import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { I18N, applyLang } from "/js/i18n.js";

applyLang("it");

const canvas = document.getElementById("world");
const loaderEl = document.getElementById("loader");
const barEl = document.getElementById("bar");
const pctEl = document.getElementById("pct");
const heroCopy = document.getElementById("heroCopy");
const detail = document.getElementById("detail");
const chapterEl = document.getElementById("chapter");
const pbar = document.getElementById("pbar");
const modeBtn = document.getElementById("modeToggle");
const soundBtn = document.getElementById("soundBtn");
const cursor = document.getElementById("cursor");
const cursorLabel = document.getElementById("cursor-label");

const CHAPTERS = [{ t: 0 }, { t: 0.16 }, { t: 0.36 }, { t: 0.56 }, { t: 0.76 }, { t: 0.93 }];
const GALLERY_HOTSPOTS = [
  { t: 0.18, key: "visione" },
  { t: 0.38, key: "metodo" },
  { t: 0.56, key: "pigozzi", room: "pigozzi" },
  { t: 0.64, key: "golden", room: "golden" },
  { t: 0.72, key: "ac", room: "ac" },
  { t: 0.80, key: "terraza", room: "terraza" },
  { t: 0.88, key: "voci" }
];

let progress = 0, targetProgress = 0, walking = false;
let pointer = { x: 0, y: 0 };
let mode = "gallery", activeRoom = null, soundOn = true;

class Ambient {
  constructor() { this.ctx = null; this.master = null; }
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;
    master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 2.2);
    const drone = (freq, type, gain) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = type; o.frequency.value = freq;
      f.type = "lowpass"; f.frequency.value = 420;
      g.gain.value = gain;
      o.connect(f); f.connect(g); g.connect(master); o.start();
    };
    drone(55, "sine", 0.22); drone(82.4, "sine", 0.09); drone(110, "triangle", 0.04);
    const notes = [220, 246.9, 329.6, 370, 440, 493.9];
    setInterval(() => {
      if (!soundOn || ctx.state !== "running") return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = notes[(Math.random() * notes.length) | 0];
      o.type = "sine";
      g.gain.value = 0.0001;
      o.connect(g); g.connect(master);
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.03, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
      o.start(); o.stop(now + 2.8);
    }, 2800);
  }
  set(on) {
    soundOn = on;
    if (this.master && this.ctx) this.master.gain.linearRampToValueAtTime(on ? 0.2 : 0.0001, this.ctx.currentTime + 0.35);
  }
}
const ambient = new Ambient();

function setLoad(n) {
  const v = Math.min(100, n);
  barEl.style.width = v + "%";
  pctEl.textContent = String(Math.round(v)).padStart(2, "0");
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060606);
scene.fog = new THREE.FogExp2(0x060606, 0.016);
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.08, 220);
camera.position.set(0, 1.62, 16);
const clock = new THREE.Clock();

function marbleTex(w = 1024, dark = false) {
  const c = document.createElement("canvas");
  c.width = c.height = w;
  const g = c.getContext("2d");
  g.fillStyle = dark ? "#161310" : "#d9d0c4";
  g.fillRect(0, 0, w, w);
  for (let i = 0; i < 48; i++) {
    g.strokeStyle = dark ? `rgba(90,78,64,${Math.random() * 0.28})` : `rgba(150,130,110,${Math.random() * 0.3})`;
    g.lineWidth = Math.random() * 2.2 + 0.25;
    g.beginPath();
    let x = Math.random() * w, y = Math.random() * w;
    g.moveTo(x, y);
    for (let k = 0; k < 9; k++) { x += (Math.random() - 0.5) * 170; y += (Math.random() - 0.5) * 170; g.lineTo(x, y); }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
const floorMap = marbleTex(); floorMap.repeat.set(6, 28);
const wallMap = marbleTex(1024, true); wallMap.repeat.set(2, 1);
const matWall = new THREE.MeshStandardMaterial({ map: wallMap, roughness: 0.58, metalness: 0.04, color: 0x1a1714 });
const matGold = new THREE.MeshStandardMaterial({ color: 0xc9a86c, roughness: 0.26, metalness: 0.86 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.32, metalness: 0.22 });
const matCream = new THREE.MeshStandardMaterial({ color: 0xe4d9c8, roughness: 0.52, metalness: 0.03 });
const matVelvet = new THREE.MeshStandardMaterial({ color: 0x2c2622, roughness: 0.88, metalness: 0 });
const matSand = new THREE.MeshStandardMaterial({ color: 0xcbb79a, roughness: 0.7, metalness: 0.04 });

const world = new THREE.Group();
scene.add(world);
const HALL_LEN = 78, HALL_W = 12, HALL_H = 5.4;

const floor = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, 0.1, HALL_LEN), new THREE.MeshStandardMaterial({
  map: floorMap, roughness: 0.12, metalness: 0.12, color: 0xe6ddd0
}));
floor.receiveShadow = true; world.add(floor);
const mirror = new Reflector(new THREE.PlaneGeometry(HALL_W - 1.6, HALL_LEN - 8), {
  clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x889999
});
mirror.rotation.x = -Math.PI / 2; mirror.position.y = 0.062;
world.add(mirror);
const ceiling = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, 0.12, HALL_LEN), matWall);
ceiling.position.y = HALL_H; world.add(ceiling);
[-1, 1].forEach((s) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, HALL_H, HALL_LEN), matWall);
  m.position.set(s * HALL_W / 2, HALL_H / 2, 0); m.receiveShadow = true; world.add(m);
});
[-HALL_LEN / 2, HALL_LEN / 2].forEach((z) => {
  const w = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, HALL_H, 0.3), matWall);
  w.position.set(0, HALL_H / 2, z); world.add(w);
});
for (let z = -HALL_LEN / 2 + 5; z < HALL_LEN / 2 - 2; z += 6.5) {
  [-1, 1].forEach((s) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, HALL_H, 20), matCream);
    col.position.set(s * (HALL_W / 2 - 0.72), HALL_H / 2, z); col.castShadow = true; world.add(col);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 28), matGold);
    ring.rotation.x = Math.PI / 2; ring.position.set(s * (HALL_W / 2 - 0.72), 0.85, z); world.add(ring);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.07, 0.66), matGold);
    cap.position.set(s * (HALL_W / 2 - 0.72), HALL_H - 0.07, z); world.add(cap);
  });
}
for (let z = -HALL_LEN / 2 + 4; z < HALL_LEN / 2; z += 5.2) {
  const coffer = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.07, 3.4), matBlack);
  coffer.position.set(0, HALL_H - 0.1, z); world.add(coffer);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xffe4ae }));
  disc.rotation.x = Math.PI / 2; disc.position.set(0, HALL_H - 0.16, z); world.add(disc);
  const light = new THREE.SpotLight(0xffe1b5, 7.2, 15, Math.PI / 5.2, 0.5, 1.15);
  light.position.set(0, HALL_H - 0.28, z);
  light.target.position.set(0, 0, z);
  light.castShadow = Math.abs(z) < 18;
  scene.add(light); scene.add(light.target);
}
scene.add(new THREE.AmbientLight(0x2b241c, 0.5));
scene.add(new THREE.HemisphereLight(0xfff0d4, 0x16110c, 0.4));
const key = new THREE.DirectionalLight(0xffe6c4, 0.95);
key.position.set(7, 13, 9); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);

function windowBay(x, z) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.3, 0.08), matGold);
  frame.position.set(x, 2.2, z); frame.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; world.add(frame);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.1), new THREE.MeshBasicMaterial({ color: 0xc5d3e4 }));
  pane.position.copy(frame.position); pane.position.x += x > 0 ? -0.06 : 0.06; pane.rotation.y = frame.rotation.y; world.add(pane);
  const glow = new THREE.PointLight(0xb7c8e0, 2.6, 7.5, 2);
  glow.position.set(x * 0.72, 2.2, z); scene.add(glow);
}
for (let z = -26; z <= 26; z += 13) { windowBay(-HALL_W / 2 + 0.17, z); windowBay(HALL_W / 2 - 0.17, z + 6.5); }

function sofa(x, z, rot = 0, mat = matVelvet) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.4, 1.02), mat);
  base.position.y = 0.38; base.castShadow = true; g.add(base);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.68, 0.2), mat);
  back.position.set(0, 0.74, -0.4); g.add(back);
  g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
}
function table(x, z, r = 0.68) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.045, 36), matGold);
  top.position.set(x, 0.42, z); top.castShadow = true; world.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.4, 12), matBlack);
  leg.position.set(x, 0.2, z); world.add(leg);
}
function chair(x, z, rot = 0) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.48), matCream); seat.position.y = 0.44; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.05), matCream); back.position.set(0, 0.72, -0.21); g.add(back);
  g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
}
function rug(x, z, w = 3.3, d = 2.1, color = 0x4a3a28) {
  const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  r.position.set(x, 0.075, z); world.add(r);
}
rug(0, 20, 4.3, 3); sofa(-1.05, 20.5); sofa(1.05, 19.3, Math.PI); table(0, 19.9);
rug(0, 3.2, 3.5, 2.3); sofa(0, 3.8); table(0, 2.8, 0.55);
rug(0, -12, 4, 2.5, 0x3a2e24); sofa(-1.35, -12, Math.PI / 2); sofa(1.35, -12, -Math.PI / 2); table(0, -12);
{
  const t = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 3.5), matGold);
  t.position.set(0, 0.76, -30); world.add(t);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.7, 2.1), matBlack);
  base.position.set(0, 0.38, -30); world.add(base);
  for (let i = -1; i <= 1; i++) { chair(-0.82, -30 + i * 1.05, Math.PI / 2); chair(0.82, -30 + i * 1.05, -Math.PI / 2); }
}

const loaderTex = new THREE.TextureLoader();
function official(path) {
  const src = "www.studioborges.com/wp-content/uploads/" + path;
  return "https://images.weserv.nl/?url=" + encodeURIComponent(src) + "&w=1400&output=jpg";
}
function loadPhoto(localPath, remotePath) {
  const url = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? localPath : official(remotePath);
  const t = loaderTex.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const photos = {
  pigozzi: loadPhoto("./img/web/madrid-rincon.jpg", "2024/07/Project-Rincon-Madrid-04.jpg"),
  pigozzi2: loadPhoto("./img/web/dining.jpg", "2024/07/Dining-room.jpg"),
  golden: loadPhoto("./img/web/pool.jpg", "2024/10/Pool-area-overhead-view-unsmushed.jpg"),
  golden2: loadPhoto("./img/web/veranda.jpg", "2024/10/Veranda-unsmushed.jpg"),
  ac: loadPhoto("./img/web/living.jpg", "2024/07/Living-room.jpg"),
  ac2: loadPhoto("./img/web/openspace.jpg", "2024/07/Open-space.jpg"),
  terraza: loadPhoto("./img/web/terraza1.jpg", "2024/07/Project-Terraza-Milano-01.jpg"),
  salone: loadPhoto("./img/web/terraza2.jpg", "2024/07/Project-Terraza-Milano-02.jpg"),
  atelier: loadPhoto("./img/web/hall.jpg", "2024/07/Hall.jpg"),
  living2: loadPhoto("./img/web/living2.jpg", "2024/07/Living-room-02-1.jpg"),
  stairs: loadPhoto("./img/web/stairs.jpg", "2024/10/Staircase.jpg"),
  closet: loadPhoto("./img/web/closet.jpg", "2024/07/Closet-01-unsmushed.jpg")
};
