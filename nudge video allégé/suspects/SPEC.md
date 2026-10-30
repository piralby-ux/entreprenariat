# SPEC — Les suspects (bloc 2)

Révision 1 (demandée) : plus de nom latin sur les fiches ; barre de la fenêtre = nom du profil seul (sans « — ENTRETIEN »).

## Relevé du bloc 1 (demineur-urbain : SPEC.md, compositions/scene3d.html, index.html, cues.mjs)
- Ciel : horizon #ff8a2a, rose #ff5d8f, haut #2a3a8f · vide #0a0b0d · rim froide #4a6fa5 · key soleil #ffb866 · lumière « moteur » #fff3e6.
- Cases (danger) : 0 voisin = bleu #3a86ff / turquoise #2ec4b6 / violet #8a5cf6 ; 1 = #ffd23f ; 2 = #ff8c42 ; 3+ = #ff3c38 ; case minée crème #f1e7d6. Rouge du contour d'impact #e8352a.
- Crotte : marron #8a5326 (éclairci de #6b3f1d), profil de révolution 3 étages + pointe inclinée vers +x (Ø 0,27 m, h 0,194 m, spirale ±7 %), brillance clearcoat ; à l'échelle ville : × 1,8 et marron × 0,45 dans le plan lointain.
- Biseau des cases : arête claire en haut-gauche (vers la rim), sombre en bas-droite ; épaisseur 4 cm + biseau 1,5 cm.
- Polices : Bungee (machine à sous, OFL) et Ultra (« 5 TONNES », Apache 2.0) copiées depuis assets/fonts ; Space Mono (bundle) pour les jauges et citations ; EB Garamond (bundle) en italique.
- Lumière : key chaude basse (#ffb866, 8° d'élévation, au fond), rim froide arrière-gauche (#4a6fa5, 1,1).
- Flash du pas : désaturation 100 % → 15 % puis retour en 0,5 s (3,0 → 3,5 s), le marron gardait sa couleur.
- Rendu : 60 i/s ; flou de mouvement = 4 sous-images sur un obturateur à 180° (1/120 s) moyennées.
  Au bloc 1 c'était fait DANS le moteur Three.js. En CSS 3D le moteur ne le fait pas : rendu à
  480 i/s puis ffmpeg moyenne 4 images consécutives sur 8 → mêmes 4 sous-images sur 1/120 s.
- Son : banque Pixabay du CLI + Freesound CC0 (+ CC BY Gravity Sound / Werstas) ; cue sheet générée
  par script (cues.mjs) : chaque son culmine 1 image (1/60 s) après son événement ; pistes attribuées
  sans chevauchement à partir de data-track-index 10.
- Mastering après rendu : +4,5 dB puis alimiter limit=0.8 attack=2 release=60 level=disabled,
  AAC 256 k, vidéo copiée. Bloc 1 : −15,8 LUFS, crête −1,7 dBTP.
- Dernier mot au bloc 1 : « 5 TONNES » = poids de 1 000 × 330 px, lettrage Ultra 124 px.

GOAL : un guide d'espèces au sérieux de documentaire animalier ; le rire vient de la rigueur, jamais du mépris.
OUTPUT : HyperFrames, 1920 × 1080, 60 i/s, 30,0 s (1 800 images), bruitages seuls, + 5 MP4 « fiche seule » + WAV.

## Couleurs des profils (teintes exactes du bloc 1 ; biseau : clair = +40 % vers blanc, sombre = × 0,65)

| # | profil | case du bloc 1 | bande | biseau clair | biseau sombre |
|---|---|---|---|---|---|
| 1 | L'INVISIBLE | 0 voisin, turquoise | #2ec4b6 | #82dcd3 | #1e7f76 |
| 2 | LE MINIMALISTE | 1 voisin | #ffd23f | #ffe48c | #a68929 |
| 3 | LE PHILOSOPHE | 0 voisin, violet | #8a5cf6 | #b99dfa | #5a3ca0 |
| 4 | LE CONTRIBUABLE | 2 voisins | #ff8c42 | #ffba8e | #a65b2b |
| 5 | LE PROCRASTINATEUR | 3+ voisins | #ff3c38 | #ff8a88 | #a62724 |

Fiche = dalle crème #f1e7d6 (la case minée), encre #0a0b0d ; tranche de 14 px = 7 couches #1a1d29 à 2 px.
Tampon « COUPABLE : PERSONNE » = rouge 3+ #ff3c38. Fond : #0d1230 → #151a3c → #24183a (haut du ciel
#2a3a8f et rose #ff5d8f assombris à ~25 %), un seul dégradé linéaire ; 20 disques de ville (#ffb866,
#ffd23f, #ff5d8f, #3a86ff, #fff3e6), opacité 0,14–0,45, Ø 12–78 px, PRNG mulberry32(0x5u5) figé dans le HTML.

## Timecodes (fermes)

| scène | global | notes |
|---|---|---|
| titre | 0,0 – 2,8 | contenu à l'image 0 ; balayage 0,25 → 1,35 ; sortie 2,5 → 2,8 (chevauche l'arrivée de la fiche 1, comme les fiches entre elles, pour tenir la règle 0,5 + 0,3 s/mot du sous-titre de 7 mots = 2,6 s) |
| fiche 1 | 2,5 – 7,3 | |
| fiche 2 | 7,0 – 11,8 | |
| fiche 3 | 11,5 – 16,3 | |
| fiche 4 | 16,0 – 20,8 | |
| fiche 5 | 20,5 – 25,3 | |
| final | 25,3 – 30,0 | |

## Anatomie d'une fiche (temps local, 4,8 s)

Plateau : fiche 700 × 960 à x 96, y 60 ; fenêtre 1000 × 562 (+ barre 56) à x 820, y 210 ; citation à y 860.
Fiche : bande 220 (biseau 10 px) avec pastille PROVISOIRE (Space Mono 28, encre sur crème inversée) ;
rouleau du nom 652 × 84 à y 236 (Bungee 64 ; « LE PROCRASTINATEUR » mesure 770 px > 652 : compressé
en largeur × 0,84 dans sa case, seule exception) ; latin EB Garamond italique 40 à y 330 ;
portrait 652 × 330 à y 392 ; 3 jauges à y 748 / 806 / 864 (libellé Space Mono 28 + barre 10 segments).

| t | quoi | ease |
|---|---|---|
| 0,00–0,45 | arrivée : rotateY 80° → −8°, z −700 → 0, x +260 → 0 ; reflet de rim sur l'arête gauche 0 → 0,9 → 0,35 | power3.out |
| 0,45–1,10 | rouleau : 11 cases (les 5 noms × 2 + le bon), y → −10 × 84 | back.out(1.3) |
| 1,10–1,50 | latin lettre par lettre (spans posés à l'init) | 1 lettre / 0,4 s ÷ n |
| 1,20–1,50 | fenêtre scaleY 0 → 1 | power3.out |
| 1,20–4,20 | ampoules : 20 disques, chenillard 12 pas/s | — |
| 1,45–2,25 | jauges, décalées de 0,12 s, 0,5 s chacune | power2.out |
| 1,55 | citation (opacité + y 16 → 0, 0,3 s) | power3.out |
| 1,20–4,20 | gag (ci-dessous) | |
| 4,20–4,45 | fenêtre scaleY 1 → 0 | power3.in |
| 4,20–4,80 | fiche : x → −980, rotateY → 38°, rotateZ → −7°, opacité 1 → 0 sur 4,55–4,80 | power3.in |

Dérive caméra : rotateY du plateau = −0,5° + 1° × power3.inOut(T / 30), T = temps global (même formule dans chaque scène).

## Gags (zone portrait 652 × 330, temps local)

1. INVISIBLE — silhouette en pointillés (bordure 4 px dashed, opacité 0,35) au centre ; 8 fenêtres
   (4 de chaque côté, 70 × 80, cadre encre, œil = disque blanc + pupille). Balayage radar (barre
   verticale turquoise) 1,5 → 3,1 de gauche à droite ; chaque œil se ferme (paupière scaleY 0 → 1,
   0,12 s) quand la barre le passe. « TÉMOINS : 8 » → décompte jusqu'à « TÉMOINS : 0 » à 3,1.
2. MINIMALISTE — crotte (profil du bloc 1, en SVG, #8a5326, reflet clearcoat) + règle jaune graduée
   « 4 cm ». 1,3 : « dimension déclarée : négligeable ». 1,9 → 2,3 : règle × 3,2 en largeur
   (graduations jusqu'à « 13 cm »), crotte × 2,4 (pop, back.out(2)) ; 1re légende barrée à 2,3 ;
   2,3 : « dimension réelle : une autre histoire ».
3. PHILOSOPHE — buste de marbre (SVG, #e9e4f2 / #b8b0cc) sur socle ; calendrier : 6 pages qui se
   tournent 1,5 → 3,0 (rotateX 0 → −110°, 0,25 s) ; piéton 40 px traverse 2,4 → 3,9 (marche à 3 Hz).
   1,2 : « Durée de décomposition : » ; 2,2 : « le temps que quelqu'un marche dedans. »
4. CONTRIBUABLE — ticket blanc qui se déroule (hauteur 0 → 280, 1,3 → 2,4, power2.out, bord dentelé
   en clip-path) : 1,4 « Impôts locaux ... {impots_montant} € — PAYÉ » (PAYÉ tamponné vert #2ec4b6
   à 1,9) ; 2,4 « Ramasser ce truc ... non inclus ». Agent municipal 46 px au pied avec un balai
   qui balaye (rotate ±14°, 2 Hz).
5. PROCRASTINATEUR — sac plastique blanc avec 2 yeux (clignent à 2,0 et 3,6) face à une silhouette
   immobile ; horloge : aiguille 3 tours 1,6 → 3,4 (power2.inOut) puis s'arrête ; case « ramasser »
   vide ; étiquette « demain » qui se pose à 3,4.

## Final (temps local 0 = 25,3 s)

| t local | global | quoi |
|---|---|---|
| 0,0–0,9 | 25,3–26,2 | 5 fiches (versions réduites : bande, nom, silhouette de suspect, jauges) arrivent en éventail : pivot en bas, rotateZ (i−2) × 11°, z décalés |
| 0,9–1,7 | 26,2–27,0 | éventail → ligne (x (i−2) × 780), plateau rotateY −10° → −4° ; caméra z −700 → −2 290 (« recule de 6 m », échelle 0,72 → 0,44 : nom à 28 px à l'écran) | power3.inOut |
| 1,7 + 0,15 i | 27,0 → 27,6 | tampon i : scale 2,4 → 1, rotate −24° → −12°, 0,12 s power3.in, écrasement 0,92 ; secousse ±7 px amortie 0,2 s |
| 1,7 | 27,0 | flash de désaturation : saturate 0,15 → 1 en 0,5 s (power2.in) sur tout le cadre (fond compris) |
| 2,0–3,5 | 27,3–28,8 | caméra continue −2 290 → −2 380 (power3.out) |
| 3,5–4,7 | 28,8–30,0 | tenue 1,2 s |

Tampon : Bungee 72 px sur 2 lignes « COUPABLE : / PERSONNE », cadre 10 px #ff3c38, ≈ 520 × 200 en
espace fiche = 229 × 88 px à l'écran (le « 5 TONNES » faisait 1 000 × 330) ; opacité 0,92.

## Variables

Déclarées dans chaque fiche (compositions/fiche-N.html), valeurs posées par l'hôte dans index.html
(`data-variable-values`) et dans solo-N.html :
`mauvaise_foi_N`, `frequence_N`, `discretion_N` (0–10, défaut 5), `citation_N` (texte du profil),
`provisoire_N` (booléen, défaut true), `interview_src_N` (défaut assets/chroma-vert.mp4, aplat #00ff00
1000 × 562, muet). Fiche 4 en plus : `impots_montant` (défaut « [X] »).

## Son → SFX.md (cue sheet générée par cues.mjs)

Règle : pendant 1,2–4,2 s de chaque fiche, tout son est × 0,25 (−12 dB) et aucun impact sec.

## BANNED

bordure arrondie · glassmorphism · flou CSS · grille en fond · rebond hors pops et rouleau · mouvement
linéaire (sauf chenillard/aiguille) · Math.random · Date.now · repeat:-1 · from() · > 40 éléments
filter/radial-gradient/clip-path · texte < 28 px à l'écran.
