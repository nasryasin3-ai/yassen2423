const Engine = (() => {
  'use strict';

  /* ---------- Arabic / text helpers ---------- */
  const AR = '\\u0590-\\u08FF\\uFB1D-\\uFDFF\\uFE70-\\uFEFF';
  const reArG = new RegExp('[' + AR + ']', 'g');
  const reLatG = /[A-Za-z]/g;
  const countAr  = s => (s.match(reArG) || []).length;
  const countLat = s => (s.match(reLatG) || []).length;
  const isRTLText = s => { const a = countAr(s); return a > 0 && a >= countLat(s); };

  const INVISIBLE = /[​‎‏‪-‮⁦-⁩﻿­\u0000]/g;
  function prep(s, reverse) {
    // Presentation forms (FB50–FDFF, FE70–FEFF) -> normal Arabic letters, incl. lam-alef ligatures
    if (/[ﭐ-﷿ﹰ-﻿]/.test(s)) s = s.normalize('NFKC');
    s = s.replace(INVISIBLE, '');
    if (reverse) s = reverseVisual(s);
    return s;
  }

  const MIRROR = { '(':')', ')':'(', '[':']', ']':'[', '{':'}', '}':'{', '<':'>', '>':'<', '«':'»', '»':'«' };
  function reverseVisual(s) {
    if (!reArG.test(s)) { reArG.lastIndex = 0; return s; }
    reArG.lastIndex = 0;
    const rev = Array.from(s).reverse().map(c => MIRROR[c] || c).join('');
    // keep Latin words / numbers readable (they were reversed too)
    return rev.replace(/[A-Za-z0-9][A-Za-z0-9.,:\/%@+\-]*[A-Za-z0-9]|[A-Za-z0-9]/g, m => Array.from(m).reverse().join(''));
  }

  const COMMON = ['في','من','على','إلى','عن','هذا','هذه','التي','الذي','مع','أن','كان','بعد','بين','ذلك','عند'];
  const COMMON_REV = new Set(COMMON.map(w => Array.from(w).reverse().join('')));
  const COMMON_FWD = new Set(COMMON);
  function detectReversedArabic(texts) {
    let f = 0, r = 0;
    const sample = texts.join(' ').normalize('NFKC');
    for (const tok of sample.split(/[^؀-ۿ]+/)) {
      if (!tok) continue;
      if (COMMON_FWD.has(tok)) f++; else if (COMMON_REV.has(tok)) r++;
    }
    return { reversed: r >= 3 && r > f * 1.5, fwd: f, rev: r };
  }

  const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

  /* ---------- Layout analysis ---------- */
  const COL_GAP = 1.1;  // gap (in font-size units) that separates table cells

  function composeSegment(seg) {
    const joined = seg.items.map(i => i.text).join('');
    const rtl = isRTLText(joined);
    const arr = rtl ? seg.items.slice().reverse() : seg.items;
    let out = '', prev = null;
    for (const it of arr) {
      if (prev) {
        const gap = rtl ? (prev.x - (it.x + it.w)) : (it.x - (prev.x + prev.w));
        if (gap > Math.max(it.size, prev.size) * 0.15 && !/\s$/.test(out) && !/^\s/.test(it.text)) out += ' ';
      }
      out += it.text; prev = it;
    }
    return { text: out.replace(/[ \t]+/g, ' ').trim(), rtl };
  }

  function buildLines(items) {
    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));
    const raw = [];
    for (const it of items) {
      const cur = raw[raw.length - 1];
      const tol = Math.max(1.5, Math.min(it.size, cur ? cur.size : it.size) * 0.5);
      if (cur && Math.abs(cur.y - it.y) <= tol) {
        cur.items.push(it); cur.y = (cur.y * (cur.items.length - 1) + it.y) / cur.items.length;
      } else raw.push({ y: it.y, size: it.size, items: [it] });
    }
    const lines = [];
    for (const ln of raw) {
      ln.items.sort((a, b) => a.x - b.x);
      // dominant size = size of the item with most characters
      let best = ln.items[0];
      for (const it of ln.items) if (it.text.length > best.text.length) best = it;
      ln.size = best.size || 10;

      const segs = []; let seg = null;
      for (const it of ln.items) {
        const x0 = it.x, x1 = it.x + it.w;
        if (seg && (x0 - seg.x1) > Math.max(it.size, seg.size) * COL_GAP) { segs.push(seg); seg = null; }
        if (!seg) seg = { items: [], x0, x1, size: it.size };
        seg.items.push(it); seg.x1 = Math.max(seg.x1, x1); seg.x0 = Math.min(seg.x0, x0);
      }
      if (seg) segs.push(seg);

      const outSegs = segs.map(s => { const c = composeSegment(s); return { text: c.text, rtl: c.rtl, x0: s.x0, x1: s.x1 }; })
                          .filter(s => s.text);
      if (!outSegs.length) continue;
      const allText = outSegs.map(s => s.text).join(' ');
      const rtl = isRTLText(allText);
      const ordered = outSegs.slice().sort((a, b) => rtl ? b.x0 - a.x0 : a.x0 - b.x0);
      lines.push({
        y: ln.y, size: ln.size, segs: outSegs, rtl,
        text: ordered.map(s => s.text).join(' '),
        x0: Math.min(...outSegs.map(s => s.x0)), x1: Math.max(...outSegs.map(s => s.x1))
      });
    }
    return lines;
  }

  function makeTable(lines) {
    const multi = lines.filter(l => l.segs.length >= 2);
    const iv = [];
    multi.forEach(l => l.segs.forEach(s => iv.push([s.x0, s.x1])));
    iv.sort((a, b) => a[0] - b[0]);
    const bands = [];
    for (const [a, b] of iv) {
      const last = bands[bands.length - 1];
      if (last && a <= last.x1) last.x1 = Math.max(last.x1, b); else bands.push({ x0: a, x1: b });
    }
    if (bands.length < 2) return null;

    const overlap = (s, b) => Math.min(s.x1, b.x1) - Math.max(s.x0, b.x0);
    const bandOf = s => { let bi = 0, bo = -Infinity; bands.forEach((b, i) => { const o = overlap(s, b); if (o > bo) { bo = o; bi = i; } }); return bi; };

    const rtl = isRTLText(lines.map(l => l.text).join(' '));
    const colOf = bi => rtl ? bands.length - 1 - bi : bi;
    const rows = lines.map(l => {
      const row = new Array(bands.length).fill('');
      if (l.segs.length === 1) {
        const s = l.segs[0];
        const hits = bands.filter(b => overlap(s, b) > 0).length;
        const ci = hits >= 2 ? 0 : colOf(bandOf(s));   // spanning title -> first column
        row[ci] = s.text;
      } else {
        const ordered = l.segs.slice().sort((a, b) => rtl ? b.x0 - a.x0 : a.x0 - b.x0);
        ordered.forEach(s => { const ci = colOf(bandOf(s)); row[ci] = row[ci] ? row[ci] + ' ' + s.text : s.text; });
      }
      return row;
    });
    if (rows.filter(r => r.filter(Boolean).length >= 2).length < 2) return null;

    const widths = bands.map(b => Math.max(10, b.x1 - b.x0));
    if (rtl) widths.reverse();
    return { type: 'table', rows, rtl, colWidths: widths, size: median(lines.map(l => l.size)) };
  }

  function groupBlocks(lines) {
    const multi = lines.map(l => l.segs.length >= 2);
    const blocks = []; let buf = [];
    const flush = () => { if (buf.length) { blocks.push({ type: 'text', lines: buf }); buf = []; } };
    let i = 0;
    while (i < lines.length) {
      if (multi[i]) {
        let j = i, k = i + 1;
        while (k < lines.length) {
          if (multi[k]) { j = k; k++; continue; }
          if (k + 1 < lines.length && multi[k + 1] && (lines[k - 1].y - lines[k + 1].y) <= lines[k].size * 4) { k++; continue; }
          break;
        }
        const n = multi.slice(i, j + 1).filter(Boolean).length;
        if (n >= 2) {
          const tb = makeTable(lines.slice(i, j + 1));
          if (tb) { flush(); blocks.push(tb); i = j + 1; continue; }
        }
      }
      buf.push(lines[i]); i++;
    }
    flush();
    return blocks;
  }

  const BULLET = /^([•●▪◦·‣▫■□\-–—*]|\(?[0-9٠-٩]{1,3}[.)\-]|\(?[A-Za-zء-ي][.)])(\s|$)/;
  function flagParagraphs(blocks) {
    const all = blocks.filter(b => b.type === 'text').flatMap(b => b.lines);
    if (!all.length) return;
    const left = Math.min(...all.map(l => l.x0)), right = Math.max(...all.map(l => l.x1));
    const cw = Math.max(1, right - left);
    const widths = all.map(l => l.x1 - l.x0).sort((a, b) => a - b);
    const typicalW = widths[Math.floor(widths.length * 0.85)] || cw;
    const gaps = [];
    blocks.forEach(b => { if (b.type !== 'text') return; for (let i = 1; i < b.lines.length; i++) { const g = b.lines[i - 1].y - b.lines[i].y; if (g > 0 && g < 3 * b.lines[i].size) gaps.push(g); } });
    const spacing = median(gaps);
    for (const l of all) {
      const lg = l.x0 - left, rg = right - l.x1;
      l.align = (l.x1 - l.x0) < 0.8 * cw && Math.abs(lg - rg) < 0.04 * cw && lg > 0.06 * cw ? 'center' : 'start';
    }
    for (const b of blocks) {
      if (b.type !== 'text') continue;
      b.lines.forEach((l, i) => {
        if (i === 0) { l.newPara = true; return; }
        const p = b.lines[i - 1], gap = p.y - l.y;
        const indent = l.rtl ? right - l.x1 : l.x0 - left;
        l.newPara = p.align === 'center' || l.align === 'center' || p.rtl !== l.rtl ||
          (spacing > 0 && gap > spacing * 1.45) || gap > l.size * 2.4 ||
          Math.abs(l.size - p.size) > 0.18 * p.size ||
          (p.x1 - p.x0) < 0.75 * typicalW || BULLET.test(l.text) ||
          (indent > 1.2 * l.size && indent < 0.35 * cw);
      });
    }
  }

  function layoutPage(rawItems, meta, opts) {
    const items = rawItems.map(it => ({ x: it.x, y: it.y, w: it.w || 0, size: it.size || 10, text: prep(it.str, opts.reverse) }))
                          .filter(it => it.text.trim() !== '');
    const page = { num: meta.num, width: meta.width, height: meta.height, blocks: [], ocr: false };
    if (!items.length) return page;
    const lines = buildLines(items);
    page.blocks = groupBlocks(lines);
    flagParagraphs(page.blocks);
    return page;
  }

  function ocrPage(meta) {
    const paras = (meta.ocrText || '').split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
    const lines = paras.map((t, i) => ({ y: -i, size: 12, segs: [{ text: t }], rtl: isRTLText(t), text: t, x0: 0, x1: 1, newPara: true, align: 'start' }));
    return { num: meta.num, width: meta.width, height: meta.height, blocks: lines.length ? [{ type: 'text', lines }] : [], ocr: true };
  }

  function buildModel(rawPages, opts) {
    const pages = rawPages.map(rp => rp.ocrText !== undefined ? ocrPage(rp) : layoutPage(rp.items, rp, opts));
    let ar = 0, lat = 0, tables = 0, chars = 0;
    const sizeCount = {};
    for (const p of pages) {
      p.rtl = false; let pa = 0, pl = 0;
      for (const b of p.blocks) {
        if (b.type === 'table') { tables++; b.rows.forEach(r => r.forEach(c => { pa += countAr(c); pl += countLat(c); chars += c.length; })); }
        else b.lines.forEach(l => { pa += countAr(l.text); pl += countLat(l.text); chars += l.text.length; const k = Math.round(l.size); sizeCount[k] = (sizeCount[k] || 0) + l.text.length; });
      }
      p.rtl = pa > 0 && pa >= pl; ar += pa; lat += pl;
    }
    let bodySize = 12, bestN = 0;
    for (const k in sizeCount) if (sizeCount[k] > bestN) { bestN = sizeCount[k]; bodySize = +k; }
    return { pages, rtl: ar > 0 && ar >= lat, tables, chars, bodySize, arabicChars: ar };
  }

  function paragraphsOf(lines) {
    const out = [];
    for (const l of lines) {
      if (l.newPara || !out.length) out.push({ text: l.text, rtl: l.rtl, size: l.size, align: l.align || 'start' });
      else { const p = out[out.length - 1]; p.text += ' ' + l.text; p.size = Math.max(p.size, l.size); }
    }
    return out;
  }

  /* ---------- TXT ---------- */
  function buildTxt(model, opts) {
    const out = [];
    model.pages.forEach((page, pi) => {
      if (opts.pageMarkers) out.push((pi ? '\n' : '') + '----- Page ' + page.num + ' -----\n');
      else if (pi) out.push('');
      page.blocks.forEach(b => {
        if (b.type === 'table') out.push(b.rows.map(r => r.join('\t')).join('\n') + '\n');
        else paragraphsOf(b.lines).forEach(p => out.push(p.text + '\n'));
      });
    });
    return '﻿' + out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  const asText = (model, n) => buildTxt(model, {}).replace('﻿', '').slice(0, n);

  /* ---------- DOCX ---------- */
  const LAT_TOKEN = "[A-Za-z][A-Za-z0-9@._\\-\\/:+&']*";
  const reLatinRuns = new RegExp(LAT_TOKEN + "(?:[ \\t]+" + LAT_TOKEN + ")*", 'g');
  const reArabicRuns = new RegExp('[' + AR + ']+(?:[ \\t\\u200c\\u200d]+[' + AR + ']+)*', 'g');
  function splitRuns(text, paraRTL) {
    const re = paraRTL ? reLatinRuns : reArabicRuns; re.lastIndex = 0;
    const out = []; let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ text: text.slice(last, m.index), rtl: paraRTL });
      out.push({ text: m[0], rtl: !paraRTL });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), rtl: paraRTL });
    return out;
  }

  async function buildDocx(model, opts, font) {
    const D = docx;
    const arFont = font ? font.name : 'Arial', latFont = 'Arial';
    const tw = pt => Math.round(pt * 20);
    const first = model.pages[0] || { width: 595, height: 842 };
    // Oversized PDF pages (slides, posters) are scaled down to a normal paper size, keeping the aspect ratio.
    const longSide = Math.max(first.width, first.height);
    const scale = longSide > 900 ? 842 / longSide : 1;
    const pw = first.width * scale, ph = first.height * scale;
    const landscape = pw > ph;
    const pageW = tw(pw), pageH = tw(ph);
    const MARGIN = scale < 1 ? 720 : 1080;
    const contentW = Math.max(3000, pageW - 2 * MARGIN);
    const clampHp = s => Math.max(16, Math.min(72, Math.round(s * 2)));

    const mkRuns = (text, rtl, size, bold) => splitRuns(text, rtl).map(r => {
      const hp = clampHp(size);
      return new D.TextRun({
        text: r.text, rightToLeft: r.rtl, font: r.rtl ? arFont : latFont,
        size: hp, sizeComplexScript: hp, bold: !!bold, boldComplexScript: !!bold
      });
    });
    const mkPara = (text, o) => new D.Paragraph({
      children: mkRuns(text, o.rtl, o.size, o.bold),
      bidirectional: !!o.rtl,
      alignment: o.align === 'center' ? D.AlignmentType.CENTER : undefined,
      spacing: { after: o.after === undefined ? 120 : o.after, line: 276 },
      pageBreakBefore: o.pageBreak || undefined
    });

    const children = [];
    model.pages.forEach((page, pi) => {
      let needBreak = pi > 0;
      const take = () => { const v = needBreak; needBreak = false; return v; };
      if (!page.blocks.length && pi > 0) children.push(new D.Paragraph({ children: [], pageBreakBefore: true }));
      for (const b of page.blocks) {
        if (b.type === 'text') {
          for (const p of paragraphsOf(b.lines)) {
            const bold = p.size >= model.bodySize * 1.25;
            children.push(mkPara(p.text, { rtl: p.rtl, size: page.ocr ? p.size : p.size * scale, bold, align: p.align, pageBreak: take() }));
          }
        } else {
          if (needBreak) { children.push(new D.Paragraph({ children: [], pageBreakBefore: true, spacing: { after: 0, line: 20 } })); needBreak = false; }
          const total = b.colWidths.reduce((a, c) => a + c, 0) || 1;
          const widths = b.colWidths.map(w => Math.max(600, Math.round(w / total * contentW)));
          const side = { style: D.BorderStyle.SINGLE, size: 4, color: '9CA3AF' };
          const rows = b.rows.map(r => new D.TableRow({
            cantSplit: true,
            children: r.map((txt, ci) => {
              const cellRTL = countAr(txt) > 0 ? true : (countLat(txt) > 0 ? false : b.rtl);
              const lines = (txt || '').split('\n');
              return new D.TableCell({
                width: { size: widths[ci], type: D.WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: lines.map(t => mkPara(t, { rtl: cellRTL, size: (b.size || model.bodySize) * (page.ocr ? 1 : scale), after: 0 }))
              });
            })
          }));
          children.push(new D.Table({
            rows, columnWidths: widths, layout: D.TableLayoutType.FIXED, visuallyRightToLeft: !!b.rtl,
            width: { size: widths.reduce((a, c) => a + c, 0), type: D.WidthType.DXA },
            borders: { top: side, bottom: side, left: side, right: side, insideHorizontal: side, insideVertical: side }
          }));
          children.push(new D.Paragraph({ children: [], spacing: { after: 120 } }));
        }
      }
    });
    if (!children.length) children.push(new D.Paragraph({ children: [] }));

    const make = withFont => new D.Document({
      creator: 'PDF Converter',
      ...(withFont ? { fonts: [{ name: font.name, data: font.data, characterSet: D.CharacterSet ? D.CharacterSet.ARABIC : undefined }] } : {}),
      styles: { default: { document: { run: { font: arFont, size: clampHp(model.bodySize * scale), sizeComplexScript: clampHp(model.bodySize * scale) } } } },
      sections: [{
        properties: { page: { size: { width: Math.min(pageW, pageH), height: Math.max(pageW, pageH), orientation: landscape ? D.PageOrientation.LANDSCAPE : D.PageOrientation.PORTRAIT }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        children
      }]
    });
    let embedded = false, blob;
    if (font) {
      try { blob = await D.Packer.toBlob(make(true)); embedded = true; }
      catch (e) { console.warn('Font embedding failed, falling back', e); }
    }
    if (!blob) blob = await D.Packer.toBlob(make(false));
    return { blob, embedded };
  }

  /* ---------- XLSX ---------- */
  function parseNumber(s) {
    let t = (s || '').trim();
    if (!t || t.length > 24) return null;
    t = t.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x6F0)
         .replace(/٫/g, '.').replace(/[٬،]/g, ',').replace(/−/g, '-');
    const m = /^(-)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/.exec(t);
    if (!m) return null;
    const ip = m[2].replace(/,/g, '');
    if (ip.length > 15) return null;
    if (ip.length > 1 && ip[0] === '0') return null;              // IDs, codes
    if (!m[2].includes(',') && !m[3] && ip.length > 9) return null; // phone / account numbers
    const value = parseFloat((m[1] ? '-' : '') + ip + (m[3] ? '.' + m[3] : ''));
    const dec = m[3] ? m[3].length : 0;
    let fmt;
    if (m[2].includes(',')) fmt = '#,##0' + (dec ? '.' + '0'.repeat(dec) : '');
    else if (dec) fmt = '0.' + '0'.repeat(dec);
    return { value, fmt };
  }

  async function buildXlsx(model, opts) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PDF Converter';
    const tablesOnly = !!opts.tablesOnly && model.tables > 0;
    const sheetName = n => String(n).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31);
    let sheet = null, r = 1, widths = [];
    const thin = { style: 'thin', color: { argb: 'FFBFC5CD' } };

    const finish = () => {
      if (!sheet) return;
      widths.forEach((w, i) => { sheet.getColumn(i + 1).width = Math.min(60, Math.max(8, w * 1.15 + 2)); });
    };
    const startSheet = (name, rtl) => { finish(); sheet = wb.addWorksheet(sheetName(name), { views: [{ rightToLeft: !!rtl }] }); r = 1; widths = []; };
    const put = (c, txt, o) => {
      const cell = sheet.getCell(r, c + 1);
      let val = txt, fmt;
      if (o.nums) { const n = parseNumber(txt); if (n) { val = n.value; fmt = n.fmt; } }
      cell.value = val;
      if (fmt) cell.numFmt = fmt;
      const ar = countAr(txt) > 0;
      cell.alignment = { vertical: 'top', wrapText: /\n/.test(txt), ...(ar ? { readingOrder: 'rtl' } : {}) };
      if (o.table) {
        cell.border = { top: thin, bottom: thin, left: thin, right: thin };
        if (o.header) { cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; }
      }
      widths[c] = Math.max(widths[c] || 0, Math.max(...String(txt).split('\n').map(x => x.length)));
    };

    if (opts.oneSheet) startSheet('Document', model.rtl);
    for (const page of model.pages) {
      if (!page.blocks.length) continue;
      if (!opts.oneSheet) startSheet('Page ' + page.num, page.rtl);
      for (const b of page.blocks) {
        if (b.type === 'table') {
          b.rows.forEach((row, ri) => { row.forEach((txt, ci) => put(ci, txt, { table: true, header: ri === 0, nums: opts.numbers })); r++; });
          r++;
        } else if (!tablesOnly) {
          b.lines.forEach(l => { put(0, l.text, { nums: false }); r++; });
          r++;
        }
      }
    }
    finish();
    if (!wb.worksheets.length) wb.addWorksheet('Empty');
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return { blob, sheets: wb.worksheets.length };
  }

  return { prep, reverseVisual, detectReversedArabic, buildModel, buildTxt, asText, buildDocx, buildXlsx, parseNumber, isRTLText, splitRuns };
})();
if (typeof module !== 'undefined') module.exports = Engine;
