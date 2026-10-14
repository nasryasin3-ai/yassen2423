(() => {
  'use strict';
  const MAX_BYTES = 50 * 1024 * 1024;
  const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/';
  const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf';

  const I18N = {
    en: {
      appName:'PDF Converter', heroTitle:'Convert PDF to Word, Excel or Text',
      heroSub:'Arabic-ready conversion with RTL layout and table detection. Everything runs in your browser — your files never leave your device.',
      dropTitle:'Drag & drop your PDF here', dropSub:'or click to browse (max 50 MB)', remove:'Remove',
      chooseFormat:'Choose output format', fmtDocx:'Editable document with RTL paragraphs and tables', fmtXlsx:'Tables detected into rows & columns', fmtTxt:'Plain UTF-8 text, tab-separated tables',
      advanced:'Advanced options', optArFix:'Arabic text order', optArAuto:'Auto-detect reversed text (recommended)', optArOff:'Keep exactly as extracted', optArForce:'Force reverse (fixes scrambled letters)',
      optOcr:'Automatically OCR scanned pages (Arabic + English, slower)', optFont:'Word: embed an Arabic font (Amiri) so it looks right on any computer',
      optNums:'Excel: store numbers as real numeric cells (Arabic-Indic digits too)', optOne:'Excel: put all pages in a single sheet', optTables:'Excel: tables only (skip plain text lines)', optPages:'Text: add page separators',
      convert:'Convert', cancel:'Cancel', errTitle:'Conversion failed', tryAgain:'Back to options', done:'Conversion complete', download:'Download Converted File',
      another:'Convert another format', newFile:'New file', preview:'Preview of extracted text',
      footer:'Layout detection is heuristic: complex, heavily designed PDFs may need small manual fixes.',
      pwTitle:'Password required', pwBody:'This PDF is protected. Enter its password to continue.', pwWrong:'Incorrect password. Try again.', unlock:'Unlock',
      ocrTitle:'Scanned pages detected', ocrBody:'{n} page(s) contain no selectable text. Run OCR (Arabic + English)? It runs locally in your browser and can take a while.', ocrYes:'Run OCR', ocrNo:'Skip',
      s_load:'Reading PDF', s_extract:'Extracting text', s_ocr:'OCR on scanned pages', s_layout:'Analysing layout & tables', s_build:'Building file',
      st_load:'Opening PDF…', st_extract:'Extracting page {i} of {n}…', st_ocr:'OCR page {i} of {n}…', st_ocrload:'Loading OCR engine (first time only)…', st_layout:'Detecting paragraphs and tables…', st_build:'Creating your file…', st_done:'Done',
      pages:'{n} pages', size:'{s}',
      errNotPdf:'Please choose a PDF file.', errTooBig:'File is larger than 50 MB.', errLibs:'Required libraries failed to load. Check your internet connection and reload the page.',
      errInvalid:'This file is not a valid PDF or is corrupted.', errPw:'A password is required to open this PDF.', errScanned:'No selectable text was found — this looks like a scanned PDF. Enable "Automatically OCR scanned pages" in Advanced options and try again.',
      errGeneric:'Something went wrong: ', errCancelled:'Conversion cancelled.', errOcr:'OCR could not be started (the OCR engine failed to load). Check your connection.', errOcrWorker:'This PDF is scanned (image-only), so it needs OCR, but OCR requires Web Workers and this restricted preview blocks them. Download index.html and open it directly in Chrome or Edge, then convert again.',
      doneMeta:'{name} · {size}', nTables:'{n} table(s) detected and converted to a grid.', nOcr:'{n} scanned page(s) were read with OCR (tables are not detected in OCR pages).', nRev:'Reversed Arabic text was detected and corrected automatically.',
      nEmbedded:'Arabic font embedded in the document.', nNoEmbed:'Font embedding was unavailable, so the document uses Arial for Arabic.', nSheets:'{n} sheet(s) created.', nBlank:'{n} page(s) had no text and were left empty.'
    },
    ar: {
      appName:'محوّل PDF', heroTitle:'حوّل ملفات PDF إلى Word أو Excel أو نص',
      heroSub:'تحويل يدعم العربية مع الحفاظ على اتجاه الكتابة من اليمين لليسار واكتشاف الجداول. كل شيء يعمل داخل متصفحك — ملفاتك لا تغادر جهازك.',
      dropTitle:'اسحب ملف PDF وأفلته هنا', dropSub:'أو اضغط للاختيار (حتى 50 ميجابايت)', remove:'إزالة',
      chooseFormat:'اختر صيغة الإخراج', fmtDocx:'مستند قابل للتحرير بفقرات وجداول من اليمين لليسار', fmtXlsx:'اكتشاف الجداول في صفوف وأعمدة', fmtTxt:'نص UTF-8 عادي مع جداول مفصولة بعلامات جدولة',
      advanced:'خيارات متقدمة', optArFix:'ترتيب النص العربي', optArAuto:'اكتشاف النص المعكوس تلقائيًا (موصى به)', optArOff:'إبقاء النص كما استُخرج', optArForce:'عكس إجباري (لإصلاح الحروف المبعثرة)',
      optOcr:'قراءة الصفحات الممسوحة ضوئيًا تلقائيًا (OCR عربي + إنجليزي، أبطأ)', optFont:'Word: تضمين خط عربي (Amiri) ليظهر المستند بشكل صحيح على أي جهاز',
      optNums:'Excel: تخزين الأرقام كخلايا رقمية حقيقية (بما فيها الأرقام الهندية)', optOne:'Excel: وضع كل الصفحات في ورقة واحدة', optTables:'Excel: الجداول فقط (تخطي النص العادي)', optPages:'نص: إضافة فواصل بين الصفحات',
      convert:'تحويل', cancel:'إلغاء', errTitle:'فشل التحويل', tryAgain:'العودة إلى الخيارات', done:'اكتمل التحويل', download:'تنزيل الملف المحوَّل',
      another:'التحويل إلى صيغة أخرى', newFile:'ملف جديد', preview:'معاينة النص المستخرج',
      footer:'اكتشاف التخطيط يعتمد على قواعد تقديرية؛ قد تحتاج الملفات المعقدة إلى تعديلات يدوية بسيطة.',
      pwTitle:'كلمة المرور مطلوبة', pwBody:'هذا الملف محمي. أدخل كلمة المرور للمتابعة.', pwWrong:'كلمة المرور غير صحيحة. حاول مرة أخرى.', unlock:'فتح',
      ocrTitle:'تم اكتشاف صفحات ممسوحة ضوئيًا', ocrBody:'{n} صفحة لا تحتوي على نص قابل للتحديد. هل تريد تشغيل OCR (عربي + إنجليزي)؟ يعمل محليًا في متصفحك وقد يستغرق وقتًا.', ocrYes:'تشغيل OCR', ocrNo:'تخطي',
      s_load:'قراءة الملف', s_extract:'استخراج النص', s_ocr:'OCR للصفحات الممسوحة', s_layout:'تحليل التخطيط والجداول', s_build:'إنشاء الملف',
      st_load:'جارٍ فتح الملف…', st_extract:'استخراج الصفحة {i} من {n}…', st_ocr:'OCR للصفحة {i} من {n}…', st_ocrload:'تحميل محرك OCR (أول مرة فقط)…', st_layout:'اكتشاف الفقرات والجداول…', st_build:'جارٍ إنشاء الملف…', st_done:'تم',
      pages:'{n} صفحة', size:'{s}',
      errNotPdf:'يرجى اختيار ملف PDF.', errTooBig:'حجم الملف أكبر من 50 ميجابايت.', errLibs:'تعذّر تحميل المكتبات المطلوبة. تحقق من اتصال الإنترنت وأعد تحميل الصفحة.',
      errInvalid:'هذا الملف ليس PDF صالحًا أو أنه تالف.', errPw:'كلمة المرور مطلوبة لفتح هذا الملف.', errScanned:'لم يُعثر على نص قابل للتحديد — يبدو أن الملف ممسوح ضوئيًا. فعّل «قراءة الصفحات الممسوحة تلقائيًا» من الخيارات المتقدمة وأعد المحاولة.',
      errGeneric:'حدث خطأ: ', errCancelled:'تم إلغاء التحويل.', errOcr:'تعذّر تشغيل OCR (فشل تحميل المحرك). تحقق من اتصالك.', errOcrWorker:'هذا الملف ممسوح ضوئيًا (صور فقط) لذلك يحتاج إلى OCR، لكن OCR يتطلب Web Workers وهذه المعاينة المقيّدة تمنعها. نزّل الملف index.html وافتحه مباشرة في Chrome أو Edge ثم أعد التحويل.',
      doneMeta:'{name} · {size}', nTables:'تم اكتشاف {n} جدول وتحويلها إلى شبكة خلايا.', nOcr:'تمت قراءة {n} صفحة ممسوحة بـ OCR (لا تُكتشف الجداول في صفحات OCR).', nRev:'تم اكتشاف نص عربي معكوس وإصلاحه تلقائيًا.',
      nEmbedded:'تم تضمين خط عربي في المستند.', nNoEmbed:'تعذّر تضمين الخط، لذلك يستخدم المستند خط Arial للعربية.', nSheets:'تم إنشاء {n} ورقة.', nBlank:'{n} صفحة بلا نص تُركت فارغة.'
    }
  };

  const $ = s => document.querySelector(s);
  const state = { file: null, format: 'docx', busy: false, cancel: false, cache: null, blobUrl: null, lang: 'en' };
  const t = (k, v) => { let s = (I18N[state.lang][k] ?? I18N.en[k] ?? k); if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s; };

  /* ---------- i18n ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $('#langBtn').textContent = state.lang === 'ar' ? 'English' : 'العربية';
    renderSteps(); if (state.file) renderFileMeta();
  }
  try { const saved = localStorage.getItem('pdfconv-lang'); if (saved) state.lang = saved; else if ((navigator.language || '').startsWith('ar')) state.lang = 'ar'; } catch (e) {}
  $('#langBtn').onclick = () => { state.lang = state.lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('pdfconv-lang', state.lang); } catch (e) {} applyLang(); };

  /* ---------- helpers ---------- */
  const fmtSize = b => b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / 1024 / 1024).toFixed(2) + ' MB';
  const show = (el, on) => $(el).classList.toggle('hidden', !on);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const loadScript = url => new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = () => rej(new Error('load ' + url)); document.head.appendChild(s); });
  class UserError extends Error {}

  function libsOk(format) {
    const miss = [];
    if (typeof pdfjsLib === 'undefined') miss.push('pdf.js');
    if (format === 'docx' && typeof docx === 'undefined') miss.push('docx');
    if (format === 'xlsx' && typeof ExcelJS === 'undefined') miss.push('ExcelJS');
    return miss;
  }
  if (typeof pdfjsLib !== 'undefined') pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
  const missing = ['pdfjsLib', 'docx', 'ExcelJS'].filter(n => typeof window[n] === 'undefined');
  if (missing.length) { const w = $('#libWarn'); w.textContent = t('errLibs') + ' (' + missing.join(', ') + ')'; w.classList.remove('hidden'); }

  /* ---------- file selection ---------- */
  const dz = $('#dropzone'), fi = $('#fileInput');
  dz.onclick = () => fi.click();
  dz.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } };
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drop-active'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drop-active'); }));
  dz.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) pickFile(f); });
  fi.onchange = () => { if (fi.files[0]) pickFile(fi.files[0]); fi.value = ''; };
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());

  function pickFile(f) {
    if (!(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) return flash(t('errNotPdf'));
    if (f.size > MAX_BYTES) return flash(t('errTooBig'));
    resetResult(); state.file = f; state.cache = null;
    $('#fileName').textContent = f.name; renderFileMeta();
    show('#viewUpload', false); show('#viewWork', true); showPanel('setup');
  }
  function flash(msg) { const w = $('#libWarn'); w.textContent = msg; w.classList.remove('hidden'); setTimeout(() => { if (w.textContent === msg) w.classList.add('hidden'); }, 4000); }
  function renderFileMeta() { $('#fileMeta').textContent = fmtSize(state.file.size); }
  $('#removeBtn').onclick = () => { if (state.busy) return; state.file = null; state.cache = null; resetResult(); show('#viewWork', false); show('#viewUpload', true); };
  $('#newBtn').onclick = () => $('#removeBtn').click();

  /* ---------- format cards ---------- */
  function selectFormat(f) {
    state.format = f;
    document.querySelectorAll('.fmt').forEach(b => {
      const on = b.dataset.format === f;
      b.setAttribute('aria-checked', on);
      b.classList.toggle('border-brand-600', on); b.classList.toggle('bg-brand-50', on);
      b.classList.toggle('border-slate-200', !on); b.classList.toggle('bg-white', !on);
    });
  }
  document.querySelectorAll('.fmt').forEach(b => b.onclick = () => selectFormat(b.dataset.format));
  selectFormat('docx');

  /* ---------- panels, steps, progress ---------- */
  function showPanel(p) {
    show('#panelSetup', p === 'setup'); show('#panelProgress', p === 'progress');
    show('#panelError', p === 'error'); show('#panelDone', p === 'done');
  }
  function resetResult() { if (state.blobUrl) { URL.revokeObjectURL(state.blobUrl); state.blobUrl = null; } }
  const STEP_IDS = ['load', 'extract', 'ocr', 'layout', 'build'];
  let stepState = {};
  function renderSteps() {
    const ol = $('#steps'); ol.innerHTML = '';
    STEP_IDS.forEach(id => {
      const st = stepState[id] || 'pending';
      if (st === 'skipped') return;
      const li = document.createElement('li'); li.className = 'flex items-center gap-2';
      const icon = st === 'done' ? '<span class="w-5 h-5 rounded-full bg-emerald-500 text-white grid place-items-center text-xs">✓</span>'
                 : st === 'active' ? '<span class="w-5 h-5 grid place-items-center"><span class="spinner"></span></span>'
                 : '<span class="w-5 h-5 rounded-full border-2 border-slate-300"></span>';
      li.innerHTML = icon + '<span class="' + (st === 'pending' ? 'text-slate-400' : st === 'active' ? 'font-medium' : 'text-slate-600') + '">' + t('s_' + id) + '</span>';
      ol.appendChild(li);
    });
  }
  const setStep = (id, st) => { stepState[id] = st; renderSteps(); };
  function progress(pct, msg) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    $('#barFill').style.width = pct + '%'; $('#pctText').textContent = pct + '%';
    $('#barWrap').setAttribute('aria-valuenow', pct);
    if (msg) $('#statusMsg').textContent = msg;
  }
  const checkCancel = () => { if (state.cancel) throw new UserError(t('errCancelled')); };

  /* ---------- modals ---------- */
  function askPassword(wrong) {
    return new Promise(res => {
      const m = $('#pwModal'), inp = $('#pwInput');
      inp.value = ''; $('#pwWrong').classList.toggle('hidden', !wrong); m.classList.remove('hidden'); setTimeout(() => inp.focus(), 50);
      const done = v => { m.classList.add('hidden'); $('#pwForm').onsubmit = null; $('#pwCancel').onclick = null; res(v); };
      $('#pwForm').onsubmit = e => { e.preventDefault(); done(inp.value); };
      $('#pwCancel').onclick = () => done(null);
    });
  }
  function askOcr(n) {
    return new Promise(res => {
      $('#ocrBody').textContent = t('ocrBody', { n }); $('#ocrModal').classList.remove('hidden');
      const done = v => { $('#ocrModal').classList.add('hidden'); res(v); };
      $('#ocrYes').onclick = () => done(true); $('#ocrNo').onclick = () => done(false);
    });
  }

  /* ---------- OCR (loaded on demand) ---------- */
  const errText = e => (e && (e.message || e.toString && e.toString())) || 'unknown error';

  // Try the OCR files hosted on this site first (reliable), then fall back to public CDNs.
  async function createOcrWorker(logger) {
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const sources = [
      { name: 'local', script: base + 'ocr/tesseract.min.js',
        opts: { workerPath: base + 'ocr/worker.min.js', corePath: base + 'ocr/core', langPath: base + 'ocr/lang', workerBlobURL: false } },
      { name: 'cdn-jsdelivr-lang', script: TESSERACT_URL, opts: { langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0_best_int' } },
      { name: 'cdn-default', script: TESSERACT_URL, opts: {} }
    ];
    let lastErr = null;
    for (const src of sources) {
      try {
        if (typeof Tesseract === 'undefined') await loadScript(src.script);
        return await Tesseract.createWorker('ara+eng', 1, Object.assign({ logger, errorHandler: e => { lastErr = e; } }, src.opts));
      } catch (e) {
        lastErr = e;
        console.warn('OCR source failed (' + src.name + '):', e);
      }
    }
    throw lastErr || new Error('OCR engine failed to start');
  }

  async function ocrPages(pdf, pageNums, rawPages, onProgress) {
    onProgress(0, t('st_ocrload'));
    let curI = 0;
    let worker;
    try {
      worker = await createOcrWorker(m => { if (m.status === 'recognizing text') onProgress(curI + m.progress, null); });
    } catch (e) {
      throw new UserError(/worker/i.test(errText(e)) && /construct|security|origin/i.test(errText(e)) ? t('errOcrWorker') : t('errOcr') + ' (' + errText(e) + ')');
    }
    try {
      for (let k = 0; k < pageNums.length; k++) {
        checkCancel(); curI = k;
        onProgress(k, t('st_ocr', { i: k + 1, n: pageNums.length }));
        const page = await pdf.getPage(pageNums[k]);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas'); canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        const { data } = await worker.recognize(canvas);
        rawPages[pageNums[k] - 1] = { num: pageNums[k], width: rawPages[pageNums[k] - 1].width, height: rawPages[pageNums[k] - 1].height, ocrText: data.text || '' };
        canvas.width = canvas.height = 0; page.cleanup();
      }
    } finally { await worker.terminate(); }
  }

  /* ---------- main conversion ---------- */
  const getOpts = () => ({
    arFix: $('#optArFix').value, ocr: $('#optOcr').checked, embedFont: $('#optFont').checked,
    numbers: $('#optNums').checked, oneSheet: $('#optOne').checked, tablesOnly: $('#optTables').checked, pageMarkers: $('#optPages').checked
  });

  async function extractAll(file, opts) {
    const data = new Uint8Array(await file.arrayBuffer());
    let pwCancelled = false;
    const openDoc = () => {
      const task = pdfjsLib.getDocument({ data: data.slice(), cMapUrl: CMAP_URL, cMapPacked: true });
      task.onPassword = async (cb, reason) => {
        const pw = await askPassword(reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD);
        if (pw === null) { pwCancelled = true; task.destroy(); } else cb(pw);
      };
      return task.promise;
    };
    let pdf;
    try {
      try { pdf = await openDoc(); }
      catch (e) {
        // Sandboxed pages (previews, some browsers) forbid blob Web Workers: run pdf.js worker on the main thread instead.
        if (/worker/i.test(String(e && e.message)) && !window.pdfjsWorker) { await loadScript(WORKER_URL); pdf = await openDoc(); }
        else throw e;
      }
    }
    catch (e) {
      if (pwCancelled || e.name === 'PasswordException') throw new UserError(t('errPw'));
      if (e.name === 'InvalidPDFException' || e.name === 'MissingPDFException' || e.name === 'FormatError') throw new UserError(t('errInvalid'));
      throw e;
    }
    setStep('load', 'done'); setStep('extract', 'active');
    const n = pdf.numPages, raw = [];
    for (let i = 1; i <= n; i++) {
      checkCancel();
      progress(5 + (i - 1) / n * 50, t('st_extract', { i, n }));
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const items = tc.items.filter(it => typeof it.str === 'string').map(it => {
        const tr = it.transform; return { str: it.str, x: tr[4], y: tr[5], w: it.width, size: Math.hypot(tr[0], tr[1]) || Math.abs(it.height) || 10 };
      });
      raw.push({ num: i, width: vp.width, height: vp.height, items });
      page.cleanup();
    }
    setStep('extract', 'done');

    // Scanned page detection
    const empty = raw.filter(p => p.items.map(i => i.str).join('').replace(/\s/g, '').length < 10).map(p => p.num);
    let ocrCount = 0;
    if (empty.length) {
      let go = opts.ocr;
      if (!go) { progress(55, ''); go = await askOcr(empty.length); }
      if (go) {
        setStep('ocr', 'active');
        await ocrPages(pdf, empty, raw, (v, msg) => progress(55 + v / empty.length * 20, msg));
        setStep('ocr', 'done'); ocrCount = empty.length;
      }
    }
    if (!ocrCount) setStep('ocr', 'skipped');
    const totalChars = raw.reduce((a, p) => a + (p.ocrText !== undefined ? p.ocrText.replace(/\s/g, '').length : p.items.reduce((s, i) => s + i.str.replace(/\s/g, '').length, 0)), 0);
    if (totalChars < 5) throw new UserError(t('errScanned'));
    pdf.destroy();
    return { raw, ocrCount, blank: empty.length - ocrCount };
  }

  async function run() {
    const opts = getOpts(), format = state.format;
    const miss = libsOk(format);
    if (miss.length) return showError(t('errLibs') + ' (' + miss.join(', ') + ')');
    state.busy = true; state.cancel = false; resetResult();
    stepState = {}; STEP_IDS.forEach(i => stepState[i] = 'pending'); stepState.load = 'active'; renderSteps();
    progress(0, t('st_load')); showPanel('progress');

    try {
      const f = state.file, key = [f.name, f.size, f.lastModified, opts.arFix, opts.ocr].join('|');
      let cached = state.cache && state.cache.key === key ? state.cache : null;
      if (!cached) {
        const ex = await extractAll(f, opts);
        setStep('layout', 'active'); progress(78, t('st_layout'));
        await sleep(30); checkCancel();
        let reverse = false, autoFixed = false;
        if (opts.arFix === 'force') reverse = true;
        else if (opts.arFix === 'auto') {
          const sample = ex.raw.slice(0, 5).filter(p => p.items).flatMap(p => p.items.map(i => i.str));
          if (Engine.detectReversedArabic(sample).reversed) { reverse = true; autoFixed = true; }
        }
        const model = Engine.buildModel(ex.raw, { reverse });
        cached = state.cache = { key, model, ocrCount: ex.ocrCount, blank: ex.blank, autoFixed };
      } else { stepState.load = stepState.extract = 'done'; stepState.ocr = 'skipped'; renderSteps(); }
      const { model } = cached;
      setStep('layout', 'done'); setStep('build', 'active'); progress(85, t('st_build')); await sleep(30); checkCancel();

      const base = state.file.name.replace(/\.pdf$/i, '') || 'converted';
      let blob, ext, notes = [];
      if (cached.autoFixed) notes.push(t('nRev'));
      if (cached.ocrCount) notes.push(t('nOcr', { n: cached.ocrCount }));
      if (cached.blank) notes.push(t('nBlank', { n: cached.blank }));
      if (format === 'docx') {
        ext = 'docx';
        let font = null;
        if (opts.embedFont && model.arabicChars > 0) {
          progress(87, t('st_build'));
          try { const r = await fetch(FONT_URL); if (r.ok) font = { name: 'Amiri', data: new Uint8Array(await r.arrayBuffer()) }; } catch (e) { font = null; }
        }
        const res = await Engine.buildDocx(model, opts, font);
        blob = res.blob;
        if (model.arabicChars > 0 && opts.embedFont) notes.push(res.embedded ? t('nEmbedded') : t('nNoEmbed'));
        if (model.tables) notes.push(t('nTables', { n: model.tables }));
      } else if (format === 'xlsx') {
        ext = 'xlsx';
        const res = await Engine.buildXlsx(model, opts);
        blob = res.blob; notes.push(t('nSheets', { n: res.sheets }));
        notes.push(model.tables ? t('nTables', { n: model.tables }) : '');
      } else {
        ext = 'txt';
        blob = new Blob([Engine.buildTxt(model, opts)], { type: 'text/plain;charset=utf-8' });
        if (model.tables) notes.push(t('nTables', { n: model.tables }));
      }
      setStep('build', 'done'); progress(100, t('st_done'));

      state.blobUrl = URL.createObjectURL(blob);
      const a = $('#downloadBtn'); a.href = state.blobUrl; a.download = base + '.' + ext;
      $('#doneMeta').textContent = t('doneMeta', { name: base + '.' + ext, size: fmtSize(blob.size) });
      $('#notes').innerHTML = ''; notes.filter(Boolean).forEach(n => { const li = document.createElement('li'); li.textContent = n; $('#notes').appendChild(li); });
      $('#preview').textContent = Engine.asText(model, 3000) || '—';
      await sleep(250); showPanel('done');
    } catch (e) {
      console.error(e);
      showError(e instanceof UserError ? e.message : t('errGeneric') + (e && e.message ? e.message : e));
    } finally { state.busy = false; }
  }

  function showError(msg) { $('#errMsg').textContent = msg; showPanel('error'); }
  $('#convertBtn').onclick = run;
  $('#cancelBtn').onclick = () => { state.cancel = true; };
  $('#retryBtn').onclick = () => showPanel('setup');
  $('#againBtn').onclick = () => showPanel('setup');

  applyLang();
})();
