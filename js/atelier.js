const [a, b] = await Promise.all([
  fetch(new URL("./atelier.p1.js", import.meta.url)).then((r) => r.text()),
  fetch(new URL("./atelier.p2.js", import.meta.url)).then((r) => r.text())
]);
const s = document.createElement("script");
s.type = "module";
s.textContent = a + "\n" + b;
document.body.appendChild(s);
