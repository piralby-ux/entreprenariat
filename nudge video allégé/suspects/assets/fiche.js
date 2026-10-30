// Shared build for the five fiches: slab, name reel, gauges, interview window, bulbs, drift,
// arrival and exit. Each fiche file adds its own gag tweens to the same timeline. All tweens are
// pure functions of the timeline's time (no timers, no randomness).
(function () {
  const NAMES = ["L’INVISIBLE", "LE MINIMALISTE", "LE PHILOSOPHE", "LE CONTRIBUABLE", "LE PROCRASTINATEUR"];
  const CELL = 84, REEL_W = 652;
  // camera drift: −0.5° → +0.5° over the 30 s film, power3.inOut, on the global clock
  const drift = (T) => -0.5 + gsap.parseEase("power3.inOut")(Math.min(1, Math.max(0, T / 30)));
  window.FicheDrift = drift;

  window.Fiche = function (p, start, idx, tl, vars) {
    const $ = (s) => document.getElementById(`${p}-${s}`);
    const v = (k, d) => (vars && vars[`${k}_${idx + 1}`] !== undefined ? vars[`${k}_${idx + 1}`] : d);

    // slab: 14 px thick, seven 2 px layers behind the face
    const slab = $("slab");
    for (let i = 1; i <= 7; i++) {
      const l = document.createElement("i");
      l.style.transform = `translateZ(${-2 * i}px)`;
      slab.appendChild(l);
    }
    // name reel: « ? ? ? », then the names, landing on this fiche's own
    const strip = $("reel");
    const cells = ["? ? ?"];
    for (let k = 1; k <= 10; k++) cells.push(NAMES[(idx + k) % 5]);
    for (const n of cells) {
      const d = document.createElement("div");
      d.className = "reel-name";
      const s = document.createElement("span");
      s.textContent = n;
      // LE PROCRASTINATEUR is 770 px of Bungee 64: squeezed to the 652 px window
      if (n.length > 16) s.style.transform = "scaleX(0.84)";
      d.appendChild(s);
      strip.appendChild(d);
    }
    // badge
    if (!v("provisoire", true) || v("provisoire", true) === "false") $("badge").style.display = "none";
    // bulbs around the window frame (1028 × 632 outer)
    const bulbs = [];
    const bw = $("bulbs"), W = 1028, H = 632, per = 2 * (W + H);
    for (let i = 0; i < 20; i++) {
      let d = (i / 20) * per, x, y;
      if (d < W) { x = d; y = 0; } else if ((d -= W) < H) { x = W; y = d; } else if ((d -= H) < W) { x = W - d; y = H; } else { x = 0; y = H - (d - W); }
      const b = document.createElement("i");
      b.style.left = `${x - 7}px`;
      b.style.top = `${y - 7}px`;
      bw.appendChild(b);
      bulbs.push(b);
    }

    // continuous: drift and bulb chase
    const clock = { t: 0 };
    tl.fromTo(clock, { t: 0 }, {
      t: 4.8, duration: 4.8, ease: "none",
      onUpdate: () => {
        gsap.set(`#${p}-stage`, { rotationY: drift(start + clock.t) });
        const step = Math.floor((clock.t - 1.2) * 12);
        bulbs.forEach((b, i) => { b.style.opacity = (i + step) % 4 === 0 ? "1" : "0.28"; });
      },
    }, 0);

    // arrival 0–0.45: from the void, edge-on, the left bevel catching the rim
    tl.fromTo(`#${p}-fiche`, { x: 260, z: -700, rotationY: 80, opacity: 0 },
      { x: 0, z: 0, rotationY: -8, opacity: 1, duration: 0.45, ease: "power3.out" }, 0);
    tl.fromTo(`#${p}-glint`, { opacity: 0 }, { keyframes: [{ opacity: 0.9, duration: 0.25, ease: "power2.out" }, { opacity: 0.35, duration: 0.35, ease: "power2.inOut" }] }, 0.1);
    // reel 0.45–1.10
    tl.fromTo(strip, { y: 0 }, { y: -(cells.length - 1) * CELL, duration: 0.65, ease: "back.out(1.3)" }, 0.45);
    // gauges
    ["mauvaise_foi", "frequence", "discretion"].forEach((k, i) => {
      const val = Math.max(0, Math.min(10, +v(k, 5)));
      tl.fromTo(`#${p}-g${i}`, { scaleX: 0 }, { scaleX: val / 10, duration: 0.5, ease: "power2.out" }, 1.45 + 0.12 * i);
    });
    // window 1.20–1.50 open, 4.20–4.45 close
    tl.fromTo(`#${p}-win`, { scaleY: 0, rotationY: 4 }, { scaleY: 1, rotationY: 4, duration: 0.3, ease: "power3.out" }, 1.2);
    tl.to(`#${p}-win`, { scaleY: 0, duration: 0.25, ease: "power3.in" }, 4.2);
    tl.fromTo(`#${p}-quote`, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, 1.55);
    tl.to(`#${p}-quote`, { opacity: 0, duration: 0.2, ease: "power2.in" }, 4.25);
    // exit 4.20–4.80
    tl.to(`#${p}-fiche`, { x: -980, rotationY: 38, rotationZ: -7, duration: 0.6, ease: "power3.in" }, 4.2);
    tl.to(`#${p}-fiche`, { opacity: 0, duration: 0.25, ease: "power2.in" }, 4.55);
    return { $, v };
  };
})();
