import * as THREE from 'three';

/* ---------------------------------------------------------------------
   Landing page: a baked voxel landscape behind, one real-time character
   in front. Drag him to turn; he watches your cursor; he changes as you
   scroll through the work. Every skin is painted here in code.
   --------------------------------------------------------------------- */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = 1 / 16;                       // one skin pixel, in world units

/* ------------------------------------------------------------- skins */
const skins = new Map();
function skin(key, w, h, paint) {
  if (skins.has(key)) return skins.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  paint(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  skins.set(key, t);
  return t;
}
const solid = (c) => new THREE.MeshLambertMaterial({ color: c });
const mapped = (t) => new THREE.MeshLambertMaterial({ map: t });
const noise = (g, w, h, base, amt) => {
  const [r, gg, b] = base;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = (Math.random() - 0.5) * amt;
    g.fillStyle = `rgb(${(r + d) | 0},${(gg + d) | 0},${(b + d) | 0})`;
    g.fillRect(x, y, 1, 1);
  }
};

/* a box measured in skin pixels, with an optional pivot offset */
function part(w, h, d, mat, x, y, z, pivot) {
  const geo = new THREE.BoxGeometry(w * P, h * P, d * P);
  if (pivot) geo.translate(pivot[0] * P, pivot[1] * P, pivot[2] * P);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x * P, y * P, z * P);
  m.castShadow = true;
  return m;
}


/* ---------------------------------------------------------------------
   Drop a standard 64x64 Minecraft skin in here (as a data: URI) and the
   hero character wears it instead of the hand-painted one. Everything
   below maps the classic skin layout onto the box parts.
   --------------------------------------------------------------------- */
const SKIN_ATLAS = '';

function cropTex(img, x, y, w, h, s = 1) {
  const c = document.createElement('canvas');
  c.width = w * s; c.height = h * s;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, x * s, y * s, w * s, h * s, 0, 0, w * s, h * s);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* the six faces of one skin part, in three.js material order
   (+x,-x,+y,-y,+z,-z) = (left, right, top, bottom, front, back) */
function atlasBox(img, u, v, w, h, d, overlay, s = 1) {
  const R = {
    top: [u + d, v, w, d], bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h], front: [u + d, v + d, w, h],
    left: [u + d + w, v + d, d, h], back: [u + d + w + d, v + d, w, h]
  };
  const opt = overlay ? { transparent: true, alphaTest: 0.35, depthWrite: false } : {};
  const mk = (r) => new THREE.MeshLambertMaterial({ map: cropTex(img, r[0], r[1], r[2], r[3], s), ...opt });
  return [mk(R.left), mk(R.right), mk(R.top), mk(R.bottom), mk(R.front), mk(R.back)];
}

/* base layer + outer layer, for each body part of a classic skin */
const SKIN_PARTS = {
  head: { base: [0, 0], over: [32, 0], size: [8, 8, 8] },
  body: { base: [16, 16], over: [16, 32], size: [8, 12, 4] },
  armR: { base: [40, 16], over: [40, 32], size: [4, 12, 4] },
  armL: { base: [32, 48], over: [48, 48], size: [4, 12, 4] },
  legR: { base: [0, 16], over: [0, 32], size: [4, 12, 4] },
  legL: { base: [16, 48], over: [0, 48], size: [4, 12, 4] }
};

function skinnedSteve(img, s = 1) {
  const g = new THREE.Group();
  const M = {};
  for (const k in SKIN_PARTS) {
    const p = SKIN_PARTS[k];
    M[k] = atlasBox(img, p.base[0], p.base[1], p.size[0], p.size[1], p.size[2], false, s);
    M[k + 'Over'] = atlasBox(img, p.over[0], p.over[1], p.size[0], p.size[1], p.size[2], true, s);
  }
  /* a part plus its slightly inflated outer layer */
  const dual = (k, x, y, z, pivot) => {
    const [w, h, d] = SKIN_PARTS[k].size;
    const grp = new THREE.Group();
    const base = part(w, h, d, M[k], 0, 0, 0, pivot);
    const over = part(w * 1.12, h * 1.06, d * 1.12, M[k + 'Over'], 0, 0, 0,
      pivot ? [pivot[0], pivot[1] * (1.06), pivot[2]] : null);
    grp.add(base, over);
    grp.position.set(x * P, y * P, z * P);
    grp.userData = { base, over, key: k };
    return grp;
  };
  const parts = {};

  parts.legR = dual('legR', -2, 6, 0);
  parts.legL = dual('legL', 2, 6, 0);
  parts.body = dual('body', 0, 18, 0);
  parts.armL = dual('armL', -6.2, 24, 0, [0, -6, 0]);
  parts.armR = dual('armR', 6.2, 24, 0, [0, -6, 0]);
  parts.head = dual('head', 0, 28, 0);
  Object.values(parts).forEach((p) => g.add(p));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { head: parts.head, armL: parts.armL, armR: parts.armR, parts };
  return g;
}

/* ---------------------------------------------------------- builders */
function steve() {
  const SKIN = '#c8956a', HAIR = '#3b2a1c', SHIRT = '#3aa6a0', PANT = '#39457e', SHOE = '#4a4a52';
  const face = skin('sFace', 8, 8, (c) => {
    c.fillStyle = SKIN; c.fillRect(0, 0, 8, 8);
    c.fillStyle = HAIR; c.fillRect(0, 0, 8, 2); c.fillRect(0, 2, 1, 2); c.fillRect(7, 2, 1, 2);
    c.fillStyle = '#f2f2f2'; c.fillRect(1, 4, 2, 1); c.fillRect(5, 4, 2, 1);
    c.fillStyle = '#5a4b8c'; c.fillRect(2, 4, 1, 1); c.fillRect(5, 4, 1, 1);
    c.fillStyle = '#8d6b4a'; c.fillRect(3, 6, 2, 1);
  });
  const head = skin('sHead', 8, 8, (c) => {
    c.fillStyle = SKIN; c.fillRect(0, 0, 8, 8);
    c.fillStyle = HAIR; c.fillRect(0, 0, 8, 3);
  });
  const shirt = skin('sShirt', 8, 12, (c) => {
    noise(c, 8, 12, [58, 166, 160], 16);
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(0, 0, 8, 2);
  });
  const g = new THREE.Group();
  const mH = mapped(head), mF = mapped(face);
  const legs = new THREE.Group();
  legs.add(part(4, 12, 4, solid(PANT), -2, 6, 0));
  legs.add(part(4, 12, 4, solid(PANT), 2, 6, 0));
  legs.add(part(4, 1, 4, solid(SHOE), -2, 0.5, 0));
  legs.add(part(4, 1, 4, solid(SHOE), 2, 0.5, 0));
  g.add(legs);
  g.add(part(8, 12, 4, mapped(shirt), 0, 18, 0));
  /* sleeve on top, bare hand below, so the arms read against the torso */
  const sleeve = skin('sArm', 4, 12, (c) => {
    c.fillStyle = SHIRT; c.fillRect(0, 0, 4, 5);
    c.fillStyle = SKIN; c.fillRect(0, 5, 4, 7);
  });
  const armMat = [mapped(sleeve), mapped(sleeve), solid(SHIRT), solid(SKIN), mapped(sleeve), mapped(sleeve)];
  const armL = part(4, 12, 4, armMat, -6.2, 18, 0, [0, -6, 0]); armL.position.y = 24 * P;
  const armR = part(4, 12, 4, armMat, 6.2, 18, 0, [0, -6, 0]); armR.position.y = 24 * P;
  g.add(armL, armR);
  const head3 = part(8, 8, 8, [mH, mH, mH, mH, mF, mH], 0, 28, 0);
  g.add(head3);
  g.userData = { head: head3, armL, armR, h: 32 * P };
  return g;
}

function villager() {
  const SK = '#c99b76', ROBE = '#6d4a2f', ROBE2 = '#523726', HAIR = '#3b2a1c';
  const face = skin('vFace', 8, 10, (c) => {
    c.fillStyle = SK; c.fillRect(0, 0, 8, 10);
    c.fillStyle = HAIR; c.fillRect(0, 0, 8, 3);
    c.fillStyle = '#2e2117'; c.fillRect(0, 3, 8, 1);
    c.fillStyle = '#f2f2f2'; c.fillRect(1, 4, 2, 2); c.fillRect(5, 4, 2, 2);
    c.fillStyle = '#2f7a35'; c.fillRect(2, 5, 1, 1); c.fillRect(5, 5, 1, 1);
  });
  const head = skin('vHead', 8, 10, (c) => {
    c.fillStyle = SK; c.fillRect(0, 0, 8, 10);
    c.fillStyle = HAIR; c.fillRect(0, 0, 8, 4);
  });
  const robe = skin('vRobe', 8, 12, (c) => {
    noise(c, 8, 12, [109, 74, 47], 14);
    c.fillStyle = ROBE2; c.fillRect(3, 0, 2, 12);
  });
  const g = new THREE.Group();
  const mH = mapped(head), mF = mapped(face);
  g.add(part(4, 12, 4, solid(ROBE2), -2, 6, 0));
  g.add(part(4, 12, 4, solid(ROBE2), 2, 6, 0));
  g.add(part(8, 12, 6, mapped(robe), 0, 18, 0));
  const armL = part(10, 8, 4, solid(ROBE), 0, 19, 3, [0, -4, 0]); armL.position.y = 23 * P;
  g.add(armL);
  const head3 = part(8, 10, 8, [mH, mH, mH, mH, mF, mH], 0, 29, 0);
  g.add(head3);
  g.add(part(2, 4, 3, solid('#b1855f'), 0, 27, 5.5));
  g.userData = { head: head3, armL, armR: null, h: 34 * P };
  return g;
}

function enderman() {
  const K = '#0d0c14';
  const face = skin('eFace', 8, 8, (c) => {
    c.fillStyle = K; c.fillRect(0, 0, 8, 8);
    c.fillStyle = '#c79bff'; c.fillRect(0, 3, 3, 2); c.fillRect(5, 3, 3, 2);
    c.fillStyle = '#ffffff'; c.fillRect(1, 3, 1, 2); c.fillRect(6, 3, 1, 2);
  });
  const g = new THREE.Group();
  const mK = solid(K), mF = mapped(face);
  g.add(part(2, 26, 2, mK, -2, 13, 0));
  g.add(part(2, 26, 2, mK, 2, 13, 0));
  g.add(part(8, 12, 4, mK, 0, 32, 0));
  const armL = part(2, 24, 2, mK, -5, 26, 0, [0, -12, 0]); armL.position.y = 38 * P;
  const armR = part(2, 24, 2, mK, 5, 26, 0, [0, -12, 0]); armR.position.y = 38 * P;
  g.add(armL, armR);
  const head3 = part(8, 8, 8, [mK, mK, mK, mK, mF, mK], 0, 42, 0);
  g.add(head3);
  g.userData = { head: head3, armL, armR, h: 46 * P };
  return g;
}

function creeper() {
  const body = skin('cBody', 8, 12, (c) => {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) {
      const v = 62 + Math.random() * 44;
      c.fillStyle = `rgb(${(v * 0.52) | 0},${(v + 64) | 0},${(v * 0.58) | 0})`;
      c.fillRect(x, y, 1, 1);
    }
  });
  const face = skin('cFace', 8, 8, (c) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const v = 62 + Math.random() * 44;
      c.fillStyle = `rgb(${(v * 0.52) | 0},${(v + 64) | 0},${(v * 0.58) | 0})`;
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = '#0d1a0d';
    c.fillRect(1, 2, 2, 2); c.fillRect(5, 2, 2, 2);
    c.fillRect(3, 4, 2, 3); c.fillRect(2, 4, 1, 2); c.fillRect(5, 4, 1, 2);
    c.fillRect(2, 6, 1, 2); c.fillRect(5, 6, 1, 2);
  });
  const g = new THREE.Group();
  const mB = mapped(body), mF = mapped(face);
  [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([x, z]) => g.add(part(4, 6, 4, mB, x, 3, z)));
  g.add(part(8, 12, 4, mB, 0, 12, 0));
  const head3 = part(8, 8, 8, [mB, mB, mB, mB, mF, mB], 0, 22, 0);
  g.add(head3);
  g.userData = { head: head3, armL: null, armR: null, h: 26 * P };
  return g;
}


function allay() {
  const B = '#4fc3f0', B2 = '#186f9e', W = '#eaf9ff', A = '#8fdcf7';
  const face = skin('aFace', 6, 6, (c) => {
    c.fillStyle = B; c.fillRect(0, 0, 6, 6);
    c.fillStyle = '#0e2233'; c.fillRect(1, 2, 1, 2); c.fillRect(4, 2, 1, 2);
    c.fillStyle = '#ffffff'; c.fillRect(1, 2, 1, 1); c.fillRect(4, 2, 1, 1);
  });
  const head = skin('aHead', 6, 6, (c) => { c.fillStyle = B; c.fillRect(0, 0, 6, 6); });
  const g = new THREE.Group();
  const mH = mapped(head), mF = mapped(face);
  g.add(part(4, 7, 3, solid(B2), 0, 6, 0));
  const armL = part(1.5, 6, 1.5, solid(A), -2.6, 6, 0, [0, -3, 0]); armL.position.y = 9 * P;
  const armR = part(1.5, 6, 1.5, solid(A), 2.6, 6, 0, [0, -3, 0]); armR.position.y = 9 * P;
  g.add(armL, armR);
  /* wings swept out to the sides so they read head-on */
  const wL = part(1, 9, 7, solid(W), -3.2, 9, -1.6, [0, 0, -3.5]); wL.rotation.y = 0.5;
  const wR = part(1, 9, 7, solid(W), 3.2, 9, -1.6, [0, 0, -3.5]); wR.rotation.y = -0.5;
  g.add(wL, wR);
  const head3 = part(6, 6, 6, [mH, mH, mH, mH, mF, mH], 0, 13, 0);
  g.add(head3);
  g.userData = { head: head3, armL, armR, wings: [wL, wR], float: true };
  return g;
}

function golem() {
  const IR = '#d0d3d0', IR2 = '#a9adaa', DK = '#8a8f8b', VINE = '#5c8f3a';
  const face = skin('gFace', 8, 10, (c) => {
    noise(c, 8, 10, [206, 210, 206], 14);
    c.fillStyle = '#3a3f3c'; c.fillRect(1, 3, 2, 2); c.fillRect(5, 3, 2, 2);
    c.fillStyle = IR2; c.fillRect(3, 4, 2, 5);
  });
  const head = skin('gHead', 8, 10, (c) => noise(c, 8, 10, [196, 200, 196], 16));
  const torso = skin('gTorso', 16, 14, (c) => {
    noise(c, 16, 14, [200, 204, 200], 16);
    c.fillStyle = VINE;
    for (let i = 0; i < 16; i++) c.fillRect((Math.random() * 16) | 0, (Math.random() * 14) | 0, 1, 2);
  });
  const g = new THREE.Group();
  const mH = mapped(head), mF = mapped(face);
  g.add(part(6, 15, 6, solid(IR2), -4, 7.5, 0));
  g.add(part(6, 15, 6, solid(IR2), 4, 7.5, 0));
  g.add(part(9, 5, 6, solid(DK), 0, 17, 0));
  g.add(part(16, 14, 8, mapped(torso), 0, 26, 0));
  const armL = part(4, 26, 4, solid(IR), -10, 26, 0, [0, -13, 0]); armL.position.y = 33 * P;
  const armR = part(4, 26, 4, solid(IR), 10, 26, 0, [0, -13, 0]); armR.position.y = 33 * P;
  g.add(armL, armR);
  const head3 = part(8, 10, 8, [mH, mH, mH, mH, mF, mH], 0, 38, 0);
  g.add(head3);
  g.add(part(2, 5, 2, solid(IR2), 0, 36, 5));
  g.userData = { head: head3, armL, armR };
  return g;
}


/* ---------------------------------------------------------------------
   Dior's skin, painted as a classic 64x64 layout but at eight canvas
   pixels per skin pixel — so the seams, stitching, stubble and strands
   of hair are real detail rather than single flat blocks.
   --------------------------------------------------------------------- */
const SKIN_S = 8;
const C = {
  hair: '#0a0a0e', hairHi: '#22222e', hairLo: '#050508',
  skin: '#d29d74', skinHi: '#e2b189', skinLo: '#b8845b', skinDeep: '#9c6b46',
  brow: '#1d150f', eyeW: '#f6f4f1', iris: '#5a3a22', pupil: '#1a1208',
  mouth: '#a2694b', lip: '#8a5539', mole: '#4a3123',
  hood: '#232b3e', hoodLo: '#161c2a', hoodHi: '#333d55', cord: '#c9cfdc',
  denim: '#4f70a6', denimLo: '#3a5480', denimHi: '#6b8fc4', stitch: '#c9a76a',
  boot: '#5b402a', bootLo: '#3f2c1c'
};

function diorSkin(bare) {
  const S = SKIN_S;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64 * S;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  /* block in skin-pixel units (fractions allowed) */
  const B = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x * S, y * S, w * S, h * S); };
  /* speckle a skin-pixel region with canvas-pixel grit */
  const grit = (x, y, w, h, col, n, sz = 1) => {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      g.fillRect((x * S + Math.random() * w * S) | 0, (y * S + Math.random() * h * S) | 0, sz, sz);
    }
  };
  const at = (ox, oy) => (x, y, w, h, col) => B(ox + x, oy + y, w, h, col);

  /* ================= head ================= */
  B(8, 0, 8, 8, C.hair); grit(8, 0, 8, 8, C.hairHi, 90);            // crown
  B(16, 0, 8, 8, C.skinDeep);                                         // under the chin
  B(24, 8, 8, 8, C.hair); grit(24, 8, 8, 8, C.hairHi, 110);           // back of head

  /* sides: skin, with hair over the top and a sideburn */
  [[0, 8, 1], [16, 8, -1]].forEach(([ox, oy, dir]) => {
    const side = at(ox, oy);
    side(0, 0, 8, 8, C.skin);
    grit(ox, oy + 3, 8, 5, C.skinLo, 120);
    for (let i = 0; i < 8; i++) side(i, 0, 1, 2.6 + Math.random() * 0.8, C.hair);
    const sx = dir > 0 ? 0 : 6;                                        // sideburn by the ear
    side(sx, 2.4, 2, 2.2, C.hair);
    side(dir > 0 ? 5.4 : 0.6, 3.6, 1.6, 2.2, C.skinLo);                // ear shadow
  });

  /* ---- the face ---- */
  const F = at(8, 8);
  F(0, 0, 8, 8, C.skin);
  grit(8, 6.1, 8, 1.9, C.skinLo, 34);                                  // faint stubble on the jaw
  F(0, 5.4, 0.8, 2.6, C.skinLo); F(7.2, 5.4, 0.8, 2.6, C.skinLo);      // cheek shadows

  /* fringe with a ragged edge and a strand across the brow */
  const fr = [3.1, 3.4, 3.0, 2.7, 2.9, 3.3, 3.6, 3.3];
  for (let i = 0; i < 8; i++) F(i, 0, 1, fr[i], C.hair);
  F(0, 2.9, 0.9, 1.5, C.hair); F(7.1, 2.9, 0.9, 1.5, C.hair);          // temples

  F(1, 3.5, 2.1, 0.75, C.brow); F(4.9, 3.5, 2.1, 0.75, C.brow);        // brows

  F(1, 4.45, 2, 0.85, C.eyeW); F(5, 4.45, 2, 0.85, C.eyeW);            // eyes
  F(1.85, 4.5, 0.85, 0.8, C.iris); F(5.15, 4.5, 0.85, 0.8, C.iris);
  F(2.1, 4.7, 0.4, 0.4, C.pupil); F(5.4, 4.7, 0.4, 0.4, C.pupil);
  F(1, 4.35, 2, 0.18, C.brow); F(5, 4.35, 2, 0.18, C.brow);            // lash line

  F(3.35, 4.4, 1.3, 1.9, C.skinHi);                                    // nose bridge
  F(3.35, 5.7, 1.3, 0.6, C.skinLo);
  F(3.3, 6.05, 0.42, 0.3, C.skinDeep); F(4.28, 6.05, 0.42, 0.3, C.skinDeep);  // nostrils
  F(5.12, 6.15, 0.5, 0.45, C.mole);                                    // the mole

  F(3.1, 6.95, 1.8, 0.42, C.mouth); F(3.3, 7.3, 1.4, 0.22, C.lip);

  /* ---- hair overlay: a ragged silhouette sitting proud of the skull ---- */
  const O = 32;
  B(O + 8, 0, 8, 8, C.hair); grit(O + 8, 0, 8, 8, C.hairHi, 80);
  B(O + 24, 8, 8, 5.4, C.hair); grit(O + 24, 8, 8, 5, C.hairHi, 60);
  for (let i = 0; i < 8; i++) {
    B(O + 8 + i, 8, 1, fr[i] - 0.15, C.hair);                          // front fringe
    B(O + i, 8, 1, 2.5 + Math.random() * 1.1, C.hair);                 // right side
    B(O + 16 + i, 8, 1, 2.5 + Math.random() * 1.1, C.hair);            // left side
  }
  B(O + 12.6, 11, 2.1, 0.6, C.hair);
  grit(O + 8, 8, 8, 3.4, C.hairLo, 40);

  /* ================= torso ================= */
  const bodyT = at(20, 16), bodyF = at(20, 20), bodyB = at(32, 20);
  if (bare) {
    bodyT(0, 0, 8, 4, C.skin); B(28, 16, 8, 4, C.skinLo);
    B(16, 20, 4, 12, C.skinLo); B(28, 20, 4, 12, C.skinLo);
    bodyF(0, 0, 8, 12, C.skin);
    grit(20, 20, 8, 12, C.skinHi, 40);
    bodyF(0, 0, 8, 1.2, C.skinHi);                                     // collarbones
    bodyF(3.9, 2.2, 0.25, 6, C.skinLo);                                // centre line
    bodyF(1.4, 2.4, 1.1, 0.5, C.skinDeep); bodyF(5.5, 2.4, 1.1, 0.5, C.skinDeep);
    bodyF(0, 10.8, 8, 1.2, C.skinLo);
    bodyB(0, 0, 8, 12, C.skinLo); grit(32, 20, 8, 12, C.skin, 40);
  } else {
  bodyT(0, 0, 8, 4, C.hood); B(28, 16, 8, 4, C.hoodLo);
  B(16, 20, 4, 12, C.hoodLo); B(28, 20, 4, 12, C.hoodLo);              // sides
  bodyF(0, 0, 8, 12, C.hood);
  grit(20, 20, 8, 12, C.hoodHi, 40);
  grit(20, 20, 8, 12, C.hoodLo, 40);
  bodyF(0, 0, 8, 1.1, C.hoodHi);                                       // collar
  bodyF(3.85, 1.1, 0.3, 10.9, C.hoodLo);                               // zip seam
  bodyF(2.6, 1.0, 0.28, 3.2, C.cord); bodyF(5.1, 1.0, 0.28, 2.7, C.cord); // drawstrings
  bodyF(2.5, 4.1, 0.5, 0.5, C.cord); bodyF(5.0, 3.6, 0.5, 0.5, C.cord);   // aglets
  bodyF(1.3, 7.6, 5.4, 0.16, C.hoodHi);                                // kangaroo pocket seam
  bodyF(1.3, 7.6, 0.16, 2.8, C.hoodHi); bodyF(6.54, 7.6, 0.16, 2.8, C.hoodHi);
  bodyF(0, 11.4, 8, 0.6, C.hoodLo);                                    // hem
  bodyB(0, 0, 8, 12, C.hoodLo); grit(32, 20, 8, 12, C.hood, 120);
  bodyB(1.2, 0, 5.6, 4.2, C.hood);                                     // hood down the back

  /* overlay: the hood bunched behind the neck */
  B(20, 32, 8, 3.2, C.hoodHi); grit(20, 32, 8, 3.2, C.hood, 70);
  B(36, 36, 8, 3.4, C.hoodLo);
  }

  /* ================= arms ================= */
  const arm = (u, v) => {
    if (bare) {
      B(u + 4, v, 4, 4, C.skin); B(u + 8, v, 4, 4, C.skin);
      [0, 4, 8, 12].forEach((o) => {
        B(u + o, v + 4, 4, 12, o === 0 || o === 8 ? C.skinLo : C.skin);
        grit(u + o, v + 4, 4, 12, C.skinHi, 20);
      });
      return;
    }
    B(u + 4, v, 4, 4, C.hood); B(u + 8, v, 4, 4, C.skin);              // shoulder / palm
    [0, 4, 8, 12].forEach((o) => {
      B(u + o, v + 4, 4, 7.4, o === 0 || o === 8 ? C.hoodLo : C.hood);
      B(u + o, v + 11.4, 4, 0.7, C.hoodHi);                            // cuff ribbing
      B(u + o, v + 12.1, 4, 3.9, C.skin);
      grit(u + o, v + 12.1, 4, 3.9, C.skinLo, 26);
    });
    grit(u + 4, v + 4, 4, 7, C.hoodHi, 30);
  };
  arm(40, 16);
  arm(32, 48);

  /* ================= jeans + boots ================= */
  const leg = (u, v) => {
    if (bare) {
      B(u + 4, v, 4, 4, '#e8e8e4'); B(u + 8, v, 4, 4, C.skinLo);
      [0, 4, 8, 12].forEach((o) => {
        B(u + o, v + 4, 4, 12, o === 0 || o === 8 ? C.skinLo : C.skin);
        grit(u + o, v + 6, 4, 10, C.skinHi, 16);
        B(u + o, v + 4, 4, 4.6, '#eeeeea');                            // boxers
        B(u + o, v + 4, 4, 0.7, '#d4d4cf');                            // waistband
      });
      return;
    }
    B(u + 4, v, 4, 4, C.denim); B(u + 8, v, 4, 4, C.bootLo);
    [[0, C.denimLo], [4, C.denim], [8, C.denimLo], [12, C.denimLo]].forEach(([o, col]) => {
      B(u + o, v + 4, 4, 12, col);
      grit(u + o, v + 4, 4, 10, C.denimHi, 14);
      grit(u + o, v + 4, 4, 10, C.denimLo, 18);
      B(u + o, v + 4, 4, 0.85, C.denimHi);                             // waistband
      B(u + o, v + 4.85, 4, 0.16, C.stitch);
      B(u + o, v + 13.9, 4, 2.1, C.boot);                              // boot
      B(u + o, v + 15.4, 4, 0.6, C.bootLo);                            // sole
    });
    /* front pocket + rivets, only on the leg you actually see */
    B(u + 4.2, v + 5.4, 0.16, 2.6, C.stitch);
    B(u + 6.6, v + 5.4, 0.16, 2.6, C.stitch);
    B(u + 4.2, v + 5.4, 2.6, 0.16, C.stitch);
    B(u + 4.15, v + 5.3, 0.3, 0.3, C.denimHi);
    B(u + 5.9, v + 8.2, 1.4, 0.16, C.stitch);
    B(u + 7.85, v + 4, 0.3, 12, C.denimLo);                            // outseam
  };
  leg(0, 16);
  leg(16, 48);

  return cv;
}

/* ---------------------------------------------------------------------
   The laptop. Wide enough to read as a laptop at a glance, with a real
   screen and a real keyboard rather than two grey slabs.
   --------------------------------------------------------------------- */
function screenTex() {
  const c = document.createElement('canvas');
  c.width = 112; c.height = 76;
  const g = c.getContext('2d');
  g.fillStyle = '#aeb3ba'; g.fillRect(0, 0, 112, 76);
  g.fillStyle = '#0f1216'; g.fillRect(6, 5, 100, 62);
  g.fillStyle = '#16202b'; g.fillRect(6, 5, 100, 10);
  ['#4fd0c8', '#8ec24d', '#7f8aa0', '#e0a03f', '#7f8aa0', '#4fd0c8'].forEach((col, i) => {
    g.fillStyle = col;
    g.fillRect(12, 21 + i * 7, 20 + Math.random() * 62, 3);
  });
  g.fillStyle = '#5d646e'; g.fillRect(50, 69, 12, 2);
  return c;
}
function keyboardTex() {
  const c = document.createElement('canvas');
  c.width = 112; c.height = 72;
  const g = c.getContext('2d');
  g.fillStyle = '#c2c6cc'; g.fillRect(0, 0, 112, 72);
  g.fillStyle = '#8f959d'; g.fillRect(8, 6, 96, 40);
  g.fillStyle = '#4a5058';
  for (let r = 0; r < 5; r++) for (let k = 0; k < 12; k++) g.fillRect(10 + k * 8, 8 + r * 8, 6, 6);
  g.fillStyle = '#a8aeb6'; g.fillRect(38, 52, 36, 14);
  return c;
}
function lidBackTex() {
  const c = document.createElement('canvas');
  c.width = 104; c.height = 61;
  const g = c.getContext('2d');
  g.fillStyle = '#b7bcc3'; g.fillRect(0, 0, 104, 61);
  g.fillStyle = '#a3a8b0'; g.fillRect(0, 0, 104, 3); g.fillRect(0, 58, 104, 3);
  g.fillStyle = '#8d939b'; g.fillRect(44, 24, 16, 13);      // a little badge
  g.fillStyle = '#c6cad0'; g.fillRect(47, 27, 10, 7);
  return c;
}

function laptop() {
  const g = new THREE.Group();
  const shell = solid('#b7bcc3'), edge = solid('#9aa0a8');
  const kb = new THREE.CanvasTexture(keyboardTex());
  kb.magFilter = THREE.NearestFilter; kb.colorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.CanvasTexture(screenTex());
  sc.magFilter = THREE.NearestFilter; sc.colorSpace = THREE.SRGBColorSpace;

  const base = part(13, 1, 8.5, [shell, shell, mapped(kb), edge, edge, edge], 0, 0, 0);
  const back = new THREE.CanvasTexture(lidBackTex());
  back.magFilter = THREE.NearestFilter; back.colorSpace = THREE.SRGBColorSpace;
  /* hinge on the far edge; the lid tips back towards him, so he reads the
     screen and we see the outside of the lid */
  const lidG = new THREE.Group();
  const lid = part(13, 6.6, 0.7, [edge, edge, edge, edge, mapped(back), mapped(sc)], 0, 0, 0, [0, 3.3, 0]);
  lidG.add(lid);
  lidG.position.set(0, 0.5 * P, 3.9 * P);
  lidG.rotation.x = -0.40;
  g.add(base, lidG);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

const SWAPPABLE = ['body', 'armL', 'armR', 'legL', 'legR'];

function diorHero() {
  const g = skinnedSteve(diorSkin(false), SKIN_S);
  const u = g.userData;

  /* a second, undressed set of materials, swapped in on click */
  const bareAtlas = diorSkin(true);
  const bareMats = {}, dressedMats = {};
  SWAPPABLE.forEach((k) => {
    const p = SKIN_PARTS[k];
    bareMats[k] = atlasBox(bareAtlas, p.base[0], p.base[1], p.size[0], p.size[1], p.size[2], false, SKIN_S);
    dressedMats[k] = u.parts[k].userData.base.material;
  });
  u.restL = -0.73; u.restR = -0.73;
  u.armL.rotation.x = u.restL;
  u.armR.rotation.x = u.restR;
  const lap = laptop();
  lap.position.set(0, 14.4 * P, 8 * P);
  lap.rotation.set(-0.10, 0, 0);
  g.add(lap);

  /* 0 fully kitted, 1 laptop down, 2 hoodie off, 3 jeans off, then back */
  u.stage = 0;
  u.setStage = (n) => {
    u.stage = ((n % 4) + 4) % 4;
    lap.visible = u.stage === 0;
    const topOff = u.stage >= 2, legsOff = u.stage >= 3;
    SWAPPABLE.forEach((k) => {
      const off = k === 'legL' || k === 'legR' ? legsOff : topOff;
      u.parts[k].userData.base.material = off ? bareMats[k] : dressedMats[k];
      u.parts[k].userData.over.visible = !off;
    });
    u.restL = u.stage === 0 ? -0.73 : -0.06;      // arms drop once the laptop is gone
    u.restR = u.stage === 0 ? -0.73 : -0.06;
  };
  return g;
}

let ATLAS_IMG = null;
const hero = () => (ATLAS_IMG ? skinnedSteve(ATLAS_IMG) : diorHero());

const CAST = [
  { id: 'steve', make: hero, label: 'Dior', scale: 1, lookDown: 0.26 },
  { id: 'allay', make: allay, label: 'GigWave', scale: 1.62, lift: 0.42 },
  { id: 'golem', make: golem, label: 'Cifragen', scale: 0.86 },
  { id: 'villager', make: villager, label: 'NAPA', scale: 1, lift: 0.14 },
  { id: 'enderman', make: enderman, label: 'Starpets', scale: 0.86 },
  { id: 'creeper', make: creeper, label: 'Gabumas', scale: 1.1 }
];

/* ---------------------------------------------------------- 3d stage */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 2.15, 9.6);
camera.lookAt(0, 0.92, 0);

scene.add(new THREE.HemisphereLight(0xdcefff, 0x6f8a4a, 1.5));
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const key = new THREE.DirectionalLight(0xfff3d6, 2.1);
key.position.set(-4.5, 6, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -3; key.shadow.camera.right = 3;
key.shadow.camera.top = 4; key.shadow.camera.bottom = -2;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 18;
key.shadow.bias = -0.002;
scene.add(key);
scene.add(key.target);

/* soft contact shadow on an invisible floor */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14),
  new THREE.ShadowMaterial({ opacity: 0.34 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const rig = new THREE.Group();
scene.add(rig);

let current = null, currentId = null;
const PARTS_HOME = new WeakMap();

function mount(id) {
  if (currentId === id) return;
  currentId = id;
  const def = CAST.find((c) => c.id === id) || CAST[0];
  const next = def.make();
  next.scale.setScalar(def.scale || 1);
  next.userData.lift = def.lift || 0;
  next.userData.lookDown = def.lookDown || 0;
  next.traverse((o) => { if (o.isMesh) PARTS_HOME.set(o, o.position.clone()); });

  const old = current;
  current = next;
  rig.add(next);

  /* new character assembles out of scattered blocks */
  const kids = [];
  next.traverse((o) => { if (o.isMesh) kids.push(o); });
  kids.forEach((o) => {
    const home = PARTS_HOME.get(o);
    o.userData.from = home.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 2.6 + 1, (Math.random() - 0.5) * 2.6
    ));
    o.userData.t = REDUCED ? 1 : 0;
  });

  if (old) {
    old.userData.dying = 0;
    const dk = [];
    old.traverse((o) => { if (o.isMesh) dk.push(o); });
    dk.forEach((o) => {
      o.userData.away = o.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3
      ));
      o.userData.start = o.position.clone();
    });
    setTimeout(() => rig.remove(old), REDUCED ? 0 : 520);
  }
}

/* -------------------------------------------------- pointer & scroll */
let spin = 0, spinV = 0, dragging = false, lastX = 0;
let mouse = { x: 0, y: 0 };
const grab = document.getElementById('grab');

let pressAt = 0, pressX = 0, pressY = 0;
grab.addEventListener('pointerdown', (e) => {
  pressAt = performance.now(); pressX = e.clientX; pressY = e.clientY;
  dragging = true; lastX = e.clientX;
  grab.setPointerCapture(e.pointerId);
  grab.classList.add('grabbing');
});
grab.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  spinV += (e.clientX - lastX) * 0.011;
  lastX = e.clientX;
});
const release = (e) => {
  if (!dragging) return;
  /* a tap, not a drag: let him take something off */
  if (e && performance.now() - pressAt < 420 &&
      Math.abs(e.clientX - pressX) < 6 && Math.abs(e.clientY - pressY) < 6 &&
      current && current.userData.setStage) {
    current.userData.setStage(current.userData.stage + 1);
  }
  dragging = false;
  grab.classList.remove('grabbing');
  if (e && e.pointerId != null && grab.hasPointerCapture(e.pointerId)) grab.releasePointerCapture(e.pointerId);
};
grab.addEventListener('pointerup', release);
grab.addEventListener('pointercancel', release);
addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
});

/* ---------------------------------------------------------- sections */
const sections = [...document.querySelectorAll('[data-cast]')];
const chips = [...document.querySelectorAll('.chip-pick')];
const bg = document.getElementById('bg');
const bg2 = document.getElementById('bg2');
const tag = document.getElementById('tag');
const tagAnchor = new THREE.Vector3();
let active = 0, sideGoal = 0, sideNow = 0;

function setActive(i) {
  if (i === active) return;
  active = i;
  if (!animating) navIndex = i;
  const s = sections[i];
  mount(s.dataset.cast);
  sideGoal = s.dataset.side === 'left' ? -1 : 1;
  document.documentElement.style.setProperty('--tint', s.dataset.tint || '#7be05b');
  chips.forEach((c, k) => c.classList.toggle('on', k === i));
}


/* ---------------------------------------------------------------------
   Section navigation.

   The browser's own smooth scrolling and CSS scroll-snap fought each other
   and a single trackpad flick could travel two or three sections, so the
   page drives the scroll itself: one wheel gesture, one swipe or one arrow
   key advances exactly one section, eased over ~0.7s. A gesture is treated
   as continuing until the events stop arriving, which is what stops a long
   flick from firing again mid-flight.
   --------------------------------------------------------------------- */
let navIndex = 0;
let animating = false;
let lastGesture = 0;
let animEnd = 0;

const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

function animateTo(y, dur = 720) {
  const from = scrollY;
  const dist = y - from;
  if (Math.abs(dist) < 1) return;
  if (REDUCED) { scrollTo(0, y); return; }
  const t0 = performance.now();
  animating = true;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    scrollTo(0, from + dist * easeInOut(p));
    if (p < 1) requestAnimationFrame(step);
    else { animating = false; animEnd = performance.now(); }
  };
  requestAnimationFrame(step);
}

function goTo(i) {
  i = Math.max(0, Math.min(sections.length - 1, i));
  navIndex = i;
  animateTo(sections[i].offsetTop);
}

/* true when the pointer is over a card that still has room to scroll itself */
function insideScrollingCard(target, dir) {
  const card = target && target.closest ? target.closest('.card') : null;
  if (!card || card.scrollHeight <= card.clientHeight + 2) return false;
  const atTop = card.scrollTop <= 0;
  const atEnd = card.scrollTop + card.clientHeight >= card.scrollHeight - 1;
  return dir > 0 ? !atEnd : !atTop;
}

/* one continuous gesture only ever advances one section */
function gesture(dir, target) {
  const now = performance.now();
  const quiet = now - lastGesture > 160;
  lastGesture = now;
  /* still animating, still coasting from the last one, or still the same
     flick — all of them mean this is not a new gesture */
  if (animating || now - animEnd < 280 || !quiet) return false;
  if (insideScrollingCard(target, dir)) return false;
  goTo(navIndex + dir);
  return true;
}

addEventListener('wheel', (e) => {
  const dir = e.deltaY > 0 ? 1 : -1;
  if (insideScrollingCard(e.target, dir)) return;       // let the card scroll
  e.preventDefault();                                    // the page never free-scrolls
  if (Math.abs(e.deltaY) < 3) return;
  gesture(dir, e.target);
}, { passive: false });

let touchY = null;
addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener('touchmove', (e) => {
  if (touchY == null) return;
  const dir = touchY - e.touches[0].clientY > 0 ? 1 : -1;
  if (!insideScrollingCard(e.target, dir)) e.preventDefault();
}, { passive: false });
addEventListener('touchend', (e) => {
  if (touchY == null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (Math.abs(dy) < 40) return;
  lastGesture = 0; animEnd = 0;                          // a swipe is always a fresh gesture
  gesture(dy > 0 ? 1 : -1, e.target);
}, { passive: true });

addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('#pick')) return;   // the picker owns its arrows
  const next = ['ArrowDown', 'PageDown', ' '].includes(e.key);
  const prev = ['ArrowUp', 'PageUp'].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault();
  if (!animating) goTo(navIndex + (next ? 1 : -1));
});

/* in-page links go through the same animation */
addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const el = document.querySelector(a.getAttribute('href'));
  const i = sections.indexOf(el);
  if (i < 0) return;
  e.preventDefault();
  goTo(i);
});

addEventListener('resize', () => { if (!animating) scrollTo(0, sections[navIndex].offsetTop); });

const io = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting && e.intersectionRatio > 0.5) setActive(sections.indexOf(e.target));
  });
}, { threshold: [0.5, 0.75] });
sections.forEach((s) => io.observe(s));

document.getElementById('pick').addEventListener('keydown', (e) => {
  const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!d) return;
  e.preventDefault();
  const i = Math.max(0, Math.min(chips.length - 1, chips.indexOf(document.activeElement) + d));
  chips[i].focus(); chips[i].click();
});
chips.forEach((c, i) => c.addEventListener('click', () => goTo(i)));

const NARROW = () => innerWidth < 900;
function applyView() {
  camera.aspect = innerWidth / innerHeight;
  if (NARROW()) {
    camera.position.set(0, 2.3, 11.4);
    camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.24, innerWidth, innerHeight);
  } else {
    camera.position.set(0, 2.15, 9.6);
    camera.clearViewOffset();
  }
  camera.lookAt(0, 0.92, 0);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', applyView);

/* ------------------------------------------------------------- frame */
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const k = 1 - Math.exp(-dt * 6);

  /* character slides to whichever side the copy isn't on */
  sideNow += (sideGoal - sideNow) * k;
  const offset = NARROW() ? 0 : 1.45;
  rig.position.x = sideNow * offset;
  floor.position.x = rig.position.x;
  key.target.position.set(rig.position.x, 1, 0);
  key.position.set(rig.position.x - 4.5, 6, 4);

  /* spin: drag momentum, easing back to face front */
  if (!dragging) { spinV *= 0.92; spin += spinV; spin += (0 - spin) * dt * 0.7; }
  else spin += spinV, spinV *= 0.55;
  rig.rotation.y = spin;

  if (current) {
    const u = current.userData;
    const t = now * 0.001;
    /* breathing */
    const lift = u.lift || 0;
    current.position.y = lift + (REDUCED ? 0 : Math.sin(t * 1.6) * (u.float ? 0.055 : 0.012));
    /* head follows the cursor, in the character's own frame */
    if (u.head) {
      u.head.rotation.y += ((mouse.x * 0.6 - spin) - u.head.rotation.y) * k;
      u.head.rotation.x += ((mouse.y * 0.30 + (u.lookDown || 0)) - u.head.rotation.x) * k;
    }
    if (!REDUCED) {
      if (u.armL) u.armL.rotation.x = (u.restL || 0) + Math.sin(t * 1.6) * 0.05;
      if (u.armR) u.armR.rotation.x = (u.restR || 0) - Math.sin(t * 1.6) * 0.05;
      if (u.wings) { const f = Math.sin(t * 13) * 0.42; u.wings[0].rotation.y = 0.5 + f; u.wings[1].rotation.y = -0.5 - f; }
    }
    /* assemble animation */
    current.traverse((o) => {
      if (!o.isMesh || o.userData.t === undefined) return;
      if (o.userData.t >= 1) return;
      o.userData.t = Math.min(1, o.userData.t + dt * 2.6);
      const e = 1 - Math.pow(1 - o.userData.t, 3);
      const home = PARTS_HOME.get(o);
      o.position.lerpVectors(o.userData.from, home, e);
      o.scale.setScalar(0.2 + 0.8 * e);
    });
  }

  /* the old character scattering away */
  rig.children.forEach((c) => {
    if (c === current || c.userData.dying === undefined) return;
    c.userData.dying = Math.min(1, c.userData.dying + dt * 2.2);
    const e = c.userData.dying;
    c.traverse((o) => {
      if (!o.isMesh || !o.userData.away) return;
      o.position.lerpVectors(o.userData.start, o.userData.away, e);
      o.scale.setScalar(Math.max(0.001, 1 - e));
    });
  });

  /* the nameplate hovers over his head until you take the hint */
  if (tag) {
    const show = !!(current && current.userData.setStage);
    tag.classList.toggle('on', !!show);
    if (show) {
      tagAnchor.set(rig.position.x, 2.28, 0).project(camera);
      tag.style.left = ((tagAnchor.x * 0.5 + 0.5) * innerWidth).toFixed(1) + 'px';
      tag.style.top = ((-tagAnchor.y * 0.5 + 0.5) * innerHeight).toFixed(1) + 'px';
    }
  }

  /* background parallax */
  {
    const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (!REDUCED) {
      const tf = `scale(1.08) translate3d(${(-mouse.x * 8).toFixed(2)}px, ${(-p * 46 - mouse.y * 6).toFixed(2)}px, 0)`;
      bg.style.transform = tf; bg2.style.transform = tf;
    }
    /* the scenery hands over to the lakeside view halfway down */
    const f = Math.min(1, Math.max(0, (p - 0.38) / 0.26));
    bg2.style.opacity = (f * f * (3 - 2 * f)).toFixed(3);
  }

  renderer.render(scene, camera);
  if (!document.hidden) requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); }
});

applyView();
if (SKIN_ATLAS) {
  const im = new Image();
  im.onload = () => { ATLAS_IMG = im; currentId = null; mount('steve'); };
  im.src = SKIN_ATLAS;
}
mount('steve');
setActive(0);
sideGoal = sections[0].dataset.side === 'left' ? -1 : 1;
sideNow = sideGoal;
document.getElementById('boot').classList.add('gone');
requestAnimationFrame(frame);

/* ------------------------------------------- picker faces + the hint */
const CHIP_FACES = [
  (c) => {                                   // Dior
    c.fillStyle = C.skin; c.fillRect(0, 0, 8, 8);
    c.fillStyle = C.hair; c.fillRect(0, 0, 8, 3); c.fillRect(0, 3, 1, 1); c.fillRect(7, 3, 1, 1);
    c.fillStyle = C.brow; c.fillRect(1, 3, 2, 1); c.fillRect(5, 3, 2, 1);
    c.fillStyle = C.eye; c.fillRect(1, 4, 2, 1); c.fillRect(5, 4, 2, 1);
    c.fillStyle = C.pupil; c.fillRect(2, 4, 1, 1); c.fillRect(5, 4, 1, 1);
    c.fillStyle = C.skinS; c.fillRect(3, 6, 2, 1);
    c.fillStyle = C.mole; c.fillRect(5, 6, 1, 1);
    c.fillStyle = C.mouth; c.fillRect(3, 7, 2, 1);
  },
  (c) => {                                   // Allay
    c.fillStyle = '#4fc3f0'; c.fillRect(0, 0, 8, 8);
    c.fillStyle = '#0e2233'; c.fillRect(1, 3, 2, 3); c.fillRect(5, 3, 2, 3);
    c.fillStyle = '#ffffff'; c.fillRect(1, 3, 1, 1); c.fillRect(5, 3, 1, 1);
  },
  (c) => {                                   // Iron golem
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const v = 190 + Math.random() * 26;
      c.fillStyle = `rgb(${v | 0},${(v + 4) | 0},${v | 0})`; c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = '#3a3f3c'; c.fillRect(1, 2, 2, 2); c.fillRect(5, 2, 2, 2);
    c.fillStyle = '#a9adaa'; c.fillRect(3, 3, 2, 4);
  },
  (c) => {                                   // Creeper
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const v = 62 + Math.random() * 44;
      c.fillStyle = `rgb(${(v * 0.52) | 0},${(v + 64) | 0},${(v * 0.58) | 0})`;
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = '#0d1a0d';
    c.fillRect(1, 2, 2, 2); c.fillRect(5, 2, 2, 2);
    c.fillRect(3, 4, 2, 3); c.fillRect(2, 4, 1, 2); c.fillRect(5, 4, 1, 2);
    c.fillRect(2, 6, 1, 2); c.fillRect(5, 6, 1, 2);
  },
  (c) => {                                   // Enderman
    c.fillStyle = '#0d0c14'; c.fillRect(0, 0, 8, 8);
    c.fillStyle = '#c79bff'; c.fillRect(0, 3, 3, 2); c.fillRect(5, 3, 3, 2);
    c.fillStyle = '#ffffff'; c.fillRect(1, 3, 1, 2); c.fillRect(6, 3, 1, 2);
  },
  (c) => {                                   // Villager
    c.fillStyle = '#c99b76'; c.fillRect(0, 0, 8, 10);
    c.fillStyle = '#3b2a1c'; c.fillRect(0, 0, 8, 3);
    c.fillStyle = '#2e2117'; c.fillRect(0, 3, 8, 1);
    c.fillStyle = '#f2f2f2'; c.fillRect(1, 4, 2, 2); c.fillRect(5, 4, 2, 2);
    c.fillStyle = '#2f7a35'; c.fillRect(2, 5, 1, 1); c.fillRect(5, 5, 1, 1);
    c.fillStyle = '#b1855f'; c.fillRect(3, 6, 2, 3);
  }
];
chips.forEach((chip, i) => {
  const cv = chip.querySelector('canvas');
  if (!cv || !CHIP_FACES[i]) return;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  CHIP_FACES[i](c);
});

/* little pixel marks for the contact buttons */
const ICONS = {
  telegram: (c) => {
    c.fillStyle = '#5fc8f0';
    c.fillRect(2, 7, 12, 2); c.fillRect(4, 5, 10, 2); c.fillRect(6, 3, 8, 2);
    c.fillRect(8, 9, 6, 2); c.fillRect(9, 11, 4, 2);
    c.fillStyle = '#9fe4ff'; c.fillRect(6, 9, 2, 4);
  },
  whatsapp: (c) => {
    c.fillStyle = '#4fd06a';
    c.fillRect(3, 2, 10, 9); c.fillRect(2, 3, 12, 7); c.fillRect(4, 11, 4, 2); c.fillRect(3, 13, 2, 2);
    c.fillStyle = '#0f2a17';
    c.fillRect(5, 4, 2, 3); c.fillRect(9, 6, 2, 3); c.fillRect(7, 6, 2, 2);
  },
  linkedin: (c) => {
    c.fillStyle = '#3f9ad6'; c.fillRect(1, 1, 14, 14);
    c.fillStyle = '#ffffff';
    c.fillRect(3, 6, 2, 7); c.fillRect(3, 3, 2, 2);
    c.fillRect(7, 6, 2, 7); c.fillRect(9, 6, 3, 2); c.fillRect(11, 8, 2, 5);
  }
};
document.querySelectorAll('canvas[data-icon]').forEach((cv) => {
  const paint = ICONS[cv.dataset.icon];
  if (!paint) return;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  paint(c);
});

const hint = document.getElementById('hint');

/* the yellow splash line, the way the title screen does it */
const splash = document.getElementById('splash');
const SPLASHES = [
  'Automation is just redstone!',
  'It compiles!',
  '99.9% uptime!',
  'Now with 100% more agents!',
  'No creepers were harmed!',
  'Ships on Fridays!',
  'Powered by coffee and YAML!',
  'The logs are green!'
];
if (splash) {
  let si = 0;
  splash.textContent = SPLASHES[0];
  setInterval(() => {
    si = (si + 1) % SPLASHES.length;
    splash.textContent = SPLASHES[si];
  }, 4200);
}
let hinted = false;
const dropHint = () => {
  if (hinted) return;
  hinted = true;
  hint.style.opacity = '0';
};
addEventListener('scroll', dropHint, { passive: true, once: true });
grab.addEventListener('pointerdown', dropHint);
setTimeout(dropHint, 9000);
