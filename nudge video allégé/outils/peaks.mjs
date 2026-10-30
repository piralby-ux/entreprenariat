// Duration, peak time and onset (first sample above 30 % of the peak) of each audio file.
// usage: node peaks.mjs file...
import { execFileSync } from "node:child_process";
const SR = 8000;
for (const f of process.argv.slice(2)) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", f, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  const a = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  let m = 0, mi = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i]) > m) { m = Math.abs(a[i]); mi = i; }
  let on = 0;
  while (on < a.length && Math.abs(a[on]) < 0.3 * m) on++;
  console.log(`${f.split(/[\\/]/).pop().padEnd(24)} dur ${(a.length / SR).toFixed(3)}  peak ${(mi / SR).toFixed(3)} (${(20 * Math.log10(m)).toFixed(1)} dBFS)  onset ${(on / SR).toFixed(3)}`);
}
