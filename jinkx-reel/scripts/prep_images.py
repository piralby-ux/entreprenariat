"""Préparation des images de Jinkx pour le Reel.

Lancer depuis la racine du projet :  python3 -I scripts/prep_images.py
Sources : assets_src/   Sorties : assets/img/ (+ prep/ pour les fichiers intermédiaires)
"""
import os
import cv2
import numpy as np

SRC = "assets_src"
OUT = "assets/img"
TMP = "prep"
os.makedirs(OUT, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

INK = np.array([0x12, 0x11, 0x10], np.float32)  # --ink (#121110) en RGB


def lum(img_bgr):
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def save_rgba(path, rgb, alpha):
    """rgb: HxWx3 RGB float 0..255, alpha: HxW 0..1"""
    a = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    bgr = cv2.cvtColor(np.clip(rgb, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    cv2.imwrite(path, np.dstack([bgr, a]))


def ink_layer(alpha):
    h, w = alpha.shape
    rgb = np.empty((h, w, 3), np.float32)
    rgb[:] = INK
    return rgb


def flat_field(img_bgr, k=61):
    """Supprime l'éclairage inégal d'une photo de papier : papier -> blanc."""
    out = np.empty_like(img_bgr, dtype=np.float32)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    for c in range(3):
        ch = img_bgr[:, :, c]
        bg = cv2.morphologyEx(ch, cv2.MORPH_CLOSE, kernel)
        bg = cv2.GaussianBlur(bg, (0, 0), k / 3)
        out[:, :, c] = np.clip(ch.astype(np.float32) / np.maximum(bg.astype(np.float32), 1) * 255, 0, 255)
    return out


def flash_alpha(img_bgr):
    """Luminance -> alpha avec seuil doux : le blanc devient transparent, les gris restent semi-transparents."""
    L = lum(img_bgr)
    a = np.clip((0.955 - L) / (0.955 - 0.07), 0, 1)
    return L, a


def crop_to_content(a, pad=24):
    ys, xs = np.where(a > 0.04)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, a.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, a.shape[1])
    return x0, y0, x1, y1




def rebuild_ruling(gray, fill, ruling_src):
    """Remplit `fill` de papier et y prolonge les lignes du cahier (ajustées sur les segments visibles hors zone)."""
    out = gray.copy()
    paper_val = float(np.median(gray[(ruling_src == 0) & (fill == 0)]))
    out[fill > 0] = paper_val
    acc = np.zeros_like(gray)
    H_, W_ = gray.shape
    for kern, horiz in (((61, 1), True), ((1, 161), False)):
        comp = cv2.morphologyEx(ruling_src, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, kern))
        comp[fill > 0] = 0
        ncc, labs, sts, _ = cv2.connectedComponentsWithStats(comp)
        fits, vals = [], []
        for i in range(1, ncc):
            x, y, w_, h_, area = sts[i]
            if horiz and (w_ < 60 or h_ > 8):
                continue
            if not horiz and (h_ < 200 or w_ > 14):
                continue
            ys_, xs_ = np.where(labs == i)
            vals.append(gray[ys_, xs_])
            if horiz:
                A, Bc = np.polyfit(xs_, ys_, 1); key = A * W_ / 2 + Bc
            else:
                A, Bc = np.polyfit(ys_, xs_, 1); key = A * H_ / 2 + Bc
            fits.append((key, len(xs_), A, Bc))
        if not fits:
            continue
        diff = max(paper_val - float(np.median(np.concatenate(vals))), 0) * 0.5
        fits.sort()
        merged = []
        for f in fits:
            if merged and abs(f[0] - merged[-1][0]) < 6:
                if f[1] > merged[-1][1]:
                    merged[-1] = f
            else:
                merged.append(f)
        if horiz and len(merged) > 4:
            # lignes régulièrement espacées : on comble les lignes manquantes par interpolation
            sp = float(np.median(np.diff([m[0] for m in merged])))
            filled = [merged[0]]
            for m in merged[1:]:
                prev = filled[-1]
                k = int(round((m[0] - prev[0]) / sp))
                for j in range(1, k):
                    t = j / k
                    filled.append((prev[0] + (m[0] - prev[0]) * t, 0, prev[2] + (m[2] - prev[2]) * t,
                                   prev[3] + (m[3] - prev[3]) * t))
                filled.append(m)
            merged = filled
        for key, n_, A, Bc in merged:
            if horiz:
                p0, p1 = (0, Bc), (W_, A * W_ + Bc)
            else:
                p0, p1 = (Bc, 0), (A * H_ + Bc, H_)
            cv2.line(acc, (int(p0[0] * 4), int(p0[1] * 4)), (int(p1[0] * 4), int(p1[1] * 4)), diff, 3, cv2.LINE_AA, shift=2)
    acc = cv2.GaussianBlur(acc, (0, 0), 0.5)
    return np.where(fill > 0, np.clip(paper_val - acc, 0, 255), out)


# ---------------------------------------------------------------- Flash A (feuilles)
img = cv2.imread(f"{SRC}/02_flash_feuilles.png")
L, a = flash_alpha(img)
x0, y0, x1, y1 = crop_to_content(a)
a = a[y0:y1, x0:x1]
L = L[y0:y1, x0:x1]
save_rgba(f"{OUT}/flashA_ink.png", ink_layer(a), a)
cv2.imwrite(f"{TMP}/flashA_bw.png", ((L > 0.5) * 255).astype(np.uint8))
print("flashA crop", (x0, y0, x1, y1), a.shape[::-1])

# ---------------------------------------------------------------- Flash B (éventail)
img = cv2.imread(f"{SRC}/04_flash_eventail_chrysanthemes.png")
L, a = flash_alpha(img)
x0, y0, x1, y1 = crop_to_content(a)
a = a[y0:y1, x0:x1].copy()
print("flashB crop", (x0, y0, x1, y1), a.shape[::-1])
# Les deux pompons (perle + houppe) sont découpés pour se balancer : rectangles en coords source
tassels = {"tasselL": (40, 425, 108, 585), "tasselR": (108, 425, 150, 585)}
for name, (tx0, ty0, tx1, ty1) in tassels.items():
    sub = a[ty0 - y0:ty1 - y0, tx0 - x0:tx1 - x0].copy()
    save_rgba(f"{OUT}/flashB_{name}.png", ink_layer(sub), sub)
    a[ty0 - y0:ty1 - y0, tx0 - x0:tx1 - x0] = 0
    print(name, "offset in flashB", (tx0 - x0, ty0 - y0), sub.shape[::-1])
save_rgba(f"{OUT}/flashB_ink.png", ink_layer(a), a)
full_b = flash_alpha(img)[1][y0:y1, x0:x1]
save_rgba(f"{OUT}/flashB_full.png", ink_layer(full_b), full_b)

# ---------------------------------------------------------------- Flash C (vase) : traits + ombrages séparés
img = cv2.imread(f"{SRC}/05_flash_vase_fleurs.png")
L, a = flash_alpha(img)
x0, y0, x1, y1 = crop_to_content(a, pad=30)
L = L[y0:y1, x0:x1]
a = a[y0:y1, x0:x1]
s = smoothstep(0.62, 0.38, L)  # 1 sur les traits noirs, 0 sur les gris
save_rgba(f"{OUT}/flashC_lines.png", ink_layer(a), a * s)
save_rgba(f"{OUT}/flashC_shade.png", ink_layer(a), a * (1 - s))
save_rgba(f"{OUT}/flashC_ink.png", ink_layer(a), a)
cv2.imwrite(f"{TMP}/flashC_bw.png", ((L > 0.5) * 255).astype(np.uint8))
print("flashC crop", (x0, y0, x1, y1), a.shape[::-1])

# ---------------------------------------------------------------- Croquis A (stylo bleu) : redressement + calques
img = cv2.imread(f"{SRC}/01_croquis_feuilles_stylo_bleu.jpg")


def line(p, q):
    return np.cross(np.array([*p, 1.0]), np.array([*q, 1.0]))


def inter(l1, l2):
    r = np.cross(l1, l2)
    return r[:2] / r[2]


# Marge verticale + deux lignes du cahier (mesurées par Hough) -> homographie frontale
M = line((392, 299), (678, 1559))
T = line((282, 668), (643, 597))
B = line((219, 1307), (681, 1181))
d = np.array([678 - 392, 1559 - 299.0]); d /= np.linalg.norm(d)
n = np.array([d[1], -d[0]])
off = 650
R = line((392 + n[0] * off, 299 + n[1] * off), (678 + n[0] * off, 1559 + n[1] * off))
tl, bl, tr, br = inter(T, M), inter(B, M), inter(T, R), inter(B, R)
h = np.linalg.norm(bl - tl); w = (np.linalg.norm(tr - tl) + np.linalg.norm(br - bl)) / 2
X0, Y0 = 300, 700
H = cv2.getPerspectiveTransform(np.float32([tl, bl, tr, br]),
                                np.float32([[X0, Y0], [X0, Y0 + h], [X0 + w, Y0], [X0 + w, Y0 + h]]))
warp = cv2.warpPerspective(img, H, (1600, 2000), flags=cv2.INTER_CUBIC, borderValue=(255, 255, 255))
cx0, cy0, cx1, cy1 = 84, 372, 884, 1604  # zone de page utile (sans bureau ni bord coupé)
page = warp[cy0:cy1, cx0:cx1]
np.save(f"{TMP}/croquisA_H.npy", H)
print("croquisA crop", (cx0, cy0, cx1, cy1))
ff = flat_field(page, 41)
ffl = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
b, g, r = ff[:, :, 0], ff[:, :, 1], ff[:, :, 2]
blue = np.clip((b - r) / 90.0, 0, 1) * smoothstep(0.97, 0.75, ffl)
blue = cv2.GaussianBlur(blue, (0, 0), 0.6)
blue_mask = (blue > 0.08).astype(np.uint8) * 255
blue_mask = cv2.dilate(blue_mask, np.ones((11, 11), np.uint8))
# calque "page" : lignes du cahier, marge, trous, sans le dessin (inpainting)
grayA = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
rulingA = ((grayA < 175) & (blue < 0.05)).astype(np.uint8) * 255
base = rebuild_ruling(grayA, blue_mask, rulingA)
# niveaux : papier bien blanc, gris doux
base = np.clip((base - 40) / (235 - 40) * 255, 0, 255)
hh, ww = base.shape[:2]
yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
edge = np.minimum.reduce([xx / 70, (ww - xx) / 90, yy / 70, (hh - yy) / 90])
feather = smoothstep(0, 1, np.clip(edge, 0, 1))
base = 255 - (255 - base) * feather
cv2.imwrite(f"{OUT}/croquisA_page.jpg", base.astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
# calque "dessin bleu" : couleur d'origine + alpha
rgb = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2RGB).astype(np.float32)
rgb = np.clip((rgb - 20) * 1.05, 0, 255)
alpha_blue = np.clip(blue * 1.25, 0, 1)
save_rgba(f"{OUT}/croquisA_ink.png", rgb, alpha_blue)
print("croquisA size", (ww, hh))

# ---------------------------------------------------------------- Croquis B (crayon) : page + éventail séparé
img = cv2.imread(f"{SRC}/03_croquis_eventail_vagues_crayon.jpg")
cx0, cy0, cx1, cy1 = 30, 92, 800, 1187
page = img[cy0:cy1, cx0:cx1]
ff = flat_field(page, 41)
g = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2GRAY)
dark = (g < 170).astype(np.uint8) * 255
hl = cv2.morphologyEx(dark, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (61, 1)))
drawing = cv2.subtract(dark, cv2.dilate(hl, np.ones((3, 1), np.uint8)))
drawing = cv2.morphologyEx(drawing, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
# polygone de l'éventail (coords de la page recadrée)
fan_poly = np.array([[370, 165], [470, 160], [770, 380], [760, 640], [700, 640], [455, 520], [395, 470],
                     [378, 420]], np.int32) - [0, 0]
fan_poly = np.array([[383, 170], [445, 165], [590, 210], [720, 300], [760, 400], [755, 610], [700, 640],
                     [455, 525], [400, 480], [375, 420]], np.int32)
poly_mask = np.zeros(g.shape, np.uint8)
cv2.fillPoly(poly_mask, [fan_poly], 255)
fan_draw = cv2.bitwise_and(cv2.dilate(drawing, np.ones((5, 5), np.uint8)), poly_mask)
fan_soft = cv2.GaussianBlur(cv2.bitwise_and(cv2.dilate(dark, np.ones((3, 3), np.uint8)), poly_mask), (0, 0), 1.2)
grayB = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
# zone de l'éventail : on recopie le profil réel des lignes (colonnes propres à gauche et à droite), avec leur pente
fillB = cv2.dilate(poly_mask, np.ones((9, 9), np.uint8))
xL0, xL1, xR0, xR1 = 336, 372, 760, 769
pL = np.median(grayB[:, xL0:xL1], axis=1); pR = np.median(grayB[:, xR0:xR1], axis=1)
best = (1e18, 0.0)
for dd in np.arange(-8, 8.01, 0.25):
    yy_ = np.arange(100, 1000)
    err = np.abs(np.interp(yy_ + dd, np.arange(len(pR)), pR) - pL[yy_]).sum()
    if err < best[0]: best = (err, dd)
slope = best[1] / ((xR0 + xR1) / 2 - (xL0 + xL1) / 2)
print('croquisB ruling slope', slope)
ys_, xs_ = np.where(fillB > 0)
xm = (xL0 + xL1) / 2
grayB[ys_, xs_] = np.interp(ys_ + slope * (xs_ - xm), np.arange(len(pL)), pL)
base = grayB
base = np.clip((base - 35) / (240 - 35) * 255, 0, 255)
hh, ww = base.shape[:2]
yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
edge = np.minimum.reduce([xx / 60, (ww - xx) / 80, yy / 70, (hh - yy) / 80])
feather = smoothstep(0, 1, np.clip(edge, 0, 1))
base = 255 - (255 - base) * feather
cv2.imwrite(f"{OUT}/croquisB_page.jpg", base.astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
gf = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
gf = np.clip((gf - 35) / (240 - 35), 0, 1)
fan_alpha = (1 - gf) * (fan_soft.astype(np.float32) / 255)
graphite = np.zeros((hh, ww, 3), np.float32); graphite[:] = (40, 38, 36)
save_rgba(f"{OUT}/croquisB_fan.png", graphite, np.clip(fan_alpha * 1.1, 0, 1))
cv2.imwrite(f"{TMP}/_croquisB_poly.jpg", cv2.polylines(cv2.cvtColor(g, cv2.COLOR_GRAY2BGR), [fan_poly], True, (0, 0, 255), 2))
print("croquisB size", (ww, hh))

# ---------------------------------------------------------------- Peau 1 (Procreate) : recadrage + tatouage isolé
img = cv2.imread(f"{SRC}/06_ornemental_bras_procreate.jpg")
# redressement affine de l'écran (bord haut du canvas incliné de ~7°)
Mrot = cv2.getRotationMatrix2D((585, 780), -7.0, 1.0)
rot = cv2.warpAffine(img, Mrot, (1170, 1560), flags=cv2.INTER_CUBIC, borderValue=(230, 230, 230))
cx0, cy0, cx1, cy1 = 150, 330, 940, 1500
page = rot[cy0:cy1, cx0:cx1]
ff = flat_field(page, 51)
g = cv2.cvtColor(ff.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
g = np.clip((g - 30) / (235 - 30) * 255, 0, 255)
tat = (g < 70).astype(np.uint8) * 255
tat = cv2.morphologyEx(tat, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
# retire les petites composantes isolées très fines (bruit), garde les points
n_cc, lab, stats, cents = cv2.connectedComponentsWithStats(tat)
keep = np.zeros_like(tat)
dots = []
for i in range(1, n_cc):
    x, y, w_, h_, area = stats[i]
    if area < 12:
        continue
    keep[lab == i] = 255
    if area < 260 and max(w_, h_) < 26:
        dots.append((float(cents[i][0]), float(cents[i][1]), float(max(w_, h_) / 2 + 1.5)))
tat_d = cv2.dilate(keep, np.ones((5, 5), np.uint8))
base = cv2.inpaint(np.clip(g, 0, 255).astype(np.uint8), tat_d, 5, cv2.INPAINT_TELEA).astype(np.float32)
# le trait de silhouette reste gris crayon
base = 255 - (255 - base) * 0.85
hh, ww = base.shape
yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
edge = np.minimum.reduce([xx / 80, (ww - xx) / 80, yy / 80, (hh - yy) / 80])
feather = smoothstep(0, 1, np.clip(edge, 0, 1))
base = 255 - (255 - base) * feather
cv2.imwrite(f"{OUT}/peau1_base.jpg", base.astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
ta = np.clip((150 - g) / 130, 0, 1) * (cv2.GaussianBlur(tat_d, (0, 0), 1.0).astype(np.float32) / 255)
save_rgba(f"{OUT}/peau1_tattoo.png", ink_layer(ta), ta)
dotmask = np.zeros_like(keep)
for (x, y, r_) in dots:
    cv2.circle(dotmask, (int(round(x)), int(round(y))), int(r_ + 2), 255, -1)
lines_only = cv2.subtract(keep, dotmask)
cv2.imwrite(f"{TMP}/peau1_bw.png", 255 - lines_only)
import json
json.dump({"size": [ww, hh], "dots": dots}, open(f"{TMP}/peau1_dots.json", "w"))
print("peau1 size", (ww, hh), "dots", len(dots))
# V2 : silhouette seule (traits gris nets, sans les traces de l'inpainting), pour un tracé propre
gb = g / 255.0
sil = smoothstep(0.93, 0.62, gb) * (1 - cv2.dilate(tat_d, np.ones((7, 7), np.uint8)).astype(np.float32) / 255)
sil = cv2.morphologyEx((sil * 255).astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)).astype(np.float32) / 255
n_cc, lab, stats, _ = cv2.connectedComponentsWithStats((sil > 0.3).astype(np.uint8))
keep_s = np.zeros(sil.shape, bool)
for i in range(1, n_cc):
    if stats[i][4] >= 40:
        keep_s |= lab == i
sil = sil * cv2.dilate(keep_s.astype(np.uint8), np.ones((3, 3), np.uint8))
save_rgba(f"{OUT}/peau1_sil.png", ink_layer(sil), np.clip(sil * 1.15, 0, 1))
cv2.imwrite(f"{TMP}/peau1sil_bw.png", ((sil < 0.35) * 255).astype(np.uint8))

# ---------------------------------------------------------------- Peau 2 (pied néo-tribal) : redressement + tirage
img = cv2.imread(f"{SRC}/07_neotribal_pied_mockup.jpg")
hh0, ww0 = img.shape[:2]
Mrot = cv2.getRotationMatrix2D((ww0 / 2, hh0 / 2), 13.45, 1.0)
rot = cv2.warpAffine(img, Mrot, (ww0, hh0), flags=cv2.INTER_CUBIC, borderValue=(255, 255, 255))
cv2.imwrite(f"{TMP}/_peau2_rot.jpg", rot)

c = rot[150:1320, 140:930]
g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY)
dark = (g < 70).astype(np.uint8)
dark[430:, 341:347] = 0
ncc, labs, sts, _ = cv2.connectedComponentsWithStats(dark, connectivity=4)
Hh, Ww = g.shape
yy, xx = np.mgrid[0:Hh, 0:Ww]
tm = np.zeros_like(dark)
for i in range(1, ncc):
    x, y, w_, h_, area = sts[i]
    if x <= 0 or y <= 0 or x + w_ >= Ww or y + h_ >= Hh or area < 40:
        continue
    tm[labs == i] = 1
yy, xx = np.mgrid[0:Hh, 0:Ww]
skin0 = (g > 92).astype(np.uint8) * 255
region = cv2.morphologyEx(skin0, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (71, 71)))
region = cv2.erode(region, np.ones((5, 5), np.uint8))
gap = (xx < 344) & (yy > 430)
tm = (tm > 0) | ((g < 70) & (region > 0) & ~gap)
tm = tm.astype(np.uint8) * 255
# ne garde que les formes pleines du tribal (pas les contours fins de la jambe)
dt = cv2.distanceTransform(tm, cv2.DIST_L2, 5)
ncc4, lab4, st4, _ = cv2.connectedComponentsWithStats(tm)
clean = np.zeros_like(tm)
for i in range(1, ncc4):
    m = lab4 == i
    if st4[i][4] > 300 and dt[m].max() > 5:
        clean[m] = 255
tm = clean
tm = cv2.morphologyEx(tm, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
tmd = cv2.dilate(tm, np.ones((7, 7), np.uint8))
soft = np.clip((165 - g.astype(np.float32)) / 120, 0, 1) * (cv2.GaussianBlur(tmd, (0, 0), 1.2) / 255.0)
rgb = cv2.cvtColor(c, cv2.COLOR_BGR2RGB).astype(np.float32)
save_rgba(f"{OUT}/peau2_tribal.png", rgb, soft)
base = cv2.inpaint(c, cv2.dilate(tmd, np.ones((5, 5), np.uint8)), 9, cv2.INPAINT_TELEA)
# contour au pochoir, comme un stencil posé avant le remplissage
cnts, _ = cv2.findContours(tm, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
stencil = base.copy()
cv2.drawContours(stencil, cnts, -1, (40, 40, 40), 2, cv2.LINE_AA)
base = cv2.addWeighted(base, 0.45, stencil, 0.55, 0)
# V2 : jambe et pied détourés, posés sur un fond encre uni (plus de damier)
skin = (g > 92).astype(np.uint8) * 255
skin = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
ncc2, lab2, st2, _ = cv2.connectedComponentsWithStats(skin)
leg = np.zeros_like(skin)
for i in range(1, ncc2):
    if st2[i][4] > 20000:
        leg[lab2 == i] = 255
leg = cv2.bitwise_or(leg, tmd)
# bouche les petits trous (ongles, ombres) sans combler l'espace entre les jambes
inv = cv2.bitwise_not(leg)
ncc3, lab3, st3, _ = cv2.connectedComponentsWithStats(inv)
for i in range(1, ncc3):
    if st3[i][4] < 6000:
        leg[lab3 == i] = 255
leg = cv2.morphologyEx(leg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
legf = cv2.GaussianBlur(leg, (0, 0), 1.2).astype(np.float32)[..., None] / 255
inkbg = np.zeros_like(base, np.float32); inkbg[:] = (0x10, 0x11, 0x12)
base = (base.astype(np.float32) * legf + inkbg * (1 - legf)).astype(np.uint8)
cv2.imwrite(f"{OUT}/peau2_base.jpg", base, [cv2.IMWRITE_JPEG_QUALITY, 92])
print("peau2 size", (Ww, Hh))
