/* Dev helper: point-in-fill probes against the Paper art of the current floor page. */
(() => {
  const stage = document.getElementById("stage");
  stage.style.transform = "none";
  const map = document.querySelector(".map");
  const M = map.getBoundingClientRect();
  const WALK = new Set(["#D9DFE3", "#E9E9E9"]);
  const BLOCK = new Set(["#9AABB2", "#A2E274", "#C59079", "#F8DB5B", "#FFDF8F", "#CDF8EF", "#E1E6E8"]);
  const opaque = (el) => {
    for (let n = el; n && n !== map; n = n.parentElement) {
      if (+getComputedStyle(n).opacity < 0.9) return false;
    }
    return true;
  };
  const walkPaths = [];
  const blockPaths = [];
  map.querySelectorAll("path").forEach((p) => {
    const f = (p.getAttribute("fill") || "").toUpperCase();
    if (WALK.has(f) && opaque(p)) walkPaths.push(p);
    else if (BLOCK.has(f) && opaque(p)) blockPaths.push(p);
  });
  const walkRects = [];
  const doorRects = [];
  map.querySelectorAll("div").forEach((d) => {
    const bg = d.style.backgroundColor;
    if (["rgb(217, 223, 227)", "rgb(233, 233, 233)"].includes(bg) && opaque(d)) {
      const b = d.getBoundingClientRect();
      walkRects.push([b.left - M.left, b.top - M.top, b.right - M.left, b.bottom - M.top]);
    } else if (bg === "rgb(0, 67, 200)") {
      const b = d.getBoundingClientRect();
      doorRects.push([b.left - M.left - 3, b.top - M.top - 3, b.right - M.left + 3, b.bottom - M.top + 3]);
    }
  });
  const inFill = (p, x, y) => {
    const pt = new DOMPoint(M.left + x, M.top + y).matrixTransform(p.getScreenCTM().inverse());
    return p.isPointInFill(pt);
  };
  const inRects = (rs, x, y) => rs.some((r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);
  window.ulProbe = {
    walk(x, y) {
      if (inRects(doorRects, x, y)) return true;
      if (blockPaths.some((p) => inFill(p, x, y))) return false;
      return inRects(walkRects, x, y) || walkPaths.some((p) => inFill(p, x, y));
    },
    runsX(y, x0 = 440, x1 = 1760, step = 2) {
      const out = [];
      let s = null;
      for (let x = x0; x <= x1; x += step) {
        const w = this.walk(x, y);
        if (w && s == null) s = x;
        if (!w && s != null) { out.push([s, x - step]); s = null; }
      }
      if (s != null) out.push([s, x1]);
      return out;
    },
    runsY(x, y0 = 280, y1 = 1830, step = 2) {
      const out = [];
      let s = null;
      for (let y = y0; y <= y1; y += step) {
        const w = this.walk(x, y);
        if (w && s == null) s = y;
        if (!w && s != null) { out.push([s, y - step]); s = null; }
      }
      if (s != null) out.push([s, y1]);
      return out;
    },
    /** Sample a polyline; return points that are off-path. */
    check(pts, step = 3) {
      const bad = [];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
        for (let k = 0; k <= n; k++) {
          const x = ax + ((bx - ax) * k) / n;
          const y = ay + ((by - ay) * k) / n;
          if (!this.walk(x, y)) bad.push([Math.round(x), Math.round(y)]);
        }
      }
      return bad;
    },
  };
  return { walkPaths: walkPaths.length, blockPaths: blockPaths.length, walkRects: walkRects.length, doors: doorRects.length };
})();
