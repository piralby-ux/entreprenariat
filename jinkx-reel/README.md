# Jinkx Tatoo — « Du carnet à la peau »

Reel Instagram de lancement, réalisé avec **HyperFrames** (HTML + CSS + GSAP → MP4).
1080 × 1920, 30 fps, 22 s, en boucle (la dernière image est la première : le carnet fermé).

## Livrables (`out/`)

| Fichier | Contenu |
|---|---|
| `jinkx-reel_v2_22s_silent.mp4` | **V2** — le Reel, **sans son** (la musique sera ajoutée dans Instagram) |
| `jinkx-reel_v2_22s_sfx.mp4` | **V2** — la même vidéo avec la piste de sound design |
| `jinkx-reel_22s_silent.mp4`, `jinkx-reel_22s_sfx.mp4` | V1 (archive) |
| `sfx.wav` | Sound design seul, synthétisé (aucun sample) |
| `jinkx-reel_cover.png` | Image de couverture 1080 × 1920 (flash éventail, « Jinkx », sceau) |

## Timeline V2 (tempo implicite 100 BPM, un temps = 0,6 s)

| Temps | Plan | Ce qui se passe |
|---|---|---|
| 0,0 → 2,4 | 1 · Carnet | Dès la frame 0, la caméra descend sur le carnet (1,15 → 1) ; sceau « J » ×2 ; **0,3** la couverture s'ouvre ; plongée dans la page de droite |
| 2,4 → 5,4 | 2 · Page 1 | Croquis A au stylo bleu ; **3,0** le flash A se trace (départ des traits en pointe), le bleu se désature puis s'efface ; **4,2** `FLASH — ENCRE`, brise dans les feuilles |
| 5,4 → 5,9 | Tourne de page | Vraie feuille qui tourne autour de la spirale (8 bandes 3D, courbure souple), verso plus sombre avec le dessin en transparence à 8 %, ombre dynamique |
| 5,9 → 8,4 | 2 · Page 2 | Croquis B ; l'éventail s'ouvre depuis le rivet ; **6,6** flash B pétale par pétale ; **7,8** `FLASH — 17.10`, pompons ; la caméra plonge dans le rivet |
| 8,4 → 9,0 | Dissolution | L'encre de l'éventail se dissout comme une goutte dans l'eau (nuages de papier aux bords effilochés, turbulences animées) |
| 8,85 → 11,4 | 3 · Aiguille | Machine rotative « pen » (grip strié, bague, pointe métal, câble RCA) : trace le vase, se lève entre deux traits, vibre seulement en traçant, ombre courte |
| 11,4 → 13,2 | 3 · Match cuts | Gros plans d'encre sur papier uni, même centre : vase → éventail → feuilles → chrysanthème → herbes → vase |
| 13,2 → 13,8 | Match cut de forme | Le haut du vase s'efface (front d'encre turbulent), les longues herbes restent et passent la main à la silhouette du bras |
| 13,8 → 15,6 | 4 · Bras | Silhouette nette (gris crayon 60 %), tatouage au tiers central, points sur la grille |
| 15,6 → 17,4 | 4 · Pied | La caméra glisse vers le bas : le tirage du pied arrive seul (70 % de la largeur), détouré sur fond encre ; le tribal se remplit |
| 17,4 → 18,0 | Rétractation | L'encre se rétracte en douceur vers le point où la plume va commencer |
| 18,0 → 21,0 | 5 · Signature | Wordmark « Jinkx » à pleins et déliés (Pinyon Script, 750 px) révélé par un masque qui suit le tracé central, goutte et points ornementaux ; CTA complet à 19,5 s ; **19,8** tampon |
| 21,0 → 22,0 | Boucle | Recul vers le carnet (échelle 1,15), la couverture se referme → première image |

## Modifier la ville du CTA

Sans ville renseignée, la ligne « TATOUEUSE · … » n'apparaît pas. Pour l'ajouter :

```bash
npx hyperframes render -o out/jinkx-reel_v2_22s_silent.mp4 -q delivery -f 30 --variables '{"ville":"Lyon"}'
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
ffmpeg -i out/jinkx-reel_v2_22s_silent.mp4 -i out/sfx.wav -c:v copy -c:a aac -b:a 192k -shortest out/jinkx-reel_v2_22s_sfx.mp4
```

## Préparation des images (résumé)

- **Flashs (02, 04, 05)** : luminance → alpha avec seuil doux ; les gris restent semi-transparents. Le vase est séparé en traits et ombrages ; les pompons de l'éventail sont découpés pour se balancer.
- **Croquis photographiés (01, 03)** : correction de perspective (homographie sur la marge et les lignes du cahier), mise à plat de l'éclairage, niveaux. Le dessin est isolé sur son propre calque ; sous lui, les lignes du cahier sont reconstruites.
- **Alignement** : similitude calculée sur les extrémités du dessin (A) et sur le rivet et les baguettes (B).
- **Vectorisation** : potrace sur les flashs A, C et sur le tatouage du bras. Les chemins servent uniquement de **masque** (`stroke-dasharray`) ; on voit toujours le vrai trait raster de l'artiste.
- **Peau 2** : rotation de 13,45° annulée, recadrage dans le damier, tribal isolé pour le remplissage.
