/* InkKit — petits outils partagés par les scènes du Reel Jinkx.
 * Tout est fonction du temps (aucun état d'une frame à l'autre), donc chaque frame se rend seule.
 */
(function () {
  const K = (window.InkKit = {});
  const FPS = 30;
  K.FPS = FPS;
  K.BEAT = 0.6; // 100 BPM
  // Période des mouvements « ambiants » : 659 frames, pour que la dernière frame (659) = la première (0)
  K.LOOP = 659 / FPS;

  K.mulberry32 = function (a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  K.hash = function (n) {
    return K.mulberry32((n * 2654435761) >>> 0)();
  };
  K.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.smooth = (t) => t * t * (3 - 2 * t);
  K.ease = (name) => gsap.parseEase(name);
  /* Valeur interpolée pure : de `from` à `to` entre start et start+dur, avec une ease GSAP nommée. */
  const _ec = {};
  K.tw = function (t, start, dur, from, to, ease = 'none') {
    const e = _ec[ease] || (_ec[ease] = gsap.parseEase(ease));
    return from + (to - from) * e(K.clamp((t - start) / dur));
  };

  /* Caméra « à l'épaule » : ±4 px, sinusoïdes lentes à fréquences décalées, périodique sur la boucle. */
  K.drift = function (tg) {
    const w = (2 * Math.PI) / K.LOOP;
    const x = 2.4 * Math.sin(w * 3 * tg + 0.3) + 1.5 * Math.sin(w * 7 * tg + 1.1);
    const y = 2.1 * Math.sin(w * 4 * tg + 2.0) + 1.7 * Math.sin(w * 9 * tg + 0.5);
    const r = 0.06 * Math.sin(w * 5 * tg + 0.7);
    return { x, y, r };
  };
  /* Applique la dérive + un push-in à un wrapper caméra. scale/ox/oy facultatifs. */
  K.applyCam = function (el, tg, scale = 1, ox = 0, oy = 0) {
    const d = K.drift(tg);
    el.style.transform = `translate(${(d.x + ox).toFixed(2)}px, ${(d.y + oy).toFixed(2)}px) rotate(${d.r.toFixed(3)}deg) scale(${scale.toFixed(5)})`;
  };

  /* --------------------------------------------------------------------------------------------
   * TraceReveal : révèle un dessin raster à travers un masque fait des contours potrace.
   * Chaque sous-chemin est ré-échantillonné et redémarré à son extrémité ; il se révèle
   * symétriquement depuis ce bout (les deux bords du trait avancent ensemble), ce qui donne
   * l'impression qu'on trace le trait d'un bout à l'autre.
   * ------------------------------------------------------------------------------------------ */
  const NS = 'http://www.w3.org/2000/svg';
  K.TraceReveal = class {
    /* polys : [{L, c:[cx,cy], p:[x0,y0,x1,y1,...]}] précalculés par scripts/trace.mjs (départ à l'extrémité) */
    constructor(maskGroup, polys, opts = {}) {
      this.g = maskGroup;
      this.width = opts.width || 18;
      this.items = [];
      for (const poly of polys) {
        const f = poly.p, pts = [];
        let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, d = '';
        for (let i = 0; i < f.length; i += 2) {
          const x = f[i], y = f[i + 1];
          pts.push([x, y]);
          d += (i ? 'L' : 'M') + x + ' ' + y;
          if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
        }
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', d);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', '#fff');
        el.setAttribute('stroke-width', this.width);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        el.style.visibility = 'hidden';
        this.g.appendChild(el);
        this.items.push({ el, L: poly.L, pts, cx: poly.c[0], cy: poly.c[1], bbox: [minx, miny, maxx, maxy], start: 0, dur: 1, state: -1 });
      }
    }
    /* fn(item, index) -> [start, duration] */
    schedule(fn) {
      this.items.forEach((it, i) => { const [s, d] = fn(it, i); it.start = s; it.dur = d; });
      return this;
    }
    progress(it, t) {
      const p = K.clamp((t - it.start) / it.dur);
      return this.ease ? this.ease(p) : p;
    }
    render(t) {
      for (const it of this.items) {
        const p = this.progress(it, t);
        if (p <= 0) {
          if (it.state !== 0) { it.el.style.visibility = 'hidden'; it.state = 0; }
        } else if (p >= 1) {
          if (it.state !== 2) { it.el.style.visibility = 'visible'; it.el.removeAttribute('stroke-dasharray'); it.el.setAttribute('stroke-width', this.width); it.state = 2; }
        } else {
          const a = (p * it.L) / 2;
          it.el.style.visibility = 'visible';
          // départ en pointe : le trait de masque s'épaissit au début (pas de « point » parasite)
          if (this.grow) it.el.setAttribute('stroke-width', (this.width * Math.min(1, 0.15 + p / 0.18)).toFixed(2));
          it.el.setAttribute('stroke-dasharray', `${a.toFixed(2)} ${(it.L - 2 * a).toFixed(2)} ${a.toFixed(2)} ${it.L.toFixed(2)}`);
          it.state = 1;
        }
      }
    }
    /* point de tête (centre du trait) d'un item à l'instant t */
    head(it, t) {
      const p = this.progress(it, t);
      const n = it.pts.length - 1;
      const i1 = Math.min(n, Math.floor((p / 2) * n));
      const i2 = Math.max(0, n - i1);
      const a = it.pts[i1], b = it.pts[i2];
      return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    }
  };

  /* Forme d'encre organique (cercle déformé), pour les révélations/rétractations à l'encre. */
  K.blobPath = function (cx, cy, R, seed, wob = 0.12, steps = 96) {
    const rnd = K.mulberry32(seed);
    const harm = [];
    for (let k = 2; k <= 14; k++) harm.push([k, (rnd() * 2 - 1) * wob / Math.pow(k - 1, 0.8), rnd() * 6.283]);
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * 2 * Math.PI;
      let r = 1;
      for (const [k, a, ph] of harm) r += a * Math.sin(k * th + ph);
      const x = cx + Math.cos(th) * R * r, y = cy + Math.sin(th) * R * r;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
  };

  /* Rideau d'encre qui coule : bord bas à y=front, avec des gouttes plus longues par endroits. */
  K.dripPath = function (front, W, seed, spread = 1) {
    const rnd = K.mulberry32(seed);
    const drips = [];
    for (let i = 0; i < 11; i++) drips.push([rnd() * W, 50 + rnd() * 260, 10 + rnd() * 16]);
    const N = 120;
    let d = `M-20 -40 L${W + 20} -40 `;
    for (let i = N; i >= 0; i--) {
      const x = (i / N) * W;
      let y = front + 14 * Math.sin(x * 0.013 + seed) + 9 * Math.sin(x * 0.031 + 2 * seed);
      for (const [dx, len, w] of drips) {
        const u = (x - dx) / (w * spread);
        // goutte allongée à bout arrondi, raccord adouci avec le bord du rideau
        if (Math.abs(u) < 1.8) {
          const a = Math.abs(u);
          y += a < 1 ? len * spread * Math.pow(1 - u * u, 0.18) : len * spread * 0.0 + 26 * spread * (1 - (a - 1) / 0.8) ** 2 * 0.6;
        }
      }
      d += `L${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    return d + 'Z';
  };

  /* Micro-label tapé lettre par lettre : crée les spans une fois, renvoie les éléments. */
  K.splitLetters = function (el) {
    const text = el.textContent;
    el.textContent = '';
    return [...text].map((ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.opacity = '0';
      el.appendChild(s);
      return s;
    });
  };
  K.typeIn = function (tl, spans, at, per = 0.035) {
    spans.forEach((s, i) => tl.set(s, { opacity: 1 }, at + i * per));
  };
  K.typeOut = function (tl, spans, at, per = 0.018) {
    [...spans].reverse().forEach((s, i) => tl.set(s, { opacity: 0 }, at + i * per));
  };

  /* Spirale métal du carnet (viewBox 0 0 70 1120), partagée par les scènes carnet / croquis / signature. */
  K.spiralRings = function () {
    let rings = '';
    for (let i = 0; i < 27; i++) {
      const y = 22 + i * 41.4;
      rings += `<ellipse cx="34" cy="${y + 4}" rx="21" ry="6" fill="none" stroke="rgba(18,17,16,0.22)" stroke-width="4" transform="rotate(-14 34 ${y + 4})"/>`;
      rings += `<circle cx="48" cy="${y}" r="3.6" fill="#2a2724"/>`;
      rings += `<ellipse cx="34" cy="${y}" rx="19.5" ry="5.6" fill="none" stroke="#2f2c29" stroke-width="3.4" transform="rotate(-14 34 ${y})"/>`;
      rings += `<path d="M17 ${y + 1.5} q15 -8 32 -5.5" fill="none" stroke="#b5afa6" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>`;
    }
    return rings;
  };

  /* V3 — micro-labels en IM Fell English SC : chaque lettre « se presse » comme un tampon */
  K.pressIn = function (tl, spans, at, per = 0.03) {
    spans.forEach((sp, i) => {
      sp.style.display = 'inline-block';
      tl.fromTo(sp, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.05, ease: 'power2.out' }, at + i * per);
    });
  };
  K.pressOut = function (tl, spans, at, dur = 0.15) {
    tl.to(spans, { opacity: 0, duration: dur, ease: 'power2.in' }, at);
  };
  /* filtre d'impression au tampon (encre légèrement inégale), injecté une fois dans le document */
  K.ensurePressFilter = function () {
    if (document.getElementById('ink-press')) return;
    const holder = document.createElementNS(NS, 'svg');
    holder.setAttribute('width', '0'); holder.setAttribute('height', '0');
    holder.style.position = 'absolute';
    holder.innerHTML = `<filter id="ink-press" x="-5%" y="-20%" width="110%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="19" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.55" result="ga"/>
      <feComposite in="d" in2="ga" operator="in"/></filter>`;
    document.body.appendChild(holder);
  };

  /* Trajectoire de l'aiguille (précalculée) : suit un trait jusqu'au bout, puis se lève et va au suivant. */
  K.needlePath = function (tr, F0, F1, toScreen, rest) {
    const N = Math.round((F1 - F0) * 30), traj = [], lift = [];
    let lead = null, cur = null, hop = null;
    for (let f = 0; f <= N; f++) {
      const t = F0 + f / 30;
      if (!lead || tr.progress(lead, t) >= 0.97) {
        lead = null;
        for (const it of tr.items) { const p = tr.progress(it, t); if (p > 0.02 && p < 0.9 && (!lead || it.L > lead.L)) lead = it; }
      }
      const target = lead ? toScreen(tr.head(lead, t)) : cur || toScreen(rest);
      if (!cur) cur = target;
      if (!hop && Math.hypot(target[0] - cur[0], target[1] - cur[1]) > 22) hop = { from: cur.slice(), k: 0 };
      let lf = 0;
      if (hop) {
        hop.k++;
        const u = hop.k / 5, e = K.smooth(Math.min(1, u));
        cur = [hop.from[0] + (target[0] - hop.from[0]) * e, hop.from[1] + (target[1] - hop.from[1]) * e];
        lf = Math.sin(Math.PI * Math.min(1, u));
        if (u >= 1) hop = null;
      } else cur = [cur[0] + (target[0] - cur[0]) * 0.6, cur[1] + (target[1] - cur[1]) * 0.6];
      traj.push(cur.slice()); lift.push(lf);
    }
    const at = (arr, t) => { const u = K.clamp((t - F0) * 30, 0, N); const i = Math.floor(u), f = u - i; const a = arr[i], b = arr[Math.min(N, i + 1)]; return Array.isArray(a) ? [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] : a + (b - a) * f; };
    return { N, traj, lift, pos: (t) => at(traj, t), lift: (t) => at(lift, t), raw: lift };
  };

  /* Un « ticker » : appelle fn(tLocal) à chaque seek, sur toute la durée de la scène. */
  K.ticker = function (tl, duration, fn) {
    const proxy = { t: 0 };
    tl.fromTo(proxy, { t: 0 }, { t: duration, duration, ease: 'none', onUpdate: () => fn(proxy.t) }, 0);
    fn(0);
  };
})();
