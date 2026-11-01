#!/bin/bash
# usage: scripts/snap.sh 1.2,3.4,... [out.jpg]   -> planche de contrôle prep/sheet.jpg
set -e
rm -rf prep/snap
npx hyperframes snapshot --at "$1" --no-end -o prep/snap 2>&1 | grep -iE "error|fail" || true
python3 -I - "${2:-prep/sheet.jpg}" <<'PY'
import cv2,glob,numpy as np,sys
fs=sorted(glob.glob('prep/snap/frame-*.png'))
ims=[cv2.resize(cv2.imread(f),(360,640),interpolation=cv2.INTER_AREA) for f in fs]
for im,f in zip(ims,fs): cv2.putText(im,f.split('-at-')[1][:-4],(8,26),cv2.FONT_HERSHEY_SIMPLEX,0.8,(0,0,255),2)
while len(ims)%6: ims.append(np.zeros_like(ims[0]))
cv2.imwrite(sys.argv[1],np.vstack([np.hstack(ims[i:i+6]) for i in range(0,len(ims),6)]))
PY
