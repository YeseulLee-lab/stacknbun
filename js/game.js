'use strict';
/* =========================================================
   GAME — data, simulation, scenes (exterior → hall → counter), panels, input
   ========================================================= */
(function () {
  const A = window.ART, W = 480, H = 270, INK = A.INK;
  const { R, disc, poly, line, T, tw, chibi, heart, bubble, coin, star, frame, paper, button, ING, icon, stackH, box, faceX, faceY, tileTop, makeIso, LAYER } = A;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const irnd = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const mod = (n, m) => ((n % m) + m) % m;
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = clamp(Math.round(r * k), 0, 255); g = clamp(Math.round(g * k), 0, 255); b = clamp(Math.round(b * k), 0, 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // =====================================================
  // DATA
  // =====================================================
  const DIRS = ['up', 'down', 'left', 'right'];
  const ARW = { up: '↑', down: '↓', left: '←', right: '→' };
  // [↑, ↓, ←, →] per stage; theme 0 classic, 1 chicken, 2 shrimp
  const STAGES = [
    { k: ['lettuce', 'patty', 'cheese', 'tomato'], th: 0 },
    { k: ['lettuce', 'patty', 'cheese', 'onion'], th: 0 },
    { k: ['bacon', 'patty', 'cheese', 'onion'], th: 0 },
    { k: ['bacon', 'patty', 'pickle', 'onion'], th: 0 },
    { k: ['lettuce', 'chicken', 'mayo', 'tomato'], th: 1 },
    { k: ['lettuce', 'chicken', 'mayo', 'jalapeno'], th: 1 },
    { k: ['egg', 'chicken', 'mayo', 'jalapeno'], th: 1 },
    { k: ['egg', 'chicken', 'mustard', 'jalapeno'], th: 1 },
    { k: ['egg', 'chicken', 'mustard', 'onion'], th: 1 },
    { k: ['cabbage', 'shrimp', 'tartar', 'tomato'], th: 2 },
  ];
  const COUNT = [[2, 3], [2, 4], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6], [5, 7], [6, 7], [6, 8]];
  const THEMES = [
    { name: '클래식 버거', sign: 'BURGER', ext2: '#2a4ab0', ext: '#f4e6c8', wall: '#f6e6c0', wall2: '#e8c890', trim: '#d8352a', trim2: '#ffc83a', floorA: '#ffd23a', floorB: '#f39a2a', cwall: '#5cc8b4', cwall2: '#3aa898', tileA: '#ffd23a', tileB: '#ff9a2a', panel: '#2a6ab8', chairA: '#d8352a', chairB: '#f2b830', table: '#e04030', awn: ['#d8352a', '#fff4e0'], brick: '#b8503a', mid: 'patty' },
    { name: '치킨 버거', sign: 'CHICKEN', ext2: '#6a3a1e', ext: '#f2e2c8', wall: '#f4e0c4', wall2: '#d8b88a', trim: '#e0701e', trim2: '#6a3a1e', floorA: '#f2deb0', floorB: '#cf9258', cwall: '#ff8fa8', cwall2: '#e06a88', tileA: '#fff0c8', tileB: '#ffb24a', panel: '#7a3aa8', chairA: '#e0701e', chairB: '#8a5228', table: '#c86020', awn: ['#e0701e', '#fff0d8'], brick: '#8a5a3a', mid: 'chicken' },
    { name: '새우 버거', sign: 'SHRIMP', ext2: '#ff9a4a', ext: '#e8f2f2', wall: '#e6f2f0', wall2: '#bcdcdc', trim: '#2a78b0', trim2: '#ff9a4a', floorA: '#d2eef2', floorB: '#64b0cc', cwall: '#ffd25a', cwall2: '#e8b030', tileA: '#e8f8ff', tileB: '#6ec4e8', panel: '#e0402e', chairA: '#2a78b0', chairB: '#ff9a4a', table: '#2a78b0', awn: ['#2a78b0', '#f4fbff'], brick: '#4a7a9a', mid: 'shrimp' },
  ];
  const LOOKS = [
    { name: '회사원', skin: '#f2c79a', hair: '#2a2220', hs: 'short', top: '#38425e', bottom: '#2a3044', tie: '#c8323a', collar: '#ffffff' },
    { name: '대학생', skin: '#f6d0a8', hair: '#5a3a2a', hs: 'bob', top: '#6ab0e0', bottom: '#3a4a6a' },
    { name: '할머니', skin: '#f0c8a0', hair: '#d8d8d8', hs: 'bun', top: '#8a5a8a', bottom: '#5a4a5a' },
    { name: '고등학생', skin: '#f2c79a', hair: '#1e1a1a', hs: 'short', top: '#24304a', bottom: '#1e2230', btn: '#e0c050' },
    { name: '멋쟁이', skin: '#f6d0a8', hair: '#c86a3a', hs: 'long', top: '#e0809a', bottom: '#4a3a5a' },
    { name: '동네 아저씨', skin: '#e8b88a', hair: '#8a8a8a', hs: 'bald', top: '#5a8a5a', bottom: '#4a3a2a', glasses: true },
    { name: '배달 기사', skin: '#d8a070', hair: '#2a2220', hs: 'cap', cap: '#2a7ab0', top: '#f0c030', bottom: '#3a3a4a' },
    { name: '여행객', skin: '#f6d0a8', hair: '#e8c060', hs: 'long', top: '#3ab0a0', bottom: '#e8e0d0' },
    { name: '운동선수', skin: '#d89a6a', hair: '#1a1a1a', hs: 'band', band: '#ffffff', top: '#e04a4a', bottom: '#2a2a3a' },
  ];
  const SPECIAL = {
    double: { name: '더블 패티광', skin: '#e8b88a', hair: '#3a2a20', hs: 'band', band: '#e83a2a', top: '#f0e8d8', bottom: '#3a4a6a', big: true, tip: 3, tag: '재료 10개 · 팁 3배' },
    rush: { name: '급한 직장인', skin: '#f2c79a', hair: '#1a1a22', hs: 'short', top: '#2a2a34', bottom: '#22222a', tie: '#3a6ac8', collar: '#ffffff', bag: '#6a4a2a', glasses: true, tip: 2, tag: '인내심 절반 · 팁 2배' },
  };
  const UPG = [
    { id: 'interior', name: '인테리어', desc: '손님 인내심 +10%', max: 5, price: [100, 200, 400, 800, 1600] },
    { id: 'menu', name: '메뉴판', desc: '버거 기본 가격 +15%', max: 5, price: [150, 300, 600, 1200, 2400] },
    { id: 'sign', name: '간판', desc: '스테이지당 손님 +3명', max: 5, price: [200, 400, 800, 1600, 3200] },
    { id: 'rail', name: '티켓 레일', desc: '동시 대기 손님 +1', max: 2, price: [500, 1500] },
    { id: 'ins', name: '실수 보험', desc: '손님당 첫 실수는 인내심 감소 없음', max: 1, price: [2000] },
  ];
  const BIZ_LEN = 120;

  // ingredient economy: cost per piece used (wrong presses are wasted too) and market price to unlock
  const COST = { lettuce: 2, patty: 4, cheese: 3, tomato: 2, onion: 2, bacon: 5, pickle: 2, chicken: 5, mayo: 1, jalapeno: 3, egg: 3, mustard: 1, cabbage: 2, shrimp: 6, tartar: 1 };
  const UNLOCK = ['onion', 'bacon', 'pickle', 'mayo', 'egg', 'jalapeno', 'mustard', 'chicken', 'cabbage', 'tartar', 'shrimp']; // one per cleared stage
  const START_ING = ['lettuce', 'patty', 'cheese', 'tomato'];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // a new day: ingredients bought yesterday are guaranteed a key, the rest come from what you own, in random positions
  function newDayMap() {
    const must = shuffle(P.fresh || []).slice(0, 4);
    const rest = shuffle(P.owned.filter(i => !must.includes(i)));
    const pickd = shuffle(must.concat(rest).slice(0, 4));
    P.prevMap = P.map || null;
    P.map = { up: pickd[0], down: pickd[1], left: pickd[2], right: pickd[3] };
    P.newIng = must; P.fresh = [];
    save();
  }
  function stageInfo(n) {
    const d = STAGES[(n - 1) % STAGES.length];
    // never write the save from here: this also runs on page load, before 이어하기 reads the save
    const map = Object.assign({}, P.map || { up: 'lettuce', down: 'patty', left: 'cheese', right: 'tomato' });
    const changed = {};
    if (P.prevMap) DIRS.forEach(k => { if (P.prevMap[k] !== map[k]) changed[k] = true; });
    const cnt = n <= 10 ? COUNT[n - 1] : [7, 8];
    return { n, map, changed, theme: THEMES[d.th], th: d.th, cnt, moved: n > 1 && STAGES[(n - 2) % STAGES.length].th !== d.th };
  }

  // =====================================================
  // STATE
  // =====================================================
  const SAVE_KEY = 'burger-stack-tycoon-v1';
  const fresh = () => ({ stage: 1, money: 0, best: 0, served: 0, up: { interior: 0, menu: 0, sign: 0, rail: 0, ins: 0 }, owned: START_ING.slice(), fresh: [], map: null, prevMap: null, newIng: [] });
  let P = fresh();
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) { /* storage unavailable */ } }
  function loadSave() { try { const j = localStorage.getItem(SAVE_KEY); if (!j) return null; const o = JSON.parse(j); o.up = Object.assign(fresh().up, o.up || {}); const r = Object.assign(fresh(), o); if (!Array.isArray(r.owned) || !r.owned.length) r.owned = START_ING.slice(); return r; } catch (e) { return null; } }

  const s = {
    scene: 'exterior', t: 0, eve: false,
    panel: null, trans: null, banner: null, toast: null,
    biz: null, cust: [], q: [], cur: null, fxC: [], shake: {}, hits: [],
    peds: [], cars: [], pedT: 0, carT: 2, smoke: [], motes: [],
    info: stageInfo(1), muted: false, idSeq: 1,
  };
  let dirtyExt = true, dirtyCtr = true;
  const markDirty = () => { dirtyExt = dirtyCtr = true; };

  // =====================================================
  // AUDIO (tiny synth)
  // =====================================================
  let AC = null;
  function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function tone(f0, f1, dur, type, vol, delay) {
    const ac = audio(); if (!ac || s.muted) return;
    const t0 = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.06, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sfx(k) {
    if (k === 'pop') tone(520, 820, 0.08, 'square', 0.05);
    else if (k === 'bad') tone(160, 90, 0.18, 'sawtooth', 0.06);
    else if (k === 'coin') { tone(988, 988, 0.07, 'square', 0.05); tone(1319, 1319, 0.16, 'square', 0.05, 0.07); }
    else if (k === 'perfect') { tone(784, 784, 0.07, 'square', 0.05); tone(988, 988, 0.07, 'square', 0.05, 0.07); tone(1319, 1568, 0.2, 'square', 0.05, 0.14); }
    else if (k === 'sel') tone(660, 660, 0.05, 'square', 0.04);
    else if (k === 'ok') tone(523, 1046, 0.12, 'square', 0.05);
    else if (k === 'nope') tone(220, 200, 0.1, 'square', 0.04);
    else if (k === 'door') { tone(880, 660, 0.12, 'triangle', 0.06); tone(660, 880, 0.18, 'triangle', 0.05, 0.12); }
    else if (k === 'zoom') tone(300, 900, 0.18, 'triangle', 0.05);
    else if (k === 'angry') tone(300, 120, 0.3, 'sawtooth', 0.05);
    else if (k === 'bell') { tone(1568, 1568, 0.25, 'triangle', 0.05); tone(2093, 2093, 0.3, 'triangle', 0.035, 0.05); }
    else if (k === 'end') { tone(784, 392, 0.4, 'triangle', 0.06); }
  }

  // =====================================================
  // EXTERIOR SCENE (front view of the shopfront, like a street photo)
  // =====================================================
  const DOOR_RECT = [290, 150, 52, 84];
  const DOOR_PT = [316, 192];
  const SHOP_RECT = [22, 62, 336, 188];
  function dither(c, x, y, w, h, a, b) { R(c, x, y, w, h, a); c.fillStyle = b; for (let yy = y; yy < y + h; yy++) for (let xx = x + ((yy + x) & 1); xx < x + w; xx += 2) c.fillRect(xx, yy, 1, 1); }
  let extCv = null;
  function stool(c, x, y) { // red diner stool; (x, y) = floor point
    disc(c, x, y, 9, 2, INK); disc(c, x, y - 1, 8, 2, '#c8ced6'); R(c, x - 1, y - 24, 3, 23, INK); R(c, x, y - 24, 1, 23, '#e8ecf0');
    R(c, x - 6, y - 12, 13, 1, '#a8b0ba');
    disc(c, x, y - 27, 11, 4, INK); disc(c, x, y - 28, 10, 3, '#e0302a'); R(c, x - 6, y - 30, 7, 1, '#ff7a6a'); R(c, x - 10, y - 26, 21, 2, '#a01e1a');
  }
  function pottedPlant(c, x, y) { // terracotta pot with a leafy bush; (x, y) = bottom centre
    const leaves = [[-7, -22, 5, 3, '#2e8a3a'], [6, -24, 5, 3, '#2e8a3a'], [-4, -28, 4, 4, '#3aa84a'], [3, -30, 4, 4, '#3aa84a'], [0, -22, 6, 5, '#46b852'], [-8, -16, 4, 3, '#3aa84a'], [8, -17, 4, 3, '#3aa84a'], [-2, -34, 3, 3, '#5ac860']];
    leaves.forEach(([dx, dy, rx, ry]) => disc(c, x + dx, y + dy, rx + 1, ry + 1, INK));
    leaves.forEach(([dx, dy, rx, ry, col]) => { disc(c, x + dx, y + dy, rx, ry, col); R(c, x + dx - 1, y + dy - ry + 1, 2, 1, '#8ee07a'); });
    R(c, x, y - 18, 1, 6, '#2a6a2a');
    poly(c, [[x - 9, y - 13], [x + 9, y - 13], [x + 7, y], [x - 7, y]], INK);
    poly(c, [[x - 8, y - 12], [x + 8, y - 12], [x + 6, y - 1], [x - 6, y - 1]], '#d0703a');
    R(c, x - 9, y - 14, 18, 4, INK); R(c, x - 8, y - 13, 16, 2, '#e08850'); R(c, x - 5, y - 9, 2, 6, '#e8905a'); R(c, x - 6, y - 2, 12, 1, '#a8502a');
  }
  function paintExterior() {
    if (!extCv) { extCv = document.createElement('canvas'); extCv.width = W; extCv.height = H; }
    const c = extCv.getContext('2d'), th = s.info.theme;
    c.imageSmoothingEnabled = false;
    // upper floors: glass curtain wall
    R(c, 0, 0, W, 56, '#6aa8b8');
    for (let x = 0; x < W; x += 40) {
      dither(c, x + 2, 0, 36, 50, '#8cc4d0', '#b4e0e8');
      R(c, x + 2, 0, 36, 18, '#8cc4d0');
      poly(c, [[x + 8, 0], [x + 16, 0], [x + 4, 50], [x + 2, 50]], '#d8f2f6');
      R(c, x, 0, 2, 52, '#2e4a50');
    }
    R(c, 0, 50, W, 2, '#2e4a50'); R(c, 0, 52, W, 4, '#e6e6e0');
    // green fascia
    R(c, 0, 56, W, 16, '#2e6a52'); R(c, 0, 56, W, 2, '#4a9a72'); R(c, 0, 71, W, 1, INK);
    // neighbours
    R(c, 0, 72, 22, 178, '#f2efe6'); R(c, 2, 120, 16, 50, '#d8352a'); R(c, 4, 122, 12, 46, '#fff6e0');
    R(c, 358, 72, 122, 178, '#e6e0d4');
    for (let y = 80; y < 250; y += 10) R(c, 358, y, 122, 1, '#d8d2c6');
    R(c, 358, 72, 3, 178, '#cfc8ba'); R(c, 372, 72, 4, 178, '#b8b2a6'); R(c, 373, 72, 1, 178, '#d8d2c6');
    for (let y = 100; y < 250; y += 40) R(c, 370, y, 8, 2, '#a8a296');
    // main signboard
    const sx = 30, sy = 62, sw = 320, sh = 60;
    R(c, sx - 2, sy - 2, sw + 4, sh + 4, '#b8b8b0'); R(c, sx - 1, sy - 1, sw + 2, sh + 2, INK); R(c, sx, sy, sw, sh, '#fbfaf4');
    poly(c, [[sx, sy + 3], [sx + sw, sy + 9], [sx + sw, sy + 15], [sx, sy + 9]], th.trim);
    poly(c, [[sx, sy + sh - 8], [sx + sw, sy + sh - 6], [sx + sw, sy + sh - 1], [sx, sy + sh - 3]], th.ext2 || '#2a4ab0');
    R(c, sx, sy + sh - 1, sw, 1, '#d8d8d0');
    let tw3 = 0; for (let d = 0; d < 2; d++) tw3 = T(c, 'STACK&BUN', sx + 14 + d, sy + 15, 12, th.trim, null, 'l', 3);
    { const mx = sx + 282, my = sy + 44; A.burger(c, mx, my + 6, 36, ['lettuce', th.mid, 'cheese'], 1.1, 2);  }
    // awning
    poly(c, [[30, 124], [350, 124], [358, 146], [22, 146]], '#f4f2ea');
    for (let x = 26; x < 356; x += 6) R(c, x, 126, 1, 19, '#d4d0c4');
    R(c, 22, 146, 336, 4, '#e2ded2'); R(c, 22, 150, 336, 1, INK); R(c, 22, 146, 336, 1, '#ffffff');
    // shop wall under the awning (white tiles)
    R(c, 22, 151, 336, 84, '#f4f4f0');
    for (let y = 151; y < 235; y += 7) R(c, 22, y, 336, 1, '#dcdcd6');
    for (let y = 151, r = 0; y < 235; y += 7, r++) for (let x = 22 + (r % 2) * 4; x < 358; x += 8) R(c, x, y, 1, 7, '#dcdcd6');
    // open service window: warm interior
    const wx = 72, wy = 152, ww = 204;
    R(c, wx - 2, wy - 1, ww + 4, 46, INK); R(c, wx, wy, ww, 44, '#f6e8cc');
    R(c, wx, wy, ww, 10, '#e0cfae'); for (let x = wx + 20; x < wx + ww; x += 50) { R(c, x, wy + 10, 22, 2, '#fff8d0'); }
    R(c, wx + 8, wy + 16, 46, 2, '#8a6a4a'); for (let i = 0; i < 6; i++) R(c, wx + 10 + i * 7, wy + 10 + (i % 2), 5, 6, ['#d8352a', '#ffc83a', '#4aa84a', '#2a6ab8'][i % 4]);
    R(c, wx + 70, wy + 14, 20, 16, th.trim); R(c, wx + 72, wy + 16, 16, 12, '#fff6e0'); A.burger(c, wx + 80, wy + 27, 9, [th.mid], 0.6);
    R(c, wx + 96, wy + 14, 20, 16, INK); R(c, wx + 98, wy + 16, 16, 12, '#2a3a5a'); R(c, wx + 100, wy + 18, 12, 2, '#ffd23a');
    R(c, wx + 130, wy + 12, 60, 20, '#c8ced6'); R(c, wx + 132, wy + 14, 56, 2, '#e8ecf0'); disc(c, wx + 150, wy + 24, 4, 3, '#5c2818'); disc(c, wx + 170, wy + 24, 4, 3, '#5c2818');
    [[wx + 60, 6], [wx + 120, 5], [wx + 180, 7]].forEach(([x, h]) => R(c, x, wy + 36 - h, 10, h, '#f08a3a'));
    // stainless counter top + slatted bar front
    R(c, wx - 6, wy + 42, ww + 12, 2, INK); R(c, wx - 6, wy + 44, ww + 12, 4, '#e4e8ec'); R(c, wx - 6, wy + 44, ww + 12, 1, '#ffffff');
    R(c, wx - 4, wy + 48, ww + 8, 34, '#c4cad2');
    for (let x = wx - 2; x < wx + ww + 4; x += 6) { R(c, x, wy + 48, 1, 34, '#9aa2ac'); R(c, x + 2, wy + 48, 1, 34, '#e8ecf0'); }
    R(c, wx - 4, wy + 50, ww + 8, 1, '#f4f6f8');
    // left wall: menu poster
    R(c, 26, 158, 40, 30, INK); R(c, 27, 159, 38, 28, th.trim); R(c, 29, 161, 34, 24, '#fff6e0'); A.burger(c, 46, 183, 18, [th.mid, 'cheese', 'lettuce'], 0.8);
    // door
    const [dx, dy, dw, dh] = DOOR_RECT;
    R(c, dx - 1, dy - 1, dw + 2, dh + 2, INK); R(c, dx, dy, dw, dh, '#c4cad2'); R(c, dx + 4, dy + 4, dw - 8, dh - 8, '#8ab0bc');
    dither(c, dx + 4, dy + 40, dw - 8, 10, '#8ab0bc', '#c89a6a'); R(c, dx + 4, dy + 50, dw - 8, dh - 54, '#c89a6a');
    poly(c, [[dx + 10, dy + 4], [dx + 18, dy + 4], [dx + 6, dy + 40], [dx + 4, dy + 40]], '#cfe6ee');
    R(c, dx + 4, dy + 40, dw - 8, 3, '#e4e8ec'); R(c, dx + 4, dy + 42, dw - 8, 1, '#8a929c');
    R(c, dx + 16, dy + 14, 22, 10, INK); R(c, dx + 17, dy + 15, 20, 8, th.trim2); T(c, 'OPEN', dx + 27, dy + 15, 8, '#2a1a08', null, 'c');
    // plant + crates
    pottedPlant(c, 283, 234);
    for (let i = 0; i < 3; i++) { const y = 234 - (i + 1) * 15; R(c, 26, y, 42, 15, INK); R(c, 27, y + 1, 40, 13, '#d8302a'); for (let x = 30; x < 66; x += 5) R(c, x, y + 1, 2, 2, '#a01e1a'); T(c, 'Cola', 47, y + 4, 8, '#fff6e8', '#8a1410', 'c'); }
    // diamond-plate step
    R(c, 14, 234, 350, 14, '#b8bec6'); R(c, 14, 234, 350, 1, '#e8ecf0');
    for (let y = 236, r = 0; y < 246; y += 3, r++) for (let x = 16 + (r % 2) * 4; x < 362; x += 8) { R(c, x, y, 2, 1, '#e8ecf0'); R(c, x + 1, y + 1, 2, 1, '#8a929c'); }
    R(c, 14, 246, 350, 4, '#9aa2ac'); R(c, 14, 250, 350, 1, INK);
    // stools on the step
    [110, 162, 214].forEach(x => stool(c, x, 242));
    // sidewalk
    R(c, 0, 250, W, 20, '#bcb8b0'); R(c, 364, 250, 116, 20, '#bcb8b0');
    for (let x = 0; x < W; x += 24) R(c, x, 251, 1, 19, '#a8a49c'); R(c, 0, 260, W, 1, '#a8a49c');
    R(c, 0, 234, 14, 16, '#bcb8b0'); R(c, 364, 234, 116, 16, '#c4c0b8');
    if (s.eve) { c.fillStyle = 'rgba(60,30,100,0.28)'; c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = 'lighter'; disc(c, 174, 176, 110, 30, 'rgba(255,170,80,0.18)'); c.restore(); }
    dirtyExt = false;
  }
  const CHEF_LOOK = { skin: '#eab88a', hair: '#2a2220', hs: 'chef', top: '#fbfbf6', bottom: '#3a3a4a', apron: '#e8e8e0' };
  const STOOLS = [110, 162, 214];
  const PRESEAT = [LOOKS[1], LOOKS[5], LOOKS[4]];
  const ext = { staff: { x: 120, tx: 120, carry: false, wait: 0, walk: 0, seat: -1 }, seats: STOOLS.map((x, i) => [{ x, st: 'eat', t: 3.4, bites: 1 }, { x, st: 'wait', t: 0.5 }, { x, st: 'eat', t: 6.5, bites: 3 }][i]), smoke: [], plates: [] };
  ext.seats.forEach((se, i) => (se.look = PRESEAT[i]));
  function drawShopLife(c) {
    const th = s.info.theme, t = s.t;
    // chef at the grill (back) + grill smoke
    const cx = 232, cb = Math.floor(t * 4) % 2;
    chibi(c, cx, 197, CHEF_LOOK, { back: true, step: cb });
    ext.smoke.forEach(m => { c.globalAlpha = clamp(0.6 * (1 - m.t / m.life), 0, 1); disc(c, m.x, m.y, m.r, m.r, '#f6f4f0'); c.globalAlpha = 1; });
    // server walking behind the counter with a burger
    const st = ext.staff, sl = { skin: '#f2c79a', hair: '#3a2420', hs: 'cap', cap: th.trim, top: th.trim, apron: '#fff4e0', bottom: '#3a3a4a' };
    chibi(c, st.x, 199, sl, { step: Math.abs(st.tx - st.x) > 1 ? Math.floor(st.walk * 6) % 2 : 0, mood: st.wait > 0 ? 'happy' : null });
    if (st.carry) A.burger(c, st.x + 8, 193 - (st.wait > 0 ? 2 : 0), 10, [th.mid, 'cheese', 'lettuce'], 0.6);
  }
  function drawDiner(c, se) {
    const th = s.info.theme;
    if (se.st === 'walk' || se.st === 'leave') { disc(c, se.px, se.py, 6, 2, 'rgba(0,0,0,.15)'); chibi(c, se.px, se.py, se.look, { step: Math.floor(se.walk * 6) % 2, mood: se.st === 'leave' ? 'happy' : null }); return; }
    const x = se.x, y = 214;
    R(c, x - 4, y - 1, 3, 7, INK); R(c, x + 1, y - 1, 3, 7, INK); R(c, x - 3, y, 1, 5, se.look.bottom); R(c, x + 2, y, 1, 5, se.look.bottom);
    const ph = se.st === 'eat' ? (se.t % 1.6) / 1.6 : 1, biting = ph < 0.25;
    chibi(c, x, y, se.look, { sit: true, mood: se.st === 'eat' ? (biting ? 'happy' : null) : null });
    if (se.st === 'wait') { bubble(c, x + 4, y - 32, 15, 12); A.burger(c, x + 11, y - 22, 8, [th.mid], 0.5); }
    if (se.st === 'eat') {
      const left = 4 - se.bites;
      if (left > 0) A.burger(c, x + (biting ? 4 : 8), y - (biting ? 6 : 3), 4 + left * 2, left > 2 ? [th.mid, 'cheese', 'lettuce'] : [th.mid], 0.5);
      if (biting && se.bites < 4) { R(c, x - 6, y - 12, 1, 1, '#f7a43a'); R(c, x + 6, y - 11, 1, 1, '#f7a43a'); }
      if (se.bites >= 4) heart(c, x - 3, y - 27);
    }
  }
  function drawExterior(c) {
    if (dirtyExt) paintExterior();
    c.drawImage(extCv, 0, 0);
    drawShopLife(c);
    c.drawImage(extCv, 60, 194, 226, 42, 60, 194, 226, 42); // counter top + bar front hide the staff's legs
    ext.seats.forEach(se => { if (se.st !== 'empty') drawDiner(c, se); });
    s.peds.slice().sort((a, b) => a.y - b.y).forEach(p => { disc(c, p.x, p.y, 6, 2, 'rgba(0,0,0,.15)'); chibi(c, p.x, p.y, p.look, { back: p.back, step: Math.floor(p.walk * 6) % 2 }); });
    if (s.panel && s.panel.kind === 'open' && !s.trans) {
      const b = Math.floor(s.t * 3) % 2;
      T(c, '▼', DOOR_PT[0], DOOR_RECT[1] - 14 + b, 10, '#ffe27a', INK, 'c');
    }
  }
  function updShopLife(dt) {
    const st = ext.staff;
    if (Math.random() < dt * 3) ext.smoke.push({ x: rnd(205, 255), y: 176, r: rnd(2, 3), t: 0, life: rnd(0.8, 1.4) });
    ext.smoke.forEach(m => { m.t += dt; m.y -= 12 * dt; m.r += dt; }); ext.smoke = ext.smoke.filter(m => m.t < m.life);
    ext.seats.forEach((se, i) => {
      se.t = (se.t || 0) + dt;
      if (se.st === 'empty') { se.cd -= dt; if (se.cd <= 0) Object.assign(se, { st: 'walk', look: pick(LOOKS), px: se.x < 180 || Math.random() < 0.5 ? -12 : W + 12, py: 256, walk: 0, t: 0, dur: rnd(10, 16) }); }
      else if (se.st === 'walk') { const d = se.x - se.px; se.walk += dt; se.px += Math.sign(d) * Math.min(Math.abs(d), 60 * dt); if (Math.abs(d) < 1) { se.st = 'wait'; se.t = 0; } }
      else if (se.st === 'eat') { if (se.t > 1.6 * (se.bites + 1) && se.bites < 4) se.bites++; if (se.t > (se.dur || 12)) { se.st = 'leave'; se.px = se.x; se.py = 256; se.walk = 0; se.dir = Math.random() < 0.5 ? 1 : -1; } }
      else if (se.st === 'leave') { se.walk += dt; se.px += se.dir * 50 * dt; if (se.px < -16 || se.px > W + 16) { se.st = 'empty'; se.cd = rnd(0.3, 1.5); } }
    });
    // server: take a burger to whoever is waiting, then wander
    if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0 && st.carry) { const se = ext.seats[st.seat]; st.carry = false; if (se && se.st === 'wait') { se.st = 'eat'; se.t = 0; se.bites = 0; } st.seat = -1; st.tx = rnd(90, 200); } return; }
    if (st.seat < 0) { const i = ext.seats.findIndex(se => se.st === 'wait' && se.t > 1); if (i >= 0) { st.seat = i; st.carry = true; st.tx = ext.seats[i].x; } }
    const d = st.tx - st.x;
    if (Math.abs(d) > 1) { st.x += Math.sign(d) * Math.min(Math.abs(d), 45 * dt); st.walk += dt; }
    else if (st.carry) st.wait = 0.6;
    else if (Math.random() < dt * 0.4) st.tx = rnd(90, 200);
  }
  function updExterior(dt) {
    updShopLife(dt);
    s.pedT -= dt;
    if (s.pedT <= 0) {
      s.pedT = rnd(0.8, 2.0);
      const dir = Math.random() < 0.5 ? 1 : -1;
      s.peds.push({ x: dir > 0 ? -12 : W + 12, y: rnd(255, 266), vx: dir * rnd(26, 40), look: pick(LOOKS), walk: 0, back: false, toDoor: Math.random() < 0.3 });
    }
    s.peds.forEach(p => {
      if (p.toDoor && !p.in && Math.abs(p.x - DOOR_PT[0]) < 2) { p.in = true; p.vx = 0; p.back = true; }
      if (p.in) { p.y -= 22 * dt; if (p.y < 236) p.dead = true; }
      p.x += p.vx * dt; p.walk += dt;
    });
    s.peds = s.peds.filter(p => !p.dead && p.x > -20 && p.x < W + 20);
  }

  // =====================================================
  // CUSTOMERS & BUSINESS
  // =====================================================
  const maxQ = () => 4 + P.up.rail;
  function makeOrder(info, special) {
    const m = info.map;
    if (special === 'double') { const pk = DIRS.find(k => ['patty', 'chicken', 'shrimp', 'bacon'].includes(m[k])) || 'down', others = DIRS.filter(k => k !== pk); const o = []; for (let i = 0; i < 10; i++) o.push(i % 3 === 1 || Math.random() < 0.4 ? m[pk] : m[pick(others)]); return o; }
    const n = irnd(info.cnt[0], info.cnt[1]), o = [];
    for (let i = 0; i < n; i++) {
      let k = pick(DIRS);
      if (i > 0 && o[i - 1] === m[k] && Math.random() < 0.55) k = pick(DIRS);
      o.push(m[k]);
    }
    if (!o.includes(m.down) && Math.random() < 0.7) o[Math.min(o.length - 1, Math.floor(o.length / 2))] = m.down;
    return o;
  }
  function genSpawns(count) {
    const segs = [[0.5, 40, 1], [40, 80, 2], [80, 114, 1]];
    const tot = segs.reduce((a, [x0, x1, w]) => a + (x1 - x0) * w, 0), out = [];
    for (let i = 0; i < count; i++) {
      let u = ((i + (i === 0 ? 0.05 : rnd(0.15, 0.85))) / count) * tot;
      for (const [x0, x1, w] of segs) { const len = (x1 - x0) * w; if (u <= len) { out.push(x0 + u / w); break; } u -= len; }
    }
    return out.sort((a, b) => a - b);
  }
  function startBiz() {
    const info = s.info, count = 36 + 3 * P.up.sign;
    s.biz = { stage: info.n, t: 0, spawns: genSpawns(count), total: count, rep: 5, combo: 0, best: 0, sales: 0, tips: 0, cost: 0, cnt: { perfect: 0, good: 0, bad: 0, fail: 0 }, served: 0, closing: 0, peakShown: false, flashT: 10 };
    s.cust = []; s.q = []; s.cur = null; s.fxC = [];
    s.banner = { text: '영업 시작!', t: 0, dur: 1.8 };
    sfx('bell');
  }
  function spawnCustomer() {
    const info = s.info;
    let special = null;
    if (info.n >= 3) { const r = Math.random(); if (r < 0.1) special = 'double'; else if (r < 0.2) special = 'rush'; }
    const look = special ? SPECIAL[special] : pick(LOOKS);
    // walks in through the door on the right edge of the counter view
    const cu = { id: s.idSeq++, look, special, st: 'in', arrived: false, walk: 0, moving: false, sayT: 0, cvx: W + 24 };
    cu.order = makeOrder(info, special);
    // heads-up the first time a special guest shows up in a day
    if (special && s.biz && !(s.biz.seen = s.biz.seen || {})[special]) {
      s.biz.seen[special] = true;
      s.banner = special === 'double' ? { text: '특별 손님 등장!', sub: '더블 패티광 · 재료 10개 · 팁 3배', col: '#ffe03a', t: 0, dur: 2.6 } : { text: '특별 손님 등장!', sub: '급한 직장인 · 인내심 절반 · 팁 2배', col: '#ffe03a', t: 0, dur: 2.6 };
      sfx('bell');
    }
    const n = cu.order.length;
    cu.patMax = cu.pat = (14 + 3 * n) * Math.max(0.6, Math.pow(0.97, info.n - 1)) * (1 + 0.1 * P.up.interior) * (special === 'rush' ? 0.5 : 1);
    cu.price = Math.round((20 + 8 * n + cu.order.reduce((a, i) => a + Math.max(0, COST[i] - 2) * 2, 0)) * (1 + 0.15 * P.up.menu));
    s.q.push(cu.id); s.cust.push(cu);
    sfx('door');
  }
  const pick2 = (seed, a) => a[seed % a.length];
  const byId = id => s.cust.find(c => c.id === id);
  function removeCust(cu) { s.q = s.q.filter(id => id !== cu.id); s.cust = s.cust.filter(c => c.id !== cu.id); }
  function updCustomers(dt) {
    const biz = s.biz;
    s.q.forEach((id, i) => {
      const cu = byId(id); if (!cu) return;
      const tx = SLOT_X(i), d = tx - cu.cvx, sp = 280 * dt;
      cu.moving = Math.abs(d) > 0.5;
      if (cu.moving) { cu.cvx += Math.sign(d) * Math.min(Math.abs(d), sp); cu.walk += dt; }
      else if (cu.st === 'in') { cu.st = 'queue'; cu.arrived = true; cu.sayT = 1.2; }
      if (cu.sayT > 0) cu.sayT -= dt;
      if (cu.arrived && biz && !biz.closing) { cu.pat -= dt; if (cu.pat <= 0) failCustomer(cu); }
    });
  }
  function failCustomer(cu) {
    const biz = s.biz, front = s.q[0] === cu.id;
    fxCustLeave(cu, 'angry');
    removeCust(cu);
    biz.cnt.fail++; biz.rep = Math.max(0, biz.rep - 1); biz.combo = 0;
    if (front && s.cur && s.cur.cid === cu.id) { tossBurger(); s.cur = null; }
    fxJudge('FAIL', '#ff5a4a', '평판 -1');
    sfx('angry');
    if (biz.rep <= 0) closeBiz('rep');
  }
  function closeBiz(reason) {
    const biz = s.biz; if (!biz || biz.closing) return;
    biz.closing = 1; biz.reason = reason; biz.closeT = 0;
    s.banner = { text: reason === 'rep' ? '평판이 바닥났어요…' : '영업 종료!', t: 0, dur: 2.2 };
    sfx('end');
    s.q.forEach(id => { const cu = byId(id); if (cu) fxCustLeave(cu, null); });
    s.q = []; s.cust = []; s.cur = null;
  }
  function updBiz(dt) {
    const biz = s.biz; if (!biz) return;
    if (biz.closing) {
      biz.closeT += dt;
      if (biz.closeT > 2.4 && !s.trans) finishBiz();
      return;
    }
    biz.t += dt;
    if (biz.flashT > 0) biz.flashT -= dt;
    if (!biz.peakShown && biz.t >= 40) { biz.peakShown = true; s.banner = { text: '점심 피크 타임! 손님 2배', t: 0, dur: 2 }; sfx('bell'); }
    while (biz.spawns.length && biz.spawns[0] <= biz.t && s.q.length < maxQ()) { biz.spawns.shift(); spawnCustomer(); }
    if (biz.t >= BIZ_LEN) closeBiz('time');
    // front customer gets a fresh bottom bun
    const fid = s.q[0], f = fid && byId(fid);
    if (f && f.arrived && (!s.cur || s.cur.cid !== fid)) {
      s.cur = { cid: fid, stack: [{ id: 'bunBottom', t: 0 }], mist: 0, insUsed: false };
    }
  }
  function finishBiz() {
    const biz = s.biz;
    biz.net = biz.sales + biz.tips - biz.cost;
    P.money = Math.max(0, P.money + biz.net);
    P.best = Math.max(P.best, biz.best);
    const ok = biz.reason !== 'rep';
    if (ok) {
      P.stage = biz.stage + 1;
      const nxt = UNLOCK.find(i => !P.owned.includes(i));
      if (nxt) { P.owned.push(nxt); P.fresh.push(nxt); biz.unlocked = nxt; }
    }
    save();
    s.trans = { kind: 'exit', t: 0, dur: 1.0, mid: 0.5, onMid: () => { s.scene = 'exterior'; s.eve = true; markDirty(); s.cust = []; s.panel = { kind: ok ? 'result' : 'fail', sel: 0, biz }; } };
    sfx('door');
  }

  // ---------- burger building ----------
  function press(dir) {
    if (s.panel) { panelKey(dir); return; }
    if (s.trans) return;
    if (s.scene !== 'counter') return;
    const biz = s.biz; if (!biz || biz.closing) return;
    const cur = s.cur;
    if (!cur) { shakeKey(dir); showToast('손님을 기다리는 중이에요'); return; }
    const cu = byId(cur.cid); if (!cu) return;
    const idx = cur.stack.length - 1, want = cu.order[idx], got = s.info.map[dir];
    if (want && got === want) {
      cur.stack.push({ id: got, t: 0 }); sfx('pop');
      if (cur.stack.length - 1 === cu.order.length) sfx('sel');
    } else {
      cur.mist++; shakeKey(dir); sfx('bad');
      biz.cost += COST[got]; s.moneyFx = { text: `-${COST[got]}`, t: 0 };
      s.fxC.push({ k: 'cost', text: `재료비 -${COST[got]}`, x: 300, y: stackTop() - 4, t: 0, dur: 0.9 });
      if (P.up.ins && !cur.insUsed) cur.insUsed = true; else cu.pat = Math.max(0.05, cu.pat - 1);
      s.fxC.push({ k: 'bounce', id: got, x: 240, y: stackTop() - 6, vx: rnd(-90, 90), vy: -120, t: 0, dur: 0.7 });
      s.fxC.push({ k: 'x', x: 240, y: stackTop() - 10, t: 0, dur: 0.5 });
    }
  }
  function serve() {
    if (s.panel) { panelKey('space'); return; }
    if (s.trans) return;
    if (s.scene !== 'counter') return;
    const biz = s.biz, cur = s.cur; if (!biz || biz.closing || !cur) { shakeKey('space'); return; }
    const cu = byId(cur.cid);
    if (!cu || cur.stack.length - 1 < cu.order.length) { shakeKey('space'); sfx('nope'); return; }
    const r = cu.pat / cu.patMax;
    let j;
    if (cur.mist === 0 && r > 0.66) j = 'perfect';
    else if (cur.mist <= 1) j = 'good';
    else j = 'bad';
    const tipBase = Math.round(cu.price * 0.3) * (cu.special ? SPECIAL[cu.special].tip : 1);
    let price = cu.price, tip = 0;
    if (j === 'perfect') { tip = Math.round(tipBase * (1 + Math.min(1, biz.combo * 0.1))); biz.combo++; biz.best = Math.max(biz.best, biz.combo); }
    else if (j === 'good') tip = Math.round(tipBase * 0.5);
    else { price = Math.round(price * 0.5); biz.combo = 0; }
    biz.sales += price; biz.tips += tip; biz.cnt[j]++; biz.served++; P.served++;
    fxCustLeave(cu, j === 'bad' ? null : 'happy', true);
    removeCust(cu);
    fxJudge(j === 'perfect' ? 'PERFECT!' : j === 'good' ? 'GOOD' : 'BAD', j === 'perfect' ? '#ffe03a' : j === 'good' ? '#7ae07a' : '#f0a04a', `+${price + tip}` + (tip ? ` (팁 ${tip})` : ''));
    const SL = stackLayout(); const topY = SL.length ? SL[SL.length - 1].y : 182; SL.push({ id: 'bunTop', y: topY, t: 1, k: SL.length ? SL[0].k : 1 });
    s.fxC.push({ k: 'served', stack: SL.map(l => Object.assign({}, l, { t: 1 })), t: 0, dur: 0.45 });
    for (let i = 0; i < (j === 'perfect' ? 10 : 5); i++) s.fxC.push({ k: 'coin', x: 240 + rnd(-20, 20), y: 150 + rnd(-10, 10), vx: rnd(-80, 80), vy: rnd(-160, -60), t: 0, dur: rnd(0.6, 0.9) });
    sfx(j === 'perfect' ? 'perfect' : 'coin');
    s.cur = null;
  }
  function tossBurger() { const cur = s.cur; if (!cur) return; cur.stack.forEach((l, i) => s.fxC.push({ k: 'bounce', id: l.id, x: 240, y: 182 - i * 5, vx: rnd(-120, 120), vy: rnd(-140, -60), t: 0, dur: 0.8 })); }
  function shakeKey(k) { s.shake[k] = 0.35; }
  function showToast(text) { s.toast = { text, t: 0, dur: 1.8 }; }

  // =====================================================
  // COUNTER VIEW (order-taking view from the planning doc)
  // =====================================================
  let ctrBack = null, ctrFront = null;
  function paintCounter() {
    const th = s.info.theme, red = th.trim, cream = '#f4e6c6';
    if (!ctrBack) { ctrBack = document.createElement('canvas'); ctrBack.width = W; ctrBack.height = H; ctrFront = document.createElement('canvas'); ctrFront.width = W; ctrFront.height = H; }
    let c = ctrBack.getContext('2d');
    R(c, 0, 0, W, H, cream);
    // ceiling line, red trim, black & white checker band, red trim (50s diner)
    R(c, 0, 19, W, 3, '#e8d8b4'); R(c, 0, 22, W, 3, red); R(c, 0, 25, W, 1, INK);
    for (let y = 26, r = 0; y < 36; y += 5, r++) for (let x = 0, k = r; x < W; x += 5, k++) R(c, x, y, 5, 5, k % 2 ? '#1e1a1c' : '#fbf8f0');
    R(c, 0, 36, W, 1, INK); R(c, 0, 37, W, 3, red);
    // wall decorations
    { const x = 30, y = 54; disc(c, x, y, 11, 11, INK); disc(c, x, y, 10, 10, red); disc(c, x, y, 7, 7, '#fbf8f0'); R(c, x, y - 5, 1, 5, INK); R(c, x, y, 4, 1, INK); for (let i = 0; i < 12; i++) { const a2 = (i / 12) * Math.PI * 2; R(c, x + Math.round(Math.cos(a2) * 6), y + Math.round(Math.sin(a2) * 6), 1, 1, '#8a8a8a'); } }
    { const x = 92, y = 46; R(c, x, y, 34, 22, INK); R(c, x + 1, y + 1, 32, 20, '#f2d870'); R(c, x + 4, y + 10, 26, 6, '#5aa8d8'); R(c, x + 8, y + 7, 10, 4, '#d8352a'); R(c, x + 6, y + 15, 3, 3, INK); R(c, x + 22, y + 15, 3, 3, INK); }
    { const x = 168, y = 46; R(c, x, y, 76, 12, INK); R(c, x + 1, y + 1, 74, 10, '#fbf8f0'); T(c, 'STACK & BUN', x + 38, y + 2, 8, '#1e1a1c', null, 'c'); }
    { const x = 262, y = 42; R(c, x, y, 36, 28, INK); R(c, x + 2, y + 2, 32, 24, '#a8dcf2'); R(c, x + 2, y + 18, 32, 8, '#d8e8c8'); R(c, x + 17, y + 2, 2, 24, '#f4f4f0'); R(c, x + 2, y + 13, 32, 2, '#f4f4f0'); R(c, x - 2, y + 28, 40, 2, '#d8c8a0'); }
    { const x = 316, y = 46; for (let i = 0; i < 3; i++) { R(c, x + i * 14, y + (i % 2) * 6, 11, 13, INK); R(c, x + i * 14 + 1, y + (i % 2) * 6 + 1, 9, 11, ['#3a4a6a', '#6a3a3a', '#3a5a4a'][i]); } }
    { const x = 372, y = 44; R(c, x, y, 52, 24, INK); R(c, x + 1, y + 1, 50, 22, red); T(c, th.sign, x + 26, y + 4, 8, '#fbf8f0', null, 'c'); T(c, 'DINER', x + 26, y + 13, 8, '#fbf8f0', null, 'c'); }
    // lower wall
    R(c, 0, 74, W, 3, red); R(c, 0, 77, W, 1, INK);
    // entrance door on the right — customers walk in from here
    R(c, 440, 40, 40, 50, INK); R(c, 442, 41, 38, 49, red); R(c, 445, 44, 35, 46, '#fbf8f0'); R(c, 448, 48, 28, 18, '#e8e2d4'); R(c, 450, 68, 10, 2, '#a8a8a8');
    T(c, 'IN', 462, 52, 8, red, null, 'c');
    const lv = P.up.interior;
    if (lv >= 2) [[140, 62], [244, 62]].forEach(([x, y]) => { R(c, x - 1, y - 1, 3, 12, INK); R(c, x, y, 1, 10, '#e05a3a'); });
    if (lv >= 3) for (let x = 60; x < 440; x += 96) { R(c, x, 0, 1, 19, '#2a2a2a'); poly(c, [[x - 7, 19], [x - 3, 14], [x + 4, 14], [x + 8, 19]], red); R(c, x - 2, 19, 5, 1, '#fff6c0'); }
    c = ctrFront.getContext('2d'); c.clearRect(0, 0, W, H);
    // counter: black edge, checker top, chrome rim, red front
    R(c, 0, 86, W, 1, INK); R(c, 0, 87, W, 2, '#d0d6de');
    for (let y = 89, r = 0; y < 97; y += 4, r++) for (let x = 0, k = r; x < W; x += 4, k++) R(c, x, y, 4, 4, k % 2 ? '#1e1a1c' : '#f4f0e6');
    R(c, 0, 97, W, 3, '#1e1a1c'); R(c, 0, 100, W, 1, '#e8ecf0'); R(c, 0, 101, W, 1, INK);
    // our side: red diner counter surface
    R(c, 0, 102, W, H - 102, red);
    dither(c, 0, 102, W, 4, shade(red, 0.7), red); R(c, 0, 102, W, 1, shade(red, 0.55));
    for (let y = 124; y < H; y += 40) { R(c, 0, y, W, 1, shade(red, 0.85)); R(c, 0, y + 1, W, 1, shade(red, 1.12)); }
    // cutting board under the burger
    R(c, 185, 175, 110, 14, INK); R(c, 186, 176, 108, 12, '#f2d29a'); R(c, 186, 176, 108, 2, '#fff0c8'); R(c, 187, 185, 106, 2, '#c89a5a');
    R(c, 281, 179, 7, 4, '#c89a5a');
    if (lv >= 1) [[6, 86], [426, 86]].forEach(([x, y]) => { R(c, x - 1, y - 3, 14, 10, INK); R(c, x, y - 2, 12, 8, '#fbf8f0'); disc(c, x + 6, y - 9, 7, 6, INK); disc(c, x + 6, y - 9, 6, 5, '#3aa83a'); disc(c, x + 3, y - 12, 3, 3, '#7ad85a'); });
    dirtyCtr = false;
  }
  const SLOT_X = i => { const n = maxQ(), w = 456 / n; return 12 + w * (i + 0.5); };
  function stackLayout() {
    const cur = s.cur; if (!cur) return [];
    const hs = cur.stack.map(l => stackH(l.id));
    const total = hs.reduce((a, b) => a + b, 0) + A.BUN_T;
    const k = Math.min(1.45, 80 / total);
    let y = 182; const out = [];
    cur.stack.forEach((l, i) => { const h = Math.max(2, Math.round(hs[i] * k)); y -= h; out.push({ id: l.id, y, t: l.t, k }); });
    return out;
  }
  function stackTop() { const L = stackLayout(); return L.length ? L[L.length - 1].y : 182; }
  let STK = null;
  function drawStackAt(c, list, cx, wdt) {
    if (!STK) { STK = document.createElement('canvas'); STK.width = 80; STK.height = 105; }
    const sc = STK.getContext('2d'); sc.clearRect(0, 0, STK.width, STK.height);
    const hw = Math.round(wdt / 2), x = 40 - Math.round(hw / 2);
    let y = 91;
    list.forEach(l => {
      const k = (l.k || 1) / 2, drop = l.t < 0.14 ? (1 - ease(l.t / 0.14)) * 13 : 0;
      if (l.id === 'bunBottom') { const h = Math.max(3, Math.round(hw * 0.14)); y -= h; LAYER.bunBottom(sc, x, Math.round(y - drop), hw, h); }
      else if (l.id === 'bunTop') { const h = Math.max(5, Math.round(hw * 0.36)); LAYER.bunTop(sc, x, Math.round(y - h + 1 - drop), hw, h); }
      else { const g = ING[l.id], h = Math.max(1, Math.round(g.th * k)); y -= h; g.d(sc, x, Math.round(y - drop), hw, Math.max(2, h)); }
    });
    A.outline(STK);
    c.drawImage(STK, Math.round(cx - 80), 0, 160, 210);
  }
  function drawCounterView(c) {
    if (dirtyCtr) paintCounter();
    const th = s.info.theme, t = s.t, biz = s.biz;
    c.drawImage(ctrBack, 0, 0);
    drawSun(c);
    // customers in line
    const n = maxQ();
    s.q.slice().reverse().forEach(id => {
      const cu = byId(id); if (!cu) return;
      const x = Math.round(cu.cvx), r = cu.pat / cu.patMax;
      const bob = cu.moving && Math.floor(cu.walk * 8) % 2 ? 3 : 0;
      const mood = !cu.arrived ? null : cu.sayT > 0 ? 'happy' : r < 0.33 ? (Math.floor(t * 3) % 2 ? 'angry' : 'sweat') : null;
      chibi(c, x - 14, 100 - bob, cu.look, { s: 3, mood, back: false, step: bob ? 1 : 0 });
      if (cu.special) specialMark(c, x - 14, 100 - bob - 64, cu.special);
    });
    s.fxC.filter(f => f.k === 'leave').forEach(f => {
      const x = Math.round(f.x + f.t * 220), bob = Math.floor(f.t * 8) % 2 ? 3 : 0;
      chibi(c, x - 14, 100 - bob, f.look, { s: 3, mood: f.mood, step: bob ? 1 : 0 });
      if (f.carry) A.burger(c, x + 12, 84 - bob, 16, [s.info.theme.mid, 'cheese', 'lettuce'], 0.8);
      if (f.mood === 'angry') T(c, '흥!', x - 14, 30 - bob, 10, '#ff5a4a', INK, 'c');
    });
    // tickets & patience above heads
    s.q.forEach((id, i) => {
      const cu = byId(id); if (!cu || !cu.arrived) return;
      const x = Math.round(cu.cvx), r = cu.pat / cu.patMax, ord = cu.order, front = i === 0;
      if (cu.sayT > 0) { // just arrived: says the order out loud first
        const msg = cu.special === 'double' ? '많이 쌓아 주세요!' : cu.special === 'rush' ? '빨리요!!' : pick2(cu.id, ['주문할게요!', '이거 주세요!', '버거 하나요!']);
        const w = tw(msg, 8) + 10; bubble(c, x + 4, 34, w, 14); T(c, msg, x + 9, 37, 8, '#3a2418');
        return;
      }
      const bh = 8 + ord.length * 3 + 6, by = Math.max(20, 62 - bh);
      bubble(c, x + 5, by, 24, bh);
      let yy = by + bh - 4;
      R(c, x + 9, yy, 16, 2, '#d88a3a'); yy -= 1;
      const done = front && s.cur && s.cur.cid === id ? s.cur.stack.length - 1 : 0;
      ord.forEach((ing, k) => { yy -= 3; R(c, x + 9, yy, 16, 2, ING[ing].col); if (k < done) R(c, x + 26, yy, 1, 2, '#3ab04a'); });
      yy -= 3; R(c, x + 10, yy, 14, 3, '#e0903a');
      if (cu.special) T(c, '★', x + 17, by - 9, 8, '#ffd23a', INK, 'c');
      const bw = Math.min(58, 456 / n - 10);
      R(c, x - bw / 2 - 1, 82, bw + 2, 5, INK);
      const col = r > 0.66 ? '#5ad05a' : r > 0.33 ? '#f2c43a' : (Math.floor(t * 6) % 2 ? '#f05a4a' : '#ff9a8a');
      R(c, x - bw / 2, 83, Math.max(0, Math.round(bw * r)), 3, col);
      if (front) { const b = Math.floor(t * 3) % 2; T(c, '▶', x - 42 + b, 52, 10, '#ffe27a', INK, 'c'); R(c, x - bw / 2 - 1, 88, bw + 2, 2, '#ffe27a'); }
    });
    c.drawImage(ctrFront, 0, 0);
    drawGrill(c);
    // ticket on the left
    drawTicket(c);
    // burger
    const L = stackLayout();
    drawStackAt(c, L, 240, 84);
    const cur = s.cur, cu = cur && byId(cur.cid);
    const complete = cu && cur.stack.length - 1 >= cu.order.length;
    if (!cur && biz && !biz.closing && !s.fxC.some(f => f.k === 'judge')) T(c, '손님을 기다리는 중…', 240, 150, 10, '#f6e8c8', INK, 'c');
    if (complete && Math.floor(t * 3) % 2) T(c, 'SPACE 로 서빙!', 240, Math.max(104, stackTop() - 30), 10, '#ffe27a', INK, 'c');
    // key guide
    drawGuide(c, complete);
    drawSidePanel(c);
    drawFxC(c);
  }
  // sunlight slanting in through the street window
  function drawSun(c) {
    const t = s.t, a = 0.10 + 0.04 * Math.sin(t * 0.9);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x0 = 30 + i * 110 + Math.sin(t * 0.3 + i) * 3;
      c.globalAlpha = a * (i % 2 ? 0.8 : 1);
      poly(c, [[x0, 24], [x0 + 46, 24], [x0 + 120, 270], [x0 + 52, 270]], '#fff2c0');
    }
    c.globalAlpha = 0.7;
    s.motes.forEach(m => R(c, m.x, m.y, 1, 1, '#fff8dc'));
    c.restore();
  }
  // flat-top grill in the corner: patties sizzle, smoke rises
  const GRILL = { x: 334, y: 236, w: 136, h: 28 };
  function drawGrill(c) {
    const g = GRILL, t = s.t;
    R(c, g.x - 1, g.y - 1, g.w + 2, g.h + 2, INK); R(c, g.x, g.y, g.w, g.h, '#8a8e96'); R(c, g.x + 3, g.y + 3, g.w - 6, g.h - 9, '#3a3a40');
    for (let x = g.x + 6; x < g.x + g.w - 6; x += 6) R(c, x, g.y + 4, 1, g.h - 11, '#4a4a52');
    R(c, g.x, g.y + g.h - 5, g.w, 5, '#6a6e76'); for (let i = 0; i < 4; i++) disc(c, g.x + 18 + i * 32, g.y + g.h - 3, 2, 1, '#2a2a30');
    for (let i = 0; i < 4; i++) {
      const px = g.x + 20 + i * 32, py = g.y + 11, flip = Math.floor(t * 0.5 + i * 0.7) % 4 === 0;
      disc(c, px, py, 11, 5, '#2a120a'); disc(c, px, py - 1, 10, 4, flip ? '#7a3c20' : '#5c2818'); R(c, px - 5, py - 3, 4, 1, '#9a5a36'); R(c, px + 2, py - 1, 3, 1, '#9a5a36');
      if (Math.floor(t * 8 + i * 3) % 3 === 0) { R(c, px - 9, py - 4, 1, 1, '#ffd27a'); R(c, px + 9, py - 2, 1, 1, '#ffd27a'); }
    }
    s.smoke.forEach(m => { c.globalAlpha = clamp((1 - m.t / m.life) * 0.55, 0, 1); disc(c, m.x, m.y, m.r, m.r, '#f4f2ee'); c.globalAlpha = 1; });
  }
  function specialMark(c, x, y, kind) { // crown for the double-patty fan, stopwatch for the rushed worker; (x, y) = bottom centre
    if (kind === 'double') {
      R(c, x - 9, y - 6, 18, 7, INK); R(c, x - 8, y - 5, 16, 5, '#ffd23a'); R(c, x - 8, y - 2, 16, 1, '#e0a010');
      [[-8, 0], [-1, 0], [6, 0]].forEach(([dx]) => { R(c, x + dx - 1, y - 11, 4, 6, INK); R(c, x + dx, y - 10, 2, 5, '#ffd23a'); });
      R(c, x - 2, y - 4, 3, 2, '#e8302a'); R(c, x - 7, y - 4, 2, 2, '#3a8ad8'); R(c, x + 5, y - 4, 2, 2, '#3a8ad8');
    } else {
      disc(c, x, y - 6, 7, 7, INK); disc(c, x, y - 6, 6, 6, '#fff6e8'); R(c, x - 1, y - 15, 3, 3, INK); R(c, x, y - 10, 1, 4, INK); R(c, x, y - 6, 4, 1, '#e8302a');
    }
  }
  function drawTicket(c) {
    const x = 8, y = 108, w = 116, h = 156;
    paper(c, x, y, w, h);
    R(c, x + 30, y - 6, 56, 14, INK); R(c, x + 31, y - 5, 54, 12, '#c8352a'); T(c, '주 문 서', x + 58, y - 3, 10, '#fff4e4', null, 'c');
    const cur = s.cur, cu = cur && byId(cur.cid);
    if (!cu) { T(c, '대기 중인', x + w / 2, y + 60, 10, '#9a8060', null, 'c'); T(c, '손님이 없어요', x + w / 2, y + 74, 10, '#9a8060', null, 'c'); return; }
    T(c, cu.look.name, x + 6, y + 12, 10, '#3a2418');
    if (cu.special) T(c, SPECIAL[cu.special].tag, x + 6, y + 24, 8, '#c8352a');
    const rows = ['bunTop'].concat(cu.order.slice().reverse(), ['bunBottom']);
    const placed = cur.stack.length - 1; // ingredients placed
    const rh = Math.min(11, Math.floor((h - 46) / rows.length));
    let yy = y + 36;
    rows.forEach((id, i) => {
      const ordIdx = cu.order.length - i; // index in order for ingredient rows (1-based from bottom)
      let state = 'todo';
      if (id === 'bunBottom') state = 'done';
      else if (id === 'bunTop') state = placed >= cu.order.length ? 'next' : 'todo';
      else { const k = ordIdx; state = k < placed ? 'done' : k === placed ? 'next' : 'todo'; }
      if (state === 'next') R(c, x + 3, yy - 1, w - 6, rh, '#ffe9a0');
      icon(c, id, x + 16, yy + rh / 2 - 1, 14);
      const name = id === 'bunTop' ? '윗 빵 (SPACE)' : id === 'bunBottom' ? '아래 빵 (자동)' : ING[id].name;
      T(c, name, x + 28, yy + (rh - 8) / 2 - 1, 8, state === 'done' ? '#a89070' : '#3a2418');
      if (state === 'done') T(c, '✓', x + w - 10, yy + (rh - 8) / 2 - 1, 8, '#2a9a3a', null, 'c');
      if (state === 'next') T(c, '◀', x + w - 10, yy + (rh - 8) / 2 - 1, 8, '#c8352a', null, 'c');
      yy += rh;
    });
    coin(c, x + 6, y + h - 13); T(c, `${cu.price}`, x + 18, y + h - 13, 10, '#3a2418');
    if (cur.mist) T(c, `실수 ${cur.mist}`, x + w - 6, y + h - 12, 8, '#c8352a', null, 'r');
  }
  const KEYPOS = { up: [218, 192], left: [168, 214], space: [218, 214], right: [268, 214], down: [218, 236] };
  function drawGuide(c, complete) {
    const map = s.info.map, biz = s.biz, t = s.t, th = s.info.theme;
    for (const k of ['up', 'left', 'right', 'down', 'space']) {
      let [x, y] = KEYPOS[k];
      const sh = s.shake[k] || 0; if (sh > 0) x += Math.round(Math.sin(sh * 60) * 3);
      const changed = k !== 'space' && s.info.changed[k] && biz && biz.flashT > 0 && Math.floor(t * 4) % 2;
      const glow = k === 'space' && complete && Math.floor(t * 5) % 2;
      const cap = sh > 0 ? '#ff8a7a' : glow ? '#ffe24a' : changed ? '#ffe9a0' : '#fff6e0';
      R(c, x + 1, y, 42, 21, INK); R(c, x, y + 1, 44, 19, INK);
      R(c, x + 1, y + 1, 42, 15, cap); R(c, x + 1, y + 16, 42, 4, shade(cap, 0.75)); R(c, x + 2, y + 1, 40, 1, '#ffffff');
      if (k === 'space') { icon(c, 'bunTop', x + 14, y + 8, 16); R(c, x + 26, y + 3, 16, 11, th.trim); T(c, '서빙', x + 34, y + 4, 8, '#ffffff', null, 'c'); }
      else { icon(c, map[k], x + 15, y + 9, 18); R(c, x + 29, y + 2, 13, 12, INK); R(c, x + 30, y + 3, 11, 10, th.trim); T(c, ARW[k], x + 35, y + 3, 8, '#ffffff', null, 'c'); }
      s.hits.push({ x, y, w: 44, h: 21, act: () => (k === 'space' ? serve() : press(k)) });
    }
  }
  function drawSidePanel(c) {
    const biz = s.biz; if (!biz) return;
    const x = 330, y = 106, w = 142, h = 120;
    const th = s.info.theme;
    R(c, x + 3, y + 3, w, h, 'rgba(0,0,0,.25)');
    R(c, x, y, w, h, INK); R(c, x + 1, y + 1, w - 2, h - 2, '#1e1a1c'); R(c, x + 3, y + 16, w - 6, h - 19, '#fff6e0');
    T(c, '오늘의 가게', x + 8, y + 4, 10, '#ffffff', INK);
    const rows = [['손님', `${biz.served + biz.cnt.fail} / ${biz.total}`], ['PERFECT', biz.cnt.perfect], ['GOOD', biz.cnt.good], ['BAD', biz.cnt.bad], ['FAIL', biz.cnt.fail], ['버린 재료값', biz.cost ? `-${biz.cost}` : '0']];
    rows.forEach(([a, b], i) => { T(c, a, x + 10, y + 20 + i * 11, 8, ['#3a2418', '#d88a00', '#2a9a3a', '#e0701e', '#d8302a', '#7a4a2a'][i]); T(c, String(b), x + w - 10, y + 20 + i * 11, 8, i === 5 ? '#c8352a' : '#3a2418', null, 'r'); });
    R(c, x + 6, y + 88, w - 12, 1, '#e0d0b0');
    if (biz.combo > 1) { T(c, `COMBO x${biz.combo}`, x + w / 2, y + 92, 12, '#ffe03a', '#c8352a', 'c'); T(c, `팁 +${Math.min(100, (biz.combo) * 10)}%`, x + w / 2, y + 107, 8, '#c8352a', null, 'c'); }
    else T(c, 'PERFECT 연속이면 팁 UP', x + w / 2, y + 100, 8, '#9a8060', null, 'c');
  }
  function fxJudge(text, col, sub) { s.fxC = s.fxC.filter(f => f.k !== 'judge'); s.fxC.push({ k: 'judge', text, col, sub, t: 0, dur: 1.1 }); }
  function fxCustLeave(cu, mood, carry) {
    s.fxC.push({ k: 'leave', look: cu.look, x: cu.cvx, mood, carry, t: 0, dur: Math.max(0.6, (W + 30 - cu.cvx) / 220) });
  }
  function drawFxC(c) {
    s.fxC.forEach(f => {
      const k = f.t / f.dur;
      if (f.k === 'bounce') { const x = f.x + f.vx * f.t, y = f.y + f.vy * f.t + 300 * f.t * f.t; c.globalAlpha = clamp(1.4 - k * 1.4, 0, 1); if (f.id === 'bunTop' || f.id === 'bunBottom') icon(c, f.id, x, y, 24); else icon(c, f.id, x, y, 24); c.globalAlpha = 1; }
      else if (f.k === 'cost') { c.globalAlpha = clamp(1.5 - (f.t / f.dur) * 1.5, 0, 1); T(c, f.text, f.x, f.y - (f.t / f.dur) * 12, 8, '#fff6e0', '#a01e1a', 'c'); c.globalAlpha = 1; }
      else if (f.k === 'x') { if (k < 1) T(c, '✕', f.x + 50, f.y - k * 8, 12, '#ff4a3a', INK, 'c'); }
      else if (f.k === 'coin') { const x = f.x + f.vx * f.t, y = f.y + f.vy * f.t + 260 * f.t * f.t; coin(c, x, y); }
      else if (f.k === 'served') { // the finished burger slides up to the customer
        c.save(); c.globalAlpha = clamp(1 - k * 1.3, 0, 1); c.translate(0, -ease(k) * 80); drawStackAt(c, f.stack, 240, 84); c.restore();
      }
      else if (f.k === 'judge') {
        const a = clamp(1.6 - k * 1.6, 0, 1), up = Math.min(1, f.t / 0.12);
        c.globalAlpha = a; T(c, f.text, 240, 118 - up * 6, 12, f.col, INK, 'c', 2); if (f.sub) T(c, f.sub, 240, 146 - up * 6, 10, '#fff6e0', INK, 'c'); c.globalAlpha = 1;
      }
    });
  }

  // =====================================================
  // HUD / BANNERS / PANELS (drawn unzoomed on the main canvas)
  // =====================================================
  function fmtTime(sec) { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
  function drawHUD(c) {
    const biz = s.biz; if (!biz || s.scene === 'exterior') return;
    const th = s.info.theme;
    R(c, 0, 0, W, 18, '#1e1a1c'); R(c, 0, 15, W, 2, th.trim); R(c, 0, 17, W, 1, INK);
    R(c, 2, 2, 112, 14, INK); R(c, 3, 3, 110, 12, th.trim2);
    T(c, `STAGE ${biz.stage}`, 7, 4, 10, '#ffffff', INK); T(c, th.name, 110, 5, 8, '#3a2418', null, 'r');
    coin(c, 120, 5); const mf = s.moneyFx && s.moneyFx.t < 0.6;
    T(c, `${biz.sales + biz.tips - biz.cost}`, 132, 4, 10, mf && Math.floor(s.t * 12) % 2 ? '#ff6a5a' : '#ffffff', INK);
    if (mf) T(c, s.moneyFx.text, 132, 8 + s.moneyFx.t * 14, 10, '#ff6a5a', INK);
    const left = BIZ_LEN - biz.t, peak = biz.t >= 40 && biz.t < 80;
    T(c, '영업', 176, 5, 8, '#ffe9c0', INK); T(c, fmtTime(left), 196, 3, 12, left < 20 && Math.floor(s.t * 4) % 2 ? '#ffe03a' : '#ffffff', INK);
    if (peak && Math.floor(s.t * 2) % 2) T(c, '점심 피크!', 232, 5, 8, '#ffe03a', INK);
    T(c, '평판', 290, 5, 8, '#ffe9c0', INK); for (let i = 0; i < 5; i++) star(c, 312 + i * 9, 5, i < biz.rep);
    if (biz.combo > 1) T(c, `COMBO x${biz.combo}`, 360, 4, 10, '#ffe03a', INK);
    T(c, s.muted ? '♪×' : '♪', 474, 4, 10, '#ffffff', INK, 'r');
    s.hits.push({ x: 460, y: 0, w: 20, h: 18, act: () => { s.muted = !s.muted; } });
  }
  function drawBanner(c) {
    const b = s.banner; if (!b) return;
    const k = b.t / b.dur, a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    c.globalAlpha = clamp(a, 0, 1);
    const w = Math.max(tw(b.text, 12) * 2, b.sub ? tw(b.sub, 10) : 0) + 40, h = b.sub ? 50 : 34;
    R(c, 240 - w / 2, 108, w, h, 'rgba(20,10,10,.88)'); R(c, 240 - w / 2, 108, w, 2, '#ffd27a'); R(c, 240 - w / 2, 106 + h, w, 2, '#ffd27a');
    T(c, b.text, 240, 113, 12, b.col || '#fff2c0', '#5a2a08', 'c', 2);
    if (b.sub) T(c, b.sub, 240, 142, 10, '#ffe9c0', null, 'c');
    c.globalAlpha = 1;
  }
  function drawToast(c) {
    const o = s.toast; if (!o) return;
    c.globalAlpha = clamp((o.dur - o.t) / 0.3, 0, 1);
    const w = tw(o.text, 10) + 16, ty = s.panel ? 2 : 226; frame(c, 240 - w / 2, ty, w, 18, 'rgba(36,22,20,.92)', '#c8352a'); T(c, o.text, 240, ty + 4, 10, '#fff2d8', null, 'c');
    c.globalAlpha = 1;
  }
  // ---------- panels ----------
  function panelItems(p) {
    if (p.kind === 'title') { const it = [{ label: '처음부터', act: newGame, kind: 'red' }]; if (loadSave()) it.push({ label: '이어하기', act: continueGame, kind: 'gold' }); return it; }
    if (p.kind === 'open') return [{ label: '가게 문 열기', act: openShop, kind: 'red' }];
    if (p.kind === 'result') return [{ label: '상점으로', act: () => { s.panel = { kind: 'shop', sel: 0 }; sfx('ok'); }, kind: 'red' }];
    if (p.kind === 'fail') return [{ label: '다시 도전', act: showOpen, kind: 'red' }];
    if (p.kind === 'shop') return UPG.map(u => ({ upg: u, act: () => buy(u) })).concat([{ label: `${P.stage}스테이지 시작 ▶`, act: () => { newDayMap(); showOpen(); }, kind: 'red' }]);
    return [];
  }
  function panelKey(k) {
    const p = s.panel; if (!p) return;
    const items = panelItems(p);
    if (k === 'up' || k === 'left') { p.sel = (p.sel + items.length - 1) % items.length; sfx('sel'); }
    else if (k === 'down' || k === 'right') { p.sel = (p.sel + 1) % items.length; sfx('sel'); }
    else if (k === 'space') { const it = items[p.sel]; if (it) it.act(); }
  }
  function buy(u) {
    const lv = P.up[u.id];
    if (lv >= u.max) { sfx('nope'); showToast('이미 최고 단계예요'); return; }
    const price = u.price[lv];
    if (P.money < price) { sfx('nope'); showToast('돈이 모자라요'); return; }
    P.money -= price; P.up[u.id]++; save(); markDirty(); sfx('coin');
    showToast(`${u.name} ${P.up[u.id]}단계!`);
  }
  function drawPanel(c) {
    const p = s.panel; if (!p) return;
    const items = panelItems(p);
    if (p.kind === 'title') {
      // logo plaque
      const px = 364, pw = 112;
      frame(c, px, 150, pw, 112, 'rgba(36,22,20,.92)', '#8a5530');
      T(c, '햄버거 쌓기 타이쿤', px + pw / 2, 157, 10, '#ffd27a', null, 'c');
      items.forEach((it, i) => { const y = 178 + i * 24; button(c, px + 14, y, pw - 28, 18, it.label, it.kind, p.sel === i); s.hits.push({ x: px + 14, y, w: pw - 28, h: 18, act: () => { p.sel = i; it.act(); } }); });
      T(c, 'SPACE로 선택', px + pw / 2, 234, 8, '#b89a78', null, 'c');
      T(c, '마우스·터치도 OK', px + pw / 2, 249, 8, '#8a7a68', null, 'c');
      return;
    }
    if (p.kind === 'open') {
      const info = s.info, x = 104, y = 34, w = 272, h = 200;
      frame(c, x, y, w, h, 'rgba(36,22,20,.94)', '#8a5530');
      T(c, `STAGE ${info.n}`, x + w / 2, y + 8, 12, '#ffd27a', '#3a1a08', 'c', 2);
      T(c, info.moved ? `${info.theme.name} 가게로 이전!` : `${info.theme.name} · 오늘의 키 배치`, x + w / 2, y + 36, 10, info.moved ? '#ff9a4a' : '#f6e8c8', null, 'c');
      const cx = x + w / 2, cy = y + 98, blink = Math.floor(s.t * 4) % 2;
      const cell = (k, dx, dy) => {
        const bx = cx + dx - 34, by = cy + dy - 14, ch = info.changed[k] || (P.newIng || []).includes(info.map[k]);
        R(c, bx, by, 68, 28, INK); R(c, bx + 1, by + 1, 66, 26, ch ? (blink ? '#ffe9a0' : '#f2c43a') : '#3a2a26');
        icon(c, info.map[k], bx + 18, by + 13, 22);
        T(c, ARW[k], bx + 40, by + 3, 10, ch ? '#7a2a14' : '#ffe27a');
        T(c, ING[info.map[k]].name, bx + 50, by + 16, 8, ch ? '#5a2a14' : '#e6cf9c', null, 'c');
        if (ch) T(c, 'NEW', bx + 62, by - 6, 8, '#ff6a4a', INK, 'r');
      };
      cell('up', 0, -32); cell('left', -72, 0); cell('right', 72, 0); cell('down', 0, 32);
      R(c, cx - 30, cy - 12, 60, 24, INK); R(c, cx - 29, cy - 11, 58, 22, '#5e3820'); icon(c, 'bunTop', cx - 12, cy, 16); T(c, '서빙', cx + 12, cy - 4, 8, '#ffd27a', null, 'c');
      T(c, `손님 ${36 + 3 * P.up.sign}명 · 주문 재료 ${info.cnt[0]}~${info.cnt[1]}개 · 2분 영업`, cx, y + 146, 8, '#b89a78', null, 'c');
      items.forEach((it, i) => { const bx = cx - 60, by = y + 166; button(c, bx, by, 120, 20, it.label, it.kind, true); s.hits.push({ x: bx, y: by, w: 120, h: 20, act: it.act }); });
      T(c, 'SPACE 또는 가게를 클릭', cx, y + 190, 8, '#8a7a68', null, 'c');
      return;
    }
    if (p.kind === 'result' || p.kind === 'fail') {
      const b = p.biz, x = 120, y = 30, w = 240, h = 212, ok = p.kind === 'result';
      paper(c, x, y, w, h);
      R(c, x + 70, y - 8, 100, 18, INK); R(c, x + 71, y - 7, 98, 16, ok ? '#c8352a' : '#5a4a5a');
      T(c, ok ? `STAGE ${b.stage} 정산` : '영업 실패', x + w / 2, y - 4, 10, '#fff4e4', null, 'c');
      if (!ok) T(c, '평판 별이 다 떨어졌어요. 같은 스테이지에 다시 도전해요.', x + w / 2, y + 16, 8, '#8a3a2a', null, 'c');
      const rows = [['매출', b.sales], ['팁', b.tips], ['버린 재료값', -b.cost], ['순이익', b.net]];
      rows.forEach(([a, v], i) => {
        const yy = y + 30 + i * 16, last = i === 3;
        if (last) R(c, x + 16, yy - 3, w - 32, 1, '#3a2418');
        T(c, a, x + 22, yy, 10, '#3a2418'); T(c, (v < 0 ? '-' : '') + Math.abs(v), x + w - 22, yy, 10, last ? (v >= 0 ? '#2a8a3a' : '#c8352a') : v < 0 ? '#c8352a' : '#3a2418', null, 'r');
      });
      const yy = y + 104;
      T(c, `PERFECT ${b.cnt.perfect}   GOOD ${b.cnt.good}   BAD ${b.cnt.bad}   FAIL ${b.cnt.fail}`, x + w / 2, yy, 8, '#5a4030', null, 'c');
      T(c, `최고 콤보 x${b.best}`, x + w / 2, yy + 14, 10, '#c8352a', null, 'c');
      coin(c, x + 70, yy + 34); T(c, `보유 ${P.money}`, x + 82, yy + 34, 10, '#3a2418');
      if (ok && b.unlocked) {
        const blink = Math.floor(s.t * 3) % 2;
        R(c, x + 40, yy + 48, w - 80, 26, INK); R(c, x + 41, yy + 49, w - 82, 24, blink ? '#ffe9a0' : '#ffd23a');
        R(c, x + 46, yy + 52, 30, 18, '#fff6e0'); icon(c, b.unlocked, x + 61, yy + 61, 20);
        T(c, `새 재료 해금! ${ING[b.unlocked].name}`, x + 84, yy + 52, 10, '#7a2a14');
        T(c, '다음 영업에 방향키로 배정돼요', x + 84, yy + 63, 8, '#7a4a14');
      } else if (ok && STAGES[(P.stage - 1) % STAGES.length].th !== STAGES[(P.stage - 2) % STAGES.length].th) T(c, '다음 스테이지에서 지점 이전!', x + w / 2, yy + 52, 8, '#c86a1a', null, 'c');
      items.forEach((it, i) => { const bx = x + w / 2 - 55, by = y + h - 30; button(c, bx, by, 110, 20, it.label, it.kind, true); s.hits.push({ x: bx, y: by, w: 110, h: 20, act: it.act }); });
      return;
    }
    if (p.kind === 'shop') {
      const x = 70, y = 18, w = 340, h = 240;
      frame(c, x, y, w, h, 'rgba(36,22,20,.95)', '#8a5530');
      T(c, '상점', x + 12, y + 8, 12, '#ffd27a', '#3a1a08');
      coin(c, x + w - 80, y + 10); T(c, `${P.money}`, x + w - 68, y + 9, 10, '#ffd27a');
      items.forEach((it, i) => {
        const by = y + 30 + i * 32, sel = p.sel === i;
        if (it.upg) {
          const u = it.upg, lv = P.up[u.id], max = lv >= u.max, price = max ? 0 : u.price[lv], can = !max && P.money >= price;
          R(c, x + 10, by, w - 20, 28, sel ? '#5e3820' : '#2a1c18');
          if (sel) { R(c, x + 10, by, 2, 28, '#ffe27a'); }
          T(c, u.name, x + 20, by + 4, 10, '#fff2d8');
          for (let k = 0; k < u.max; k++) R(c, x + 80 + k * 8, by + 6, 6, 6, k < lv ? '#ffd23a' : '#4a3a34');
          T(c, u.desc, x + 20, by + 17, 8, '#b89a78');
          if (max) T(c, 'MAX', x + w - 20, by + 9, 10, '#7ae07a', null, 'r');
          else { coin(c, x + w - 70, by + 9); T(c, `${price}`, x + w - 20, by + 9, 10, can ? '#ffd27a' : '#8a6a5a', null, 'r'); }
          s.hits.push({ x: x + 10, y: by, w: w - 20, h: 28, act: () => { p.sel = i; it.act(); } });
        } else {
          const bx = x + w / 2 - 70; button(c, bx, by + 6, 140, 20, it.label, it.kind, sel);
          s.hits.push({ x: bx, y: by + 6, w: 140, h: 20, act: () => { p.sel = i; it.act(); } });
        }
      });
      T(c, '↑↓ 고르기 · SPACE 구매', x + w / 2, y + h - 12, 8, '#8a7a68', null, 'c');
    }
  }

  // =====================================================
  // FLOW
  // =====================================================
  function newGame() { P = fresh(); newDayMap(); sfx('ok'); showOpen(); }
  function continueGame() { const o = loadSave(); if (o) P = o; if (!P.map || (P.fresh && P.fresh.length)) newDayMap(); sfx('ok'); showOpen(); }
  function showOpen() {
    s.info = stageInfo(P.stage); markDirty(); s.eve = false; s.biz = null;
    s.panel = { kind: 'open', sel: 0 }; sfx('sel');
  }
  function openShop() {
    if (s.trans) return;
    s.panel = null; sfx('door');
    s.trans = { kind: 'enter', t: 0, dur: 1.1, mid: 0.5, onMid: () => { s.scene = 'counter'; startBiz(); } };
  }
  // =====================================================
  // LOOP
  // =====================================================
  let canvas, ctx, buf, bctx;
  function update(dt) {
    s.t += dt;
    if (s.trans) {
      const tr = s.trans; const before = tr.t; tr.t += dt;
      if (!tr.fired && tr.t >= tr.dur * tr.mid && before <= tr.dur * tr.mid + 1e-9) { tr.fired = true; tr.onMid && tr.onMid(); }
      if (tr.t >= tr.dur) { if (!tr.fired) { tr.fired = true; tr.onMid && tr.onMid(); } s.trans = null; }
    }
    if (s.scene === 'exterior') updExterior(dt);
    if (s.biz && s.scene !== 'exterior') { updBiz(dt); updCustomers(dt); }
    if (s.cur) s.cur.stack.forEach(l => (l.t += dt));
    for (const k in s.shake) { s.shake[k] -= dt; if (s.shake[k] <= 0) delete s.shake[k]; }
    s.fxC.forEach(f => (f.t += dt)); s.fxC = s.fxC.filter(f => f.t < f.dur);
    if (s.banner) { s.banner.t += dt; if (s.banner.t >= s.banner.dur) s.banner = null; }
    if (s.moneyFx) { s.moneyFx.t += dt; if (s.moneyFx.t > 0.6) s.moneyFx = null; }
    if (s.toast) { s.toast.t += dt; if (s.toast.t >= s.toast.dur) s.toast = null; }
    if (s.scene === 'counter') {
      if (Math.random() < dt * 6) s.smoke.push({ x: GRILL.x + 20 + ((Math.random() * 4) | 0) * 32 + rnd(-6, 6), y: GRILL.y + 6, r: rnd(2, 4), t: 0, life: rnd(0.9, 1.6), vx: rnd(-6, 6) });
      if (s.motes.length < 26 && Math.random() < dt * 8) s.motes.push({ x: rnd(20, 460), y: rnd(30, 260), vx: rnd(-3, 3), vy: rnd(-4, 2), t: 0, life: rnd(3, 7) });
    }
    s.smoke.forEach(m => { m.t += dt; m.y -= 22 * dt; m.x += m.vx * dt; m.r += dt * 2; }); s.smoke = s.smoke.filter(m => m.t < m.life);
    s.motes.forEach(m => { m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; }); s.motes = s.motes.filter(m => m.t < m.life);
  }
  function render() {
    s.hits = [];
    const tr = s.trans;
    let z = 1, fx = 240, fy = 135, black = 0, white = 0;
    if (tr) {
      const k = clamp(tr.t / tr.dur, 0, 1);
      if (tr.kind === 'enter' || tr.kind === 'exit') {
        if (k < 0.5) { black = k / 0.5; if (tr.kind === 'enter') { z = 1 + ease(k / 0.5) * 1.8; fx = DOOR_PT[0]; fy = DOOR_PT[1]; } }
        else { black = 1 - (k - 0.5) / 0.5; if (tr.kind === 'exit') { z = 1 + (1 - ease((k - 0.5) / 0.5)) * 0.8; fx = DOOR_PT[0]; fy = DOOR_PT[1]; } }
      }
    }
    const c = bctx;
    if (s.scene === 'exterior') drawExterior(c);
    else drawCounterView(c);
    if (z !== 1) { s.hits = []; const sw = W / z, sh = H / z; const sx = clamp(fx - sw / 2, 0, W - sw), sy = clamp(fy - sh / 2, 0, H - sh); ctx.drawImage(buf, sx, sy, sw, sh, 0, 0, W, H); }
    else ctx.drawImage(buf, 0, 0);
    if (black > 0) { ctx.fillStyle = `rgba(10,6,10,${clamp(black, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    if (white > 0) { ctx.fillStyle = `rgba(255,240,210,${clamp(white, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    if (!tr) drawHUD(ctx);
    drawBanner(ctx);
    if (!tr) drawPanel(ctx);
    drawToast(ctx);
  }
  let last = 0;
  function frameLoop(ts) {
    // real-time clock: slow frames are caught up in small steps, so 3 minutes of business is 3 real minutes
    let dt = Math.min(0.5, (ts - last) / 1000 || 0); last = ts;
    while (dt > 0) { const st = Math.min(dt, 1 / 30); update(st); dt -= st; }
    render();
    requestAnimationFrame(frameLoop);
  }
  function fit() {
    const sc = Math.min(window.innerWidth / W, window.innerHeight / H);
    const k = sc >= 2 ? Math.floor(sc * 2) / 2 : sc;
    canvas.style.width = Math.round(W * k) + 'px'; canvas.style.height = Math.round(H * k) + 'px';
  }
  function toLogical(e) { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; }
  function onKey(e) {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'space', Spacebar: 'space', Enter: 'space', Escape: 'esc' };
    const k = map[e.key] || (e.code === 'Space' ? 'space' : null);
    if (!k) { if (e.key === 'm' || e.key === 'M') s.muted = !s.muted; return; }
    e.preventDefault(); audio();
    if (e.repeat && k === 'space') return;
    if (k === 'esc') return;
    if (k === 'space') serve(); else press(k);
  }
  let down = null;
  function onDown(e) { audio(); canvas.focus(); down = toLogical(e); }
  function onUp(e) {
    if (!down) return;
    const [x, y] = toLogical(e), [x0, y0] = down; down = null;
    const dx = x - x0, dy = y - y0;
    if (s.scene === 'counter' && !s.panel && Math.hypot(dx, dy) > 22) { press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); return; }
    for (let i = s.hits.length - 1; i >= 0; i--) { const h = s.hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { h.act(); return; } }
    if (s.trans) return;
    if (s.scene === 'exterior' && s.panel && s.panel.kind === 'open' && x >= SHOP_RECT[0] && x <= SHOP_RECT[0] + SHOP_RECT[2] && y >= SHOP_RECT[1] && y <= SHOP_RECT[1] + SHOP_RECT[3]) openShop();
  }

  function boot() {
    canvas = document.getElementById('cv'); ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;
    buf = document.createElement('canvas'); buf.width = W; buf.height = H; bctx = buf.getContext('2d'); bctx.imageSmoothingEnabled = false;
    fit(); window.addEventListener('resize', fit);
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp);
    s.panel = { kind: 'title', sel: loadSave() ? 1 : 0 };
    if (document.fonts && document.fonts.load) {
      Promise.all(['12px "Galmuri11"', '10px "Galmuri9"', '8px "Galmuri7"'].map(f => document.fonts.load(f, '가A'))).then(() => { A.fontReady = true; A.clearText(); markDirty(); }).catch(() => {});
    }
    requestAnimationFrame(frameLoop);
    // test hooks
    window.__burger = { markDirty: () => markDirty(), s, get P() { return P; }, update, render, startBiz, press, serve, spawnCustomer, showOpen };
  }
  window.addEventListener('DOMContentLoaded', boot);
})();
