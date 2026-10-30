# nudge video — copie allégée

Copie de travail de `C:\Users\annea\nudge-video` : uniquement les sources des deux films, sans rendus,
brouillons, captures ni caches. Tout ce qui manque se régénère avec les commandes ci-dessous.

## demineur-urbain (bloc 1, « 5 tonnes »)
- `index.html` + `compositions/scene3d.html` : le film (Three.js, 18,5 s, 60 i/s).
- `assets/` : polices Bungee et Ultra, bruitages + `sfx/CREDITS.md`.
- `cues.mjs` : génère les balises `<audio>` (`node cues.mjs` affiche le bloc à coller dans index.html).
- `SPEC.md`, `REVIEW.md` : intention, révisions, réglages de rendu et de mastering.
- Rendu : `npx hyperframes render --quality delivery --fps 60 --workers 2 -o renders/demineur-urbain_1080p60.mp4`,
  puis mastering du son (voir SPEC.md, révision 5).

## suspects (bloc 2, « Les suspects »)
- `index.html` + `compositions/` (titre, fond, fiche-1 à 5, final) ; `solo/` : chaque fiche seule.
- `assets/fiche.css`, `assets/fiche.js` : style et construction communs des fiches ; `chroma-vert.mp4`.
- `cues.mjs` → son + `SFX.md` ; `finish.mjs` → flou de mouvement, mastering, WAV.
- Rendu et fiches seules : voir `REVIEW.md`, section « Refaire ».

## outils/
Scripts d'appoint : `peaks.mjs` (crête et attaque d'un son), `measure.mjs` (largeur d'un texte dans une
police TTF), `freesound.mjs` / `commons.mjs` (recherche de sons libres), `lights.mjs` (lumières de ville).

Rien à installer : le CLI HyperFrames se lance par `npx` (version figée dans chaque `package.json`).
