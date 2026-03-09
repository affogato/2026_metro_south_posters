# MetroSouth Poster Generation

This project contains HTML/CSS templates and scripts to generate high-resolution (A0, 300 DPI) PNG posters for the MetroSouth symposium.

## Prerequisites

- **Node.js** (v14+ recommended)
- **npm** (usually installed with Node.js)

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

To generate the posters, run the generation script:

```bash
node generate_posters.js
```

This script will:
1.  Launch a headless browser (Puppeteer).
2.  Load `poster_v2.html` and `poster_dhq.html`.
3.  Calculate the exact scaling required to fit the content into an A0 canvas (14043 x 9933 px) minus a 10mm margin.
4.  Capture the poster in high-resolution tiles to avoid browser memory limits.
5.  Stitch the tiles together using `sharp`.
6.  Output the final files:
    - `poster_v2_final.png`
    - `poster_dhq_final.png`

## Adjusting Content

- **HTML/CSS:** Edit `poster_v2.html` or `poster_dhq.html` directly to change text or layout.
- **Images:** 
  - Source images are located in `Screenshots/`.
  - To adjust image zooming or cropping, edit the CSS variables in the HTML inline styles for the `.img-vp` div (e.g., `--zoom: 1.1; --x: -5%;`).

## Output Specs

- **Dimensions:** 14043 x 9933 pixels (A0 Landscape)
- **Resolution:** 300 DPI metadata
- **Margins:** ~10mm white border around the content
