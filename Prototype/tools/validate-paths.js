/* Dev helper (run on a floor page after tools/probe.js): checks the authored path layer
   against the corridor art. Returns off-path samples per segment and per connector. */
(() => {
  const floor = document.body.dataset.floor;
  const router = window.ULRouter.create(window.UL_CAMPUS);
  const P = window.ulProbe;
  const segIssues = [];
  for (const s of router.segmentsFor(floor)) {
    if (s.unpaved) continue;
    const bad = P.check([[s.a.x, s.a.y], [s.b.x, s.b.y]], 3);
    if (bad.length) segIssues.push({ seg: `${s.a.pathId}→${s.b.pathId}`, outer: s.outer, bad: bad.slice(0, 6), n: bad.length });
  }
  const connIssues = [];
  for (const c of router.connectorsFor(floor)) {
    const bad = P.check([[c.to.x, c.to.y], [c.from.x, c.from.y]], 2);
    // A door sits on a wall: allow a few px of threshold.
    if (bad.length * 2 > 10) connIssues.push({ key: c.key, gap: Math.round(c.gap), offPx: bad.length * 2, bad: bad.slice(0, 4) });
  }
  return JSON.stringify({ floor, segIssues, connIssues });
})();
