# REVIEW — bloc1-v2, révision 6 (snapshots, avant rendu)

- Snapshots aux instants demandés (T0 = 15,58 s) : 15,28 · 15,63 · 16,08 · 17,08 · 18,08 · 19,08 ·
  19,88 · 21,08 · 22,98. La horde se détache de la ville (silhouettes #0a0b0d, liseré orange/rose), le
  tampon est net, aucun texte n'est couvert (ordre : ville < horde < interface).
- Check : 0 erreur ; contraste 38/38. Avertissements restants voulus : chiffres qui défilent dans les
  rouleaux (comme la machine à sous d'origine), fichiers longs et calques imbriqués (structure d'origine),
  canvas plein cadre.
- Sons d'avant 14,6 s identiques à l'original (vérifié clip par clip) ; ceux d'après décalés de +4,50 s.
  Seuls changements voulus : riser coupé à 15,33 (micro-silence) et rouleaux à −6 dB pendant l'insert.
- Écarts assumés : traversées de la horde raccourcies (voir SPEC, révision 6) ; aboiements non placés,
  faute de banque joignable (instants prévus dans SFX.md).

# REVIEW — Démineur urbain, révision 5 (avant rendu final)

Brouillon d'écoute : `../draft-audio3.mp4` (15 i/s, image brouillon, son définitif).
Snapshots : `snaps/casino/` et `snaps/casino2/` (machine à sous, poids).

Révision 5 : le 0 → 1 devient une machine à sous (Bungee), « 5 TONNES » un poids en fonte qui
écrase la ville (Ultra). Mix −14,4 LUFS, crête −1,5 dBTP. Polices : Bungee (OFL), Ultra
(Apache 2.0), fichiers dans assets/fonts.

## Révision 4

## Ce qui a changé (validé par la personne)

- « MINES » → « DÉJECTIONS CANINES ».
- Le compteur ne se pose plus : il s'emballe, ses chiffres tournent en rouleaux, puis
  « 5 TONNES » s'écrase au centre avec la phrase sur Toulouse. Film allongé à 18,5 s.
- Sound design : bruitages seuls, sans musique.

## Mesuré (pas écouté)

- Mix : −14,6 LUFS intégrés, crête vraie −1,7 dBTP, 0 écrêtage. Les attaques tombent aux bons
  instants (pas, impact 2,99 s, bascule 3,86 s, 14 plops à 0,18 s d'écart, impact final 15,5 s).
- Silences : 2,61–2,89 s (le pied descend), 4,88–5,5 s, 10,6–12,2 s (respiration avant la
  ville), 17,7–18,5 s (fin).
- Lint : 0 erreur.

## Limites honnêtes

- Pas de vrai « splotch » : Openverse était injoignable et Wikimedia Commons n'en a pas en
  CC0/CC BY. L'impact du pas est un pas sur gravier + un impact grave. Un vrai son de bouillie
  le rendrait bien plus drôle : à remplacer dès qu'on en a un (fichier
  `assets/sfx/footstep-gravel.mp3` sur la piste `sfx-step-hit`, ou un nouveau clip à 3,0 s).
- Pas d'ambiance de rue : seulement trois chants d'oiseau.
- Le passage « rouleaux » est un extrait de machine de jeu choisi à la mesure (cliquetis le plus
  dense) : à confirmer à l'oreille.
- Le chiffre « 5 tonnes par an à Toulouse » vient de la personne ; je ne l'ai pas vérifié.
- Crédits CC BY obligatoires (Gravity Sound, Work With Sounds / Werstas) : assets/sfx/CREDITS.md.
