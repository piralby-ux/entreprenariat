# Jinkx Tatoo — « Du carnet à la peau »

Reel Instagram de lancement, réalisé avec **HyperFrames** (HTML + CSS + GSAP → MP4).
1080 × 1920, 30 fps, 22 s, en boucle (la dernière image est la première : le carnet fermé).

## Livrables (`out/`)

| Fichier | Contenu |
|---|---|
| `jinkx-reel_22s_silent.mp4` | Le Reel, **sans son** (la musique sera ajoutée dans Instagram) |
| `jinkx-reel_22s_sfx.mp4` | La même vidéo avec la piste de sound design |
| `sfx.wav` | Sound design seul, synthétisé (aucun sample) |
| `jinkx-reel_cover.png` | Image de couverture 1080 × 1920 (flash éventail, « Jinkx », sceau) |

## Timeline (tempo implicite 100 BPM, un temps = 0,6 s)

| Temps | Plan | Ce qui se passe |
|---|---|---|
| 0,0 → 2,4 | 1 · Carnet | Carnet fermé (sceau « J », `SKETCHBOOK — 2026`), il respire ; **0,6** la couverture s'ouvre d'un coup (3D, ombre qui balaie la page) ; plongée caméra dans la page de droite |
| 2,4 → 5,4 | 2 · Page 1 | Croquis A au stylo bleu ; `CROQUIS — STYLO BILLE` ; **3,0** le flash A se trace par-dessus (masque potrace), le bleu se désature puis s'efface, les lignes pâlissent ; **4,2** `FLASH — ENCRE`, brise dans les feuilles |
| 5,4 | Tourne de page | Rotation 3D sur la spirale, ombre dynamique, « tac » |
| 5,4 → 8,4 | 2 · Page 2 | Croquis B (crayon) ; l'éventail s'ouvre depuis le rivet ; **6,6** le flash B se déploie pétale par pétale ; **7,8** `FLASH — 17.10`, les pompons se balancent |
| 8,4 → 11,4 | 3 · Aiguille | Révélation à l'encre depuis le rivet ; la machine entre par la droite et retrace le vase (contour, puis fleurs et longues herbes), éclaboussures, vibration ; puis les gris arrivent en ombrage |
| 11,4 → 13,2 | 3 · Match cuts | Toutes les 0,3 s : vase → éventail → feuilles → chrysanthème → mèche du croquis B → vase, avec un flash papier de 2 frames |
| 13,2 → 18,0 | 4 · Sur peau | L'encre coule et révèle le bras (Procreate) ; le tatouage ornemental se trace, les points tombent sur la grille ; **15,6** le tirage du pied glisse et se pose (−4°), le tribal se remplit de haut en bas ; **17,4** l'encre se rétracte en un point |
| 18,0 → 21,0 | 5 · Signature | « Jinkx » s'écrit à la main (monoline) ; **19,8** le sceau vermillon se tamponne ; CTA |
| 21,0 → 22,0 | Boucle | Recul vers le carnet, la couverture se referme depuis la gauche → première image |

## Modifier la ville du CTA

Le CTA affiche `TATOUEUSE · [VILLE]` par défaut. Pour la ville réelle :

```bash
npx hyperframes render -o out/jinkx-reel_22s_silent.mp4 -q delivery -f 30 --variables '{"ville":"Lyon"}'
```

## Structure

- `index.html` : composition racine (22 s), textures globales (grain papier `feTurbulence`, fibres, vignettage chaud, grain film animé toutes les 2 frames).
- `compositions/` : une scène par plan (`carnet`, `croquis`, `aiguille`, `peau`, `signature`).
- `assets/lib/inkkit.js` : outils partagés (caméra « à l'épaule » périodique sur la boucle, révélation par masque potrace, formes d'encre, gouttes).
- `assets_src/` : images originales de Jinkx (non modifiées).
- `scripts/` : préparation des images et des données, puis rendu.

## Régénérer

```bash
npm install
pip install opencv-python-headless scikit-image numpy pillow
npm run assets     # images détourées, alignements, vectorisation potrace, signature, sfx.wav
npm run check      # contrôle HyperFrames
npm run render     # MP4 sans son
npm run cover      # image de couverture
ffmpeg -i out/jinkx-reel_22s_silent.mp4 -i out/sfx.wav -c:v copy -c:a aac -b:a 192k -shortest out/jinkx-reel_22s_sfx.mp4
```

## Préparation des images (résumé)

- **Flashs (02, 04, 05)** : luminance → alpha avec seuil doux ; les gris restent semi-transparents. Le vase est séparé en traits et ombrages ; les pompons de l'éventail sont découpés pour se balancer.
- **Croquis photographiés (01, 03)** : correction de perspective (homographie sur la marge et les lignes du cahier), mise à plat de l'éclairage, niveaux. Le dessin est isolé sur son propre calque ; sous lui, les lignes du cahier sont reconstruites.
- **Alignement** : similitude calculée sur les extrémités du dessin (A) et sur le rivet et les baguettes (B).
- **Vectorisation** : potrace sur les flashs A, C et sur le tatouage du bras. Les chemins servent uniquement de **masque** (`stroke-dasharray`) ; on voit toujours le vrai trait raster de l'artiste.
- **Peau 2** : rotation de 13,45° annulée, recadrage dans le damier, tribal isolé pour le remplissage.
