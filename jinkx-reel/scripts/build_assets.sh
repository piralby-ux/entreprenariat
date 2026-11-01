#!/bin/bash
# Régénère toutes les images et données à partir de assets_src/ (originaux de Jinkx).
set -e
cd "$(dirname "$0")/.."
python3 -I scripts/prep_images.py          # détourage, redressement, calques
python3 -I scripts/align.py                # alignement croquis -> flash (A et B)
node scripts/trace.mjs                     # vectorisation potrace -> polylignes de masque
python3 -I scripts/signature.py            # tracé monoline de « Jinkx »
for n in align signature; do
  echo "window.JINKX=window.JINKX||{};window.JINKX['$n']=$(cat assets/data/$n.json);" > assets/data/$n.js
done
python3 -I -c "import json;d=json.load(open('prep/peau1_dots.json'));open('assets/data/peau1dots.js','w').write('window.JINKX=window.JINKX||{};window.JINKX.peau1dots='+json.dumps(d)+';')"
python3 -I scripts/sfx.py                  # sound design synthétisé -> out/sfx.wav
