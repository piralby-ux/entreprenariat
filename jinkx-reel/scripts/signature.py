"""Construit le tracé monoline de « Jinkx » : texte en Mrs Saint Delafield -> squelette -> polylignes ordonnées.
python3 -I scripts/signature.py  -> assets/data/signature.json"""
import json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from skimage.morphology import skeletonize

S = 2
font = ImageFont.truetype('prep/fonts/MrsSaintDelafield.ttf', 300 * S)
im = Image.new('L', (900 * S, 520 * S), 0)
ImageDraw.Draw(im).text((60 * S, 10 * S), "Jinkx", font=font, fill=255)
a = np.array(im) > 127
sk = skeletonize(a)
H, W = sk.shape
pts = set(zip(*np.where(sk)))
def nb(p):
    y, x = p
    return [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in pts]
deg = {p: len(nb(p)) for p in pts}
nodes = {p for p in pts if deg[p] != 2}
# découpe en arêtes entre nœuds
seen = set(); edges = []
for n0 in nodes:
    for q in nb(n0):
        if (n0, q) in seen: continue
        path = [n0, q]; prev, cur = n0, q
        while cur not in nodes:
            nxt = [r for r in nb(cur) if r != prev and r not in path[-3:]]
            if not nxt: break
            prev, cur = cur, nxt[0]; path.append(cur)
        seen.add((path[-1], path[-2])); seen.add((n0, q))
        edges.append(path)
# boucles fermées sans nœud
rest = pts - {p for e in edges for p in e}
while rest:
    p0 = rest.pop(); loop = [p0]; cur = p0; prev = None
    while True:
        nx = [r for r in nb(cur) if r != prev and r in rest]
        if not nx: break
        prev, cur = cur, nx[0]; rest.discard(cur); loop.append(cur)
    loop.append(p0); edges.append(loop)
# élague les petits éperons (arête reliée à une extrémité, courte)
def is_end(p): return deg.get(p, 0) == 1
edges = [e for e in edges if not ((is_end(e[0]) or is_end(e[-1])) and len(e) < 18 * S)]
edges = [e for e in edges if len(e) > 3]
# ordre d'écriture : glouton, depuis le haut du J, en enchaînant l'extrémité la plus proche
def key_start(e): return min(e[0][1], e[-1][1])
remaining = edges[:]
start = min(remaining, key=lambda e: (min(p[0] for p in e) + 0.6 * min(p[1] for p in e)))
order = []
cur = start if start[0][0] < start[-1][0] else start[::-1]
remaining.remove(start); order.append(cur)
while remaining:
    end = np.array(order[-1][-1])
    best = None
    for e in remaining:
        for rev in (False, True):
            ee = e[::-1] if rev else e
            d = np.linalg.norm(np.array(ee[0]) - end) + 0.35 * max(0, end[1] - ee[0][1])  # préfère avancer vers la droite
            if best is None or d < best[0]: best = (d, e, ee)
    remaining.remove(best[1]); order.append(best[2])
# fusionne les arêtes consécutives qui se touchent en un seul trait
strokes = [order[0][:]]
for e in order[1:]:
    if np.linalg.norm(np.array(e[0]) - np.array(strokes[-1][-1])) < 3 * S:
        strokes[-1] += e[1:]
    else:
        strokes.append(e[:])
def smooth(path, k=5):
    p = np.array(path, np.float32)[:, ::-1] / S
    if len(p) > 2 * k:
        ker = np.ones(k) / k
        x = np.convolve(np.pad(p[:, 0], k // 2, mode='edge'), ker, 'valid')
        y = np.convolve(np.pad(p[:, 1], k // 2, mode='edge'), ker, 'valid')
        p = np.stack([x, y], 1)
    p = p[::2] if len(p) > 6 else p
    return p
# ordre final : de gauche à droite (comme on écrit), chaque trait orienté de son extrémité gauche ;
# le grand jambage du J part du haut
def minx(st): return min(q[1] for q in st)
strokes.sort(key=minx)
for i, st in enumerate(strokes):
    if i == 0:
        if st[0][0] > st[-1][0]: strokes[i] = st[::-1]
    elif st[0][1] > st[-1][1]:
        strokes[i] = st[::-1]
out = []
for st in strokes:
    p = smooth(st)
    out.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in p))
ys, xs = np.where(a)
bbox = [int(xs.min() / S), int(ys.min() / S), int(xs.max() / S), int(ys.max() / S)]
json.dump({'bbox': bbox, 'strokes': out}, open('assets/data/signature.json', 'w'))
# aperçu numéroté
vis = np.full((520, 900, 3), 255, np.uint8)
for i, st in enumerate(strokes):
    p = smooth(st).astype(np.int32)
    col = tuple(int(c) for c in np.random.RandomState(i).randint(0, 200, 3))
    cv2.polylines(vis, [p], False, col, 3, cv2.LINE_AA)
    cv2.putText(vis, str(i), tuple(int(v) for v in p[0]), cv2.FONT_HERSHEY_SIMPLEX, 0.6, col, 2)
cv2.imwrite('prep/_signature.png', vis)
print(len(strokes), 'traits', bbox)
