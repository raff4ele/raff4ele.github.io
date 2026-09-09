const [a, b] = await Promise.all([
  fetch(new URL("./atelier.p1.js", import.meta.url)).then((r) => r.text()),
  fetch(new URL("./atelier.p2.js", import.meta.url)).then((r) => r.text())
]);
const url = URL.createObjectURL(new Blob([a, b], { type: "text/javascript" }));
await import(url);
