const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Config
const TARGET_DPI = 300;
const A0_WIDTH_PX = 14043;
const A0_HEIGHT_PX = 9933;
const MARGIN_PX = 118; // 10mm approx

// Derived
// The "content" area is the area inside the white margins.
const CONTENT_WIDTH_TARGET = A0_WIDTH_PX - (MARGIN_PX * 2); 
const CONTENT_HEIGHT_TARGET = A0_HEIGHT_PX - (MARGIN_PX * 2);

const POSTER_FILES = [
  { input: 'poster_v2.html', output: 'poster_v2_final.png' },
  { input: 'poster_dhq.html', output: 'poster_dhq_final.png' }
];

async function captureAndStitch(file, outputFile) {
  console.log(`Processing ${file}...`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();

  const fileUrl = `file://${process.cwd()}/${file}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Inject CSS to clean up layout for capture
  await page.addStyleTag({
    content: `
      body { margin: 0 !important; padding: 0 !important; background: white !important; overflow: hidden !important; }
      .poster { margin: 0 !important; box-shadow: none !important; transform-origin: 0 0 !important; }
    `
  });

  // Get CSS dimensions of the poster element
  const dimensions = await page.evaluate(() => {
    const el = document.querySelector('.poster');
    // Force exact dimensions if needed, but better to read them
    // We assume the poster is at 0,0 due to the injected CSS
    return { width: el.offsetWidth, height: el.offsetHeight };
  });

  console.log(`Original CSS dimensions: ${dimensions.width}x${dimensions.height}`);

  // Calculate Scale Factor
  // We want the final image content to be at least CONTENT_WIDTH_TARGET
  // Scale = Target / Original
  const scaleFactor = CONTENT_WIDTH_TARGET / dimensions.width;
  console.log(`Calculated Scale Factor: ${scaleFactor.toFixed(5)}`);
  
  // Set viewport to the original CSS size, but with the high deviceScaleFactor.
  // This renders the page at the target resolution.
  // We add a small buffer (10px) to the viewport size to ensure we don't clip edges 
  // if we capture with overlap slightly beyond the exact boundary.
  await page.setViewport({
    width: Math.ceil(dimensions.width) + 10,
    height: Math.ceil(dimensions.height) + 10,
    deviceScaleFactor: scaleFactor
  });

  // Wait for layout/fonts
  await new Promise(r => setTimeout(r, 2000));

  // Determine grid for tiling
  // We work in device pixels (integers) to avoid gaps
  const fullWidthPx = Math.ceil(dimensions.width * scaleFactor);
  const fullHeightPx = Math.ceil(dimensions.height * scaleFactor);
  
  console.log(`Capture dimensions (pixels): ${fullWidthPx}x${fullHeightPx}`);

  // Tile size in pixels (e.g. 2048 or 4096)
  // 4096 is safe for Puppeteer usually
  const TILE_SIZE_PX = 4096; 
  const TILE_OVERLAP_PX = 2; // Overlap to prevent stitching gaps
  
  const tiles = [];
  
  const rows = Math.ceil(fullHeightPx / TILE_SIZE_PX);
  const cols = Math.ceil(fullWidthPx / TILE_SIZE_PX);
  
  console.log(`Capturing ${cols}x${rows} tiles (with ${TILE_OVERLAP_PX}px overlap)...`);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xPx = c * TILE_SIZE_PX;
      const yPx = r * TILE_SIZE_PX;
      
      const isLastCol = c === cols - 1;
      const isLastRow = r === rows - 1;

      // Base width/height without overlap
      const baseWPx = Math.min(TILE_SIZE_PX, fullWidthPx - xPx);
      const baseHPx = Math.min(TILE_SIZE_PX, fullHeightPx - yPx);
      
      // Request width/height with overlap
      // We overlap into the NEXT tile's area.
      // If it's the last column/row, we don't need to overlap.
      const wPxRequest = baseWPx + (isLastCol ? 0 : TILE_OVERLAP_PX);
      const hPxRequest = baseHPx + (isLastRow ? 0 : TILE_OVERLAP_PX);

      // Convert to CSS units for clip
      // clip coordinates are in CSS pixels (pre-scale)
      const xCss = xPx / scaleFactor;
      const yCss = yPx / scaleFactor;
      const wCss = wPxRequest / scaleFactor;
      const hCss = hPxRequest / scaleFactor;

      // Capture tile
      // Use 'binary' encoding for Buffer
      const buffer = await page.screenshot({
        clip: {
          x: xCss,
          y: yCss,
          width: wCss,
          height: hCss
        },
        encoding: 'binary',
        omitBackground: true
      });
      
      tiles.push({ buffer, left: xPx, top: yPx });
      process.stdout.write('.');
    }
  }
  console.log('\nTiles captured. Stitching...');
  
  await browser.close();

  // 1. Composite tiles into the "poster content" image
  // We use the exact fullWidthPx and fullHeightPx calculated
  const compositeOps = tiles.map(t => ({
    input: t.buffer,
    left: t.left,
    top: t.top
  }));

  // Limit memory usage by running garbage collection if exposed? No, just rely on OS.
  // Sharp handles large images well if using stream/file, but here we use buffers.
  // With 300dpi A0, we are talking ~14000x10000 px. 140MP. 
  // 4 channels * 1 byte = 560MB uncompressed. It fits in RAM easily.
  
  // Create the content image first
  // Note: We can composite directly onto the A0 canvas to save a step,
  // but we need to center it.
  // The content size is fullWidthPx x fullHeightPx.
  // A0 canvas size is A0_WIDTH_PX x A0_HEIGHT_PX.
  
  // Calculate centering offsets
  const xOffset = Math.floor((A0_WIDTH_PX - fullWidthPx) / 2);
  const yOffset = Math.floor((A0_HEIGHT_PX - fullHeightPx) / 2);

  // Update composite operations to include the offset
  const finalCompositeOps = compositeOps.map(op => ({
    input: op.input,
    left: op.left + xOffset,
    top: op.top + yOffset
  }));

  console.log(`Composing final A0 image (${A0_WIDTH_PX}x${A0_HEIGHT_PX})...`);
  console.log(`Margins: approx ${xOffset}px horizontal, ${yOffset}px vertical`);

  await sharp({
    create: {
      width: A0_WIDTH_PX,
      height: A0_HEIGHT_PX,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(finalCompositeOps)
  .withMetadata({ density: TARGET_DPI })
  .png()
  .toFile(outputFile);

  console.log(`Saved ${outputFile}`);
}

async function run() {
  for (const p of POSTER_FILES) {
    try {
      await captureAndStitch(p.input, p.output);
    } catch (e) {
      console.error(`Error processing ${p.input}:`, e);
    }
  }
}

run();
