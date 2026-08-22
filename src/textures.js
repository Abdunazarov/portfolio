import * as THREE from 'three';

/* 32px hand-painted block textures — drawn from scratch, no game assets. */

let _s = 20031121;
export const rnd = () => (((_s = (_s * 1664525 + 1013904223) | 0) >>> 8) / 16777216);
export const rr = (a, b) => a + rnd() * (b - a);
export const reseed = (n) => { _s = n; };

const N = 64;
const cache = new Map();

export function tex(key, paint, { size = N } = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  paint(g, size);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

const px = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };

/* base colour + per-pixel noise, with a few darker clumps for texture */
function grain(g, n, [r, gr, b], amt, clumps = 0) {
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = (rnd() - 0.5) * amt;
    px(g, x, y, `rgb(${Math.max(0, Math.min(255, r + d)) | 0},${Math.max(0, Math.min(255, gr + d)) | 0},${Math.max(0, Math.min(255, b + d)) | 0})`);
  }
  for (let i = 0; i < clumps; i++) {
    const cx = (rnd() * n) | 0, cy = (rnd() * n) | 0, s = 2 + ((rnd() * 4) | 0);
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.12)';
    g.fillRect(cx, cy, s, s);
  }
}

export const T = {
  grassTop: () => tex('grassTop', (g, n) => {
    grain(g, n, [112, 176, 62], 26, 22);
    for (let i = 0; i < 340; i++) {
      const x = (rnd() * n) | 0, y = (rnd() * n) | 0, h = 2 + ((rnd() * 4) | 0);
      g.fillStyle = rnd() < 0.5 ? 'rgba(150,206,96,.55)' : 'rgba(70,124,42,.5)';
      g.fillRect(x, y, 1, h);
    }
  }),
  grassSide: () => tex('grassSide', (g, n) => {
    grain(g, n, [138, 100, 68], 26, 10);
    for (let x = 0; x < n; x++) {
      const h = 10 + ((rnd() * 12) | 0);
      for (let y = 0; y < h; y++) {
        const d = (rnd() - 0.5) * 28;
        px(g, x, y, `rgb(${(106 + d) | 0},${(170 + d) | 0},${(58 + d) | 0})`);
      }
    }
  }),
  dirt: () => tex('dirt', (g, n) => {
    grain(g, n, [138, 100, 68], 24, 26);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(96,66,42,.5)' : 'rgba(168,128,92,.4)';
      g.fillRect((rnd() * n) | 0, (rnd() * n) | 0, 2, 2);
    }
  }),
  path: () => tex('path', (g, n) => grain(g, n, [158, 128, 90], 20, 8)),
  sand: () => tex('sand', (g, n) => grain(g, n, [226, 214, 162], 16, 6)),
  stone: () => tex('stone', (g, n) => {
    grain(g, n, [134, 134, 138], 20, 18);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect((rnd() * n) | 0, (rnd() * n) | 0, 1 + ((rnd() * 7) | 0), 1);
    }
  }),
  cobble: () => tex('cobble', (g, n) => {
    grain(g, n, [126, 126, 130], 16);
    for (let i = 0; i < 46; i++) {
      const x = (rnd() * n) | 0, y = (rnd() * n) | 0;
      g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.18)';
      g.fillRect(x, y, 2 + ((rnd() * 5) | 0), 2 + ((rnd() * 3) | 0));
    }
  }),
  planks: () => tex('planks', (g, n) => {
    grain(g, n, [180, 140, 90], 16);
    g.fillStyle = 'rgba(58,36,16,.5)';
    for (let y = 0; y < n; y += 16) g.fillRect(0, y, n, 2);
    for (let i = 0; i < 14; i++) g.fillRect((rnd() * n) | 0, ((rnd() * 4) | 0) * 16, 2, 16);
  }),
  planksDark: () => tex('planksDark', (g, n) => {
    grain(g, n, [98, 66, 40], 14);
    g.fillStyle = 'rgba(26,14,6,.55)';
    for (let y = 0; y < n; y += 16) g.fillRect(0, y, n, 2);
  }),
  logSide: () => tex('logSide', (g, n) => {
    grain(g, n, [102, 76, 42], 14);
    g.fillStyle = 'rgba(44,28,12,.5)';
    for (let i = 0; i < 13; i++) g.fillRect((rnd() * n) | 0, 0, 1 + ((rnd() * 2) | 0), n);
  }),
  logTop: () => tex('logTop', (g, n) => {
    grain(g, n, [174, 140, 90], 10);
    g.strokeStyle = 'rgba(78,52,24,.65)'; g.lineWidth = 1;
    for (let r = 3; r < 16; r += 3) { g.beginPath(); g.arc(16, 16, r, 0, 7); g.stroke(); }
  }),
  leaves: () => tex('leaves', (g, n) => {
    g.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (rnd() < 0.1) continue;
      const d = (rnd() - 0.5) * 44;
      px(g, x, y, `rgb(${(66 + d) | 0},${(126 + d) | 0},${(46 + d) | 0})`);
    }
  }),
  leavesDark: () => tex('leavesDark', (g, n) => {
    g.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (rnd() < 0.1) continue;
      const d = (rnd() - 0.5) * 36;
      px(g, x, y, `rgb(${(44 + d) | 0},${(96 + d) | 0},${(38 + d) | 0})`);
    }
  }),
  sakura: () => tex('sakura', (g, n) => {
    g.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (rnd() < 0.12) continue;
      const d = (rnd() - 0.5) * 30;
      px(g, x, y, `rgb(${(240 + d) | 0},${(166 + d) | 0},${(198 + d) | 0})`);
    }
  }),
  water: () => tex('water', (g, n) => grain(g, n, [56, 112, 208], 22, 8)),
  glass: () => tex('glass', (g, n) => {
    g.clearRect(0, 0, n, n);
    g.fillStyle = 'rgba(196,228,255,.22)'; g.fillRect(0, 0, n, n);
    g.fillStyle = 'rgba(232,246,255,.8)';
    g.fillRect(0, 0, n, 2); g.fillRect(0, n - 2, n, 2); g.fillRect(0, 0, 2, n); g.fillRect(n - 2, 0, 2, n);
  }),
  glow: () => tex('glow', (g, n) => {
    grain(g, n, [248, 212, 130], 18);
    for (let i = 0; i < 26; i++) px(g, (rnd() * n) | 0, (rnd() * n) | 0, '#fff6cf');
  }),
  tuft: () => tex('tuft', (g, n) => {
    g.clearRect(0, 0, n, n);
    for (let x = 4; x < n - 4; x++) {
      const h = 8 + ((rnd() * 15) | 0);
      g.fillStyle = `rgb(${(92 + rnd() * 28) | 0},${(156 + rnd() * 38) | 0},${(52 + rnd() * 22) | 0})`;
      g.fillRect(x, n - h, 1, h);
    }
  }),
  flower: (a, b) => tex('fl' + a + b, (g, n) => {
    g.clearRect(0, 0, n, n);
    g.fillStyle = '#3f7a2c'; g.fillRect(15, 16, 3, 16);
    g.fillStyle = a; g.fillRect(10, 6, 12, 11);
    g.fillStyle = b; g.fillRect(14, 10, 4, 4);
  })
};

const lam = (map, o = {}) => new THREE.MeshLambertMaterial({ map, ...o });

export function blockMat(def) {
  if (typeof def === 'function') return lam(def());
  const { top, side, bottom, opts } = def;
  const s = lam(side(), opts), t = lam(top(), opts), b = lam((bottom || top)(), opts);
  return [s, s, t, b, s, s];
}

export const BLOCKS = {
  grass: { top: T.grassTop, side: T.grassSide, bottom: T.dirt },
  dirt: T.dirt,
  path: { top: T.path, side: T.dirt, bottom: T.dirt },
  sand: T.sand,
  stone: T.stone,
  cobble: T.cobble,
  planks: T.planks,
  dark: T.planksDark,
  log: { top: T.logTop, side: T.logSide },
  leaves: { top: T.leaves, side: T.leaves, opts: { transparent: true, alphaTest: 0.5 } },
  leavesDark: { top: T.leavesDark, side: T.leavesDark, opts: { transparent: true, alphaTest: 0.5 } },
  sakura: { top: T.sakura, side: T.sakura, opts: { transparent: true, alphaTest: 0.5 } },
  water: { top: T.water, side: T.water, opts: { transparent: true, opacity: 0.78 } },
  glass: { top: T.glass, side: T.glass, opts: { transparent: true, opacity: 0.55 } },
  glowstone: T.glow
};
