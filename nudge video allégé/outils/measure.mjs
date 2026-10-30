// Advance width of strings in a TTF (cmap format 4 + hmtx), no kerning. usage: node measure.mjs font.ttf px "text"...
import { readFileSync } from "node:fs";
const [file, px, ...texts] = process.argv.slice(2);
const b = readFileSync(file);
const tables = {};
for (let i = 0, n = b.readUInt16BE(4); i < n; i++) {
  const o = 12 + i * 16;
  tables[b.toString("latin1", o, o + 4)] = b.readUInt32BE(o + 8);
}
const upem = b.readUInt16BE(tables.head + 18);
const nH = b.readUInt16BE(tables.hhea + 34);
const cmap = tables.cmap;
let sub = 0;
for (let i = 0, n = b.readUInt16BE(cmap + 2); i < n; i++) {
  const r = cmap + 4 + i * 8, off = cmap + b.readUInt32BE(r + 4);
  if (b.readUInt16BE(off) === 4) { sub = off; break; }
}
const segX2 = b.readUInt16BE(sub + 6), ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ros = deltas + segX2;
function glyph(c) {
  for (let i = 0; i < segX2 / 2; i++) {
    if (c > b.readUInt16BE(ends + i * 2)) continue;
    const s = b.readUInt16BE(starts + i * 2);
    if (c < s) return 0;
    const d = b.readInt16BE(deltas + i * 2), ro = b.readUInt16BE(ros + i * 2);
    if (!ro) return (c + d) & 0xffff;
    const g = b.readUInt16BE(ros + i * 2 + ro + (c - s) * 2);
    return g ? (g + d) & 0xffff : 0;
  }
  return 0;
}
const adv = (g) => b.readUInt16BE(tables.hmtx + Math.min(g, nH - 1) * 4);
for (const t of texts) console.log(`${t.padEnd(30)} ${Math.round([...t].reduce((a, ch) => a + adv(glyph(ch.codePointAt(0))), 0) / upem * px)} px`);
