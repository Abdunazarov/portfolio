import * as THREE from 'three';
import { T, BLOCKS, blockMat, rnd, rr, reseed } from './textures.js';

/* ---------------------------------------------------------------------
   Offline renderer: composes a voxel landscape and bakes one high-res
   still. Run head-less; the page hands the JPEG back on window.__IMG.
   --------------------------------------------------------------------- */

const P = new URLSearchParams(location.search);
const W = +(P.get('w') || 2560);
const H = +(P.get('h') || 1440);
const VARIANT = P.get('v') || 'valley';

reseed(VARIANT === 'valley' ? 776611 : 4242424);

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

/* ------------------------------------------------------------- sky */
const SKY = {
  valley: { top: '#3f86e0', low: '#bfe0ff', sun: '#fff4cf', fog: '#c3e0fb', amb: 0.30 },
  grove: { top: '#2f6fc4', low: '#cfe6ff', sun: '#fff0c2', fog: '#cfe6fb', amb: 0.34 }
}[VARIANT];

scene.fog = new THREE.Fog(new THREE.Color(SKY.fog).getHex(), 95, 330);
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(600, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(SKY.top) }, b: { value: new THREE.Color(SKY.low) } },
    vertexShader: 'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 a;uniform vec3 b;varying float h;void main(){gl_FragColor=vec4(mix(b,a,clamp(h*1.5+0.06,0.,1.)),1.);}'
  })
));

/* ---------------------------------------------------------- lighting */
scene.add(new THREE.HemisphereLight(0xd9ecff, 0x5c7038, 1.15));
scene.add(new THREE.AmbientLight(0xffffff, SKY.amb));
const sun = new THREE.DirectionalLight(new THREE.Color(SKY.sun), 2.25);
sun.position.set(-140, 66, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0012;
sun.shadow.normalBias = 0.05;
const sc = sun.shadow.camera;
sc.left = -130; sc.right = 130; sc.top = 130; sc.bottom = -130; sc.near = 1; sc.far = 420;
sc.updateProjectionMatrix();
scene.add(sun);

/* ---------------------------------------------------------- terrain */
const LAT = []; for (let i = 0; i < 8192; i++) LAT.push(rnd());
const latAt = (x, z) => LAT[(((x * 73856093) ^ (z * 19349663)) >>> 0) % 8192];
function noise(x, z, s) {
  const X = Math.floor(x / s), Z = Math.floor(z / s);
  const fx = x / s - X, fz = z / s - Z;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = latAt(X, Z), b = latAt(X + 1, Z), c = latAt(X, Z + 1), d = latAt(X + 1, Z + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

const R = 92;                 // half-extent of the generated world
const LAKE = { x: -14, z: 2, r: 26 };
const HILL = { x: 34, z: -26, r: 24, h: 15 };
const WATER_Y = 7;

function height(x, z) {
  let h = noise(x, z, 30) * 10 + noise(x, z, 13) * 3.4 + noise(x, z, 6) * 0.9;
  /* a broad hill for the build to sit on */
  const dh = Math.hypot(x - HILL.x, z - HILL.z);
  if (dh < HILL.r) h += Math.cos((dh / HILL.r) * Math.PI * 0.5) * HILL.h;
  /* mountains along the back edge */
  const back = Math.max(0, (-z - 48) / 34);
  h += back * back * (12 + noise(x, z, 19) * 20);
  /* lake basin */
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (dl < LAKE.r) h -= Math.pow(1 - dl / LAKE.r, 0.7) * 24;
  return Math.round(h);
}

const buckets = new Map();
const put = (t, x, y, z) => {
  let a = buckets.get(t); if (!a) buckets.set(t, (a = []));
  a.push(x, y, z);
};

for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
  const h = height(x, z);
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (h < WATER_Y && dl < LAKE.r + 5) {
    put('sand', x, h, z);
    for (let y = h + 1; y <= WATER_Y; y++) put('water', x, y, z);
  } else if (h > 26) {
    put('stone', x, h, z);
  } else {
    put(h <= WATER_Y + 2 && dl < LAKE.r + 5 ? 'sand' : 'grass', x, h, z);
  }
  put('dirt', x, h - 1, z);
  if ((x + z) % 2 === 0) put('stone', x, h - 2, z);
}

/* ------------------------------------------------------------- trees */
function tree(x, z, kind) {
  const h = height(x, z);
  if (h < WATER_Y + 1 || h > 25) return;
  const trunk = kind === 'sakura' ? 5 + ((rnd() * 2) | 0) : 5 + ((rnd() * 3) | 0);
  for (let y = 1; y <= trunk; y++) put('log', x, h + y, z);
  const leaf = kind === 'sakura' ? 'sakura' : (kind === 'dark' ? 'leavesDark' : 'leaves');
  const top = h + trunk;
  const spread = kind === 'sakura' ? 3 : 2;
  for (let dy = -1; dy <= 2; dy++) {
    const r = dy <= 0 ? spread : (dy === 1 ? spread : spread - 1);
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx === 0 && dz === 0 && dy <= 0) continue;
      const d = Math.hypot(dx, dz);
      if (d > r + 0.4) continue;
      if (d > r - 0.6 && rnd() < 0.55) continue;
      put(leaf, x + dx, top + dy, z + dz);
    }
  }
}

const decor = [];
for (let i = 0; i < 5200; i++) {
  const x = Math.round(rr(-R + 3, R - 3)), z = Math.round(rr(-R + 3, R - 3));
  const h = height(x, z);
  if (h <= WATER_Y || h > 25) continue;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 3) continue;
  if (Math.hypot(x - HILL.x, z - HILL.z) < 9) continue;
  const r = rnd();
  if (r < 0.055) tree(x, z, rnd() < 0.09 ? 'sakura' : (rnd() < 0.42 ? 'dark' : 'oak'));
  else if (r < 0.62) decor.push({ x, y: h + 1, z, t: 0 });
  else if (r < 0.70) decor.push({ x, y: h + 1, z, t: 1 + ((rnd() * 3) | 0) });
}

/* ------------------------------------------------------- the village */
(() => {
  const bx = HILL.x, bz = HILL.z, gy = height(bx, bz);
  const box = (t, x0, y0, z0, w, hh, d, hollow) => {
    for (let x = 0; x < w; x++) for (let y = 0; y < hh; y++) for (let z = 0; z < d; z++) {
      if (hollow && x > 0 && x < w - 1 && y > 0 && y < hh - 1 && z > 0 && z < d - 1) continue;
      put(t, x0 + x, y0 + y, z0 + z);
    }
  };
  /* levelled cobble platform */
  for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) {
    if (Math.hypot(x, z) > 8.6) continue;
    const h = height(bx + x, bz + z);
    for (let y = h; y <= gy; y++) put('cobble', bx + x, y, bz + z);
  }
  box('cobble', bx - 5, gy + 1, bz - 5, 11, 1, 11);
  box('planks', bx - 4, gy + 2, bz - 4, 9, 5, 9, true);
  [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([a, b]) => {
    for (let y = 2; y <= 6; y++) put('log', bx + a, gy + y, bz + b);
  });
  [[-2, 4], [2, 4], [-4, 2], [4, 2], [-4, -2], [4, -2], [0, -4]].forEach(([a, b]) => {
    put('glass', bx + a, gy + 4, bz + b); put('glass', bx + a, gy + 5, bz + b);
  });
  for (let r = 0; r < 5; r++) {
    const s = 5 - r;
    for (let x = -s; x <= s; x++) for (let z = -s; z <= s; z++) {
      if (Math.abs(x) !== s && Math.abs(z) !== s && r < 4) continue;
      put('dark', bx + x, gy + 7 + r, bz + z);
    }
  }
  /* lantern posts */
  [[-7, 6], [7, 6], [-7, -6], [7, -6]].forEach(([a, b]) => {
    for (let y = 2; y <= 5; y++) put('log', bx + a, gy + y, bz + b);
    put('glowstone', bx + a, gy + 6, bz + b);
  });
  /* a path down the hill toward the lake */
  for (let i = 0; i < 46; i++) {
    const t = i / 45;
    const x = Math.round(bx + (LAKE.x + 6 - bx) * t + Math.sin(t * 6) * 2);
    const z = Math.round(bz + (LAKE.z - 3 - bz) * t + Math.cos(t * 5) * 2);
    for (let w = -1; w <= 1; w++) {
      const h = height(x + w, z);
      if (h > WATER_Y) put('path', x + w, h, z);
    }
  }
})();

/* --------------------------------------------------- instance meshes */
const unit = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();
buckets.forEach((arr, type) => {
  const def = BLOCKS[type]; if (!def || !arr.length) return;
  const n = arr.length / 3;
  const mesh = new THREE.InstancedMesh(unit, blockMat(def), n);
  mesh.castShadow = type !== 'water';
  mesh.receiveShadow = true;
  for (let i = 0; i < n; i++) {
    dummy.position.set(arr[i * 3] + 0.5, arr[i * 3 + 1] + 0.5, arr[i * 3 + 2] + 0.5);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
});

/* crossed-plane grass & flowers */
(() => {
  const maps = [T.tuft(), T.flower('#e05050', '#ffe27a'), T.flower('#f2c62a', '#fff6c0'), T.flower('#cf78e8', '#ffeaff')];
  const pl = new THREE.PlaneGeometry(1, 1);
  const a = pl.clone(); a.rotateY(Math.PI / 4);
  const b = pl.clone(); b.rotateY(-Math.PI / 4);
  const geo = mergeGeos([a, b]);
  maps.forEach((m, ti) => {
    const items = decor.filter((d) => d.t === ti);
    if (!items.length) return;
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({
      map: m, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide
    }), items.length);
    mesh.castShadow = false; mesh.receiveShadow = true;
    items.forEach((d, i) => {
      dummy.position.set(d.x + 0.5, d.y + 0.5, d.z + 0.5);
      dummy.rotation.set(0, rnd() * 3.14, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  });
})();

function mergeGeos(gs) {
  const pos = [], uv = [], nor = [], idx = []; let o = 0;
  gs.forEach((g) => {
    const p = g.attributes.position.array, u = g.attributes.uv.array, nn = g.attributes.normal.array;
    pos.push(...p); uv.push(...u); nor.push(...nn);
    for (const i of g.index.array) idx.push(i + o);
    o += p.length / 3;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/* ------------------------------------------------------------ clouds */
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfdfeff, fog: false, transparent: true, opacity: 0.96 });
for (let i = 0; i < 34; i++) {
  const w = rr(22, 60), d = rr(16, 40);
  const c = new THREE.Mesh(new THREE.BoxGeometry(w, 4, d), cloudMat);
  c.position.set(rr(-300, 300), rr(56, 92), rr(-300, 130));
  scene.add(c);
}

/* ------------------------------------------------------------ camera */
const CAM = {
  valley: { pos: [70, 50, 108], look: [0, 16, -34], fov: 34 },
  grove: { pos: [-58, 34, 78], look: [6, 4, -20], fov: 38 }
}[VARIANT];
const camera = new THREE.PerspectiveCamera(CAM.fov, W / H, 0.5, 1600);
camera.position.set(...CAM.pos);
camera.lookAt(...CAM.look);

renderer.render(scene, camera);
window.__IMG = renderer.domElement.toDataURL('image/jpeg', +(P.get('q') || 0.86));
window.__DONE = true;
