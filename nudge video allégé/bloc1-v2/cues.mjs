// Cue sheet → <audio> tags. Each cue names the picture's instant; the clip starts so its measured
// peak lands one frame (1/60 s) after it. Pure arithmetic: splices the tags into index.html, writes SFX.md.
// bloc1-v2: a 4.5 s beat is inserted at INS = 14.6 s; every cue of the first cut at or after INS moves by
// DELTA (the `shift` helper), nothing before it moves. usage: node cues.mjs
import { readFileSync, writeFileSync } from "node:fs";
const F = 1 / 60, END = 23.0;
const INS = 14.6, DELTA = 4.5, T0 = 15.58, HIT = 15.48 + DELTA;
const shift = (t) => (t >= INS ? t + DELTA : t);
const SFX = {
  "bird-chirp.mp3": { dur: 1.07, peak: 0.591 },
  "footstep-gravel.mp3": { dur: 0.57, peak: 0.128 },
  "glitch-3.mp3": { dur: 3.1, peak: 0.242 }, // aligned on its onset, not its late peak
  "impact-bass-1.mp3": { dur: 2.12, peak: 0.073 },
  "pop.mp3": { dur: 0.72, peak: 0.12 },
  "pop-hi.wav": { dur: 0.77, peak: 0.108 },
  "pop-lo.wav": { dur: 0.77, peak: 0.127 },
  "riser.mp3": { dur: 10.03, peak: 3.472 },
  "whoosh-cinematic.mp3": { dur: 5.54, peak: 2.503 },
  "whoosh-short.mp3": { dur: 0.57, peak: 0.162 },
  "whoosh.mp3": { dur: 0.57, peak: 0.162 },
  "poker-reels-long.wav": { dur: 1.9, peak: 0.171 }, // a bed: its first click lands on the picture
  // the weight (Freesound, CC0): whistle ends on the hit; four layers land together
  "fs-whistle-end.wav": { dur: 1.4, peak: 1.38 },
  "fs-dino-hit.wav": { dur: 2.6, peak: 0.5 },
  "fs-metal-bang.mp3": { dur: 2.99, peak: 0.03 },
  "fs-debris.mp3": { dur: 4.67, peak: 0.15 },
  "fs-rumble.mp3": { dur: 4.0, peak: 0.02 },
  "sparkle.mp3": { dur: 1.8, peak: 0.027 },
  // bloc1-v2 (copied from suspects/assets/sfx, measured with outils/peaks.mjs)
  "fs-stamp.wav": { dur: 1.1, peak: 0.065 },
  "click.mp3": { dur: 0.366, peak: 0.072 },
  "reel-slow.wav": { dur: 1.156, peak: 0.023 }, // a bed that slows down: aligned on its onset
  // bloc1-v2, made by sfx-synth.mjs
  "sub-drop.wav": { dur: 0.9, peak: 0.004 },
  "horde-bed.wav": { dur: 3.15, peak: 0 }, // starts at T0 + 0.6 by construction
};
const cues = [];
const cue = (id, file, at, vol, what, opts = {}) => cues.push({ id, file, at, vol, what, ...opts });

// act 1 — evening, the walk
cue("sfx-bird-1", "bird-chirp.mp3", 0.55, 3.2, "oiseau du soir");
cue("sfx-bird-2", "bird-chirp.mp3", 1.75, 2.4, "oiseau du soir");
[0.22, 0.75, 1.28, 1.81, 2.34].forEach((t, i) => cue(`sfx-step-${i + 1}`, "footstep-gravel.mp3", t, i % 2 ? 0.34 : 0.42, `pas ${i + 1}`));
// the step: the foot swings down, lands on the poop at 3.0
cue("sfx-foot-swing", "whoosh-short.mp3", 2.95, 0.22, "le pied descend");
cue("sfx-step-hit", "footstep-gravel.mp3", 3.0, 0.9, "le pied dans la crotte");
cue("sfx-step-thud", "impact-bass-1.mp3", 3.0, 0.5, "impact grave du pas", { dur: 1.6 });
// the slot machine 0 → 1: pops up, the reel rattles while it spins, jackpot on the 1, « +1 »
cue("sfx-slot-in", "whoosh-short.mp3", 3.2, 0.3, "machine à sous : apparition");
cue("sfx-slot-reel", "poker-reels-long.wav", 3.12, 1.3, "machine à sous : rouleau", { dur: 0.64 });
cue("sfx-slot-stop", "impact-bass-1.mp3", 3.74, 0.3, "machine à sous : gain", { dur: 1.0 });
cue("sfx-slot-win", "sparkle.mp3", 3.76, 0.4, "machine à sous : scintillement");
cue("sfx-slot-plus", "pop-hi.wav", 3.8, 0.55, "machine à sous : « +1 »");
cue("sfx-to-hud", "whoosh-short.mp3", 4.5, 0.26, "le 1 file vers le compteur");
// the crane and the wave
cue("sfx-wave", "whoosh.mp3", 4.72, 0.3, "onde");
cue("sfx-crane", "whoosh-cinematic.mp3", 7.1, 0.28, "grue");
cue("sfx-wire", "glitch-3.mp3", 5.5, 0.28, "fil de fer");
// 14 poops in a spiral: each crosses its cell top ~0.08 s after its pop time; three takes rotate
const takes = ["pop.mp3", "pop-hi.wav", "pop-lo.wav"];
for (let i = 0; i < 14; i++) cue(`sfx-poop-${String(i + 1).padStart(2, "0")}`, takes[i % 3], 8.1 + 0.18 * i + 0.08, 0.38 + 0.012 * i, `crotte ${i + 1} de la spirale`);
// the city hatches in waves as the camera climbs: soft pop clusters, and one long swell at the
// fastest point of the rise (~13.3 s)
[12.15, 12.4, 12.65, 12.9, 13.15].forEach((t, i) => cue(`sfx-wave-pop-${i + 1}`, takes[(i + 1) % 3], t, 0.2 + 0.03 * i, `vague de crottes ${i + 1}`));
cue("sfx-rise", "whoosh-cinematic.mp3", 13.3, 0.24, "montée");
// bloc1-v2: the riser now builds into the stamp: same start as before (crest 15.48), cut 0.25 s before T0
cue("sfx-riser", "riser.mp3", 15.48, 0.3, "riser vers le tampon, coupé au micro-silence", { end: T0 - 0.25 });
// the counter's reels rattle from 13.7 s; at T0 − 0.25 they drop 6 dB (the micro-silence) and stay
// under the beat; back to full for the boil-over (14.7 + DELTA), cut 0.25 s before the weight lands
const DIP = T0 - 0.25;
cue("sfx-reels", "poker-reels-long.wav", 13.7, 1.3, "rouleaux du compteur ; −6 dB à T0 − 0,25", {
  end: 15.42,
  automation: (start) => [{ t: 0, v: 1 }, { t: +(DIP - start - 0.02).toFixed(3), v: 1 }, { t: +(DIP - start).toFixed(3), v: 0.5 }],
});
// the bed loops a 1.73 s take of the same file, each pass overlapping the last by 30 ms
[15.4, 17.1, 18.8].forEach((t, i) => cue(`sfx-reels-bed-${i + 1}`, "poker-reels-long.wav", t, 0.65, `rouleaux du compteur en fond (−6 dB), ${i + 1}/3`, { onset: true, mediaStart: 0.17, end: i === 2 ? shift(14.6) + 0.03 : undefined, fadeIn: 0.03, fadeOut: 0.03 }));
cue("sfx-reels-boil", "poker-reels-long.wav", shift(14.6), 1.3, "rouleaux : le compteur s'emballe (suite décalée)", { onset: true, mediaStart: 1.054, end: HIT - 0.25, fadeIn: 0.03, fadeOut: 0.03 });
// the weight: a falling whistle that ends on the hit, then body thud + iron clang + debris,
// and a sub rumble that carries the card to the last frame (no gap)
cue("sfx-weight-whistle", "fs-whistle-end.wav", shift(15.48), 2.2, "poids : sifflement de chute");
cue("sfx-weight-thud", "fs-dino-hit.wav", shift(15.48), 1.8, "poids : choc sourd", { end: END });
cue("sfx-weight-clang", "fs-metal-bang.mp3", shift(15.48), 1.3, "poids : fracas métallique");
cue("sfx-weight-debris", "fs-debris.mp3", shift(15.5), 1.3, "poids : débris");
cue("sfx-weight-rumble", "fs-rumble.mp3", shift(15.48), 0.85, "poids : grondement sub-grave", { end: END });

// ---- bloc1-v2: the inserted beat
// the stamp, T0: very short whoosh in, ink-pad thud, dry clack, sub
cue("sfx-stamp-whoosh", "whoosh-short.mp3", T0 - 0.03, 0.32, "tampon : whoosh très court", { dur: 0.3, fadeOut: 0.12 });
cue("sfx-stamp-ink", "fs-stamp.wav", T0, 1.1, "tampon : choc sourd d'encreur");
cue("sfx-stamp-clack", "click.mp3", T0, 0.9, "tampon : claquement sec");
cue("sfx-stamp-sub", "sub-drop.wav", T0, 0.8, "tampon : sub grave (70 → 36 Hz)");
// the number rolls T0 + 0.9 → T0 + 3.1: reels at full speed, then the slowing reel, « clac » on « + de »
cue("sfx-roll", "poker-reels-long.wav", T0 + 0.9, 0.8, "nombre : rouleaux qui tournent", { onset: true, mediaStart: 0.17, dur: 1.2, fadeOut: 0.08 });
cue("sfx-roll-slow", "reel-slow.wav", T0 + 2.0, 1.0, "nombre : rouleaux qui ralentissent", { onset: true, end: T0 + 3.1, fadeIn: 0.06 });
cue("sfx-roll-stop", "click.mp3", T0 + 3.1, 1.0, "nombre : « clac » d'arrêt, « + de » claque");
// the horde: one stereo bed (sfx-synth.mjs) — paws with Doppler and pan following the pack, panting,
// the teckel's small fast steps; it is silent from T0 + 3.5, before the 0.25 s hush ahead of the weight
cue("sfx-horde", "horde-bed.wav", T0 + 0.6, 1.0, "horde : pas, Doppler, pan, halètements, teckel");

// Barks: no barking dog is in assets/sfx and no sound library is reachable from here. Their times are
// fixed so a bank file drops straight in (assets/sfx/bark-*.wav, then add them to SFX above and here).
const PENDING = [
  [T0 + 1.05, "aboiement grave, premier plan, à gauche (berger)"],
  [T0 + 1.35, "aboiement moyen, plan moyen (labrador)"],
  [T0 + 1.6, "jappement aigu, fond (chihuahua)"],
  [T0 + 1.9, "aboiement grave, premier plan, au centre (husky, double)"],
  [T0 + 2.2, "aboiement moyen, fond, à droite"],
  [T0 + 2.45, "aboiement sec, plan moyen, à droite (bouledogue)"],
  [T0 + 2.75, "aboiement lointain, sortie à droite"],
  [T0 + 3.2, "petit aboiement aigu du teckel, seul"],
];

// placement: the clip starts so its peak (or onset for a bed) lands one frame after the picture
const placed = cues.map((c) => {
  const s = SFX[c.file];
  const start = +Math.max(0, c.at + (c.onset ? 0 : F - s.peak)).toFixed(3);
  const avail = s.dur - (c.mediaStart || 0);
  const dur = +Math.min(c.end ? c.end - start : c.dur ?? avail, avail, END - start).toFixed(3);
  return { ...c, start, dur };
}).sort((a, b) => a.start - b.start);

const laneEnds = [];
const tags = placed.map((c) => {
  let lane = laneEnds.findIndex((e) => e <= c.start + 1e-6);
  if (lane < 0) { lane = laneEnds.length; laneEnds.push(0); }
  laneEnds[lane] = c.start + c.dur;
  const extra =
    (c.mediaStart ? ` data-media-start="${c.mediaStart}"` : "") +
    (c.fadeIn ? ` data-fade-in="${c.fadeIn}"` : "") +
    (c.fadeOut ? ` data-fade-out="${c.fadeOut}"` : "") +
    (c.automation ? ` data-automation='${JSON.stringify({ version: 1, lanes: [{ target: "volume", points: c.automation(c.start) }] })}'` : "");
  return `      <audio id="${c.id}" src="assets/sfx/${c.file}" data-start="${c.start}" data-duration="${c.dur}" data-volume="${c.vol}" data-track-index="${10 + lane}"${extra}></audio>`;
});
const OPEN = "      <!-- sound: generated by cues.mjs, see SFX.md -->";
const t = readFileSync("index.html", "utf8");
const a = t.indexOf(OPEN), b = t.indexOf("\n    </div>\n    <script>", a);
if (a < 0 || b < 0) throw new Error("no audio block in index.html");
writeFileSync("index.html", t.slice(0, a + OPEN.length) + "\n" + tags.join("\n") + t.slice(b));

// SFX.md
const fmt = (x) => x.toFixed(2).replace(".", ",");
let md = "# SFX — Démineur urbain, bloc1-v2\n\nGénéré par `node cues.mjs` (ne pas éditer à la main). Temps en secondes, film entier (23 s).\n" +
  "« À l'image » = instant de l'événement ; le son culmine 1 image après (les lits démarrent sur leur attaque). Volume : 1 = 0 dB.\n" +
  "Insert de 4,5 s à 14,6 s : tout ce qui suivait est décalé de +4,5 s. T0 (tampon) = 15,58 s ; impact du poids = 19,98 s.\n\n" +
  "| à l'image | début clip | durée | son | volume | quoi |\n|---|---|---|---|---|---|\n";
for (const c of [...placed].sort((x, y) => x.at - y.at)) md += `| ${fmt(c.at)} | ${fmt(c.start)} | ${fmt(c.dur)} | ${c.file}${c.mediaStart ? ` (dès ${fmt(c.mediaStart)})` : ""} | ${c.vol}${c.automation ? " (−6 dB à " + fmt(DIP) + ")" : ""} | ${c.what} |\n`;
md += "\n## Silences voulus\n\n- 15,33 → 15,58 : micro-silence de tension, les rouleaux du compteur passent à −6 dB, le riser est coupé.\n" +
  "- 19,73 → 19,98 : quasi-silence avant le poids ; seul le sifflement de chute (1re des 5 couches du poids) continue.\n";
md += "\n## À fournir : aboiements (non placés)\n\nAucun aboiement dans assets/sfx et aucune banque joignable depuis l'environnement de rendu ; " +
  "un aboiement de synthèse sonnerait faux. Instants prévus :\n\n| à l'image | quoi |\n|---|---|\n";
for (const [at, what] of PENDING) md += `| ${fmt(at)} | ${what} |\n`;
md += "\nMastering après rendu (identique au bloc 1) : `volume=4.5dB,alimiter=limit=0.8:attack=2:release=60:level=disabled`, AAC 256 k ; piste seule exportée en WAV 48 kHz 24 bits.\n";
writeFileSync("SFX.md", md);
console.log(`${placed.length} cues placed, ${PENDING.length} barks pending`);
