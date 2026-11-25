/*
 * Lists every stair plate on the current floor page with its arrow direction and
 * whether the arrow points into the path network ("in" = you come out of the stairs here)
 * or away from it ("out" = you leave the floor here).
 * Run in the page after campus-map.js has booted (needs window.ulView / window.ulNav).
 */
(() => {
  const map = document.querySelector(".map");
  const floor = document.body.dataset.floor;
  const saved = { ...ulView.state };
  Object.assign(ulView.state, { x: 0, y: 0, zoom: 1, rotate: 0, tilt: 0 });
  ulView.render();
  const M = map.getBoundingClientRect();
  const toMap = (sx, sy) => ({ x: sx - M.left, y: sy - M.top });

  const plates = [];
  for (const g of map.querySelectorAll(':scope > [data-ul-art="verticals"]')) {
    const plate = [...g.querySelectorAll("div")].find((d) => d.style.backgroundColor === "rgb(217, 217, 217)");
    const arrow = g.querySelector('svg path[fill="#FFFFFF"]');
    if (!plate || !arrow) continue;
    const r = plate.getBoundingClientRect();
    const c = toMap(r.left + r.width / 2, r.top + r.height / 2);
    const ctm = arrow.getScreenCTM();
    const pt = (x, y) => {
      const p = new DOMPoint(x, y).matrixTransform(ctm);
      return toMap(p.x, p.y);
    };
    const tip = pt(0, 5);
    const tail = pt(12, 5);
    const dx = tip.x - tail.x;
    const dy = tip.y - tail.y;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : dy > 0 ? "S" : "N";
    const snap = ulNav.router.snap(floor, c.x, c.y);
    const toPath = { x: snap.x - c.x, y: snap.y - c.y };
    const len = Math.hypot(toPath.x, toPath.y) || 1;
    const dot = (dx * toPath.x + dy * toPath.y) / (Math.hypot(dx, dy) * len);
    plates.push({
      x: Math.round(c.x),
      y: Math.round(c.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      dir,
      sense: dot > 0.3 ? "in" : dot < -0.3 ? "out" : "side",
      snap: [Math.round(snap.x), Math.round(snap.y)],
      gap: Math.round(snap.gap),
      el: g,
    });
  }
  Object.assign(ulView.state, saved);
  ulView.render();
  window.ulStairPlates = plates;
  return JSON.stringify(plates.map(({ el, ...p }) => p));
})();
