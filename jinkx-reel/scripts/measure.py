import cv2, numpy as np, sys
for f in ['01_croquis_feuilles_stylo_bleu.jpg','03_croquis_eventail_vagues_crayon.jpg','07_neotribal_pied_mockup.jpg','06_ornemental_bras_procreate.jpg']:
    im=cv2.imread('assets_src/'+f,0)
    e=cv2.Canny(im,50,150)
    L=cv2.HoughLinesP(e,1,np.pi/720,200,minLineLength=300,maxLineGap=10)
    angs=[]
    if L is not None:
        for x1,y1,x2,y2 in L.reshape(-1,4):
            a=np.degrees(np.arctan2(y2-y1,x2-x1))
            if abs(a)<30: angs.append(a)
    print(f, len(angs), np.median(angs) if angs else None, np.percentile(angs,[25,75]) if angs else None)
