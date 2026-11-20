'use strict';
/* =========================================================
   ART — pixel primitives, text, chibi characters, burger layers
   Every drawing happens on a 480x270 logical canvas.
   ========================================================= */
(function () {
  const W = 480, H = 270, INK = '#24161c';
  const A = { W, H, INK, fontReady: false };

  // ---------- primitives ----------
  function R(c, x, y, w, h, col) {
    if (col) c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function disc(c, cx, cy, rx, ry, col) {
    c.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy);
    rx = Math.max(0, Math.round(rx)); ry = Math.max(0, Math.round(ry));
    if (ry === 0) { c.fillRect(cx - rx, cy, rx * 2 + 1, 1); return; }
    for (let dy = -ry; dy <= ry; dy++) {
      const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
      c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  // scanline polygon fill: crisp edges, no antialiasing
  function poly(c, pts, col) {
    c.fillStyle = col;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    y0 = Math.round(y0); y1 = Math.round(y1);
    const xs = [];
    for (let y = y0; y < y1; y++) {
      const yc = y + 0.5; xs.length = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if ((yi > yc) !== (yj > yc)) xs.push(xi + ((yc - yi) * (xj - xi)) / (yj - yi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.round(xs[k]), b = Math.round(xs[k + 1]);
        if (b > a) c.fillRect(a, y, b - a, 1);
      }
    }
  }
  function line(c, x0, y0, x1, y1, col) {
    c.fillStyle = col; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 3000; i++) {
      c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function srand(seed) { let s = seed || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  // ---------- iso helpers ----------
  // gx → right-down, gy → left-down, h → up (pixels)
  function makeIso(OX, OY, HW, HH) {
    const f = (gx, gy, h) => [OX + (gx - gy) * HW, OY + (gx + gy) * HH - (h || 0)];
    f.OX = OX; f.OY = OY; f.HW = HW; f.HH = HH;
    return f;
  }
  // face lying on the plane gy = const (faces the viewer's lower-left)
  function faceY(c, I, gy, xa, xb, ha, hb, col) { poly(c, [I(xa, gy, ha), I(xb, gy, ha), I(xb, gy, hb), I(xa, gy, hb)], col); }
  // face lying on the plane gx = const (faces the viewer's lower-right)
  function faceX(c, I, gx, ya, yb, ha, hb, col) { poly(c, [I(gx, ya, ha), I(gx, yb, ha), I(gx, yb, hb), I(gx, ya, hb)], col); }
  function tileTop(c, I, x0, y0, x1, y1, h, col) { poly(c, [I(x0, y0, h), I(x1, y0, h), I(x1, y1, h), I(x0, y1, h)], col); }
  function box(c, I, x0, y0, x1, y1, h0, h1, top, left, right) {
    if (left) faceY(c, I, y1, x0, x1, h0, h1, left);
    if (right) faceX(c, I, x1, y0, y1, h0, h1, right);
    if (top) tileTop(c, I, x0, y0, x1, y1, h1, top);
  }

  // ---------- crisp pixel text (Galmuri bitmap fonts at native sizes) ----------
  const TXT = new Map();
  function txt(str, size, col, ol) {
    str = String(str);
    const key = str + '|' + size + '|' + col + '|' + ol + '|' + A.fontReady;
    let cv = TXT.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); const x = cv.getContext('2d');
    const font = (size <= 8 ? '8px "Galmuri7"' : size <= 11 ? '10px "Galmuri9"' : '12px "Galmuri11"') + ', "Apple SD Gothic Neo", "Malgun Gothic", monospace';
    x.font = font; const w = Math.max(4, Math.ceil(x.measureText(str).width) + 4), h = size + 6;
    cv.width = w; cv.height = h; x.font = font; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(str, 2, 2);
    const src = x.getImageData(0, 0, w, h).data; const img = x.createImageData(w, h); const d = img.data;
    const m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = src[i * 4 + 3] > 110 ? 1 : 0;
    const fc = hexRGB(col), oc = ol ? hexRGB(ol) : null;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx; let cc = null;
      if (m[i]) cc = fc;
      else if (oc && ((xx > 0 && m[i - 1]) || (xx < w - 1 && m[i + 1]) || (yy > 0 && m[i - w]) || (yy < h - 1 && m[i + w]) ||
        (xx > 0 && yy < h - 1 && m[i + w - 1]) || (xx < w - 1 && yy < h - 1 && m[i + w + 1]))) cc = oc;
      if (cc) { d[i * 4] = cc[0]; d[i * 4 + 1] = cc[1]; d[i * 4 + 2] = cc[2]; d[i * 4 + 3] = 255; }
    }
    x.clearRect(0, 0, w, h); x.putImageData(img, 0, 0);
    if (TXT.size > 900) TXT.clear();
    TXT.set(key, cv); return cv;
  }
  // T: draw text; align 'l' | 'c' | 'r'; k = integer zoom
  function T(c, str, x, y, size, col, ol, align, k) {
    const cv = txt(str, size || 10, col || '#fff', ol); k = k || 1;
    const w = cv.width * k;
    const dx = align === 'c' ? x - w / 2 : align === 'r' ? x - w : x;
    c.drawImage(cv, Math.round(dx - 2 * k), Math.round(y - 2 * k), w, cv.height * k);
    return cv.width - 4;
  }
  function tw(str, size) { return txt(str, size || 10, '#fff').width - 4; }
  A.clearText = () => TXT.clear();

  // ---------- chibi character ----------
  // (x, y) = feet bottom center. o: { s scale, back, step, sit, mood: 'happy'|'angry'|'sweat', look }
  function chibi(c, x, y, L, o) {
    o = o || {};
    const s = o.s || 1;
    const ox = Math.round(x - 6 * s), oy = Math.round(y - (o.sit ? 17 : 20) * s);
    const p = (gx, gy, w, h, col) => { c.fillStyle = col; c.fillRect(ox + gx * s, oy + gy * s, w * s, h * s); };
    const back = !!o.back;
    // legs
    if (!o.sit) {
      const st = o.step ? 1 : 0;
      p(2, 16, 8, 4, INK);
      p(3, 16, 2, 3 - st, L.bottom); p(7, 16, 2, 2 + st, L.bottom);
      if (!st) p(7, 18, 2, 1, L.bottom);
    }
    // body
    p(0, 10, 12, 7, INK);
    p(1, 11, 10, 5, L.top);
    p(1, 10, 10, 1, INK);
    if (L.apron && !back) p(3, 12, 6, 4, L.apron);
    if (L.tie && !back) p(5, 11, 2, 4, L.tie);
    if (L.btn && !back) { p(6, 12, 1, 1, L.btn); p(6, 14, 1, 1, L.btn); }
    if (L.collar && !back) { p(4, 11, 1, 1, L.collar); p(7, 11, 1, 1, L.collar); }
    p(1, 15, 1, 1, L.skin); p(10, 15, 1, 1, L.skin); // hands
    if (L.bag) { p(10, 13, 3, 4, INK); p(11, 14, 1, 2, L.bag); }
    // head
    p(1, 0, 10, 1, INK); p(0, 1, 12, 9, INK); p(1, 10, 10, 1, INK);
    p(1, 1, 10, 9, L.skin);
    const hs = L.hs, hc = L.hair;
    if (back) {
      if (hs === 'bald') { p(1, 4, 10, 4, hc); p(1, 1, 10, 3, L.skin); }
      else p(1, 1, 10, 8, hc);
      if (hs === 'long') p(1, 9, 10, 2, hc);
    } else {
      if (hs === 'bald') { p(1, 4, 1, 3, hc); p(10, 4, 1, 3, hc); }
      else {
        p(1, 1, 10, 3, hc);
        if (hs === 'long') { p(1, 4, 2, 7, hc); p(9, 4, 2, 7, hc); }
        else if (hs === 'bob') { p(1, 4, 2, 4, hc); p(9, 4, 2, 4, hc); p(3, 4, 3, 1, hc); }
        else { p(1, 4, 1, 2, hc); p(10, 4, 1, 2, hc); p(6, 4, 3, 1, hc); }
      }
      // face
      const m = o.mood;
      if (m === 'angry') {
        p(3, 5, 2, 1, INK); p(7, 5, 2, 1, INK); p(3, 6, 1, 2, INK); p(8, 6, 1, 2, INK);
        p(5, 8, 2, 1, INK); p(2, 8, 1, 1, '#e05a4a'); p(9, 8, 1, 1, '#e05a4a');
      } else if (m === 'happy') {
        p(3, 6, 2, 1, INK); p(7, 6, 2, 1, INK); p(4, 8, 4, 1, '#a8323a'); p(2, 8, 1, 1, '#f49a9a'); p(9, 8, 1, 1, '#f49a9a');
      } else {
        p(3, 6, 1, 2, INK); p(8, 6, 1, 2, INK); p(2, 8, 1, 1, '#f4a0a0'); p(9, 8, 1, 1, '#f4a0a0');
        if (m === 'sweat') p(10, 3, 1, 2, '#7ac8f0');
      }
      if (L.glasses) { p(2, 6, 3, 1, INK); p(7, 6, 3, 1, INK); }
    }
    if (hs === 'bun') { p(4, -3, 4, 1, INK); p(3, -2, 6, 3, INK); p(4, -2, 4, 2, hc); }
    if (hs === 'cap' || hs === 'band') {
      p(0, 0, 12, 4, INK); p(1, 1, 10, 2, L.cap || L.band);
      if (hs === 'cap' && !back) { p(1, 3, 11, 1, INK); p(2, 3, 9, 1, L.cap); }
    }
    if (hs === 'chef') { p(1, -5, 10, 6, INK); p(2, -4, 8, 5, '#fbfbf6'); p(1, 1, 10, 2, '#fbfbf6'); p(1, 0, 10, 1, INK); }
    if (L.big) { /* wide shoulders for the double-patty fan */ p(-1, 11, 1, 5, INK); p(12, 11, 1, 5, INK); }
  }

  // ---------- small icons ----------
  function heart(c, x, y, col) {
    col = col || '#ff4a6a';
    R(c, x + 1, y, 2, 1, col); R(c, x + 4, y, 2, 1, col); R(c, x, y + 1, 7, 2, col); R(c, x + 1, y + 3, 5, 1, col); R(c, x + 2, y + 4, 3, 1, col); R(c, x + 3, y + 5, 1, 1, col);
    R(c, x + 1, y + 1, 1, 1, '#ffc0cc');
  }
  function bubble(c, x, y, w, h) { // speech bubble, tail at bottom-left; (x,y) top-left
    R(c, x + 1, y, w - 2, h, INK); R(c, x, y + 1, w, h - 2, INK);
    R(c, x + 1, y + 1, w - 2, h - 2, '#fffaf0');
    R(c, x + 3, y + h, 3, 1, INK); R(c, x + 3, y + h + 1, 2, 1, INK); R(c, x + 4, y + h - 1, 2, 1, '#fffaf0'); R(c, x + 4, y + h, 1, 1, '#fffaf0');
  }
  function coin(c, x, y) { disc(c, x + 4, y + 4, 4, 4, '#7a4a08'); disc(c, x + 4, y + 4, 3, 3, '#ffcf3a'); R(c, x + 3, y + 2, 2, 1, '#fff2a0'); R(c, x + 4, y + 3, 1, 3, '#d89a10'); }
  function star(c, x, y, on) {
    const col = on ? '#ffd23a' : '#4a3a34', sh = on ? '#b07a10' : '#2a2020';
    R(c, x + 3, y, 1, 2, col); R(c, x, y + 2, 7, 2, col); R(c, x + 1, y + 4, 5, 1, col); R(c, x + 1, y + 5, 2, 2, col); R(c, x + 4, y + 5, 2, 2, col);
    R(c, x + 1, y + 6, 1, 1, sh); R(c, x + 5, y + 6, 1, 1, sh);
  }

  // ---------- frames / buttons ----------
  function frame(c, x, y, w, h, fill, rim, inner) {
    R(c, x + 1, y, w - 2, h, INK); R(c, x, y + 1, w, h - 2, INK);
    R(c, x + 1, y + 1, w - 2, h - 2, rim || '#8a5530');
    R(c, x + 2, y + 2, w - 4, h - 4, fill || '#3a2216');
    if (inner) R(c, x + 2, y + 2, w - 4, 1, inner);
  }
  function paper(c, x, y, w, h) {
    R(c, x + 2, y + 3, w, h, 'rgba(0,0,0,.28)');
    R(c, x, y, w, h, INK); R(c, x + 1, y + 1, w - 2, h - 2, '#fbf1d8');
    for (let yy = y + 14; yy < y + h - 3; yy += 11) R(c, x + 3, yy, w - 6, 1, '#eedcb4');
  }
  function button(c, x, y, w, h, label, kind, sel, size) {
    const pal = {
      red: ['#c8352a', '#7a1a12', '#ff8a5a', '#fff6e4'],
      gold: ['#e0a02a', '#7a4a0a', '#ffd87a', '#2a1408'],
      ghost: ['#3a2c36', '#1a121a', '#5a4a58', '#f0e0d0'],
      off: ['#4a3c38', '#2a201c', '#5a4c48', '#9a8a80'],
      green: ['#3a9a4a', '#1a5a24', '#8ad88a', '#f4fff0'],
    }[kind || 'red'];
    R(c, x + 1, y, w - 2, h, INK); R(c, x, y + 1, w, h - 2, INK);
    R(c, x + 1, y + 1, w - 2, h - 2, pal[0]);
    R(c, x + 1, y + h - 3, w - 2, 2, pal[1]); R(c, x + 2, y + 1, w - 4, 1, pal[2]);
    if (sel) {
      R(c, x - 2, y - 2, w + 4, 1, '#ffe27a'); R(c, x - 2, y + h + 1, w + 4, 1, '#ffe27a');
      R(c, x - 2, y - 2, 1, h + 4, '#ffe27a'); R(c, x + w + 1, y - 2, 1, h + 4, '#ffe27a');
      T(c, '▶', x - 9, y + (h - 10) / 2 + 1, 8, '#ffe27a', INK);
    }
    T(c, label, x + w / 2, y + (h - (size || 10)) / 2, size || 10, pal[3], kind === 'gold' ? null : pal[1], 'c');
  }

  // ---------- burger layers ----------
  // each draw(c, x, y, w, t): x = left, y = top, w = width, t = thickness
  const segs = (x, w, n) => { const out = [], sw = (w + 2) / n; for (let i = 0; i < n; i++) out.push([x - 1 + i * sw, sw]); return out; };
  const LAYER = {
    lettuce(c, x, y, w, t) { // flat leaf with round lobes drooping over the layer below
      const G = '#5ac84a', D = '#38a03a', band = Math.max(1, Math.ceil(t / 2));
      R(c, x - 1, y, w + 2, band, G);
      const seq = [2, 3, 2, 3, 3, 2], lw = 5;
      for (let i = -2, n = 0; i < w - 1; i += lw - 1, n++) {
        const d = seq[n % seq.length] + (t > 4 ? 1 : 0);
        for (let r = 0; r < d; r++) { const inset = r === d - 1 ? 1 : 0; R(c, x + i + inset, y + band + r, lw - inset * 2, 1, r === d - 1 ? D : G); }
      }
    },
    cabbage(c, x, y, w, t) {
      R(c, x - 2, y, w + 4, t, '#cfe8a0');
      for (let i = 0; i < w + 2; i += 3) R(c, x - 1 + i, y + (i % 2), 2, 1, '#9cc860');
      for (let i = 1; i < w; i += 4) R(c, x + i, y + t - 1, 2, 1, '#e8f6c8');
    },
    patty(c, x, y, w, t) {
      R(c, x + 1, y, w - 2, t, '#8a4a2a'); R(c, x, y + 1, w, Math.max(1, t - 2), '#8a4a2a');
      R(c, x + 1, y, w - 2, 1, '#a8643c'); R(c, x + 1, y + t - 1, w - 2, 1, '#5e2e1a');
    },
    chicken(c, x, y, w, t) {
      R(c, x - 2, y + 1, w + 4, t - 1, '#b4601a'); R(c, x, y, w, t, '#b4601a');
      for (let i = -2; i < w + 2; i += 3) R(c, x + i, y - ((i * 7) % 3 === 0 ? 1 : 0), 2, 2, '#e8a03a');
      for (let i = -1; i < w + 1; i += 4) R(c, x + i, y + t - 1 - (i % 3 === 0 ? 1 : 0), 2, 1, '#7a3a0e');
      for (let i = 2; i < w - 2; i += 4) R(c, x + i, y + 2 + (i % 3), 1, 1, i % 8 < 4 ? '#f6c860' : '#8a4410');
    },
    shrimp(c, x, y, w, t) {
      const n = Math.max(2, Math.round(w / 18));
      for (const [sx, sw] of segs(x, w, n)) {
        R(c, sx + 1, y, sw - 2, t, '#e8782e'); R(c, sx, y + 1, sw, t - 2, '#e8782e');
        for (let i = 1; i < sw - 1; i += 2) R(c, sx + i, y, 1, 1, '#f8c070');
        R(c, sx + 1, y + t - 1, sw - 2, 1, '#a84a1a'); R(c, sx + sw - 2, y + 1, 2, 2, '#e0402e');
      }
    },
    cheese(c, x, y, w, t) { // thin slice with a big triangle corner hanging in the middle
      R(c, x - 1, y, w + 2, Math.max(1, t - 1), '#ffd23a');
      const cx = Math.round(x + w / 2), hT = Math.max(2, Math.round(w / 8));
      for (let r = 0; r < hT; r++) { const half = hT - r; R(c, cx - half, y + t - 1 + r, half * 2, 1, r === hT - 1 ? '#f0a820' : '#ffd23a'); }
    },
    tomato(c, x, y, w, t) {
      R(c, x, y, w, t, '#e83a2a'); R(c, x + 1, y, w - 2, 1, '#ff7a5a');
      const n = Math.max(2, Math.round(w / 12)); for (let i = 1; i < n; i++) R(c, x + Math.round((w * i) / n), y, 1, t, '#b8261c');
    },
    onion(c, x, y, w, t) {
      const n = Math.max(2, Math.round(w / 13));
      for (const [sx, sw] of segs(x, w, n)) {
        R(c, sx + 1, y, sw - 2, t, '#b07ab8'); R(c, sx, y + 1, sw, t - 2, '#b07ab8');
        R(c, sx + 2, y + 1, sw - 4, Math.max(1, t - 2), '#f6eef6');
        if (sw > 8) R(c, sx + 4, y + 1, sw - 8, Math.max(1, t - 2), '#d8b0dc');
      }
    },
    bacon(c, x, y, w, t) {
      for (let i = 0; i < w + 6; i++) {
        const wv = Math.round(Math.sin(i * 0.5));
        R(c, x - 3 + i, y + wv + 1, 1, t, '#b8403a');
        if (i % 4 < 2) R(c, x - 3 + i, y + wv + 1 + Math.floor(t / 2), 1, 1, '#f6b0a0');
        R(c, x - 3 + i, y + wv + 1, 1, 1, '#e0706a');
      }
    },
    pickle(c, x, y, w, t) {
      const n = Math.max(2, Math.round(w / 12));
      for (const [sx, sw] of segs(x, w, n)) {
        R(c, sx + 1, y, sw - 2, t, '#4a8a2a'); R(c, sx, y + 1, sw, t - 2, '#4a8a2a');
        R(c, sx + 2, y + 1, sw - 4, Math.max(1, t - 2), '#a8d064');
        R(c, sx + Math.floor(sw / 2), y + Math.floor(t / 2), 1, 1, '#e8f4a0');
      }
    },
    jalapeno(c, x, y, w, t) {
      const n = Math.max(2, Math.round(w / 10));
      for (const [sx, sw] of segs(x, w, n)) {
        R(c, sx + 1, y, sw - 2, t, '#2a7a22'); R(c, sx, y + 1, sw, t - 2, '#2a7a22');
        R(c, sx + 2, y + 1, sw - 4, Math.max(1, t - 2), '#8ad05a');
        R(c, sx + Math.floor(sw / 2), y + Math.floor(t / 2), 1, 1, '#fff6c0');
      }
    },
    egg(c, x, y, w, t) {
      R(c, x - 3, y + 1, w + 6, t - 1, '#fffcf2'); R(c, x - 1, y, w + 2, t, '#fffcf2');
      R(c, x - 3, y + t - 1, w + 6, 1, '#e8dcc0');
      const cx = x + w / 2; disc(c, cx, y + 1, Math.max(3, w / 6), Math.max(2, t / 2), '#ffb21e'); R(c, cx - 2, y, 2, 1, '#ffe08a');
    },
    sauce(col, hi, dots) {
      return function (c, x, y, w, t) {
        for (let i = 0; i < w + 4; i++) { const wv = Math.sin(i * 0.7) > 0 ? 0 : 1; R(c, x - 2 + i, y + wv, 1, t, col); }
        R(c, x - 1, y, w + 2, 1, hi);
        R(c, x + 3, y + t, 2, 2, col); R(c, x + Math.round(w * 0.7), y + t, 2, 3, col);
        if (dots) for (let i = 2; i < w; i += 6) R(c, x + i, y + 1, 1, 1, dots);
      };
    },
    bunBottom(c, x, y, w, t) {
      R(c, x, y, w, 1, '#ffc870'); R(c, x, y + 1, w, Math.max(1, t - 2), '#f7a43a'); R(c, x + 1, y + t - 1, w - 2, 1, '#d9822a');
    },
    bunTop(c, x, y, w, t) {
      for (let r = 0; r < t; r++) {
        const k = (t - r - 0.5) / t, ww = Math.round(w * Math.sqrt(Math.max(0, 1 - k * k * 0.85))), x0 = Math.round(x + (w - ww) / 2);
        R(c, x0, y + r, ww, 1, r >= t - Math.max(1, Math.round(t / 6)) ? '#d9822a' : '#f7a43a');
      }
      // highlight streak (top right) + a few sesame seeds
      const hy = y + Math.max(1, Math.round(t * 0.18)); R(c, x + Math.round(w * 0.62), hy, Math.max(2, Math.round(w * 0.16)), 1, '#ffd88a'); R(c, x + Math.round(w * 0.74), hy + 1, Math.max(1, Math.round(w * 0.08)), 1, '#ffd88a');
      const seeds = [[0.3, 0.38], [0.5, 0.3], [0.42, 0.6], [0.7, 0.55], [0.22, 0.62], [0.6, 0.75]];
      seeds.slice(0, w > 30 ? 6 : 4).forEach(([a, b]) => R(c, x + Math.round(w * a), y + Math.round(t * b), w > 40 ? 2 : 1, 1, '#fff6e0'));
    },
  };
  // ingredient catalog: name, color for tiny tickets, stack thickness
  const ING = {
    lettuce: { name: '양상추', col: '#5ac84a', th: 4, d: LAYER.lettuce },
    patty: { name: '패티', col: '#8a4a2a', th: 7, d: LAYER.patty },
    cheese: { name: '치즈', col: '#ffd23a', th: 3, d: LAYER.cheese },
    tomato: { name: '토마토', col: '#e83a2a', th: 4, d: LAYER.tomato },
    onion: { name: '양파', col: '#d8b0dc', th: 3, d: LAYER.onion },
    bacon: { name: '베이컨', col: '#c84a40', th: 3, d: LAYER.bacon },
    pickle: { name: '피클', col: '#6aa83a', th: 3, d: LAYER.pickle },
    chicken: { name: '치킨', col: '#b4601a', th: 8, d: LAYER.chicken },
    mayo: { name: '마요', col: '#fff6e0', th: 2, d: LAYER.sauce('#fff8e8', '#ffffff') },
    jalapeno: { name: '할라피뇨', col: '#3a9a2a', th: 3, d: LAYER.jalapeno },
    egg: { name: '계란', col: '#ffe9a0', th: 4, d: LAYER.egg },
    mustard: { name: '머스터드', col: '#f0c020', th: 2, d: LAYER.sauce('#f2c41e', '#ffe46a') },
    cabbage: { name: '양배추', col: '#cfe8a0', th: 4, d: LAYER.cabbage },
    shrimp: { name: '새우', col: '#f08a40', th: 7, d: LAYER.shrimp },
    tartar: { name: '타르타르', col: '#f0ead0', th: 2, d: LAYER.sauce('#f2ecd2', '#ffffff', '#6aa83a') },
  };
  const BUN_B = 8, BUN_T = 13;
  // dark-brown pixel outline around everything drawn on a canvas (the reference burger look)
  const OUT = '#1e1416';
  function outline(cv) {
    const x = cv.getContext('2d'), w = cv.width, h = cv.height, im = x.getImageData(0, 0, w, h), d = im.data;
    const m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 60 ? 1 : 0;
    const oc = hexRGB(OUT);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx;
      if (m[i]) { d[i * 4 + 3] = 255; continue; }
      if ((xx > 0 && m[i - 1]) || (xx < w - 1 && m[i + 1]) || (yy > 0 && m[i - w]) || (yy < h - 1 && m[i + w])) { d[i * 4] = oc[0]; d[i * 4 + 1] = oc[1]; d[i * 4 + 2] = oc[2]; d[i * 4 + 3] = 255; }
    }
    x.putImageData(im, 0, 0); return cv;
  }
  const CACHE = new Map();
  function cached(key, w, h, fn) {
    let cv = CACHE.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); fn(x); outline(cv);
    if (CACHE.size > 400) CACHE.clear();
    CACHE.set(key, cv); return cv;
  }
  // icon: one layer drawn chunky, outlined (cx, cy = center)
  function icon(c, id, cx, cy, w) {
    w = Math.round(w || 22);
    const cv = cached('i|' + id + '|' + w, w + 14, 30, x => {
      if (id === 'bunTop') LAYER.bunTop(x, 7, 9, w, Math.max(6, Math.round(w * 0.5)));
      else if (id === 'bunBottom') LAYER.bunBottom(x, 7, 11, w, Math.max(5, Math.round(w * 0.32)));
      else { const g = ING[id]; const t = Math.min(9, Math.max(4, Math.round(g.th * 1.5))); g.d(x, 7, 15 - Math.round(t / 2), w, t); }
    });
    c.drawImage(cv, Math.round(cx - cv.width / 2), Math.round(cy - 15));
  }
  // a whole little burger (ids bottom→top, buns added), outlined; (cx, by) = bottom center
  function burger(c, cx, by, w, ids, k, px) {
    k = k || 1; px = px || 1;
    if (px > 1) { w = Math.round(w / px); k = k / px; }
    w = Math.round(w);
    const hs = ids.map(id => Math.max(2, Math.round(ING[id].th * k))), bb = Math.max(3, Math.round(w * 0.15)), bt = Math.max(5, Math.round(w * 0.38));
    const H2 = bb + hs.reduce((a, b) => a + b, 0) + bt + 8;
    const cv = cached('b|' + ids.join(',') + '|' + w + '|' + k, w + 16, H2, x => {
      let y = H2 - 3 - bb; LAYER.bunBottom(x, 8, y, w, bb);
      ids.forEach((id, i) => { y -= hs[i]; ING[id].d(x, 8, y, w, hs[i]); });
      LAYER.bunTop(x, 8, y - bt + 2, w, bt);
    });
    c.drawImage(cv, Math.round(cx - (cv.width * px) / 2), Math.round(by - (H2 - 2) * px), cv.width * px, cv.height * px);
  }
  // height of a layer when stacked (sauces overlap a bit)
  const stackH = id => (id === 'bunBottom' ? BUN_B : id === 'bunTop' ? BUN_T - 2 : ING[id].th);

  Object.assign(A, { outline, cached, burger, R, disc, poly, line, srand, makeIso, faceY, faceX, tileTop, box, txt, T, tw, chibi, heart, bubble, coin, star, frame, paper, button, LAYER, ING, icon, stackH, BUN_B, BUN_T });
  window.ART = A;
})();
