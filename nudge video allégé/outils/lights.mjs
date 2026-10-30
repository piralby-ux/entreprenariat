// 20 out-of-focus city lights, seeded (mulberry32 0x5005), printed as HTML to paste.
function m(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r = m(0x5005);
const C = ["#ffb866", "#ffd23f", "#ff5d8f", "#3a86ff", "#fff3e6"];
let o = "";
for (let i = 0; i < 20; i++) {
  const d = Math.round(12 + 66 * r() * r() + r() * 8), x = Math.round(40 + r() * 1840), y = Math.round(470 + r() * 560);
  const op = (0.14 + 0.31 * r()).toFixed(2), c = C[Math.floor(r() * 5)];
  o += `<i style="left:${x}px;top:${y}px;width:${d}px;height:${d}px;background:${c};opacity:${op}"></i>\n`;
}
console.log(o);
