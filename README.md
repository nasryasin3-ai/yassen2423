# PDF Converter (Arabic-ready)

Client-side PDF to Word (.docx), Excel (.xlsx) and Text (.txt) converter. No server: files never leave the browser.

## Files
- `index.html` - UI (Tailwind via CDN) and library script tags
- `engine.js`  - conversion engine: text extraction post-processing, Arabic handling, table detection, DOCX/XLSX/TXT builders (no DOM access)
- `app.js`     - UI logic: upload, progress, password and OCR prompts, download, EN/AR interface

## Run
Open `index.html` in Chrome or Edge, or serve the folder: `python -m http.server 8000` then visit http://localhost:8000

## Deploy
Upload the whole folder to any static host (Netlify Drop, Cloudflare Pages, GitHub Pages). Keep the file names.

## Libraries (CDN)
pdf.js 3.11.174, docx 8.5.0, ExcelJS 4.4.0, Tesseract.js 5 (loaded only when OCR is needed), Tailwind CDN, Google Fonts (Inter, Cairo), Amiri font for Word embedding.

## Known limits
Tables are detected from text positions (no ruling lines); wrapped cells become extra rows. OCR gives plain paragraphs only (no tables) and needs Web Workers (not available in sandboxed previews).
