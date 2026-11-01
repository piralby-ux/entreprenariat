"""Calcule l'alignement croquis -> flash (similitude) à partir des extrémités du dessin.
python3 -I scripts/align.py -> assets/data/align.json"""
import cv2, numpy as np, json
def extremes(path, thr=0.35, poly=None):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)[:, :, 3] / 255.0
    m = (a > thr).astype(np.uint8)
    if poly is not None:
        pm = np.zeros_like(m); cv2.fillPoly(pm, [np.array(poly, np.int32)], 1); m &= pm
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    big = 1 + np.argsort(st[1:, 4])[::-1][:6]
    m = np.isin(lab, big)
    ys, xs = np.where(m)
    P = np.stack([xs, ys], 1).astype(np.float32)
    top = P[np.argmin(P[:, 1])]; bot = P[np.argmax(P[:, 1])]
    left = P[np.argmin(P[:, 0])]; right = P[np.argmax(P[:, 0])]
    return np.array([top, bot, left, right], np.float32)
res = {}
src = extremes('assets/img/croquisA_ink.png', 0.3)
dst = extremes('assets/img/flashA_ink.png', 0.5)
M, _ = cv2.estimateAffinePartial2D(dst, src)  # flash -> repère du croquis
s = float(np.hypot(M[0, 0], M[1, 0])); ang = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
res['A'] = {'matrix': M.tolist(), 'scale': s, 'rotate': ang, 'src': src.tolist(), 'dst': dst.tolist()}
print('A', s, ang, M[:, 2], '\n', src, '\n', dst)
# contrôle visuel
cro = cv2.imread('assets/img/croquisA_ink.png', cv2.IMREAD_UNCHANGED)
fl = cv2.imread('assets/img/flashA_ink.png', cv2.IMREAD_UNCHANGED)
w = cv2.warpAffine(fl, M, (cro.shape[1], cro.shape[0]))
vis = np.full(cro.shape[:2] + (3,), 255, np.uint8)
vis[cro[:, :, 3] > 80] = (255, 120, 60)
vis[w[:, :, 3] > 120] = (0, 0, 0)
cv2.imwrite('prep/_alignA.jpg', vis)
json.dump(res, open('assets/data/align.json', 'w'))
# Éventail : rivet + extrémités des deux baguettes (mesurées à l'œil, repères des images recadrées)
srcB = np.float32([[440, 473], [390, 183], [685, 620]])   # croquisB_fan.png
dstB = np.float32([[231, 452], [269, 32], [527, 754]])    # flashB_ink.png
MB, _ = cv2.estimateAffinePartial2D(dstB, srcB)
res['B'] = {'matrix': MB.tolist(), 'scale': float(np.hypot(MB[0, 0], MB[1, 0])),
            'rotate': float(np.degrees(np.arctan2(MB[1, 0], MB[0, 0]))), 'rivet_croquis': [440, 473], 'rivet_flash': [231, 452]}
print('B', res['B'])
cro = cv2.imread('assets/img/croquisB_fan.png', cv2.IMREAD_UNCHANGED)
fl = cv2.imread('assets/img/flashB_ink.png', cv2.IMREAD_UNCHANGED)
w = cv2.warpAffine(fl, MB, (cro.shape[1], cro.shape[0]))
vis = np.full(cro.shape[:2] + (3,), 255, np.uint8)
vis[cro[:, :, 3] > 80] = (255, 120, 60)
vis[w[:, :, 3] > 120] = (0, 0, 0)
cv2.imwrite('prep/_alignB.jpg', vis)
json.dump(res, open('assets/data/align.json', 'w'))
