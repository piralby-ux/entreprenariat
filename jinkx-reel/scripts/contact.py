import sys, cv2, numpy as np
# compose des images sur papier ivoire, en grille, pour contrôle visuel
files=sys.argv[2:]; out=sys.argv[1]
tiles=[]
for f in files:
    im=cv2.imread(f,cv2.IMREAD_UNCHANGED)
    if im.ndim==2: im=cv2.cvtColor(im,cv2.COLOR_GRAY2BGR)
    paper=np.zeros((im.shape[0],im.shape[1],3),np.float32); paper[:]=(0xDA,0xE6,0xED)
    if im.shape[2]==4:
        a=im[:,:,3:4]/255.; c=paper*(1-a)+im[:,:,:3]*a
    else:
        c=paper*im[:,:,:3]/255.
    s=600/c.shape[0]; c=cv2.resize(c.astype(np.uint8),(int(c.shape[1]*s),600))
    tiles.append(c); tiles.append(np.full((600,10,3),80,np.uint8))
cv2.imwrite(out,np.hstack(tiles))
