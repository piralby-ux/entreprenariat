# SPEC — Démineur urbain

## Révision 6 — bloc1-v2 (demandée) — prime sur tout ce qui suit

1. Insertion à I = 14,6 s (ancienne timeline) : la montée est finie (14,3 s), le compteur s'emballe depuis 14,0 s, les rouleaux n'ont pas commencé (14,7 s).
2. Le film passe de 18,5 s à 23,0 s (Δ = +4,5 s, 1 380 images à 60 i/s). T0 (le tampon s'écrase) = 15,58 s.
3. Tout ce qui était à t ≥ 14,6 s est décalé de +4,5 s (rouleaux 19,2 s, voile 19,6 s, poids 19,78 → impact 19,98 s = T0 + 4,4) ; rien avant 14,6 s ne bouge.
4. La 3D ne se décale pas : c'est le plan-séquence, elle continue en temps réel (montée lente +3,5 % pendant l'insert, grille qui éclot toujours) ; seuls la 2D et le son se décalent.
5. Le compteur reste à l'écran : sa valeur suit les crottes en temps réel, son emballement (× (1 + 1,5 r + 2,2 r³)) est gelé à r = 0,6 pendant l'insert puis reprend.

### Détail

- Tampon « INDICE N°1 — LES CHIFFRES » : entrée 15,50 → 15,58 (×1,9 → 1, power4.in, −7°), flash 1 image,
  tremblement de caméra ±1,2° amorti 0,25 s (3D), 12 gouttes d'encre (mulberry32 fixe), tenue jusqu'à
  16,48, rétrécit à 35 % en haut à gauche 16,48 → 16,83 (power3.inOut), disparaît à 19,78.
- « + de 50 000 chiens à Toulouse » : visible 16,48 ; le nombre roule 16,48 → 18,68 (power2.out, rouleaux
  à retenue) ; « + de » claque 18,68 (back.out(2)) ; sortie vers le haut 19,48 → 19,78 (power3.in).
- Horde (dans le pipeline 3D, après la ville et avant la 2D, donc floutée par les 4 sous-images) :
  45 chiens, 9 races dessinées en code, 6 poses de galop, sprites instanciés, atlas fait au chargement.
  Écart assumé : traversées 1,6 / 1,9 / 2,3 s (devant / milieu / fond) au lieu de 2,4 / 3,0 / 3,6 s,
  sinon la horde sortirait après le poids (entrées 16,28 → 16,78, toute la horde sortie à ≈ 18,8).
  Teckel : entre avec la tête de la horde (16,38), se fait doubler par tous, sort à 19,18 (T0 + 3,6).
- Poids : impact 19,98 ; recul de caméra 3 % (0,3 s, power3.out) ; textes à 20,38 et jusqu'à 23,0.
- Variables (index.html) : dogs_prefix, dogs_number, tonnage_text, tonnage_sub, weight_label, sources_line.
- Technique : three.js 0.184.0 et GSAP 3.14.2 copiés dans assets/vendor (le CDN n'est pas joignable
  depuis l'environnement de rendu) ; mêmes versions qu'avant.

## Révision 5 (demandée) — prime sur tout ce qui suit

- 0 → 1 = machine à sous (Bungee, OFL) : rouleau unique 260 × 300 px dans une caisse rouge
  #ff3c38 à liseré doré #ffd23f, 20 ampoules (chenillard à 24 pas/s pendant la rotation,
  clignotement 12 Hz au gain). 3,02 s : apparition (×0,15 → ×1,3, rotation −14° → 0,
  back.out 2,2). 3,1 → 3,74 s : 21 cases de défilement (back.out 1,1), flou 8 px au plus vite.
  3,74 s : secousse de gain ; 3,76 s : « +1 » arcade qui jaillit et s'envole. 4,28 s : la caisse
  s'efface, le rouleau rétrécit (× 0,384) jusqu'au compteur, qui prend le relais à 4,66 s.
- « 5 TONNES » = poids en fonte de dessin animé (Ultra, Apache 2.0) : corps trapézoïdal
  #33343d 1 000 × 330 px, biseau #5a5b67, anse, lettrage 124 px crème gravé. Chute libre
  15,28 → 15,48 s (power2.in), écrasement 0,88, secousse de la ville (±14 px, 0,22 s),
  6 fissures tracées en 0,16 s, 6 nuages de poussière (× 1,7, 0,95 s). Phrase à 15,85 s.
- Son : rouleau (cliquetis de machine) 3,1 → 3,74 s, impact + scintillement au gain, pop sur
  « +1 ». Rouleaux du compteur final dès 13,7 s jusqu'à 15,42 s. Plus d'oiseau à la fin.
  Le poids (sons Freesound CC0) : sifflement de chute qui finit sur l'impact (14,1 → 15,48 s),
  puis choc sourd + fracas métallique + débris + grondement sub-grave qui tient jusqu'à 18,5 s.
  Mastering après rendu : +4,5 dB puis limiteur (plafond 0,8, attaque 2 ms) sur la piste son
  du MP4 → −15,8 LUFS, crête −1,7 dBTP, poids ≈ 7 dB au-dessus du roulement.

## Révision 4 (demandée)

- Durée 18,5 s (1 110 images à 60 i/s). Libellé du compteur : « DÉJECTIONS CANINES ».
- Compteur : suit les crottes jusqu'à 14,0 s, puis s'emballe (× (1 + 1,5 r + 2,2 r³), r = t − 14)
  pour ne jamais se poser ; dès 14,7 s ses chiffres de droite tournent comme des rouleaux
  (hash de l'image et de la position), de plus en plus nombreux jusqu'à 15,45 s.
- 15,1 s : voile sombre radial ; le compteur gonfle et tremble, éclate à 15,42 s ;
  « 5 TONNES » (Archivo Black 210 px, blanc, contour 14 px, ombre marron) tombe à 15,3 s,
  s'écrase à 15,48 s avec rayons ; 15,85 s : « de déjections canines non ramassées / chaque
  année à Toulouse » (Space Mono 700, 46 px). Tenue jusqu'à 18,5 s. Chiffre fourni par la
  personne, non vérifié.
- Son (bruitages seuls, pas de musique) : chaque clip culmine 1 image après son événement.
  Oiseaux 0,55 / 1,75 / 17,2 s ; pas 0,22 → 2,34 s (1,9 Hz) ; pied + impact grave 3,0 s ;
  souffle + impact du « 0 » 3,26 / 3,28 s ; pop de la bascule 3,85 s ; souffle vers le HUD
  4,5 s ; onde 4,72 s ; glitch du fil de fer 5,5 s ; grand souffle de grue (crête 7,1 s) ;
  14 plops en spirale 8,18 → 10,52 s (3 hauteurs en rotation) ; 5 vagues de plops 12,15 →
  13,15 s ; souffle de montée (crête 13,3 s) ; riser (crête 15,48 s, coupé à 15,5 s) ;
  rouleaux 14,7 → 15,45 s ; « 5 TONNES » : souffle 15,42 s + impact grave 15,48 s.
  Mix mesuré : −14,6 LUFS, crête vraie −1,7 dBTP, aucun écrêtage. Crédits : assets/sfx/CREDITS.md.

## Révision 3 (demandée)

- Durée 15,5 s à 60 i/s (930 images). Tout ce qui suit l'impact est décalé de SH = 1,5 s :
  grue 4,7 → 8,0 s, fil de fer 5,5 s, vide 6,7 s, crottes en spirale dès 8,1 s,
  montée 12,0 → 14,3 s, tenue 14,3 → 15,5 s.
- Gel après le pas (3,0 → 4,7 s) : un « 0 » géant (Archivo Black 420 px, blanc, contour
  #0a0b0d 14 px, ombre portée marron 22 px) tombe au centre à 3,1 s, s'écrase (1,35 × 0,62)
  à 3,28 s puis rebondit ; il bascule (rotationX) en « 1 » jaune #ffd23f à 3,85 s avec une
  explosion de rayons ; à 4,28 s il file (power3.inOut, 0,42 s) vers le compteur en bas à
  gauche, à l'échelle 96 / 420, où le HUD prend le relais à 4,66 s.
- Couleurs : coucher de soleil orange #ff8a2a → rose #ff5d8f → bleu #2a3a8f ; saturation
  globale × 1,3 (acte 1), puis × 1,15 ; virage bleu dans les ombres, chaud dans les hautes lumières.
  La désaturation n'est plus qu'un flash de 0,5 s au moment du pas (3,0 → 3,5 s).
- Plus de chiffres : chaque case dit son nombre par sa couleur. 0 = bleu #3a86ff / turquoise
  #2ec4b6 / violet #8a5cf6 selon le quartier (blocs de 24 cases), 1 = #ffd23f, 2 = #ff8c42,
  3+ = #ff3c38, case minée = crème #f1e7d6, case de l'impact = rouge. Marron éclairci en #8a5326.
- Lisibilité de la ville (« calme » c = power2.inOut((y − 40 m) / 120 m)) : les cases sans
  mine perdent 60 % × c de saturation et 30 % × c de luminosité ; les cases minées
  s'éclaircissent de 80 % × c ; les crottes lointaines grossissent de 80 % × c (stylisées :
  ~1 case de large à 160 m). Dans le plan procédural, sous quelques pixels par case, la crotte
  remplit la case selon sa surface et son marron est assombri × 0,45, comme les instanciées.
  Fin plus claire : exposition × 1,3 sur la montée, brouillard de 1,3 y + 40 à 3,6 y + 100 m.
- Flou de mouvement : 4 sous-images par image sur un obturateur à 180° (1/120 s), moyennées
  avant bloom et étalonnage ; 1 seule pendant le gel (rien ne bouge en 3D).

GOAL:    le spectateur rit au pas dans la crotte, puis prend une claque d'échelle : la ville
         entière est un champ de mines, et le marron est la seule chose qui n'a pas changé.
OUTPUT:  HyperFrames, 1920 × 1080, 30 fps, muet (son ajouté au montage).
TIME:    14 s × 30 = 420 images. Un plan-séquence, zéro coupe.

## Repère

- Unités en mètres. x vers la droite, y vers le haut, la marche va vers −z.
- Dalle 0,60 × 0,60, joint 0,02 → pas de grille P = 0,62. Trottoir 9 colonnes
  (x ∈ [−2,79 ; +2,79]), centres x = (c − 4) · 0,62, c = 0…8.
- Rangées : centre z = −0,31 − 0,62 · r. Trottoir r = −5 … 91 (≈ 60 m).
- Dalle d'impact : c = 4, r = 7 → (0 ; −4,65). Champ proche = c 0…8 × r 0…15 (9 × 16).
- Grille finale : 200 × 200 cases (124 m) centrée sur l'impact, en InstancedMesh ;
  au-delà, un plan procédural (shader) prolonge la même grille jusqu'à 400 m.

## Caméra (keyframes, interpolées à t)

FOV : « 35 mm équivalent » = 54° HORIZONTAL → fov vertical Three.js = 31,6°. Lacet 0.
Tangage positif = vers le haut.

| t (s)       | x    | y (m)        | z (m)         | tangage      | ease                           |
| ----------- | ---- | ------------ | ------------- | ------------ | ------------------------------ |
| 0,0 → 2,6   | 0,18 | 0,28 ± 0,008 | +0,52 → −3,12 | +2°          | linéaire, 1,4 m/s, pas à 1,9 Hz |
| 2,6 → 3,0   | 0,18 | 0,28         | −3,12 → −3,40 | +2°          | décélération 3,5 m/s² (arrêt)  |
| 3,0 → 3,2   | 0,18 | 0,28         | −3,40         | +2° + secousse | secousse ±2° amortie en 3 img |
| 3,2 → 6,5   | 0,18→0 | 0,28 → 14  | −3,40 → +5,60 | +2° → −58°   | power3.inOut (grue, 3,3 s)     |
| 6,5 → 10,5  | 0    | 14 → 15,2    | +5,60 → +6,35 | −58°         | sine.in (dérive, ne s'arrête pas) |
| 10,5 → 12,8 | 0    | 15,2 → 160 (log) | cible au sol fixe | −58° → −42° | power3.inOut sur log(y)  |
| 12,8 → 14,0 | 0    | 160 → 161    | idem          | −42°         | linéaire (tenue 1,2 s)         |

Révision 1 : tangage final −55° → −42°, pour que la ville file jusqu'au brouillard en haut du cadre.

Secousse : roulis+tangage = 2° · cos(πk) · e^(−k/1,1), k = image depuis 3,0 s (0…3).
La rangée 0…15 tient tout le cadre vertical à 14 m (sol visible de 4,1 à 15,4 m devant).
Note : 10,5 + 2,5 + 1,2 = 14,2 s > 14 → montée ramenée à 2,3 s pour garder la tenue de 1,2 s.

## Lumière

| Rôle | Acte 1 (0–3,6 s)                         | Acte 3+ (≥ 5,4 s, « moteur de jeu »)    |
| ---- | ---------------------------------------- | --------------------------------------- |
| Key  | #ffb866, 3,2, élévation 8°, azimut 12° à gauche de l'axe, au fond (contre-jour) | #fff3e6, 3,2, élévation 52°, venue haut-gauche-fond |
| Ombres | PCF, rayon 7 texels (douces), 4 096²   | rayon 1 (dures), même carte              |
| Rim  | #4a6fa5, 1,1, arrière-gauche haute       | idem                                    |
| Env  | studio sombre 3 bandes, intensité 0,5, rotation y = 0,18 rad/s | idem               |

Transition 3,6 → 5,4 s, ease sine.inOut. Ombre d'un potelet de 0,6 m à 8° = 4,3 m vers la caméra.
« Arrière-gauche » est lu comme « au fond, à gauche » : seule position où les ombres viennent
vers la caméra et où les biseaux accrochent une lumière de contre.

## Optique & post

- Profondeur de champ : point 3,5 m, f/2,8, f = 35 mm. CoC physique × 2,2 (sinon l'infini
  ne fait que 6,7 px) ; diamètre max 28 px. Active 0–3,2 s, éteinte linéairement 3,2 → 4,6 s.
- Bloom : seuil luminance 2,2 (HDR linéaire), genou 0,4, force 0,35 — seuls le soleil, les
  liserés de biseau et le flash passent.
- Impact 3,0 s : flash blanc 0,85 sur 1 image (90) ; désaturation 100 % → 15 % en 0,25 s
  (power2.out), SAUF masque marron + contour rouge (canal alpha du rendu) ; la saturation
  revient à 100 % de 4,8 à 5,0 s (le monde est déjà gris, les chiffres doivent porter leur couleur).
- ACES, exposition 1,0 ; vignette 6 %. Tout pixel NaN/Inf → 0 avant le bloom.

## Matériaux & palette (seules couleurs)

béton #b8ac9a (rugosité 0,6, variance ±6 %/dalle, mouchetis 4 %) · soleil #ffb866 ·
ombre bleue #2e3b52 (jambe, rue, ciel haut) · gris Démineur #c0c0c0 (rugosité 0,5) ·
rouge #e8352a (contour, chiffre 3) · marron #6b3f1d (rugosité 0,45, clearcoat 0,5) · vide #0a0b0d.
Exception assumée par le brief : chiffres 1 bleu #0000ff, 2 vert #008000.

## Objets

- Crotte : lathe 3 étages + pointe inclinée, Ø 0,27 m, h 0,19 m ; brillance = clearcoat.
  Disque d'occlusion Ø 0,42 m, opacité 0,55, sous chaque crotte.
- Semelle : basket, semelle caoutchouc 0,29 × 0,11 × 0,035 (#0a0b0d), tige #2e3b52,
  jambe de pantalon Ø 0,12 → 0,18 m sur 1,2 m.
- Monde : muret 0,9 m + garde-corps (barreaux / 0,15 m, 1,7 m) à gauche, lampadaires
  4 m tous les 15 m, bordure 0,15 m, caniveau, chaussée, arbres de l'autre côté, façades à 14 m.
- Débris d'automne (camouflage) : 170 feuilles sèches, 80 feuilles froissées, 16 pommes de pin,
  sur 28 m de trottoir ; un cinquième de chaque sorte dans un rayon de 0,4–2 m autour de la
  crotte, à l'échelle 1,25–1,85, pour qu'elle ne soit jamais la bosse la plus haute. Non masqués :
  gris dès 3,0 s (seule la crotte garde son marron), ils rétrécissent avec l'onde (0,25 s).
- Poussières : 1 400 points, 0,1–1,8 m de haut, dérive 2–6 cm/s, figées à 3,0 s.
- Chiffres : Archivo Black, extrudés 4 cm, hauteur de glyphe 0,34 m, couchés, lisibles depuis la caméra.

## Temps forts

| t (s)     | événement                                                                       |
| --------- | ------------------------------------------------------------------------------- |
| 0–2,6     | marche, crotte posée dans l'ombre d'un lampadaire à 4,2 m — banale             |
| 2,6–3,0   | semelle entre par le haut, attaque talon (+18° → 0°), power2.in, impact 3,000 s |
| 3,0       | crotte écrasée (y × 0,32, xz × 1,45), secousse, flash, gel, contour rouge ×1,25 → 1 en 3 img |
| 3,2 →     | onde 11 m/s depuis l'impact : extrusion 0 → 7 cm (back.out(1,4), 0,3 s), béton → #c0c0c0 en 0,3 s |
| 4,0 + d·0,02 | non-trottoir passe en fil de fer #c0c0c0 ; fondu vers le vide jusqu'à 5,2    |
| 4,0–5,2   | ciel or → #0a0b0d ; joints → vide                                               |
| 5,0 + d·0,05 | chiffres : +6 cm en 0,35 s, back.out(2)                                       |
| 6,5       | HUD apparaît (opacité 0 → 1, 0,2 s) : « 001 » (la crotte écrasée)               |
| 6,6 + 0,18·i | 14 crottes en spirale (r + θ/2π · 1,5 cases), 0,4 s chacune : montée coupée par le plan de la case, échelle y 1,4 → 0,85 → 1, back.out(2,5) |
| 10,5 →    | front de grille r(t) = 4 + 2,6·(y − 15,2) + 6·(t − 10,5) m ; cases montent de −0,8 m en 0,35 s |
| front + 0,35 + bande | crottes éclosent par bandes de 4 m (vagues), densité 12 %          |
| 12,8–14   | tenue sur 400 m de ville minée ; compteur ≈ 150 000                             |

## Mines

Champ proche : 14 mines + l'impact, PRNG mulberry32(0xD3_41_7E), tirage rejeté tant qu'une
case compte > 3 ou qu'il n'y a pas au moins un « 3 ». Champ lointain : 12 % des cases,
hash(i,k), aucune mine dans l'anneau d'une case autour du champ proche (les chiffres proches
restent justes). Cases lointaines comptant ≥ 4 : pas de chiffre (palette limitée à 3 couleurs).

## HUD (index.html)

Space Mono 700, nombre 96 px #c0c0c0, libellé « MINES » 28 px, 18 % d'espacement, #c0c0c0 à 60 %.
Bas-gauche, marge 112 px (dans le 90 % d'action). Au moins 3 chiffres, s'élargit sans bouger
l'origine. Pas de boîte, pas de pixels, pas de biseau 2D.

## BANNED

vide noir avec objet flottant au centre AVANT 5,2 s · glow/bloom décoratif · particules
décoratives après 4,0 s · boîte Démineur skeuomorphe · UI pixel · orbite caméra · coupe ·
pop aléatoire · tout ce qui bouge pendant qu'on le lit (le HUD ne bouge pas) · GSAP sur la 3D ·
Math.random · requestAnimationFrame.

## QA (snapshots)

1,5 trottoir doré, ombres vers la caméra, bokeh, poussière · 3,0 semelle + flash/contour ·
4,2 grue mi-course, onde visible, fil de fer · 5,5 grille grise + chiffres colorés, vide noir ·
7,0 premières crottes + HUD · 9,0 spirale lisible · 11,5 grille qui s'étend · 13,5 ville minée.
