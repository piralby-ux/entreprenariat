// Search freesound.org (public search page, CC0 filter): one line per player tag, with its own
// id, user, title, duration and HQ preview. usage: node freesound.mjs "query" ["query" ...]
for (const q of process.argv.slice(2)) {
  const url = `https://freesound.org/search/?q=${encodeURIComponent(q)}&f=${encodeURIComponent('license:"Creative Commons 0"')}&s=Relevance`;
  const html = (await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (DemineurUrbainFilm sound search)" } })).text()).replace(/\s+/g, " ");
  console.log(`== ${q}`);
  const tags = html.match(/class="bw-player" [^>]*>/g) || [];
  for (const tag of tags.slice(0, 10)) {
    const a = (k) => (tag.match(new RegExp(`data-${k}="([^"]*)"`)) || [])[1] || "";
    console.log(`  ${a("sound-id").padEnd(7)} ${(+a("duration")).toFixed(1).padStart(5)}s  ${a("title").slice(0, 50).padEnd(50)} ${a("username")}  dl=${a("num-downloads")}\n          ${a("mp3").replace("-lq.mp3", "-hq.mp3")}`);
  }
}
