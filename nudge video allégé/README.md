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

## transition-caca (transition de 2 s)
- `index.html` (vague marron, ouverture, gouttes, son) + `compositions/plan-a.html`, `plan-b.html`.
- 1920×1080, 60 i/s : la crotte de `suspects/compositions/fiche-2.html` tombe et s'écrase à 0,5 s, la vague
  #8a5326 couvre tout l'écran au plus tard à 1,0 s, puis s'ouvre sur le plan B (#0d1230 → #2ec4b6).
- `assets/` : Bungee, 3 sons copiés de `suspects/assets/sfx` (+ `CREDITS.md`), GSAP 3.14.2 en local.
- `renders/` : le MP4 et `apercu.jpg` (planche de contrôle).
- Rendu : `npx hyperframes render --quality delivery --fps 60 --workers 2 -o renders/transition-caca_1080p60.mp4`.

## outils/
Scripts d'appoint : `peaks.mjs` (crête et attaque d'un son), `measure.mjs` (largeur d'un texte dans une
police TTF), `freesound.mjs` / `commons.mjs` (recherche de sons libres), `lights.mjs` (lumières de ville).

Rien à installer : le CLI HyperFrames se lance par `npx` (version figée dans chaque `package.json`).
