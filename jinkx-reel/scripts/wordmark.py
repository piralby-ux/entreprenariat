"""Wordmark « Jinkx » à pleins et déliés (Pinyon Script) + chemin central pour le masque d'écriture.
python3 -I scripts/wordmark.py -> assets/data/wordmark.js
1) contour rempli de la fonte (fontTools)  2) rendu raster par Chromium  3) squelette -> traits ordonnés
"""
import json, subprocess, os
import numpy as np, cv2
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from skimage.morphology import skeletonize

W_TARGET = 750
font = TTFont('prep/fonts/PinyonScript.ttf')
gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font['hmtx']
upm = font['head'].unitsPerEm
text = "Jinkx"
# approche : légère compression des espaces pour que les lettres se lient
track = {('J', 'i'): -60, ('i', 'n'): -10, ('n', 'k'): -20, ('k', 'x'): -30}
x = 0; parts = []
for i, ch in enumerate(text):
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
    parts.append(pen.getCommands())
    x += hmtx[g][0] + (track.get((ch, text[i + 1]), 0) if i + 1 < len(text) else 0)
d_units = ' '.join(parts)
# bbox via rendu : on rastérise dans Chromium à une échelle provisoire
def render(d, tf, w, h, out):
    html = f'''<html><body style="margin:0;background:#fff"><svg width="{w}" height="{h}"><path d="{d}" transform="{tf}" fill="#000"/></svg></body></html>'''
    open('prep/_wm.html', 'w').write(html)
    subprocess.run(['node', '-e', f'''
const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:{w},height:{h}}}}});
await p.goto('file://'+require('path').resolve('prep/_wm.html'));await p.screenshot({{path:'{out}'}});await b.close();}})();'''], check=True)
    return cv2.imread(out, 0)
s0 = 0.4
im = render(d_units, f'translate(400 600) scale({s0})', 2400, 1200, 'prep/_wm0.png')
ys, xs = np.where(im < 128)
bx0, bx1 = (xs.min() - 400) / s0, (xs.max() - 400) / s0
by0, by1 = (ys.min() - 600) / s0, (ys.max() - 600) / s0
S = W_TARGET / (bx1 - bx0)
pad = 40
Wc, Hc = int(W_TARGET + 2 * pad), int((by1 - by0) * S + 2 * pad)
tf = f'translate({pad - bx0 * S:.2f} {pad - by0 * S:.2f}) scale({S:.5f})'
im = render(d_units, tf, Wc, Hc, 'prep/_wm1.png')
a = im < 128
# épaisseurs (distance au bord x2) pour contrôle
dist = cv2.distanceTransform(a.astype(np.uint8), cv2.DIST_L2, 5)
sk = skeletonize(a)
th = dist[sk] * 2
print('size', Wc, Hc, 'stroke px: p10 %.1f median %.1f p95 %.1f max %.1f' % tuple(np.percentile(th, [10, 50, 95, 100])))

# ---- squelette -> traits (même logique que la V1, ordre gauche -> droite)
pts = set(zip(*np.where(sk)))
def nb(p):
    y, x_ = p
    return [(y + dy, x_ + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x_ + dx) in pts]
deg = {p: len(nb(p)) for p in pts}
nodes = {p for p in pts if deg[p] != 2}
seen = set(); edges = []
for n0 in nodes:
    for q in nb(n0):
        if (n0, q) in seen: continue
        path = [n0, q]; prev, cur = n0, q
        while cur not in nodes:
            nxt = [r for r in nb(cur) if r != prev and r not in path[-3:]]
            if not nxt: break
            prev, cur = cur, nxt[0]; path.append(cur)
        seen.add((path[-1], path[-2])); seen.add((n0, q)); edges.append(path)
rest = pts - {p for e in edges for p in e}
while rest:
    p0 = rest.pop(); loop = [p0]; cur = p0; prev = None
    while True:
        nx = [r for r in nb(cur) if r != prev and r in rest]
        if not nx: break
        prev, cur = cur, nx[0]; rest.discard(cur); loop.append(cur)
    loop.append(p0); edges.append(loop)
edges = [e for e in edges if len(e) > 4]
def minx(e): return min(p[1] for p in e)
edges.sort(key=minx)
strokes = [e if e[0][1] <= e[-1][1] else e[::-1] for e in edges]
# le J s'écrit depuis le haut
j = 0
if strokes[j][0][0] > strokes[j][-1][0]: strokes[j] = strokes[j][::-1]
def smooth(path, k=5):
    p = np.array(path, np.float32)[:, ::-1]
    if len(p) > 2 * k:
        ker = np.ones(k) / k
        p = np.stack([np.convolve(np.pad(p[:, i], k // 2, mode='edge'), ker, 'valid') for i in (0, 1)], 1)
    return p[::2] if len(p) > 6 else p
mask_strokes = []
for st in strokes:
    p = smooth(st)
    L = float(np.sum(np.hypot(*np.diff(p, axis=0).T)))
    mask_strokes.append({'d': 'M' + ' L'.join(f'{x_:.1f} {y_:.1f}' for x_, y_ in p), 'L': round(L, 1), 'w': float(min(40, max(14, np.percentile(dist[tuple(np.array(st).T)] * 2, 95) + 8)))})
out = {'x0': 125, 'y0': 330, 'w': Wc, 'h': Hc, 'd': d_units, 'transform': tf, 'strokes': mask_strokes}
open('assets/data/wordmark.js', 'w').write('window.JINKX=window.JINKX||{};window.JINKX.wordmark=' + json.dumps(out) + ';')
vis = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
for i, st in enumerate(mask_strokes):
    p = np.array([[float(v) for v in s.split()] for s in st['d'][1:].split(' L')]).astype(np.int32)
    c = tuple(int(v) for v in np.random.RandomState(i).randint(0, 220, 3))
    cv2.polylines(vis, [p], False, c, 2); cv2.putText(vis, str(i), tuple(p[0]), cv2.FONT_HERSHEY_SIMPLEX, .6, c, 2)
cv2.imwrite('prep/_wordmark.png', vis)
print(len(mask_strokes), 'traits')
