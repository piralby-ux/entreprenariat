// Vectorise les traits (potrace) -> JSON de sous-chemins SVG, utilisés comme masques de révélation.
// node scripts/trace.mjs
import potrace from 'potrace';
import fs from 'fs';
const jobs = [
  ['prep/flashA_bw.png', 'assets/data/flashA_paths.json'],
  ['prep/flashC_bw.png', 'assets/data/flashC_paths.json'],
  ['prep/peau1_bw.png', 'assets/data/peau1_paths.json'],
];
fs.mkdirSync('assets/data', { recursive: true });
for (const [src, dst] of jobs) {
  const svg = await new Promise((res, rej) =>
    potrace.trace(src, { threshold: 128, turdSize: 6, optTolerance: 0.4, turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY },
      (e, s) => (e ? rej(e) : res(s))));
  const d = svg.match(/ d="([^"]+)"/)[1];
  const w = +svg.match(/width="(\d+)"/)[1], h = +svg.match(/height="(\d+)"/)[1];
  const subs = d.split(/(?=M)/).map(s => s.trim()).filter(Boolean);
  fs.writeFileSync(dst, JSON.stringify({ width: w, height: h, paths: subs }));
  console.log(dst, w, h, subs.length, 'sous-chemins');
}

// ---- Pré-calcul hors navigateur : chaque sous-chemin -> polyligne régulière (pas de 3 px),
// redémarrée à son extrémité (point le plus éloigné du centroïde). Le navigateur n'a plus rien à mesurer.
function flatten(d) {
  const tok = d.replace(/,/g, ' ').trim().split(/\s+/);
  const pts = []; let i = 0, cx = 0, cy = 0, cmd = '';
  while (i < tok.length) {
    if (/[MCLZ]/i.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M') { cx = +tok[i++]; cy = +tok[i++]; pts.push([cx, cy]); cmd = 'L'; }
    else if (cmd === 'L') { cx = +tok[i++]; cy = +tok[i++]; pts.push([cx, cy]); }
    else if (cmd === 'C') {
      const x1 = +tok[i++], y1 = +tok[i++], x2 = +tok[i++], y2 = +tok[i++], x = +tok[i++], y = +tok[i++];
      for (let k = 1; k <= 16; k++) {
        const t = k / 16, u = 1 - t;
        pts.push([u*u*u*cx + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x, u*u*u*cy + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y]);
      }
      cx = x; cy = y;
    } else if (/z/i.test(cmd)) { i++; }
    else i++;
  }
  return pts;
}
function resample(pts, step = 3) {
  const out = [pts[0]]; let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay); let pos = step - carry;
    while (pos <= seg) { const t = pos / seg; out.push([ax + (bx - ax) * t, ay + (by - ay) * t]); pos += step; }
    carry = seg - (pos - step);
  }
  return out;
}
for (const [, dst] of jobs) {
  const data = JSON.parse(fs.readFileSync(dst, 'utf8'));
  const polys = [];
  for (const d of data.paths) {
    let p = flatten(d); if (p.length < 2) continue;
    p.push(p[0]);
    p = resample(p, 3); if (p.length < 4) continue;
    let cx = 0, cy = 0; for (const q of p) { cx += q[0]; cy += q[1]; } cx /= p.length; cy /= p.length;
    let best = 0, bd = -1; p.forEach((q, i) => { const dd = (q[0]-cx)**2 + (q[1]-cy)**2; if (dd > bd) { bd = dd; best = i; } });
    const rot = p.slice(best).concat(p.slice(0, best)); rot.push(rot[0]);
    let L = 0; for (let i = 1; i < rot.length; i++) L += Math.hypot(rot[i][0]-rot[i-1][0], rot[i][1]-rot[i-1][1]);
    if (L < 6) continue;
    polys.push({ L: +L.toFixed(1), c: [+cx.toFixed(1), +cy.toFixed(1)], p: rot.flat().map(v => Math.round(v * 2) / 2) });
  }
  data.polys = polys; delete data.paths;
  const name = dst.split('/').pop().replace('_paths.json', '');
  fs.writeFileSync(`assets/data/${name}.js`, `window.JINKX=window.JINKX||{};window.JINKX['${name}']=${JSON.stringify(data)};`);
  console.log(name, polys.length, 'polylignes');
}
