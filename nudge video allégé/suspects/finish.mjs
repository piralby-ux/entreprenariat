// Post-render for « Les suspects »: motion blur, mastering, WAV.
// The CLI renders at 240 fps at most, so each 60 fps frame averages its four 240 fps subframes,
// weighted 1-3-3-1 (≈ the 180° shutter of block 1, whose blur was 4 subframes over 1/120 s).
// Mastering is block 1's: +4.5 dB, then a fast limiter (ceiling 0.8, 2 ms attack), AAC 256 k.
// usage: node finish.mjs raw.mp4 out.mp4 [out.wav]
import { execFileSync } from "node:child_process";
const [raw, out, wav] = process.argv.slice(2);
const MASTER = "volume=4.5dB,alimiter=limit=0.8:attack=2:release=60:level=disabled";
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", raw,
  "-vf", "tmix=frames=4:weights='1 3 3 1',select='eq(mod(n\\,4)\\,3)',setpts=N/60/TB",
  "-r", "60", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
  "-af", MASTER, "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", out,
], { stdio: "inherit" });
if (wav) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vn", "-af", MASTER, "-ar", "48000", "-c:a", "pcm_s24le", wav], { stdio: "inherit" });
console.log(`done: ${out}${wav ? " + " + wav : ""}`);
