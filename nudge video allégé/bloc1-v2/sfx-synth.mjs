// Deterministic sounds made here, from files already in assets/sfx (no download, no randomness):
//   sub-drop.wav  — the stamp's sub: a 70 → 36 Hz sine drop, 0.9 s
//   horde-bed.wav — the stampede, T0 + 0.6 → T0 + 3.75: every paw of every dog, placed from the same dog
//                   table as compositions/scene3d.html (read from it), with a cartoon Doppler (c = 40 m/s),
//                   an equal-power pan that follows each dog across the frame, panting on the front planes,
//                   and the teckel's small fast steps. Paw = footstep-gravel.mp3, softened and pitched.
// usage: node sfx-synth.mjs   (needs ffmpeg)
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const SR = 48000;
const T0 = 15.58, W = 1920, CELL_W = 384, DOG_H = 190;
const HORDE_T0 = T0 + 0.6, HORDE_T1 = T0 + 3.75;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a, b, k) => a + (b - a) * k;

function writeWav(file, chans) {
  const n = chans[0].length, nc = chans.length;
  const b = Buffer.alloc(44 + n * nc * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * nc * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(nc, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * nc * 2, 28); b.writeUInt16LE(nc * 2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * nc * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[c][i])) * 32767), 44 + (i * nc + c) * 2);
  writeFileSync(file, b);
}
const decode = (f) => {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", f, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
};

// ---- sub drop
{
  const n = Math.round(0.9 * SR), s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const phase = 2 * Math.PI * (36 * t + (34 / 6) * (1 - Math.exp(-6 * t)));
    s[i] = 0.9 * Math.sin(phase) * Math.exp(-4.5 * t) * Math.min(1, t / 0.004);
  }
  writeWav("assets/sfx/sub-drop.wav", [s, s]);
}

// ---- the dog table, read from the scene so picture and sound can never disagree
const scene = readFileSync("compositions/scene3d.html", "utf8");
const breedsSrc = scene.slice(scene.indexOf("const BREEDS = ["), scene.indexOf("];", scene.indexOf("const BREEDS = [")) + 2);
const dogsSrc = scene.slice(scene.indexOf("const PLANES = ["), scene.indexOf("const ND = dogs.length;"));
const { BREEDS, PLANES, dogs } = new Function("mulberry32", "lerp", "T0", "W", "CELL_W", "DOG_H", `${breedsSrc}\n${dogsSrc}\nreturn { BREEDS, PLANES, dogs };`)(mulberry32, lerp, T0, W, CELL_W, DOG_H);

// ---- the stampede
const paw = decode("assets/sfx/footstep-gravel.mp3");
const onset = Math.round(0.105 * SR), pawLen = Math.round(0.14 * SR);
const pawSrc = new Float32Array(pawLen);
{
  // softened: one-pole low-pass at ~2.5 kHz, 3 ms in, decaying out
  let y = 0;
  const a = 1 - Math.exp((-2 * Math.PI * 2500) / SR);
  for (let i = 0; i < pawLen; i++) {
    y += a * ((paw[onset + i] || 0) - y);
    pawSrc[i] = y * Math.min(1, i / (0.003 * SR)) * Math.pow(1 - i / pawLen, 2);
  }
}
const len = Math.round((HORDE_T1 - HORDE_T0) * SR);
const L = new Float32Array(len), R = new Float32Array(len);
const rnd = mulberry32(0xd06);
// world layout of the three planes (metres): half-width seen at that depth, depth, level
const WORLD = [
  { hw: 14, z: 24, g: 0.32 },
  { hw: 8, z: 13, g: 0.6 },
  { hw: 5, z: 6, g: 1.0 },
];
const C_SOUND = 40; // cartoon speed of sound: a clearly audible Doppler swing
function place(src, t, pitch, gain, pan) {
  const at = (t - HORDE_T0) * SR;
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  const n = Math.floor(src.length / pitch);
  for (let i = 0; i < n; i++) {
    const j = Math.floor(at) + i;
    if (j < 0 || j >= len) continue;
    const p = i * pitch, k = Math.floor(p), f = p - k;
    const v = (src[k] || 0) * (1 - f) + (src[k + 1] || 0) * f;
    L[j] += v * gl;
    R[j] += v * gr;
  }
}
// panting: a band-passed noise breath, made once per size
function breath(center) {
  const n = Math.round(0.12 * SR), out = new Float32Array(n), nz = mulberry32(Math.round(center));
  const w0 = (2 * Math.PI * center) / SR, q = 1.4, al = Math.sin(w0) / (2 * q);
  const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w0), a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const x = nz() * 2 - 1;
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y * Math.pow(Math.sin((Math.PI * i) / n), 2);
  }
  return out;
}
const breaths = {};
let hits = 0;
for (const d of dogs) {
  const B = BREEDS[d.breed], Wd = WORLD[d.plane];
  const sw = (CELL_W * d.h) / DOG_H;
  const size = d.h / PLANES[d.plane].h; // 0.36 … 1.1 of the plane's dog
  const teckel = d.breed === 0;
  const pitchBase = teckel ? 1.8 : Math.min(1.6, 1 / Math.sqrt(size));
  const vPx = (W + sw) / d.D, v = (vPx / 960) * Wd.hw;
  const at = (t) => {
    const u = (t - d.te) / d.D;
    const X = ((lerp(-sw / 2, W + sw / 2, u) - 960) / 960) * Wd.hw;
    const dist = Math.hypot(X, Wd.z);
    return { u, X, dist, dop: 1 / (1 + (v * X) / dist / C_SOUND), pan: Math.max(-1, Math.min(1, X / (Wd.hw * 1.1))) };
  };
  // footfalls of a rotary gallop: hind, hind, fore, fore
  for (let k = -1; k < 40; k++)
    for (const p of [0.0, 0.09, 0.44, 0.52]) {
      const t = d.te + (k + p - d.ph) / d.f;
      const s = at(t);
      if (!(s.u > 0 && s.u < 1)) continue;
      const g = Wd.g * Math.pow(Wd.z / s.dist, 1.5) * Math.pow(size, 0.8) * (teckel ? 0.9 : 0.55) * (0.8 + 0.4 * rnd());
      place(pawSrc, t, pitchBase * s.dop * (0.94 + 0.12 * rnd()), g, s.pan);
      hits++;
    }
  // breath once per stride on the two nearer planes
  if (d.plane > 0) {
    const fc = Math.round((teckel ? 2600 : 1300 / Math.sqrt(size)) / 50) * 50;
    breaths[fc] = breaths[fc] || breath(fc);
    for (let k = 0; k < 40; k++) {
      const t = d.te + (k + 0.6 - d.ph) / d.f;
      const s = at(t);
      if (!(s.u > 0 && s.u < 1)) continue;
      place(breaths[fc], t, s.dop, Wd.g * Math.pow(Wd.z / s.dist, 1.5) * (teckel ? 0.5 : 0.22), s.pan);
    }
  }
}
// level: peak at −3 dBFS; 60 ms in, 250 ms out
let peak = 0;
for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const k = 0.708 / (peak || 1);
for (let i = 0; i < len; i++) {
  const e = Math.min(1, i / (0.06 * SR), (len - i) / (0.25 * SR));
  L[i] *= k * e; R[i] *= k * e;
}
writeWav("assets/sfx/horde-bed.wav", [L, R]);
console.log(`sub-drop.wav 0.9 s; horde-bed.wav ${(len / SR).toFixed(2)} s from ${HORDE_T0.toFixed(2)} s, ${dogs.length} dogs, ${hits} paws`);
