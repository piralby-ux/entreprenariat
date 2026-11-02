"""Sound design synthétisé (aucun sample) calé sur la timeline du film.
python3 -I scripts/sfx.py -> out/sfx.wav  (48 kHz, stéréo, 22 s)
Les instants viennent du storyboard (grille 100 BPM, un temps = 0,6 s)."""
import wave
import numpy as np

SR = 48000
DUR = 22.0
N = int(SR * DUR)
rng = np.random.default_rng(2026)
L = np.zeros(N)
R = np.zeros(N)


def noise(n):
    return rng.standard_normal(n)


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y


def bandpass(x, lo, hi):
    return onepole_lp(x, hi) - onepole_lp(onepole_lp(x, hi), lo)


def env_adsr(n, a, d, sustain=0.0, curve=3.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) * curve / max(d, 1e-4)) * (1 - sustain) + sustain)
    return e


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    gl, gr = gain * np.sqrt(0.5 * (1 - pan)), gain * np.sqrt(0.5 * (1 + pan))
    L[i:j] += sig[:j - i] * gl
    R[i:j] += sig[:j - i] * gr


def flap(dur=0.35, bright=2500):  # carton / couverture qui bat l'air
    n = int(dur * SR)
    s = bandpass(noise(n), 180, bright) * env_adsr(n, 0.04, dur * 0.5)
    return s / (np.abs(s).max() + 1e-9)


def thump(f=90, dur=0.18):  # choc sourd
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t * (1 - 0.35 * t / dur)) * np.exp(-t * 28)
    s += 0.25 * bandpass(noise(n), 300, 2500) * np.exp(-t * 90)
    return s / np.abs(s).max()


def scratch(dur, seed, rate=11):  # stylo / crayon qui gratte le papier
    n = int(dur * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    strokes = np.zeros(n)
    k = 0
    while k < n:
        ln = int(SR * r.uniform(0.05, 0.16)); gap = int(SR * r.uniform(0.01, 0.06))
        w = np.sin(np.linspace(0, np.pi, min(ln, n - k))) ** 0.7 * r.uniform(0.5, 1.0)
        strokes[k:k + len(w)] = w; k += ln + gap
    grit = bandpass(noise(n), 1800, 7000) * (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 140 * t + r.uniform(0, 6))))
    s = grit * strokes * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.08)
    return s / (np.abs(s).max() + 1e-9)


def swish(dur=0.45, lo=400, hi=5000):  # tourne de page
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(n)
    fc = lo + (hi - lo) * np.sin(np.pi * t / dur) ** 2
    y = np.empty(n); s = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * fc[i] / SR); s = (1 - a) * x[i] + a * s; y[i] = s
    y -= onepole_lp(y, 250)
    y *= np.sin(np.pi * t / dur) ** 1.5
    return y / np.abs(y).max()


def machine(dur):  # bourdonnement de la machine rotative
    n = int(dur * SR); t = np.arange(n) / SR
    f = 118 + 3 * np.sin(2 * np.pi * 0.7 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = 0.6 * np.sin(ph) + 0.35 * np.sin(2 * ph + 0.3) + 0.22 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph)
    s *= 1 + 0.25 * np.sin(ph / 2)
    s += 0.18 * bandpass(noise(n), 2000, 6000) * (0.5 + 0.5 * np.sin(ph))
    e = np.minimum(1, t / 0.12) * np.minimum(1, (dur - t) / 0.18)
    s = s * e
    return s / np.abs(s).max()


def tick():  # coupe sèche
    n = int(0.05 * SR); t = np.arange(n) / SR
    s = bandpass(noise(n), 1500, 9000) * np.exp(-t * 160) + 0.4 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 120)
    return s / np.abs(s).max()


def gloop(dur=0.6):  # encre qui coule
    n = int(dur * SR); t = np.arange(n) / SR
    f = 240 * np.exp(-t * 3.2) + 70
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_adsr(n, 0.02, dur * 0.5) * 0.8
    s += 0.25 * bandpass(noise(n), 120, 900) * env_adsr(n, 0.08, dur * 0.6)
    return s / np.abs(s).max()


def swell(dur, rev=False):  # aspiration / révélation à l'encre
    n = int(dur * SR); t = np.arange(n) / SR
    s = bandpass(noise(n), 150, 1800) * (t / dur) ** 2
    s += 0.5 * np.sin(2 * np.pi * (60 + 50 * t / dur) * t) * (t / dur) ** 2
    s = s / np.abs(s).max()
    return s[::-1] if rev else s


# --- placement (temps du film, V3) ---
def rub(n_pass, dur, seed):  # gomme : allers-retours rapides
    out = np.zeros(int(dur * SR))
    seg = len(out) // n_pass
    for k in range(n_pass):
        sc = scratch(seg / SR, seed + k, rate=20)
        out[k * seg:k * seg + len(sc)] += sc * (0.8 + 0.2 * (k % 2))
    return out / (np.abs(out).max() + 1e-9)
place(flap(0.4, 2200), 0.3, 0.55, -0.3)         # la couverture s'ouvre
place(thump(70, 0.2), 0.62, 0.35, -0.4)
place(swell(1.0), 1.4, 0.12)                     # la caméra plonge dans la page
place(scratch(0.3, 7, 8), 2.7, 0.10, 0.1)        # lignes de construction au crayon
place(scratch(1.4, 1), 3.0, 0.20, 0.15)          # morph A : encre
place(rub(3, 0.35, 11), 4.4, 0.16, 0.1)          # coup de gomme
place(swish(0.5), 5.4, 0.45, -0.2)               # tourne de page
place(thump(110, 0.12), 5.9, 0.28, -0.1)
place(swish(0.5, 900, 6000), 5.9, 0.14, 0.25)    # l'éventail s'ouvre
place(swish(0.4, 600, 4000), 6.4, 0.22, 0.3)     # le papier calque glisse
place(scratch(0.3, 8, 8), 6.8, 0.10, 0.1)        # arcs de construction
place(scratch(0.9, 2), 6.95, 0.20, 0.2)          # flash B sur le calque
place(rub(3, 0.3, 21), 7.7, 0.16, 0.1)           # gomme
place(swish(0.3, 500, 3500), 7.9, 0.18, 0.2)     # le calque se soulève
place(tick(), 8.1, 0.25)                         # coupe sur le flash seul
place(swish(0.6, 120, 1400), 8.4, 0.30)          # l'encre se dissout
place(machine(1.95), 9.0, 0.30, 0.25)            # machine à tatouer (vase)
for k, at in enumerate([11.4, 11.7, 12.0, 12.3, 12.6, 12.9]):
    place(tick(), at, 0.35, (-1) ** k * 0.3)     # match cuts
place(swish(0.6, 200, 2200), 13.2, 0.25, 0.1)    # le vase s'efface, les herbes restent
place(scratch(0.8, 5, 9), 13.25, 0.10, -0.1)     # silhouette du bras
place(swish(0.25, 300, 1500), 14.0, 0.16)        # le stencil est posé
place(machine(1.2), 14.2, 0.28, 0.2)             # la machine repasse le stencil
for k in range(4):
    place(tick(), 15.15 + 0.15 * k, 0.12, 0.2)   # points tapés
place(swish(0.35, 250, 1800), 15.25, 0.20, -0.1) # essuyage
place(swish(0.6, 300, 2500), 15.6, 0.32, -0.25)  # la caméra glisse, le tirage arrive
place(thump(140, 0.08), 16.2, 0.18)
place(swish(0.5, 300, 2500), 17.5, 0.26, 0.2)    # le tirage sort du cadre
place(scratch(0.3, 9, 8), 17.6, 0.08, -0.1)      # esquisse au crayon
place(scratch(1.2, 4, 9), 17.65, 0.20, -0.1)     # « Jinkx » s'écrit
place(scratch(0.3, 10, 16), 19.2, 0.08)          # « TATTOO » imprimé
place(thump(85, 0.22), 19.95, 0.75)              # le tampon : « tok » sourd
place(flap(0.45, 1800), 21.32, 0.45, -0.35)      # la couverture se referme
place(thump(65, 0.25), 21.86, 0.5, -0.2)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
peak = np.abs(mix).max()
mix *= 0.7 / peak  # ~ -3 dBFS crête
pcm = (mix * 32767).astype('<i2')
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('out/sfx.wav', DUR, 's')
