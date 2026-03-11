const puppeteer = require('puppeteer');
const fs = require('fs');

const POSTER_FILES = [
  { input: 'poster_v2.html', output: 'poster_v2_preview.png' },
  { input: 'poster_dhq.html', output: 'poster_dhq_preview.png' }
];

async function capturePreview(file, outputFile) {
  console.log(`Generating preview for ${file}...`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const fileUrl = `file://${process.cwd()}/${file}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Inject CSS to remove shadow and margins for clean capture
  await page.addStyleTag({
    content: `
      body { background: white !important; } 
      .poster { margin: 0 !important; box-shadow: none !important; }
    `
  });

  // Scale factor 2 gives ~2378px width (Retina quality, good for email)
  await page.setViewport({
    width: 1189, // Original CSS width
    height: 841,
    deviceScaleFactor: 2
  });

  const element = await page.$('.poster');
  await element.screenshot({ path: outputFile });
  
  console.log(`Saved ${outputFile}`);
  await browser.close();
}

async function run() {
  for (const p of POSTER_FILES) {
    try {
      await capturePreview(p.input, p.output);
    } catch (e) {
      console.error(`Error processing ${p.input}:`, e);
    }
  }
}

run();
