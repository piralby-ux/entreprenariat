// Cue sheet for « Les suspects », same method as block 1: each cue names the picture's instant and
// the clip starts so its measured peak lands one frame (1/60 s) after it. During each fiche's
// interview window (1.2–4.2 s of the fiche) every cue is −12 dB (× 0.25) and none is a dry impact.
// usage: node cues.mjs → splices the <audio> tags into index.html and solo-N.html, writes SFX.md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const F = 1 / 60, END = 30;
const SFX = {
  // file: duration, peak (or the instant to align: onset for beds, end for the whistle), dry impact?
  "whoosh.mp3": { dur: 0.575, peak: 0.162 },
  "whoosh-short.mp3": { dur: 0.575, peak: 0.162 },
  "impact-bass-1.mp3": { dur: 2.116, peak: 0.073, hit: true },
  "reel-slow.wav": { dur: 1.156, peak: 0.023 },
  "click.mp3": { dur: 0.366, peak: 0.072, hit: true },
  "click-soft.mp3": { dur: 0.366, peak: 0.072 },
  "pop.mp3": { dur: 0.72, peak: 0.119 },
  "pop-hi.wav": { dur: 0.765, peak: 0.106 },
  "pop-lo.wav": { dur: 0.768, peak: 0.126 },
  "fs-radar.wav": { dur: 1.26, peak: 0.139 },
  "fs-pageflip.wav": { dur: 0.58, peak: 0.147 },
  "footstep-gravel.mp3": { dur: 0.575, peak: 0.113 },
  "fs-receipt.wav": { dur: 1.25, peak: 0.066 },
  "fs-bag.wav": { dur: 1.8, peak: 0.214 },
  "fs-clock.wav": { dur: 2.2, peak: 0.086 },
  "sparkle.mp3": { dur: 1.8, peak: 0.025 },
  "fs-whistle-short.wav": { dur: 0.45, peak: 0.44 },
  "fs-stamp.wav": { dur: 1.1, peak: 0.065, hit: true },
  "fs-crack.wav": { dur: 0.92, peak: 0.086, hit: true },
};
const S = [2.5, 7.0, 11.5, 16.0, 20.5];
const cues = [];
const cue = (id, file, at, vol, what, opts = {}) => cues.push({ id, file, at, vol, what, ...opts });

// title
cue("t-in", "impact-bass-1.mp3", 0.0, 0.22, "titre : présence à l'image 0", { dur: 1.2 });
cue("t-sub", "whoosh-short.mp3", 0.2, 0.18, "titre : sous-titre");
cue("t-scan", "fs-radar.wav", 0.3, 0.45, "titre : ligne de scan");
[0, 1, 2, 3, 4].forEach((i) => cue(`t-cell-${i + 1}`, ["pop-hi.wav", "pop.mp3", "pop-lo.wav"][i % 3], 0.6 + 0.08 * i, 0.2, `titre : case ${i + 1}`));
cue("t-out", "whoosh.mp3", 2.6, 0.22, "titre : sortie en profondeur");

// the five fiches: same skeleton, own gag
const gags = [
  (n, s) => {
    cue(`${n}-radar`, "fs-radar.wav", s + 1.5, 0.9, "gag : balayage radar");
    // windows close in pairs (top and bottom of a column together): one click per pair
    [60, 148, 502, 590].forEach((x, i) => cue(`${n}-eyes-${i + 1}`, "click-soft.mp3", s + 1.5 + (1.6 * (x + 100)) / 780 + 0.15, 1.0, `gag : 2 yeux se ferment (colonne ${i + 1})`));
  },
  (n, s) => {
    cue(`${n}-grow`, "whoosh.mp3", s + 2.1, 0.7, "gag : la règle et la crotte s'allongent");
    cue(`${n}-real`, "pop-hi.wav", s + 2.3, 0.8, "gag : « dimension réelle »");
  },
  (n, s) => {
    for (let k = 0; k < 6; k++) cue(`${n}-page-${k + 1}`, "fs-pageflip.wav", s + 1.6 + 0.25 * k, 1.0, `gag : page ${k + 1}`);
    [2.6, 2.93, 3.27, 3.6].forEach((t, i) => cue(`${n}-step-${i + 1}`, "footstep-gravel.mp3", s + t, 0.7, `gag : pas du piéton ${i + 1}`));
  },
  (n, s) => {
    cue(`${n}-print-1`, "fs-receipt.wav", s + 1.3, 1.0, "gag : le ticket se déroule");
    cue(`${n}-paid`, "pop-lo.wav", s + 1.9, 0.9, "gag : « PAYÉ » (pop, pas de choc)");
    cue(`${n}-print-2`, "fs-receipt.wav", s + 2.1, 1.0, "gag : « non inclus »");
  },
  (n, s) => {
    cue(`${n}-bag`, "fs-bag.wav", s + 1.4, 1.0, "gag : le sac attend");
    cue(`${n}-clock`, "fs-clock.wav", s + 1.6, 1.4, "gag : l'horloge fait trois tours", { end: s + 3.45 });
    cue(`${n}-stop`, "click-soft.mp3", s + 3.4, 0.9, "gag : l'aiguille s'arrête");
    cue(`${n}-tag`, "pop.mp3", s + 3.45, 0.9, "gag : étiquette « demain »");
  },
];
S.forEach((s, i) => {
  const n = `f${i + 1}`;
  cue(`${n}-whoosh`, "whoosh.mp3", s + 0.25, 0.32, "arrivée de la dalle : whoosh");
  cue(`${n}-land`, "impact-bass-1.mp3", s + 0.45, 0.3, "arrivée de la dalle : pose sourde", { dur: 0.7 });
  cue(`${n}-reel`, "reel-slow.wav", s + 0.47, 1.0, "rouleau du nom : cliquetis qui ralentit", { end: s + 1.1 });
  cue(`${n}-clac`, "click.mp3", s + 1.1, 0.9, "rouleau du nom : « clac » d'arrêt");
  cue(`${n}-win`, "whoosh-short.mp3", s + 1.25, 0.5, "ouverture de la fenêtre");
  gags[i](n, s);
  cue(`${n}-out`, "whoosh.mp3", s + 4.5, 0.3, "départ de la fiche");
});

// final
cue("fin-fan", "whoosh.mp3", 25.5, 0.32, "final : éventail");
cue("fin-line", "whoosh-short.mp3", 26.3, 0.3, "final : mise en ligne, la caméra recule");
for (let i = 0; i < 5; i++) {
  const t = 27.0 + 0.15 * i;
  cue(`fin-st${i + 1}-whistle`, "fs-whistle-short.wav", t, 1.4, `tampon ${i + 1} : sifflement court`);
  cue(`fin-st${i + 1}-thud`, "fs-stamp.wav", t, 0.85, `tampon ${i + 1} : choc sourd`);
  cue(`fin-st${i + 1}-crack`, "fs-crack.wav", t, 0.4, `tampon ${i + 1} : craquement`);
}

// placement: one frame after the picture; −12 dB inside the interview windows, no dry hit there
const inWindow = (t) => S.some((s) => t >= s + 1.2 && t < s + 4.2);
const placed = cues.map((c) => {
  const s = SFX[c.file];
  const start = +Math.max(0, c.at + F - s.peak).toFixed(3);
  const dur = +Math.min(c.end ? c.end - start : c.dur ?? s.dur, s.dur, END - start).toFixed(3);
  const quiet = inWindow(c.at);
  if (quiet && s.hit) throw new Error(`${c.id}: dry impact inside an interview window`);
  return { ...c, start, dur, vol: +(c.vol * (quiet ? 0.25 : 1)).toFixed(3), quiet };
}).sort((a, b) => a.start - b.start);

const tags = (list, offset = 0) => {
  const laneEnds = [];
  return list.map((c) => {
    const st = +(c.start - offset).toFixed(3);
    let lane = laneEnds.findIndex((e) => e <= st + 1e-6);
    if (lane < 0) { lane = laneEnds.length; laneEnds.push(0); }
    laneEnds[lane] = st + c.dur;
    return `      <audio id="sfx-${c.id}" src="assets/sfx/${c.file}" data-start="${st}" data-duration="${c.dur}" data-volume="${c.vol}" data-track-index="${10 + lane}"></audio>`;
  }).join("\n");
};
const OPEN = "      <!-- sound: generated by cues.mjs, see SFX.md -->";
const splice = (file, body) => {
  const t = readFileSync(file, "utf8");
  const a = t.indexOf(OPEN), b = t.indexOf("\n    </div>\n    <script>", a);
  if (a < 0 || b < 0) throw new Error(`no audio block in ${file}`);
  writeFileSync(file, t.slice(0, a + OPEN.length) + "\n" + body + t.slice(b));
};
splice("index.html", tags(placed));
S.forEach((s, i) => {
  const f = `solo/solo-${i + 1}.html`;
  if (existsSync(f)) splice(f, tags(placed.filter((c) => c.id.startsWith(`f${i + 1}-`)), s));
});

// SFX.md
const fmt = (x) => x.toFixed(2).replace(".", ",");
let md = "# SFX — Les suspects\n\nGénéré par `node cues.mjs` (ne pas éditer à la main). Temps en secondes, film entier.\n" +
  "« À l'image » = instant de l'événement ; le son culmine 1 image après. Volume : 1 = 0 dB.\n" +
  "Fenêtre d'interview (1,2–4,2 s de chaque fiche) : volume × 0,25 (−12 dB), aucun impact sec.\n\n" +
  "| à l'image | début clip | durée | son | volume | quoi |\n|---|---|---|---|---|---|\n";
for (const c of [...placed].sort((a, b) => a.at - b.at)) md += `| ${fmt(c.at)} | ${fmt(c.start)} | ${fmt(c.dur)} | ${c.file} | ${c.vol}${c.quiet ? " (−12 dB)" : ""} | ${c.what} |\n`;
md += "\nMastering après rendu (identique au bloc 1) : `volume=4.5dB,alimiter=limit=0.8:attack=2:release=60:level=disabled`, AAC 256 k ; piste seule exportée en WAV 48 kHz 24 bits.\n";
writeFileSync("SFX.md", md);
console.log(`${placed.length} cues, ${placed.filter((c) => c.quiet).length} at −12 dB`);
