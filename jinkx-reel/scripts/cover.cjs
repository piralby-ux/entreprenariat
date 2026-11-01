// Rendu de l'image de couverture : node scripts/cover.cjs -> out/jinkx-reel_cover.png
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve('cover/cover.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'out/jinkx-reel_cover.png' });
  await b.close();
})();
