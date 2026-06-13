import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Chess } from 'chess.js';
 
// ─── CHESS LOGIC ────────────────────────────────────────────────────────────
const chess = new Chess();
 
// ─── THREE.JS SETUP ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbeeff);
scene.fog = new THREE.Fog(0xdbeeff, 12, 70);
 
// Get the actual usable viewport (minus title/status bar on mobile)
function getViewW() { return window.innerWidth; }
function getViewH() { return window.innerHeight; }
 
const camera = new THREE.PerspectiveCamera(55, getViewW() / getViewH(), 0.1, 200);
camera.position.set(0, 10, 14);
camera.lookAt(0, 0, 0);
 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(getViewW(), getViewH());
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);
 
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.minDistance = 6; controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI / 2.1;
controls.enableDamping = true; controls.dampingFactor = 0.08;
 
const frontCameraPos = new THREE.Vector3(0, 10, 14);
const backCameraPos = new THREE.Vector3(0, 10, -14);
let cameraStartPos = camera.position.clone();
 
window.addEventListener('resize', () => {
  camera.aspect = getViewW() / getViewH();
  camera.updateProjectionMatrix();
  renderer.setSize(getViewW(), getViewH());
});
 
// ─── LIGHTING ────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1.4));
 
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(8, 20, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 60;
keyLight.shadow.camera.left = -15; keyLight.shadow.camera.right = 15;
keyLight.shadow.camera.top = 15; keyLight.shadow.camera.bottom = -15;
scene.add(keyLight);
 
const fillLight = new THREE.PointLight(0xdbeeff, 2.0, 40);
fillLight.position.set(-6, 8, -6);
scene.add(fillLight);
 
const rimLight = new THREE.PointLight(0xfff1c8, 1.3, 30);
rimLight.position.set(0, 12, -12);
scene.add(rimLight);
 
const accentLight1 = new THREE.PointLight(0xbbf7d0, 0.6, 32);
accentLight1.position.set(-8, 6, 6);
scene.add(accentLight1);
 
const accentLight2 = new THREE.PointLight(0x93c5fd, 0.75, 32);
accentLight2.position.set(8, 5, -8);
scene.add(accentLight2);
 
// Board glow light
const boardGlow = new THREE.PointLight(0x93c5fd, 1.15, 16);
boardGlow.position.set(0, 2, 0);
scene.add(boardGlow);
 
// ─── MATERIALS ───────────────────────────────────────────────────────────────
const mats = {
  lightSquare: new THREE.MeshStandardMaterial({ color: 0xd9c59d, roughness: 0.42, metalness: 0.1 }),
  darkSquare:  new THREE.MeshStandardMaterial({ color: 0x4d3119, roughness: 0.45, metalness: 0.07 }),
  boardEdge:   new THREE.MeshStandardMaterial({ color: 0x3b2312, roughness: 0.48, metalness: 0.15 }),
  whitePiece:  new THREE.MeshStandardMaterial({ color: 0xf7ecdd, roughness: 0.27, metalness: 0.18 }),
  blackPiece:  new THREE.MeshStandardMaterial({ color: 0x2b1a0e, roughness: 0.38, metalness: 0.12 }),
  selected:    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.3,
                  emissive: 0xfbbf24, emissiveIntensity: 0.35 }),
  validMove:   new THREE.MeshStandardMaterial({ color: 0x8dc5a3, roughness: 0.3, metalness: 0.1,
                  transparent: true, opacity: 0.65,
                  emissive: 0x7ddf8c, emissiveIntensity: 0.28 }),
  tableTop:    new THREE.MeshStandardMaterial({ color: 0x603b20, roughness: 0.32, metalness: 0.12 }),
  tableLeg:    new THREE.MeshStandardMaterial({ color: 0x22160f, roughness: 0.45, metalness: 0.18 }),
};
 
// ─── BUILD BOARD ─────────────────────────────────────────────────────────────
const SQUARE_SIZE = 1.2;
const BOARD_OFFSET = -SQUARE_SIZE * 3.5;
 
const boardGroup = new THREE.Group();
scene.add(boardGroup);
 
// Board edge
const edgeGeo = new THREE.BoxGeometry(SQUARE_SIZE * 8 + 0.6, 0.25, SQUARE_SIZE * 8 + 0.6);
const edgeMesh = new THREE.Mesh(edgeGeo, mats.boardEdge);
edgeMesh.position.y = -0.15; edgeMesh.receiveShadow = true;
boardGroup.add(edgeMesh);
 
// Squares
const squareGeo = new THREE.BoxGeometry(SQUARE_SIZE - 0.04, 0.12, SQUARE_SIZE - 0.04);
const squares = {};
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) {
    const isLight = (r + c) % 2 === 0;
    const material = isLight ? mats.lightSquare.clone() : mats.darkSquare.clone();
    material.roughness = 0.45;
    material.metalness = 0.08;
    const mesh = new THREE.Mesh(squareGeo, material);
    mesh.position.set(BOARD_OFFSET + c * SQUARE_SIZE, 0, BOARD_OFFSET + (7 - r) * SQUARE_SIZE);
    mesh.receiveShadow = true;
    mesh.userData = { row: r, col: c, isLight, baseColor: isLight ? 0xd9c59d : 0x4d3119 };
    boardGroup.add(mesh);
    const file = String.fromCharCode(97 + c);
    squares[`${file}${r + 1}`] = mesh;
  }
}
 
// ─── TABLE ───────────────────────────────────────────────────────────────────
const tableGroup = new THREE.Group();
scene.add(tableGroup);
 
const tableTopMesh = new THREE.Mesh(
  new THREE.BoxGeometry(22, 0.3, 16), mats.tableTop
);
tableTopMesh.position.y = -0.45; tableTopMesh.receiveShadow = true; tableTopMesh.castShadow = true;
tableGroup.add(tableTopMesh);
 
[[-7,-7],[7,-7],[-7,5],[7,5]].forEach(([x,z]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4, 8), mats.tableLeg);
  leg.position.set(x, -2.6, z); leg.castShadow = true;
  tableGroup.add(leg);
});
 
const backgroundGroup = new THREE.Group();
const wallMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 28),
  new THREE.MeshStandardMaterial({ color: 0x1f2f55, roughness: 0.95, metalness: 0.05, emissive: 0x10213c, emissiveIntensity: 0.06 })
);
wallMesh.position.set(0, 8, -18);
backgroundGroup.add(wallMesh);
 
const panelMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 18),
  new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.3, metalness: 0.2, emissive: 0x312e81, emissiveIntensity: 0.08 })
);
panelMesh.position.set(0, 8, -17.8);
backgroundGroup.add(panelMesh);
 
const stripeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 20),
  new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.25, metalness: 0.2, emissive: 0x831843, emissiveIntensity: 0.12 })
);
stripeMesh.position.set(8, 8, -17.7);
backgroundGroup.add(stripeMesh);
 
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x14213d, roughness: 0.9, metalness: 0.02 })
);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -0.45;
floorMesh.receiveShadow = true;
backgroundGroup.add(floorMesh);
 
scene.add(backgroundGroup);
 
const sunMesh = new THREE.Group();
const orbCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: 0.9, roughness: 0.12, metalness: 0.6, transparent: true, opacity: 0.95 })
);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x60a5fa, emissiveIntensity: 0.5, roughness: 0.05, metalness: 0.85 });
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.04, 12, 60), ringMat);
ring1.rotation.x = Math.PI / 2.4;
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.04, 12, 60), ringMat);
ring2.rotation.y = Math.PI / 2.1;
const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.03, 12, 60), ringMat);
ring3.rotation.z = Math.PI / 3;
const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 5.5, 16),
  new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.6, emissive: 0x0f172a, emissiveIntensity: 0.2 })
);
beam.position.set(0, 2.35, 0);
beam.rotation.x = Math.PI / 2;
 
orbCore.position.set(0, 12, -16);
ring1.position.copy(orbCore.position);
ring2.position.copy(orbCore.position);
ring3.position.copy(orbCore.position);
beam.position.set(0, 9.5, -16);
 
sunMesh.add(orbCore, ring1, ring2, ring3, beam);
backgroundGroup.add(sunMesh);
sunMesh.visible = false;
 
const weatherGroup = new THREE.Group();
scene.add(weatherGroup);
 
const MAX_WEATHER_PARTICLES = 500;
const weatherGeo = new THREE.BufferGeometry();
const weatherPositions = new Float32Array(MAX_WEATHER_PARTICLES * 3);
const weatherVelocities = new Float32Array(MAX_WEATHER_PARTICLES);
const weatherOffsets = new Float32Array(MAX_WEATHER_PARTICLES * 2);
for (let i = 0; i < MAX_WEATHER_PARTICLES; i++) {
  weatherPositions[i * 3]     = (Math.random() - 0.5) * 50;
  weatherPositions[i * 3 + 1] = Math.random() * 40;
  weatherPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  weatherVelocities[i] = Math.random();
  weatherOffsets[i * 2] = Math.random() * Math.PI * 2;
  weatherOffsets[i * 2 + 1] = Math.random();
}
weatherGeo.setAttribute('position', new THREE.BufferAttribute(weatherPositions, 3));
const weatherMat = new THREE.PointsMaterial({ color: 0xbcd2ff, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, depthTest: true });
const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
weatherGroup.add(weatherPoints);
weatherPoints.visible = false;
 
const envSettings = {
  studio: {
    background: 0xdbeeff,
    fogColor: 0xdbeeff,
    fogNear: 12,
    fogFar: 70,
    keyLight: 2.2,
    fillLight: 2.0,
    rimLight: 1.3,
    accentLight1: 0.55,
    accentLight2: 0.75,
    wallColor: 0x9fc7ff,
    panelColor: 0xdce9ff,
    stripeColor: 0x60a5fa,
    floorColor: 0xd7ebff,
    sunVisible: false,
    particles: 'none'
  },
  sunny: {
    background: 0xdcf0ff,
    fogColor: 0xe4f4ff,
    fogNear: 12,
    fogFar: 80,
    keyLight: 2.0,
    fillLight: 2.0,
    rimLight: 1.4,
    accentLight1: 0.5,
    accentLight2: 0.7,
    wallColor: 0xb8d6ff,
    panelColor: 0xf3fbff,
    stripeColor: 0xfbbf24,
    floorColor: 0xd9efff,
    sunVisible: false,
    particles: 'sunny'
  },
  rain: {
    background: 0x1a2a4a,
    fogColor: 0x16233d,
    fogNear: 6,
    fogFar: 38,
    keyLight: 1.4,
    fillLight: 0.9,
    rimLight: 1.0,
    accentLight1: 0.4,
    accentLight2: 0.5,
    wallColor: 0x16223c,
    panelColor: 0x0f172a,
    stripeColor: 0x60a5fa,
    floorColor: 0x0c1a30,
    sunVisible: false,
    particles: 'rain'
  },
  snow: {
    background: 0xdfeefe,
    fogColor: 0xcde2f0,
    fogNear: 8,
    fogFar: 50,
    keyLight: 1.6,
    fillLight: 1.1,
    rimLight: 1.2,
    accentLight1: 0.25,
    accentLight2: 0.45,
    wallColor: 0xbfd7ea,
    panelColor: 0xe2eff4,
    stripeColor: 0x93c5fd,
    floorColor: 0xf7fbff,
    sunVisible: false,
    particles: 'snow'
  }
};
 
let currentEnvironment = 'studio';
let currentPerformance = 'medium';
 
function getWeatherCount(mode) {
  if (mode === 'low') return 80;
  if (mode === 'high') return 320;
  return 160;
}
 
function applyEnvironmentMode(mode) {
  const config = envSettings[mode] || envSettings.studio;
  currentEnvironment = mode;
 
  scene.background.setHex(config.background);
  scene.fog.color.setHex(config.fogColor);
  scene.fog.near = config.fogNear;
  scene.fog.far = config.fogFar;
 
  keyLight.intensity = config.keyLight;
  fillLight.intensity = config.fillLight;
  rimLight.intensity = config.rimLight;
  accentLight1.intensity = config.accentLight1;
  accentLight2.intensity = config.accentLight2;
 
  wallMesh.material.color.setHex(config.wallColor);
  panelMesh.material.color.setHex(config.panelColor);
  stripeMesh.material.color.setHex(config.stripeColor);
  floorMesh.material.color.setHex(config.floorColor);
  sunMesh.visible = config.sunVisible;
 
  weatherPoints.visible = config.particles !== 'none';
  weatherMat.color.setHex(config.particles === 'snow' ? 0xffffff : config.particles === 'rain' ? 0xa5b4fc : 0xffe4a6);
  weatherMat.size = config.particles === 'snow' ? 0.18 : config.particles === 'rain' ? 0.06 : 0.08;
  weatherMat.opacity = config.particles === 'rain' ? 0.8 : 0.75;
  weatherMat.transparent = config.particles === 'rain';
}
 
function applyPerformanceMode(mode) {
  currentPerformance = mode;
  renderer.shadowMap.enabled = mode !== 'low';
  weatherGeo.setDrawRange(0, getWeatherCount(mode));
}
 
function updateWeatherParticles(dt) {
  const count = getWeatherCount(currentPerformance);
  const mode = envSettings[currentEnvironment].particles;
 
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    let x = weatherPositions[ix];
    let y = weatherPositions[ix + 1];
    let z = weatherPositions[ix + 2];
    const speed = 1 + weatherVelocities[i] * 5;
    const offset = weatherOffsets[i * 2];
    const drift = Math.sin(offset + y * 0.12) * 0.05;
 
    if (mode === 'snow') {
      y -= dt * (1.5 + weatherVelocities[i] * 1.6);
      x += drift * dt * 0.8;
      z += Math.cos(offset + y * 0.1) * 0.02;
    } else if (mode === 'rain') {
      y -= dt * (12 + weatherVelocities[i] * 12);
      x += drift * dt * 2.6;
      z += Math.cos(offset + y * 0.15) * 0.03;
    } else if (mode === 'sunny') {
      y += dt * (0.6 + weatherVelocities[i] * 0.8);
      x += Math.sin(offset + y * 0.05) * 0.02;
      z += Math.cos(offset + y * 0.05) * 0.02;
    }
 
    if (y < -4) y = 35;
    if (y > 40) y = -4;
 
    weatherPositions[ix] = x;
    weatherPositions[ix + 1] = y;
    weatherPositions[ix + 2] = z;
  }
  weatherGeo.attributes.position.needsUpdate = true;
}
 
// ─── PIECE SHAPES ─────────────────────────────────────────────────────────────
function makePieceGeometry(type) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.15, 24), null);
  base.position.y = 0.075;
  group.add(base);
 
  if (type === 'p') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.48, 24), null);
    body.position.y = 0.42;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), null);
    head.position.y = 0.8;
    group.add(head);
  } else if (type === 'r') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.78, 24), null);
    body.position.y = 0.48;
    group.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 24), null);
    top.position.y = 0.96;
    group.add(top);
    for (let i = 0; i < 4; i++) {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.18), null);
      const angle = (i / 4) * Math.PI * 2;
      cren.position.set(Math.cos(angle) * 0.22, 1.08, Math.sin(angle) * 0.22);
      group.add(cren);
    }
  } else if (type === 'n') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.72, 20), null);
    body.position.y = 0.46;
    group.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.28, 12), null);
    neck.position.set(0.05, 0.88, 0);
    neck.rotation.z = -0.28;
    group.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.16), null);
    head.position.set(0.18, 1.12, 0);
    head.rotation.z = -0.28;
    group.add(head);
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.06), null);
    mane.position.set(-0.04, 0.96, 0.06);
    mane.rotation.y = 0.42;
    group.add(mane);
  } else if (type === 'b') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.8, 20), null);
    body.position.y = 0.54;
    group.add(body);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), null);
    ball.position.y = 1.04;
    group.add(ball);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 16), null);
    tip.position.y = 1.32;
    group.add(tip);
  } else if (type === 'q') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.84, 20), null);
    body.position.y = 0.56;
    group.add(body);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.15, 20), null);
    collar.position.y = 1.02;
    group.add(collar);
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), null);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.22, 1.26, Math.sin(angle) * 0.22);
      spike.rotation.y = angle;
      group.add(spike);
    }
  } else if (type === 'k') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 20), null);
    body.position.y = 0.6;
    group.add(body);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.16, 20), null);
    collar.position.y = 1.15;
    group.add(collar);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), null);
    head.position.y = 1.4;
    group.add(head);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.08), null);
    crossV.position.y = 1.72;
    group.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08), null);
    crossH.position.y = 1.76;
    group.add(crossH);
  }
 
  return group;
}
 
// ─── PIECE MANAGER ───────────────────────────────────────────────────────────
const pieces3D = {}; // square -> mesh group
 
function squareTo3D(sq) {
  const col = sq.charCodeAt(0) - 97;
  const row = parseInt(sq[1]) - 1;
  return new THREE.Vector3(BOARD_OFFSET + col * SQUARE_SIZE, 0, BOARD_OFFSET + (7 - row) * SQUARE_SIZE);
}
 
function createPiece3D(type, color, square) {
  const group = makePieceGeometry(type);
  const mat = color === 'w' ? mats.whitePiece.clone() : mats.blackPiece.clone();
  group.traverse(child => { if (child.isMesh) { child.material = mat; child.castShadow = true; } });
  group.userData = { type, color, square, mat, originalMat: mat };
 
  const pos = squareTo3D(square);
  group.position.copy(pos);
  scene.add(group);
  pieces3D[square] = group;
  return group;
}
 
function syncBoard() {
  // Remove all current pieces
  Object.values(pieces3D).forEach(p => scene.remove(p));
  for (const k in pieces3D) delete pieces3D[k];
 
  // Re-create from chess.js board
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const file = String.fromCharCode(97 + c);
        const rank = 8 - r;
        const sq = `${file}${rank}`;
        createPiece3D(p.type, p.color, sq);
      }
    }
  }
}
 
syncBoard();
 
// ─── CHARACTER BILLBOARDS + 3D ARMS ───────────────────────────────────────
const defaultCharacters = {
  white: { label: 'Player 1' },
  black: { label: 'Player 2' }
};
 
function buildChair() {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.18, metalness: 0.85 });
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.24, metalness: 0.28 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, roughness: 0.33, metalness: 0.18 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.14, metalness: 0.72, emissive: 0x38bdf8, emissiveIntensity: 0.45 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.78 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.08, metalness: 0.9, emissive: 0x22d3ee, emissiveIntensity: 0.35 });
 
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 16), frameMat);
  base.position.y = -0.18;
  g.add(base);
 
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 16), frameMat);
  stem.position.set(0, -0.32, 0);
  g.add(stem);
 
  const wheelBase = new THREE.Group();
  [[0.58,0.58],[0.58,-0.58],[-0.58,0.58],[-0.58,-0.58]].forEach(([x,z]) => {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 16), frameMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.position.set(x, -0.18, z * 0.4);
    wheelBase.add(spoke);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, -0.18, z * 0.9);
    wheelBase.add(wheel);
  });
  g.add(wheelBase);
 
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.26, 1.6), cushionMat);
  seat.position.y = 0;
  seat.castShadow = true;
  seat.receiveShadow = true;
  g.add(seat);
 
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.0, 0.4), shellMat);
  back.position.set(0, 1.14, -0.7);
  back.castShadow = true;
  back.receiveShadow = true;
  g.add(back);
 
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.44), cushionMat);
  headrest.position.set(0, 1.68, -0.72);
  g.add(headrest);
 
  const sideWingL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.2, 0.46), shellMat);
  sideWingL.position.set(-0.98, 1.06, -0.6);
  sideWingL.rotation.y = 0.12;
  g.add(sideWingL);
 
  const sideWingR = sideWingL.clone();
  sideWingR.position.x = 0.98;
  sideWingR.rotation.y = -0.12;
  g.add(sideWingR);
 
  const leftArmrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 1.18), frameMat);
  leftArmrest.position.set(-0.86, 0.24, 0.1);
  g.add(leftArmrest);
 
  const rightArmrest = leftArmrest.clone();
  rightArmrest.position.set(0.86, 0.24, 0.1);
  g.add(rightArmrest);
 
  const trimStripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.04), accentMat);
  trimStripe.position.set(0, 1.5, -0.48);
  g.add(trimStripe);
 
  const glowStripe = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.03), stripeMat);
  glowStripe.position.set(0, 1.4, -0.5);
  g.add(glowStripe);
 
  const trimLogo = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.02), stripeMat);
  trimLogo.position.set(0, 1.75, -0.56);
  g.add(trimLogo);
 
  const kneeGuard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.56), shellMat);
  kneeGuard.position.set(0, 0.18, 0.2);
  g.add(kneeGuard);
 
  const strap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.08), accentMat);
  strap.position.set(0, 0.74, 0.18);
  g.add(strap);
 
  return g;
}
 
function createSeatedFigure(isWhite, label) {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd1a17f, roughness: 0.56, metalness: 0.05 });
  const suitBase = new THREE.MeshStandardMaterial({ color: isWhite ? 0x3b82f6 : 0xdb2777, roughness: 0.26, metalness: 0.18 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: isWhite ? 0x60a5fa : 0xf472b6, roughness: 0.24, metalness: 0.14 });
  const trimMat = new THREE.MeshStandardMaterial({ color: isWhite ? 0x38bdf8 : 0xfb7185, roughness: 0.18, metalness: 0.55 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: isWhite ? 0xa5f3fc : 0xfbcfe8, roughness: 0.92, metalness: 0.03 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.3 });
  const hairMat = new THREE.MeshStandardMaterial({ color: isWhite ? 0x7dd3fc : 0xc084fc, roughness: 0.28, metalness: 0.14 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.3 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.18 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.85 });
  const jewelMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.15, metalness: 0.8 });
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3, metalness: 0.1 });
  const sashMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.2, metalness: 0.3 });
 
  const CHARACTER_SCALE = 1.7;
  const group = new THREE.Group();
  group.userData.isWhite = isWhite;
  group.userData.label = label;
  group.scale.setScalar(CHARACTER_SCALE);
 
  const chair = buildChair();
  chair.position.y = -0.92;
  group.add(chair);
 
  const seatBody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.62), fabricMat);
  seatBody.position.set(0, 0.22, 0);
  group.add(seatBody);
 
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.62), suitBase);
  shoulder.position.set(0, 1.06, 0);
  shoulder.rotation.x = 0.03;
  group.add(shoulder);
 
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.48), suitBase);
  torso.position.set(0, 0.95, 0);
  group.add(torso);
 
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.88, 0.32), shirtMat);
  shirt.position.set(0, 0.93, 0.16);
  group.add(shirt);
 
  const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.3), shirtMat);
  collarLeft.position.set(-0.16, 1.18, 0.18);
  collarLeft.rotation.y = 0.16;
  group.add(collarLeft);
 
  const collarRight = collarLeft.clone();
  collarRight.position.set(0.16, 1.18, 0.18);
  collarRight.rotation.y = -0.16;
  group.add(collarRight);
 
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.92, 0.06), trimMat);
  trim.position.set(0, 0.94, 0.32);
  group.add(trim);
 
  const buttonLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.06), trimMat);
  buttonLine.position.set(0, 0.9, 0.34);
  group.add(buttonLine);
 
  if (!isWhite) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.58), skirtMat);
    skirt.position.set(0, 0.12, 0.12);
    group.add(skirt);
 
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.1, 0.16), trimMat);
    belt.position.set(0, 0.5, 0.18);
    group.add(belt);
 
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.28), sashMat);
    sash.position.set(0, 0.64, 0.28);
    group.add(sash);
 
    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.46, 0.32), trimMat);
    frontPanel.position.set(0, 0.38, 0.32);
    group.add(frontPanel);
 
    const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 24), jewelMat);
    necklace.position.set(0, 1.28, 0.16);
    necklace.rotation.x = Math.PI / 2;
    group.add(necklace);
 
    const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), jewelMat);
    brooch.position.set(0.12, 0.98, 0.34);
    group.add(brooch);
  }
 
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12), skinMat);
  neck.position.set(0, 1.45, 0);
  group.add(neck);
 
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  group.add(headGroup);
 
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), skinMat);
  head.scale.set(1, 1.08, 0.95);
  headGroup.add(head);
 
  if (isWhite) {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 24), hairMat);
    helmet.position.set(0, 0.08, 0);
    headGroup.add(helmet);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.06), visorMat);
    visor.position.set(0, 0.04, 0.24);
    headGroup.add(visor);
 
    const accentStripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.46), trimMat);
    accentStripe.position.set(0, 0.15, 0);
    headGroup.add(accentStripe);
  } else {
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.32, 0.56), hairMat);
    hairTop.position.set(0, 0.32, 0);
    hairTop.rotation.y = 0.06;
    headGroup.add(hairTop);
 
    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.28), hairMat);
    hairSideL.position.set(-0.28, 0.06, 0.08);
    hairSideL.rotation.y = 0.08;
    headGroup.add(hairSideL);
 
    const hairSideR = hairSideL.clone();
    hairSideR.position.x = 0.28;
    hairSideR.rotation.y = -0.08;
    headGroup.add(hairSideR);
 
    const braid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.14), hairMat);
    braid.position.set(0, 0.02, -0.18);
    braid.rotation.x = 0.05;
    headGroup.add(braid);
 
    const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 24), trimMat);
    tiara.position.set(0, 0.22, 0);
    tiara.rotation.x = Math.PI / 2;
    headGroup.add(tiara);
  }
 
  const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.28), suitBase);
  leftThigh.position.set(-0.22, -0.03, 0.18);
  leftThigh.rotation.x = Math.PI / 12;
  group.add(leftThigh);
 
  const leftKnee = new THREE.Group();
  leftKnee.position.set(-0.22, -0.27, 0.38);
  group.add(leftKnee);
  const leftShin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.18), suitBase);
  leftShin.position.set(0, -0.28, 0.08);
  leftShin.rotation.x = -Math.PI / 12;
  leftKnee.add(leftShin);
  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.44), bootMat);
  leftFoot.position.set(0, -0.34, 0.18);
  leftKnee.add(leftFoot);
 
  const rightThigh = leftThigh.clone();
  rightThigh.position.set(0.22, -0.03, 0.18);
  group.add(rightThigh);
  const rightKnee = new THREE.Group();
  rightKnee.position.set(0.22, -0.27, 0.38);
  group.add(rightKnee);
  const rightShin = leftShin.clone();
  rightKnee.add(rightShin);
  const rightFoot = leftFoot.clone();
  rightKnee.add(rightFoot);
 
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.26, 1.12, 0.08);
  leftShoulder.rotation.z = Math.PI / 2.8;
  leftShoulder.rotation.x = 0.05;
  group.add(leftShoulder);
  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.52, 14), suitBase);
  leftUpperArm.geometry.translate(0, -0.26, 0);
  leftShoulder.add(leftUpperArm);
  const leftElbow = new THREE.Group();
  leftElbow.position.set(0.44, 0, 0);
  leftUpperArm.add(leftElbow);
  const leftLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.42, 14), gloveMat);
  leftLowerArm.geometry.translate(0, -0.21, 0);
  leftLowerArm.rotation.z = -0.32;
  leftElbow.add(leftLowerArm);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.2), gloveMat);
  leftHand.position.set(0.38, -0.08, 0.04);
  leftElbow.add(leftHand);
 
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.36, 1.09, 0.08);
  rightArmPivot.rotation.set(0.08, 0, Math.PI / 2.8);
  group.add(rightArmPivot);
  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.52, 14), suitBase);
  rightUpperArm.geometry.translate(0, -0.26, 0);
  rightArmPivot.add(rightUpperArm);
  const rightElbow = new THREE.Group();
  rightElbow.position.set(0.44, 0, 0);
  rightUpperArm.add(rightElbow);
  const rightLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.42, 14), gloveMat);
  rightLowerArm.geometry.translate(0, -0.21, 0);
  rightLowerArm.rotation.z = -0.18;
  rightElbow.add(rightLowerArm);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.2), gloveMat);
  rightHand.position.set(0.38, -0.06, 0.04);
  rightElbow.add(rightHand);
 
  const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.12), suitBase);
  leftPad.position.set(-0.26, 0.9, 0.08);
  leftPad.rotation.z = 0.08;
  group.add(leftPad);
  const rightPad = leftPad.clone();
  rightPad.position.set(0.26, 0.9, 0.08);
  rightPad.rotation.z = -0.08;
  group.add(rightPad);
 
  group.userData.leftArmPivot = leftShoulder;
  group.userData.rightArmPivot = rightArmPivot;
  group.userData.rightElbow = rightElbow;
  group.userData.head = head;
 
  return group;
}
 
const whiteChar = createSeatedFigure(true, defaultCharacters.white.label);
whiteChar.position.set(0, 0.55, 6.3);
whiteChar.rotation.y = Math.PI;
scene.add(whiteChar);
 
const blackChar = createSeatedFigure(false, defaultCharacters.black.label);
blackChar.position.set(0, 0.55, -6.3);
scene.add(blackChar);
 
updateCharacterUI('white', defaultCharacters.white.label);
updateCharacterUI('black', defaultCharacters.black.label);
 
function getArmRestPosition(isWhite) {
  return new THREE.Vector3(isWhite ? 0.85 : -0.85, 1.05, isWhite ? 6.1 : -6.1);
}
 
function getHandTargetPosition(square) {
  const pos = squareTo3D(square);
  pos.y = 1.0;
  return pos;
}
 
function updateCharacterUI(side, label) {
  // Desktop name cards
  const nameEl = document.getElementById(`name-${side}`);
  if (nameEl) nameEl.textContent = label;
  // Old card fallback
  const cardName = document.querySelector(`#card-${side} .char-name`);
  if (cardName) cardName.textContent = label;
  // Mobile badges
  const mbName = document.getElementById(`mb-name-${side}`);
  if (mbName) mbName.textContent = label;
  const mbAvatar = document.getElementById(`mb-avatar-${side}`);
  if (mbAvatar) mbAvatar.textContent = label.slice(0,2).toUpperCase();
}
 
function animateHandDrag(side, square) {
  const charGroup = side === 'white' ? whiteChar : blackChar;
  const armPivot = charGroup.userData.rightArmPivot;
  const elbow = charGroup.userData.rightElbow;
  if (!armPivot || !elbow) return;
 
  const startArmX = armPivot.rotation.x;
  const startArmZ = armPivot.rotation.z;
  const startElbow = elbow.rotation.z;
  const reachArmX = startArmX - 0.75;
  const reachArmZ = side === 'white' ? startArmZ - 0.72 : startArmZ + 0.72;
  const reachElbow = startElbow + 1.05;
 
  let phase = 0;
  let t = 0;
  const phaseDurations = [0.16, 0.22, 0.24];
 
  activeAnimations.push({
    update(dt) {
      t += dt;
      if (phase === 0) {
        const progress = Math.min(1, t / phaseDurations[0]);
        armPivot.rotation.x = startArmX + (reachArmX - startArmX) * easeOutCubic(progress);
        armPivot.rotation.z = startArmZ + (reachArmZ - startArmZ) * easeOutCubic(progress);
        elbow.rotation.z = startElbow + (reachElbow - startElbow) * easeOutCubic(progress);
        if (progress >= 1) { phase = 1; t = 0; }
      } else if (phase === 1) {
        const progress = Math.min(1, t / phaseDurations[1]);
        if (progress >= 1) { phase = 2; t = 0; }
      } else {
        const progress = Math.min(1, t / phaseDurations[2]);
        armPivot.rotation.x = reachArmX + (startArmX - reachArmX) * easeInCubic(progress);
        armPivot.rotation.z = reachArmZ + (startArmZ - reachArmZ) * easeInCubic(progress);
        elbow.rotation.z = reachElbow + (startElbow - reachElbow) * easeInCubic(progress);
        if (progress >= 1) {
          armPivot.rotation.x = startArmX;
          armPivot.rotation.z = startArmZ;
          elbow.rotation.z = startElbow;
          return true;
        }
      }
      return false;
    }
  });
}
 
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t) { return t * t * t; }
function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
 
 
function getCharGroup(side) {
  return side === 'white' ? whiteChar : blackChar;
}
 
// ─── PARTICLES ───────────────────────────────────────────────────────────────
// Weather particles are updated per environment mode
weatherGeo.setDrawRange(0, getWeatherCount(currentPerformance));
weatherPoints.visible = envSettings.studio.particles !== 'none';
 
// ─── INTERACTION ─────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
 
let selectedSquare = null;
let validMoveSquares = [];
let highlightedSquares = [];
 
function clearHighlights() {
  highlightedSquares.forEach(sq => {
    const mesh = squares[sq];
    if (mesh) {
      const isLight = mesh.userData.isLight;
      mesh.material.color.setHex(isLight ? 0xd8b4fe : 0x3730a3);
      mesh.material.emissive?.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
    }
  });
  highlightedSquares = [];
}
 
function highlightSquare(sq, color, emissive = 0x000000, emissiveInt = 0) {
  const mesh = squares[sq];
  if (mesh) {
    mesh.material.color.setHex(color);
    if (mesh.material.emissive) {
      mesh.material.emissive.setHex(emissive);
      mesh.material.emissiveIntensity = emissiveInt;
    }
    highlightedSquares.push(sq);
  }
}
 
function getSquareFromPosition(pos) {
  const col = Math.round((pos.x - BOARD_OFFSET) / SQUARE_SIZE);
  const row = Math.round((pos.z - BOARD_OFFSET) / SQUARE_SIZE);
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  if (col < 0 || col > 7 || rank < 1 || rank > 8) return null;
  return `${file}${rank}`;
}
 
// Animations queue
const activeAnimations = [];
 
function animatePieceMove(group, targetPos, onDone) {
  const startPos = group.position.clone();
  const midPos = new THREE.Vector3(
    (startPos.x + targetPos.x) / 2,
    startPos.y + 1.8,
    (startPos.z + targetPos.z) / 2
  );
  let t = 0;
  activeAnimations.push({
    update(dt) {
      t += dt * 2.5;
      if (t >= 1) { group.position.copy(targetPos); onDone?.(); return true; }
      // Bezier arc
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const c = t * t;
      group.position.set(
        a * startPos.x + b * midPos.x + c * targetPos.x,
        a * startPos.y + b * midPos.y + c * targetPos.y,
        a * startPos.z + b * midPos.z + c * targetPos.z
      );
      return false;
    }
  });
}
 
function animateCharacterNod(charGroup) {
  const head = charGroup.userData.head;
  if (!head) return;
  const startRot = head.rotation.x;
  let t = 0;
  activeAnimations.push({
    update(dt) {
      t += dt * 3;
      head.rotation.x = startRot + Math.sin(t * Math.PI) * 0.14;
      if (t >= 1) { head.rotation.x = startRot; return true; }
      return false;
    }
  });
}
 
function animateCharacterReach(charGroup, targetSq) {
  const startRot = charGroup.rotation.x;
  const dir = charGroup.userData.isWhite ? -1 : 1;
  let t = 0;
  activeAnimations.push({
    update(dt) {
      t += dt * 2.5;
      charGroup.rotation.x = startRot + Math.sin(t * Math.PI) * 0.08 * dir;
      if (t >= 1) { charGroup.rotation.x = startRot; return true; }
      return false;
    }
  });
}
 
// Promotion handling
let pendingPromotion = null;
const promotionUI = document.getElementById('piece-selector');
promotionUI.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (pendingPromotion) {
      const { from, to } = pendingPromotion;
      pendingPromotion = null;
      promotionUI.style.display = 'none';
      executeMove(from, to, btn.dataset.piece);
    }
  });
});
 
async function executeMove(from, to, promotion = undefined) {
  const moveObj = { from, to };
  if (promotion) moveObj.promotion = promotion;
 
  let result = null;
  // If online, send to server first and use server's authoritative move metadata
  if (onlineMode === 'online' && currentGameId) {
    try {
      const resp = await fetch(`${BASE_API}/games/${currentGameId}/move/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_square: from, to_square: to, promotion: promotion || '' })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        onlineStatus.textContent = err.detail || 'Move rejected by server';
        await pollGameState();
        return;
      }
      const data = await resp.json();
 
      // Load authoritative FEN from server
      if (data.board_fen) {
        chess.load(data.board_fen);
      }
 
      // Construct a result object compatible with local animation code
      const flags = [];
      if (data.is_castle) flags.push(data.castle_side || 'k');
      if (data.promotion) flags.push('p');
      if (data.is_capture) flags.push('c');
      if (data.uci && data.uci.includes('ep')) flags.push('e');
 
      result = {
        san: data.san || '',
        flags: flags.join(''),
        color: data.color || chess.turn(),
        promotion: data.promotion || undefined,
      };
 
      // Use server-provided from/to
      from = data.from_square || from;
      to = data.to_square || to;
      // proceed to animate using the `result` below
    } catch (err) {
      onlineStatus.textContent = 'Network error sending move';
      await pollGameState();
      return;
    }
  } else {
    result = chess.move(moveObj);
    if (!result) return;
  }
 
  // Animate the moving piece
  const movingPiece = pieces3D[from];
  const captured = pieces3D[to];
  const targetPos = squareTo3D(to);
 
  if (captured && captured !== movingPiece) {
    // Animate capture: lift captured piece away
    const capPos = captured.position.clone();
    let t = 0;
    activeAnimations.push({
      update(dt) {
        t += dt * 3;
        captured.position.y = capPos.y + Math.sin(t * Math.PI * 0.5) * 1.5;
        captured.scale.setScalar(Math.max(0, 1 - t));
        if (t >= 1) { scene.remove(captured); return true; }
        return false;
      }
    });
    delete pieces3D[to];
  }
 
  // Animate the piece arc move
  if (movingPiece) {
    delete pieces3D[from];
    animatePieceMove(movingPiece, targetPos, () => {
      pieces3D[to] = movingPiece;
      movingPiece.userData.square = to;
 
      // Handle castling - move rook too
      if (result.flags.includes('k') || result.flags.includes('q')) {
        const isKingSide = result.flags.includes('k');
        const rank = result.color === 'w' ? 1 : 8;
        const rookFrom = isKingSide ? `h${rank}` : `a${rank}`;
        const rookTo   = isKingSide ? `f${rank}` : `d${rank}`;
        const rook = pieces3D[rookFrom];
        if (rook) {
          delete pieces3D[rookFrom];
          animatePieceMove(rook, squareTo3D(rookTo), () => {
            pieces3D[rookTo] = rook;
          });
        }
      }
 
      // Handle en passant
      if (result.flags.includes('e')) {
        const epRank = result.color === 'w' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
        const epSq = `${to[0]}${epRank}`;
        const epPiece = pieces3D[epSq];
        if (epPiece) { scene.remove(epPiece); delete pieces3D[epSq]; }
      }
 
      // Handle promotion: replace pawn mesh
      if (result.flags.includes('p')) {
        scene.remove(movingPiece); delete pieces3D[to];
        createPiece3D(result.promotion, result.color, to);
      }
 
      updateUI();
      if (onlineMode === 'pass') {
        const nextTurn = chess.turn() === 'w' ? frontCameraPos : backCameraPos;
        rotateCameraToTarget(nextTurn);
      }
    });
 
    // Animate character and hand
    const activeChar = result.color === 'w' ? whiteChar : blackChar;
    animateCharacterReach(activeChar, to);
    animateHandDrag(result.color === 'w' ? 'white' : 'black', to);
    setTimeout(() => animateCharacterNod(activeChar), 400);
  }
 
  // Move log
  document.getElementById('move-log').textContent = `Last move: ${result.san}  |  ${chess.history().slice(-5).join('  ')}`;
 
  updateUI();
}
 
function updateUI() {
  const turnBadge = document.getElementById('turn-badge');
  const msg = document.getElementById('game-message');
  const msgText = document.getElementById('msg-text');
  const msgSub = document.getElementById('msg-sub');
 
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black' : 'White';
      msgText.textContent = `${winner} Wins! ♛`;
      msgSub.textContent = 'Checkmate! Click to play again';
    } else if (chess.isDraw()) {
      msgText.textContent = 'Draw! 🤝';
      msgSub.textContent = 'Click to play again';
    }
    msg.style.display = 'block';
  } else if (chess.isCheck()) {
    const inCheck = chess.turn() === 'w' ? 'White' : 'Black';
    msgText.textContent = `Check! ${inCheck} is in check`;
    msgSub.textContent = 'Click to dismiss';
    msg.style.display = 'block';
    // Flash board glow red
    boardGlow.color.setHex(0xff4444);
    setTimeout(() => boardGlow.color.setHex(0x7c3aed), 1500);
  } else {
    msg.style.display = 'none';
  }
 
  turnBadge.textContent = chess.turn() === 'w' ? "White's Turn" : "Black's Turn";
}
 
document.getElementById('game-message').addEventListener('click', () => {
  const msg = document.getElementById('game-message');
  if (chess.isGameOver()) {
    chess.reset();
    syncBoard();
    document.getElementById('move-log').textContent = 'New game started!';
  }
  msg.style.display = 'none';
});
 
const backgroundSelect = document.getElementById('background-select');
const performanceSelect = document.getElementById('performance-select');
if (backgroundSelect) {
  backgroundSelect.addEventListener('change', (e) => {
    applyEnvironmentMode(e.target.value);
  });
}
if (performanceSelect) {
  performanceSelect.addEventListener('change', (e) => {
    applyPerformanceMode(e.target.value);
  });
}
 
applyEnvironmentMode('studio');
applyPerformanceMode('medium');
 
const gameModeSelect = document.getElementById('game-mode-select');
const onlineStatus = document.getElementById('online-status');
const friendSearch = document.getElementById('friend-search');
const friendSearchButton = document.getElementById('friend-search-button');
const friendList = document.getElementById('friend-list');
const challengeList = document.getElementById('challenge-list');
 
let onlineMode = 'pass';
let fakeFriends = ['NovaKnight', 'PixelRook', 'QueenBlast'];
let fakeChallenges = [];
 
// Simulate online players list — replace with real WebSocket/polling in production
const SIMULATED_ONLINE = ['NovaKnight', 'PixelRook', 'QueenBlast', 'SakuraBishop', 'KiraRook'];
 
function makePill(content) {
  const pill = document.createElement('div');
  pill.className = 'online-pill';
  pill.innerHTML = content;
  return pill;
}
 
function refreshOnlinePanel() {
  if (!onlineStatus || !friendList || !challengeList) return;
  onlineStatus.textContent = onlineMode === 'pass'
    ? 'Local pass-and-play active'
    : 'Connected to AniChess lobby';
 
  friendList.innerHTML = '';
  if (onlineMode === 'online') {
    const allPlayers = Array.from(new Set([...SIMULATED_ONLINE, ...fakeFriends]));
    allPlayers.forEach(name => {
      const pill = makePill(`
        <span style="display:flex;align-items:center;gap:6px"><span class="dot"></span>${name}</span>
        <button class="pill-challenge-btn" onclick="sendChallenge('${name}')">Challenge</button>
      `);
      friendList.appendChild(pill);
    });
  } else {
    friendList.appendChild(makePill('<span>Switch to Online to see players</span>'));
  }
 
  challengeList.innerHTML = '';
  if (fakeChallenges.length) {
    fakeChallenges.forEach(ch => {
      const from = typeof ch === 'object' ? ch.from : ch.replace(' challenge', '');
      const pill = makePill(`
        <span style="display:flex;align-items:center;gap:6px"><span class="dot challenge"></span>${from} challenges you</span>
        <button class="pill-accept-btn" onclick="acceptChallenge('${from}')">Accept</button>
      `);
      challengeList.appendChild(pill);
    });
  } else {
    challengeList.appendChild(makePill('<span>' + (onlineMode === 'online' ? 'No pending challenges' : 'Online mode off') + '</span>'));
  }
}
 
window.sendChallenge = function(name) {
  if (onlineStatus) onlineStatus.textContent = `Challenge sent to ${name}!`;
  setTimeout(() => {
    fakeChallenges = [{ from: name, type: '10+0 Blitz' }, ...fakeChallenges];
    refreshOnlinePanel();
    if (onlineStatus) onlineStatus.textContent = `${name} accepted your challenge!`;
  }, 2000);
};
 
window.acceptChallenge = function(name) {
  fakeChallenges = fakeChallenges.filter(c => (typeof c === 'object' ? c.from : c) !== name);
  if (onlineStatus) onlineStatus.textContent = `Game started vs ${name}!`;
  // Update black player name
  defaultCharacters.black.label = name;
  updateCharacterUI('black', name);
  refreshOnlinePanel();
};
 
 
if (gameModeSelect) {
  gameModeSelect.addEventListener('change', (e) => {
    onlineMode = e.target.value;
    if (onlineMode === 'online') {
      onlineStatus.textContent = 'Connecting to AniChess lobby...';
      fakeChallenges = [];
      setTimeout(() => {
        onlineStatus.textContent = 'Online lobby ready';
        refreshOnlinePanel();
      }, 800);
    } else {
      onlineStatus.textContent = 'Local pass-and-play active';
      fakeChallenges = [];
    }
    refreshOnlinePanel();
  });
}
 
if (friendSearchButton) {
  friendSearchButton.addEventListener('click', () => {
    const name = friendSearch?.value.trim();
    if (!name) return;
    fakeFriends = Array.from(new Set([name, ...fakeFriends]));
    refreshOnlinePanel();
    if (onlineStatus) onlineStatus.textContent = `Friend request sent to ${name}`;
    setTimeout(() => refreshOnlinePanel(), 1800);
  });
}
 
refreshOnlinePanel();
 
const createGameButton = document.getElementById('create-game-button');
const joinGameButton = document.getElementById('join-game-button');
const gameIdInput = document.getElementById('game-id-input');
const currentGameDisplay = document.getElementById('current-game');
 
// Use Vite env variable `VITE_BASE_API` in production, fallback to localhost for local dev
const BASE_API = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BASE_API)
  ? import.meta.env.VITE_BASE_API
  : 'http://localhost:8000/api';
let currentGameId = null;
let pollInterval = null;
 
async function createGame() {
  try {
    const resp = await fetch(`${BASE_API}/games/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ white_player: defaultCharacters.white.label })
    });
    const data = await resp.json();
    if (!resp.ok) { onlineStatus.textContent = data.detail || 'Failed to create game'; return; }
    currentGameId = data.game_id;
    if (currentGameDisplay) currentGameDisplay.textContent = `Game: ${currentGameId}`;
    onlineStatus.textContent = `Connected to game ${currentGameId}`;
    startPolling();
  } catch (err) { onlineStatus.textContent = 'Network error creating game'; }
}
 
async function joinGame(gameId) {
  if (!gameId) gameId = gameIdInput?.value?.trim();
  if (!gameId) return;
  try {
    const resp = await fetch(`${BASE_API}/games/${gameId}/`);
    if (!resp.ok) { onlineStatus.textContent = 'Game not found'; return; }
    const data = await resp.json();
    currentGameId = data.game_id;
    if (currentGameDisplay) currentGameDisplay.textContent = `Game: ${currentGameId}`;
    onlineStatus.textContent = `Joined game ${currentGameId}`;
    // Load server board state
    if (data.board_fen) { chess.load(data.board_fen); syncBoard(); updateUI(); }
    startPolling();
  } catch (err) { onlineStatus.textContent = 'Network error joining game'; }
}
 
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => pollGameState(), 1500);
  pollGameState();
}
 
function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}
 
async function pollGameState() {
  if (!currentGameId) return;
  try {
    const resp = await fetch(`${BASE_API}/games/${currentGameId}/`);
    if (!resp.ok) { onlineStatus.textContent = 'Disconnected from server'; stopPolling(); currentGameId = null; if (currentGameDisplay) currentGameDisplay.textContent = 'No game connected'; return; }
    const data = await resp.json();
    if (data.board_fen && data.board_fen !== chess.fen()) {
      chess.load(data.board_fen);
      syncBoard();
      updateUI();
    }
    if (data.last_move) document.getElementById('move-log').textContent = `Last move: ${data.last_move}`;
  } catch (err) {
    onlineStatus.textContent = 'Polling error';
  }
}
 
if (createGameButton) createGameButton.addEventListener('click', () => createGame());
if (joinGameButton) joinGameButton.addEventListener('click', () => joinGame());
 
// Click handling
renderer.domElement.addEventListener('click', (e) => {
  mouse.set(
    (e.clientX / getViewW()) * 2 - 1,
    -(e.clientY / getViewH()) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
 
  // Check piece clicks first
  const pieceObjects = Object.values(pieces3D).flatMap(g => {
    const meshes = [];
    g.traverse(c => { if (c.isMesh) meshes.push(c); });
    return meshes;
  });
 
  const squareMeshes = Object.values(squares);
  const allTargets = [...pieceObjects, ...squareMeshes];
  const hits = raycaster.intersectObjects(allTargets, true);
 
  if (!hits.length) { clearHighlights(); selectedSquare = null; return; }
 
  const hit = hits[0].object;
 
  // Find which square was clicked
  let clickedSq = null;
 
  // Check if it's a board square
  const sqEntry = Object.entries(squares).find(([, m]) => m === hit);
  if (sqEntry) { clickedSq = sqEntry[0]; }
 
  // Check if it's a piece
  if (!clickedSq) {
    const pieceEntry = Object.entries(pieces3D).find(([, g]) => {
      let found = false;
      g.traverse(c => { if (c === hit) found = true; });
      return found;
    });
    if (pieceEntry) clickedSq = pieceEntry[0];
  }
 
  if (!clickedSq) return;
 
  if (selectedSquare) {
    // Try to move
    if (validMoveSquares.includes(clickedSq)) {
      // Check promotion
      const piece = chess.get(selectedSquare);
      const isPromotion = piece?.type === 'p' &&
        ((piece.color === 'w' && clickedSq[1] === '8') || (piece.color === 'b' && clickedSq[1] === '1'));
 
      if (isPromotion) {
        pendingPromotion = { from: selectedSquare, to: clickedSq };
        promotionUI.style.display = 'flex';
      } else {
        executeMove(selectedSquare, clickedSq);
      }
      clearHighlights();
      selectedSquare = null;
      validMoveSquares = [];
    } else {
      // Select new piece
      clearHighlights();
      selectedSquare = null;
      validMoveSquares = [];
      trySelectPiece(clickedSq);
    }
  } else {
    trySelectPiece(clickedSq);
  }
});
 
function trySelectPiece(sq) {
  const piece = chess.get(sq);
  if (!piece || piece.color !== chess.turn()) return;
 
  if (onlineMode === 'online') {
    const status = document.getElementById('online-status');
    if (status) status.textContent = 'Online match active — waiting for server';
  }
 
  selectedSquare = sq;
  highlightSquare(sq, 0xe879f9, 0xe879f9, 0.6);
 
  validMoveSquares = chess.moves({ square: sq, verbose: true }).map(m => m.to);
  validMoveSquares.forEach(vsq => highlightSquare(vsq, 0x4ade80, 0x4ade80, 0.5));
}
 
// ─── RENDER LOOP ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
 
let cameraTargetRotation = null;
let cameraRotationTime = 0;
let cameraRotationDuration = 0.9;
 
function rotateCameraToTarget(targetPos) {
  cameraStartPos = camera.position.clone();
  cameraTargetRotation = targetPos.clone();
  cameraRotationTime = 0;
}
 
function updateCameraRotation(dt) {
  if (!cameraTargetRotation) return;
 
  cameraRotationTime += dt;
  const progress = Math.min(1, cameraRotationTime / cameraRotationDuration);
  const ease = easeInOutSine(progress);
 
  camera.position.lerpVectors(cameraStartPos, cameraTargetRotation, ease);
  camera.lookAt(0, 0, 0);
  controls.update();
 
  if (progress >= 1) {
    cameraTargetRotation = null;
  }
}
 
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
 
  // Update animations
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const done = activeAnimations[i].update(dt);
    if (done) activeAnimations.splice(i, 1);
  }
 
  // Ambient character idle bob
  const t = clock.elapsedTime;
  const whiteHead = whiteChar.userData.head;
  const blackHead = blackChar.userData.head;
  if (whiteHead) whiteHead.position.y = 1.85 + Math.sin(t * 1.2) * 0.02;
  if (blackHead) blackHead.position.y = 1.85 + Math.sin(t * 1.2 + Math.PI) * 0.02;
 
  // Board glow pulse
  boardGlow.intensity = 0.8 + Math.sin(t * 2) * 0.2;
 
  // Weather and environment particle effects
  updateWeatherParticles(dt);
 
  updateCameraRotation(dt);
  if (!cameraTargetRotation) controls.update();
  renderer.render(scene, camera);
}
 
animate();
 
// ─── TOUCH SUPPORT ───────────────────────────────────────────────────────────
renderer.domElement.addEventListener('touchend', (e) => {
  if (e.touches.length > 0) return; // still multi-touching
  const touch = e.changedTouches[0];
  const fakeClick = new MouseEvent('click', {
    clientX: touch.clientX,
    clientY: touch.clientY,
    bubbles: true,
  });
  renderer.domElement.dispatchEvent(fakeClick);
}, { passive: true });
 
// ─── PICKUP PLAYER NAME FROM NAME SCREEN ────────────────────────────────────
(function syncPlayerName() {
  const checkName = () => {
    if (window._playerName) {
      defaultCharacters.white.label = window._playerName;
      updateCharacterUI('white', window._playerName);
      if (window._startMode) {
        const modeEl = document.getElementById('game-mode-select');
        if (modeEl) { modeEl.value = window._startMode; modeEl.dispatchEvent(new Event('change')); }
      }
    } else {
      setTimeout(checkName, 100);
    }
  };
  checkName();
})();
 
// ─── TURN INDICATOR (mobile) ─────────────────────────────────────────────────
function updateMobileTurn() {
  const el = document.getElementById('turn-indicator');
  if (el) el.textContent = chess.turn() === 'w' ? '◀ White' : 'Black ▶';
}
// Patch updateUI to also call updateMobileTurn
const _origUpdateUI = updateUI;
window.updateUI = function() { _origUpdateUI(); updateMobileTurn(); };
updateMobileTurn();