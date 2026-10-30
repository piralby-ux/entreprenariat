// Cue sheet → <audio> tags. Each cue names the picture's instant; the clip starts so its measured
// peak lands one frame (1/60 s) after it. Pure arithmetic, printed for index.html.
const F = 1 / 60;
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
};
const cues = [];
const cue = (id, file, at, vol, opts = {}) => cues.push({ id, file, at, vol, ...opts });

// act 1 — evening, the walk
cue("sfx-bird-1", "bird-chirp.mp3", 0.55, 3.2);
cue("sfx-bird-2", "bird-chirp.mp3", 1.75, 2.4);
[0.22, 0.75, 1.28, 1.81, 2.34].forEach((t, i) => cue(`sfx-step-${i + 1}`, "footstep-gravel.mp3", t, i % 2 ? 0.34 : 0.42));
// the step: the foot swings down, lands on the poop at 3.0
cue("sfx-foot-swing", "whoosh-short.mp3", 2.95, 0.22);
cue("sfx-step-hit", "footstep-gravel.mp3", 3.0, 0.9);
cue("sfx-step-thud", "impact-bass-1.mp3", 3.0, 0.5, { dur: 1.6 });
// the slot machine 0 → 1: pops up, the reel rattles while it spins, jackpot on the 1, « +1 »
cue("sfx-slot-in", "whoosh-short.mp3", 3.2, 0.3);
cue("sfx-slot-reel", "poker-reels-long.wav", 3.12, 1.3, { dur: 0.64 });
cue("sfx-slot-stop", "impact-bass-1.mp3", 3.74, 0.3, { dur: 1.0 });
cue("sfx-slot-win", "sparkle.mp3", 3.76, 0.4);
cue("sfx-slot-plus", "pop-hi.wav", 3.8, 0.55);
cue("sfx-to-hud", "whoosh-short.mp3", 4.5, 0.26);
// the crane and the wave
cue("sfx-wave", "whoosh.mp3", 4.72, 0.3);
cue("sfx-crane", "whoosh-cinematic.mp3", 7.1, 0.28);
cue("sfx-wire", "glitch-3.mp3", 5.5, 0.28);
// 14 poops in a spiral: each crosses its cell top ~0.08 s after its pop time; three takes rotate
const takes = ["pop.mp3", "pop-hi.wav", "pop-lo.wav"];
for (let i = 0; i < 14; i++) cue(`sfx-poop-${String(i + 1).padStart(2, "0")}`, takes[i % 3], 8.1 + 0.18 * i + 0.08, 0.38 + 0.012 * i);
// the city hatches in waves as the camera climbs: soft pop clusters, and one long swell at the
// fastest point of the rise (~13.3 s)
[12.15, 12.4, 12.65, 12.9, 13.15].forEach((t, i) => cue(`sfx-wave-pop-${i + 1}`, takes[(i + 1) % 3], t, 0.2 + 0.03 * i));
cue("sfx-rise", "whoosh-cinematic.mp3", 13.3, 0.24);
// the rise builds into « 5 TONNES » (riser crest at 15.48), cut right after it
cue("sfx-riser", "riser.mp3", 15.48, 0.3, { dur: null, end: 15.5 });
// the counter's reels rattle from 13.7 s, up to the weight
cue("sfx-reels", "poker-reels-long.wav", 13.7, 1.3, { end: 15.42 });
// the weight: a falling whistle that ends on the hit, then body thud + iron clang + debris,
// and a sub rumble that carries the card to the last frame (no gap)
cue("sfx-weight-whistle", "fs-whistle-end.wav", 15.48, 2.2);
cue("sfx-weight-thud", "fs-dino-hit.wav", 15.48, 1.8, { end: 18.5 });
cue("sfx-weight-clang", "fs-metal-bang.mp3", 15.48, 1.3);
cue("sfx-weight-debris", "fs-debris.mp3", 15.5, 1.3);
cue("sfx-weight-rumble", "fs-rumble.mp3", 15.48, 0.85, { end: 18.5 });

// lanes: each clip goes on the first Studio track free at its start, so no two overlap
const laneEnds = [];
const lines = cues.map((c) => {
  const s = SFX[c.file];
  const start = +Math.max(0, c.at + F - s.peak).toFixed(3);
  // never longer than the file, never past the film's end (18.5 s)
  const dur = +Math.min(c.end ? c.end - start : c.dur ?? s.dur, s.dur, 18.5 - start).toFixed(3);
  return { c, start, dur };
}).sort((a, b) => a.start - b.start).map(({ c, start, dur }) => {
  let lane = laneEnds.findIndex((e) => e <= start + 1e-6);
  if (lane < 0) { lane = laneEnds.length; laneEnds.push(0); }
  laneEnds[lane] = start + dur;
  return `      <audio id="${c.id}" src="assets/sfx/${c.file}" data-start="${start}" data-duration="${dur}" data-volume="${c.vol}" data-track-index="${10 + lane}"></audio>`;
});
console.log(lines.join("\n"));
