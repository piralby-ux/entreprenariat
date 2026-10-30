// Search Wikimedia Commons audio for each query and print CC0 / CC BY results only.
// usage: node commons.mjs "query 1" "query 2" ...
const ok = (lic) => /^(cc0|cc by \d|cc-by-\d|public domain|pd)/i.test(lic) && !/sa|nc|nd/i.test(lic.replace(/^cc0/i, ""));
for (const q of process.argv.slice(2)) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=25&gsrsearch=${encodeURIComponent(q + " filetype:audio")}&prop=imageinfo&iiprop=url|size|extmetadata|mediatype&iiextmetadatafilter=LicenseShortName|Artist|ObjectName`;
  const r = await fetch(url, { headers: { "User-Agent": "demineur-urbain-sfx/1.0 (local film project)" } });
  const j = await r.json();
  const pages = Object.values(j.query?.pages || {});
  console.log(`== ${q} (${pages.length})`);
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const lic = ii.extmetadata?.LicenseShortName?.value || "?";
    if (!ok(lic)) continue;
    const artist = (ii.extmetadata?.Artist?.value || "").replace(/<[^>]+>/g, "").slice(0, 40);
    console.log(`  ${lic.padEnd(12)} ${String(ii.size).padStart(9)}B  ${p.title}  | ${artist}\n      ${ii.url}`);
  }
}
