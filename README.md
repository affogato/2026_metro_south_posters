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

### High-Resolution (Print)
To generate the full A0 300 DPI posters for printing:
```bash
node generate_posters.js
```
Outputs: `poster_v2_final.png`, `poster_dhq_final.png` (~14000px wide)

### Screen / Email (Preview)
To generate smaller, retina-quality versions for emailing or sharing on screens:
```bash
node generate_previews.js
```
Outputs: `poster_v2_preview.png`, `poster_dhq_preview.png` (~2400px wide)

## Adjusting Content

- **HTML/CSS:** Edit `poster_v2.html` or `poster_dhq.html` directly to change text or layout.
- **Images:** 
  - Source images are located in `Screenshots/`.
  - To adjust image zooming or cropping, edit the CSS variables in the HTML inline styles for the `.img-vp` div (e.g., `--zoom: 1.1; --x: -5%;`).

## Output Specs

- **Dimensions:** 14043 x 9933 pixels (A0 Landscape)
- **Resolution:** 300 DPI metadata
- **Margins:** ~10mm white border around the content
