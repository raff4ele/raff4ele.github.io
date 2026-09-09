const clickables = [];
function framedPhoto(tex, x, y, z, rotY, w, h, userData) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.07), matGold));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42 }));
  art.position.z = 0.042; art.userData = userData; g.add(art);
  g.position.set(x, y, z); g.rotation.y = rotY; world.add(g); clickables.push(art);
}
framedPhoto(photos.pigozzi, -HALL_W / 2 + 0.4, 2.2, 22, Math.PI / 2, 1.9, 2.5, { room: "pigozzi", key: "pigozzi" });
framedPhoto(photos.golden, HALL_W / 2 - 0.4, 2.2, 10, -Math.PI / 2, 1.9, 2.5, { room: "golden", key: "golden" });
framedPhoto(photos.ac, -HALL_W / 2 + 0.4, 2.2, -2, Math.PI / 2, 1.9, 2.5, { room: "ac", key: "ac" });
framedPhoto(photos.terraza, HALL_W / 2 - 0.4, 2.2, -16, -Math.PI / 2, 1.9, 2.5, { room: "terraza", key: "terraza" });
framedPhoto(photos.salone, -HALL_W / 2 + 0.4, 2.2, -26, Math.PI / 2, 1.7, 2.2, { key: "voci" });
framedPhoto(photos.atelier, HALL_W / 2 - 0.4, 2.2, 28, -Math.PI / 2, 1.7, 2.2, { key: "metodo" });
framedPhoto(photos.living2, -HALL_W / 2 + 0.4, 2.2, 6, Math.PI / 2, 1.6, 2.1, { room: "ac", key: "ac" });
framedPhoto(photos.stairs, HALL_W / 2 - 0.4, 2.2, -8, -Math.PI / 2, 1.6, 2.1, { room: "golden", key: "golden" });
framedPhoto(photos.closet, -HALL_W / 2 + 0.4, 2.2, 16, Math.PI / 2, 1.5, 2.0, { room: "pigozzi", key: "pigozzi" });

function sculpture(x, z, kind) {
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), matBlack);
  ped.position.set(x, 0.4, z); world.add(ped);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, 0.72), matGold);
  trim.position.set(x, 0.75, z); world.add(trim);
  const form = new THREE.Mesh(kind === 1 ? new THREE.DodecahedronGeometry(0.3) : new THREE.TorusKnotGeometry(0.2, 0.055, 80, 12), kind === 1 ? matCream : matGold);
  form.position.set(x, 1.22, z); form.userData.spin = 0.18 + Math.random() * 0.2; world.add(form); return form;
}
const sculptures = [sculpture(-2.7, 14, 0), sculpture(2.7, 14, 1), sculpture(-2.7, -7, 0), sculpture(2.7, -7, 1), sculpture(0, -34, 1)];

const ROOMS = {
  pigozzi: { origin: new THREE.Vector3(-22, 0, 22), fog: 0x1a1612, light: 0xffe0b8, photo: "pigozzi", photo2: "pigozzi2" },
  golden: { origin: new THREE.Vector3(22, 0, 10), fog: 0x101820, light: 0xcfe4ff, photo: "golden", photo2: "golden2" },
  ac: { origin: new THREE.Vector3(-22, 0, -2), fog: 0x120e0c, light: 0xffd9a8, photo: "ac", photo2: "ac2" },
  terraza: { origin: new THREE.Vector3(22, 0, -16), fog: 0x0c1018, light: 0xb7c8e6, photo: "terraza", photo2: "salone" }
};
function buildRoom(id, spec) {
  const g = new THREE.Group(); g.position.copy(spec.origin);
  const W = 10, D = 12, H = 4.4;
  const floorR = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), new THREE.MeshStandardMaterial({ color: id === "golden" ? 0xd8cfc0 : 0xcfc3b3, roughness: 0.28, metalness: 0.08 }));
  floorR.receiveShadow = true; g.add(floorR);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), matWall); ceil.position.y = H; g.add(ceil);
  [[0, H / 2, -D / 2, W, H, 0.2], [0, H / 2, D / 2, W, H, 0.2], [-W / 2, H / 2, 0, 0.2, H, D], [W / 2, H / 2, 0, 0.2, H, D]].forEach((a) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a[3], a[4], a[5]), matWall); m.position.set(a[0], a[1], a[2]); g.add(m);
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.6), new THREE.MeshStandardMaterial({ map: photos[spec.photo], roughness: 0.4 }));
  back.position.set(0, 2.05, -D / 2 + 0.14); g.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshStandardMaterial({ map: photos[spec.photo2], roughness: 0.45 }));
  side.position.set(-W / 2 + 0.14, 1.9, 0.6); side.rotation.y = Math.PI / 2; g.add(side);
  const sl = new THREE.SpotLight(spec.light, 14, 16, Math.PI / 4.5, 0.45, 1);
  sl.position.set(0, H - 0.3, 1); sl.target.position.set(0, 0, -2); g.add(sl); g.add(sl.target);
  const fill = new THREE.PointLight(spec.light, 4.5, 10, 1.6); fill.position.set(1.6, 2.2, 2); g.add(fill);
  const sofaG = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 1.05), id === "ac" ? matVelvet : matSand);
  base.position.y = 0.4; sofaG.add(base);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.22), id === "ac" ? matVelvet : matSand);
  bk.position.set(0, 0.76, -0.4); sofaG.add(bk);
  sofaG.position.set(0, 0, 1.4); g.add(sofaG);
  const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 32), matGold);
  tp.position.set(0, 0.42, 2.4); g.add(tp);
  world.add(g);
  spec.cam = spec.origin.clone().add(new THREE.Vector3(0, 1.58, 4.2));
  spec.look = spec.origin.clone().add(new THREE.Vector3(0, 1.5, -3));
}
Object.entries(ROOMS).forEach(([id, spec]) => buildRoom(id, spec));

const dustGeo = new THREE.BufferGeometry();
const dustCount = 420;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * HALL_W * 0.75;
  dustPos[i * 3 + 1] = Math.random() * HALL_H;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * HALL_LEN;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xe8d5a3, size: 0.014, transparent: true, opacity: 0.32 })));

{
  const c = document.createElement("canvas"); c.width = 1024; c.height = 220;
  const g = c.getContext("2d"); g.fillStyle = "#c9a86c"; g.font = "150px Georgia"; g.textAlign = "center"; g.fillText("STUDIO BORGES", 512, 155);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.42), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  mesh.position.set(0, 3.55, 36.6); mesh.rotation.y = Math.PI; world.add(mesh);
}

function pathAt(t) {
  const z = THREE.MathUtils.lerp(34, -36, t);
  return { pos: new THREE.Vector3(Math.sin(t * Math.PI * 2) * 0.4, 1.6 + Math.sin(t * Math.PI) * 0.07, z), look: new THREE.Vector3(Math.sin(t * Math.PI * 2.1) * 0.25, 1.42, z - 6) };
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.34, 0.68, 0.84));
composer.addPass(new OutputPass());

let dragging = false, lastX = 0, lastY = 0, orbitYaw = 0, orbitPitch = 0;
const raycaster = new THREE.Raycaster();
const mouseN = new THREE.Vector2();

addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
  mouseN.set(pointer.x, -pointer.y);
  cursor.style.left = e.clientX + "px"; cursor.style.top = e.clientY + "px";
  cursorLabel.style.left = e.clientX + "px"; cursorLabel.style.top = e.clientY + "px";
  if (dragging) {
    orbitYaw += (e.clientX - lastX) * 0.004;
    orbitPitch = THREE.MathUtils.clamp(orbitPitch + (e.clientY - lastY) * 0.003, -0.38, 0.38);
    lastX = e.clientX; lastY = e.clientY;
  }
});
addEventListener("pointerdown", (e) => {
  if (e.target.closest("header, .overlay, .btn, button, a, form, .dock, #roomExit")) return;
  dragging = true; lastX = e.clientX; lastY = e.clientY; ambient.start();
});
addEventListener("pointerup", () => { dragging = false; });
addEventListener("click", (e) => {
  if (e.target.closest("header, .overlay, .btn, button, a, form, .dock, #roomExit")) return;
  raycaster.setFromCamera(mouseN, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits[0]?.object.userData.room) enterRoom(hits[0].object.userData.room);
});
addEventListener("wheel", (e) => {
  if (document.querySelector(".overlay.open") || mode === "room") return;
  targetProgress = THREE.MathUtils.clamp(targetProgress + e.deltaY * 0.00052, 0, 1);
}, { passive: true });
let touchY = null;
addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; ambient.start(); }, { passive: true });
addEventListener("touchmove", (e) => {
  if (touchY == null || mode === "room") return;
  targetProgress = THREE.MathUtils.clamp(targetProgress + (touchY - e.touches[0].clientY) * 0.0013, 0, 1);
  touchY = e.touches[0].clientY;
}, { passive: true });

document.querySelectorAll("[data-go]").forEach((el) => {
  el.addEventListener("click", (e) => { e.preventDefault(); leaveRoom(); targetProgress = CHAPTERS[Number(el.getAttribute("data-go"))]?.t ?? 0; });
});
document.getElementById("goHome").addEventListener("click", (e) => { e.preventDefault(); leaveRoom(); targetProgress = 0; });
document.querySelectorAll("[data-open]").forEach((el) => el.addEventListener("click", () => document.getElementById(el.getAttribute("data-open"))?.classList.add("open")));
document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => el.closest(".overlay")?.classList.remove("open")));
document.querySelectorAll(".overlay").forEach((ov) => ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); }));
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { applyLang(b.getAttribute("data-lang")); refreshDetail(); }));
document.getElementById("roomExit").addEventListener("click", leaveRoom);
modeBtn.addEventListener("click", () => {
  walking = !walking;
  const t = I18N[window.SB_LANG];
  modeBtn.textContent = walking ? t.modeWalk : t.modeAtelier;
  orbitYaw = 0; orbitPitch = 0;
});
soundBtn.addEventListener("click", () => {
  ambient.start(); ambient.set(!soundOn);
  const t = I18N[window.SB_LANG];
  soundBtn.textContent = soundOn ? t.soundOn : t.soundOff;
});
const keys = {};
addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; if (e.key === "Escape") leaveRoom(); });
addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

function tRoom(key) { return I18N[window.SB_LANG].rooms[key]; }
function refreshDetail() {
  if (mode === "room" && activeRoom) {
    const r = tRoom(activeRoom);
    document.getElementById("dMeta").textContent = r.meta;
    document.getElementById("dTitle").textContent = r.title;
    document.getElementById("dBody").textContent = r.body;
    document.getElementById("dActions").innerHTML = "";
    detail.classList.add("show");
  }
}
function enterRoom(id) {
  if (!ROOMS[id]) return;
  mode = "room"; activeRoom = id; document.body.classList.add("in-room");
  scene.fog.color.set(ROOMS[id].fog); scene.background.set(ROOMS[id].fog);
  refreshDetail(); ambient.start();
}
function leaveRoom() {
  mode = "gallery"; activeRoom = null; document.body.classList.remove("in-room");
  scene.fog.color.set(0x060606); scene.background.set(0x060606);
  orbitYaw = 0; orbitPitch = 0;
}

function updateHud() {
  pbar.style.width = (progress * 100).toFixed(2) + "%";
  heroCopy.classList.toggle("show", progress < 0.075 && mode === "gallery");
  document.getElementById("scrollHint").style.opacity = progress < 0.05 && mode === "gallery" ? "1" : "0";
  const dict = I18N[window.SB_LANG];
  let chI = 0; CHAPTERS.forEach((c, i) => { if (progress >= c.t - 0.02) chI = i; });
  if (mode === "room") { chapterEl.textContent = tRoom(activeRoom).title; chapterEl.classList.add("show"); }
  else if (dict.chapters[chI]) { chapterEl.textContent = dict.chapters[chI]; chapterEl.classList.add("show"); }
  else chapterEl.classList.remove("show");
  if (mode === "gallery") {
    let hot = null, best = 0.065;
    for (const h of GALLERY_HOTSPOTS) { const d = Math.abs(progress - h.t); if (d < best) { best = d; hot = h; } }
    if (hot && progress > 0.1) {
      const r = tRoom(hot.key);
      document.getElementById("dMeta").textContent = r.meta;
      document.getElementById("dTitle").textContent = r.title;
      document.getElementById("dBody").textContent = r.body;
      const actions = document.getElementById("dActions"); actions.innerHTML = "";
      if (hot.room) {
        const b = document.createElement("button"); b.className = "btn solid";
        b.textContent = r.enter || dict.enter; b.onclick = () => enterRoom(hot.room); actions.appendChild(b);
      }
      detail.classList.add("show");
    } else detail.classList.remove("show");
  }
  raycaster.setFromCamera(mouseN, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  const hover = hits[0]?.object;
  const isHot = !!(hover && hover.userData.room);
  cursor.classList.toggle("hot", isHot);
  if (isHot) { cursorLabel.textContent = tRoom(hover.userData.room).enter; cursorLabel.style.opacity = "1"; }
  else cursorLabel.style.opacity = "0";
}

const camPos = new THREE.Vector3(), lookPos = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  if (walking && mode === "gallery") {
    if (keys.w || keys.arrowup) targetProgress = Math.min(1, targetProgress + dt * 0.11);
    if (keys.s || keys.arrowdown) targetProgress = Math.max(0, targetProgress - dt * 0.11);
    if (keys.a || keys.arrowleft) orbitYaw += dt * 0.85;
    if (keys.d || keys.arrowright) orbitYaw -= dt * 0.85;
  }
  if (mode === "room") {
    if (keys.a || keys.arrowleft) orbitYaw += dt * 0.7;
    if (keys.d || keys.arrowright) orbitYaw -= dt * 0.7;
  }
  progress += (targetProgress - progress) * 0.048;
  if (mode === "room" && activeRoom) {
    const spec = ROOMS[activeRoom];
    const swayX = pointer.x * 0.35 + orbitYaw, swayY = -pointer.y * 0.18 - orbitPitch;
    camera.position.set(spec.cam.x + swayX * 1.1, spec.cam.y + swayY * 0.4, spec.cam.z);
    camera.lookAt(spec.look.x + swayX * 0.8, spec.look.y + swayY, spec.look.z);
  } else {
    const p = pathAt(progress); camPos.copy(p.pos); lookPos.copy(p.look);
    const swayX = pointer.x * 0.2 + orbitYaw, swayY = -pointer.y * 0.12 - orbitPitch;
    camera.position.set(camPos.x + swayX * 0.75, camPos.y + swayY * 0.32, camPos.z);
    camera.lookAt(lookPos.x + swayX * 1.3, lookPos.y + swayY, lookPos.z);
  }
  sculptures.forEach((s, i) => { s.rotation.y += dt * s.userData.spin; s.position.y = 1.22 + Math.sin(clock.elapsedTime * 0.75 + i) * 0.035; });
  updateHud(); composer.render();
}
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
let n = 0;
const boot = setInterval(() => {
  n += 6 + Math.random() * 11; setLoad(n);
  if (n >= 100) { clearInterval(boot); setLoad(100); setTimeout(() => loaderEl.classList.add("hide"), 320); animate(); }
}, 80);
