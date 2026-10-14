// Tiny static server. Serves the app and the OCR files (Tesseract engine + Arabic/English
// language data) from node_modules, so the browser never depends on third-party CDNs for OCR.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const NM = path.join(ROOT, 'node_modules');
const PORT = process.env.PORT || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml'
};

// /ocr/<name> -> file inside node_modules
const OCR_DIRS = {
  'worker.min.js': [path.join(NM, 'tesseract.js/dist')],
  'tesseract.min.js': [path.join(NM, 'tesseract.js/dist')],
  core: [path.join(NM, 'tesseract.js-core')],
  lang: [
    path.join(NM, '@tesseract.js-data/ara/4.0.0_best_int'),
    path.join(NM, '@tesseract.js-data/eng/4.0.0_best_int')
  ]
};

function send(res, file, extraHeaders = {}) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    const headers = Object.assign({
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    }, extraHeaders);
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
}

function firstExisting(dirs, name) {
  for (const d of dirs) { const f = path.join(d, name); if (fs.existsSync(f)) return f; }
  return null;
}

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.includes('..')) { res.writeHead(400); return res.end(); }

  if (p === '/healthz') { res.writeHead(200); return res.end('ok'); }

  if (p.startsWith('/ocr/')) {
    const rest = p.slice(5);
    const name = path.basename(rest);
    let file = null;
    if (OCR_DIRS[rest]) file = firstExisting(OCR_DIRS[rest], rest);
    else if (rest.startsWith('core/')) file = firstExisting(OCR_DIRS.core, name);
    else if (rest.startsWith('lang/')) file = firstExisting(OCR_DIRS.lang, name);
    if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    // .traineddata.gz must be sent as raw bytes (Tesseract gunzips it itself)
    return send(res, file, name.endsWith('.gz') ? { 'Content-Type': 'application/octet-stream' } : {});
  }

  if (p === '/') p = '/index.html';
  const allowed = ['/index.html', '/app.js', '/engine.js', '/README.md'];
  if (!allowed.includes(p)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  send(res, path.join(ROOT, p));
}).listen(PORT, '0.0.0.0', () => console.log('PDF Converter running on port ' + PORT));
