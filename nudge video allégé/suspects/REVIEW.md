# REVIEW — Les suspects (livraison 1)

## Fichiers (renders/)
- `suspects_1080p60.mp4` — assemblage 30,0 s, 1 800 images à 60 i/s, son masterisé.
- `suspects_fiche-1_1080p60.mp4` … `fiche-5` — chaque fiche seule, 4,8 s (288 images), fond et sons inclus.
- `suspects_audio.wav` — piste son seule, masterisée, 48 kHz / 24 bits, 30,0 s.
- `raw/` — rendus bruts à 240 i/s (avant flou et mastering), à garder pour refaire le flou sans re-rendre.

## Mesures
- Son : −14,8 LUFS intégré, crête −1,6 dBFS (bloc 1 : −15,8 LUFS, −1,7 dBTP).
- Fenêtres d'interview : moyenne −34 à −36 dB contre −13,6 dB hors fenêtre (≈ 20 dB plus bas).
- Image : aucune image noire (luminance moyenne mini 37/255), durées et cadences exactes.
- Contrôle : 0 erreur. Avertissements restants voulus (départ des vidéos d'interview compté
  localement à 1,2 s ; contraste des noms du rouleau mesuré hors fenêtre).

## Écarts assumés
- Flou : le CLI rend à 240 i/s maximum (pas 480). Chaque image à 60 i/s moyenne ses 4 sous-images à
  240 i/s, pondérées 1-3-3-1 (≈ obturateur 180° du bloc 1) — `finish.mjs`.
- « LE PROCRASTINATEUR » compressé × 0,84 en largeur (770 px de Bungee 64 pour 652 px).
- Titre jusqu'à 2,8 s (sortie superposée à l'arrivée de la fiche 1) pour la règle de lecture.
- Flash de désaturation du final : tout le cadre, sans préserver le marron (impossible en CSS).
- Fiches du final réduites (bande, nom, silhouette) : latin et jauges seraient sous 28 px.
- Variables : réglées sur chaque hôte (`data-variable-values` dans index.html et solo/solo-N.html).
  `impots_montant` vaut « [X] » par défaut.

## Refaire
`node cues.mjs` (son) → `npx hyperframes render --fps 240 --quality delivery --workers 2 -o renders/raw/suspects_240.mp4`
→ `node finish.mjs renders/raw/suspects_240.mp4 renders/suspects_1080p60.mp4 renders/suspects_audio.wav`.
Fiche seule N : copier solo/solo-N.html à la racine le temps du rendu (`-c solo-N.html`), puis l'enlever.
