/* UniLocate map navigation — walk ONLY on #D9DFE3, closest path via A* */
(() => {
  const MAP_W = 2184;
  const MAP_H = 2114;
  const CELL = 6;
  const COLS = Math.ceil(MAP_W / CELL);
  const ROWS = Math.ceil(MAP_H / CELL);
  // Use .html so static file servers / file:// / Live Server all resolve floors
  const FLOOR_PAGES = {
    ground: "ground-floor-map.html",
    first: "first-floor-map.html",
    second: "second-floor-map.html",
  };
  const NAV_VERSION = "20251114s";
  const FLOOR_LABEL = { ground: "Ground", first: "1st", second: "2nd" };
  const FLOOR_ORDER = ["ground", "first", "second"];
  const STORAGE_KEY = "unilocate-nav";
  // Corridor paints — solid (opacity 1) and faded (opacity 0.3) both count
  const PATH_COLORS = new Set(["#D9DFE3", "#E9E9E9", "#E1E6E8"]);
  const ENTRY_COLOR = "#0043C8";
  // Stair marker plate inside the step icons
  const STAIR_MARK = "#D9D9D9";
  // Blocked: classrooms + Quad greens + warm fills
  const ROOM_COLORS = new Set([
    "#9AABB2",
    "#FFDF8F",
    "#CDF8EF",
    "#C59079",
    "#A2E274",
    "#F8DB5B",
    "#FF8543",
  ]);

  const currentFloor =
    document.body.dataset.floor ||
    (location.pathname.includes("first")
      ? "first"
      : location.pathname.includes("second")
        ? "second"
        : "ground");

  const DESTINATIONS = [
    { id: "g-enquiry", name: "Enquiry Desk", floor: "ground", x: 754, y: 1279 },
    { id: "g-workshop", name: "Workshop", floor: "ground", x: 967, y: 1156 },
    { id: "g-gym", name: "Gym Khana", floor: "ground", x: 1240, y: 456 },
    { id: "g-workshops", name: "Workshops", floor: "ground", x: 1326, y: 331 },
    { id: "g-main-stage", name: "Main Stage", floor: "ground", x: 1633, y: 593 },
    { id: "g-stage", name: "Stage", floor: "ground", x: 601, y: 794 },
    { id: "g-gate", name: "Entry Exit Gate", floor: "ground", x: 503, y: 535 },
    { id: "g-mpc", name: "Multi purpose court", floor: "ground", x: 1343, y: 1060 },
    { id: "g-fees", name: "Fees Counter", floor: "ground", x: 626, y: 1359 },
    { id: "g-stilt", name: "Stilt area", floor: "ground", x: 776, y: 1050 },
    { id: "g-atrium", name: "Atrium", floor: "ground", x: 696, y: 782 },
    { id: "g-oc", name: "Oc", floor: "ground", x: 860, y: 903 },
    { id: "g-print", name: "Print Shop", floor: "ground", x: 548, y: 901 },
    { id: "g-library", name: "Library", floor: "ground", x: 668, y: 906 },
    // door on LEFT wall (label is top-center; without doorX routes clipped the top edge)
    {
      id: "g-canteen",
      name: "Canteen",
      floor: "ground",
      x: 619,
      y: 653,
      doorX: 524,
      doorY: 611,
    },
    // SE door on right wall — interior hall approach (not north perimeter)
    {
      id: "g-arch",
      name: "Architecture Wing",
      floor: "ground",
      x: 858,
      y: 664,
      doorX: 916,
      doorY: 718,
    },
    { id: "g-placement", name: "Placement Cell", floor: "ground", x: 706, y: 1365 },
    { id: "g-machine", name: "Machine Workshop", floor: "ground", x: 1038, y: 658 },
    { id: "g-turf", name: "Football Turf", floor: "ground", x: 1324, y: 1553 },
    { id: "1-quad", name: "Quad", floor: "first", x: 756, y: 1130 },
    { id: "1-atrium", name: "Atrium", floor: "first", x: 696, y: 782 },
    { id: "1-t101", name: "T101", floor: "first", x: 966, y: 1060 },
    { id: "1-t102", name: "T102", floor: "first", x: 967, y: 1120 },
    { id: "1-t103", name: "T103", floor: "first", x: 967, y: 1180 },
    { id: "1-t104", name: "T104", floor: "first", x: 966, y: 1253 },
    { id: "1-r101", name: "R101", floor: "first", x: 551, y: 1132 },
    { id: "1-r102", name: "R102", floor: "first", x: 550, y: 1193 },
    { id: "1-r103", name: "R103", floor: "first", x: 551, y: 1265 },
    { id: "1-s101", name: "S101", floor: "first", x: 692, y: 1260 },
    { id: "1-s102", name: "S102", floor: "first", x: 827, y: 1260 },
    { id: "1-exam", name: "Exam Cell", floor: "first", x: 829, y: 867 },
    { id: "1-l1", name: "L1", floor: "first", x: 830, y: 933 },
    { id: "1-l2", name: "L2", floor: "first", x: 895, y: 919 },
    { id: "1-o101", name: "O101", floor: "first", x: 737, y: 861 },
    { id: "1-o102", name: "O102", floor: "first", x: 737, y: 928 },
    { id: "1-o103", name: "O103", floor: "first", x: 742, y: 1054 },
    { id: "1-o104", name: "O104", floor: "first", x: 802, y: 1054 },
    { id: "1-l101", name: "L101", floor: "first", x: 653, y: 916 },
    { id: "1-l102", name: "L102", floor: "first", x: 600, y: 862 },
    { id: "1-l103", name: "L103", floor: "first", x: 600, y: 900 },
    { id: "1-l104", name: "L104", floor: "first", x: 601, y: 933 },
    { id: "1-vp", name: "V- Principle Cabin", floor: "first", x: 600, y: 971 },
    { id: "1-pimsr", name: "Pimsr Library", floor: "first", x: 619, y: 653 },
    { id: "1-arch", name: "Architecture Wing", floor: "first", x: 858, y: 656 },
    { id: "1-cons", name: "Consetition desk", floor: "first", x: 539, y: 956 },
    { id: "2-quad", name: "Quad", floor: "second", x: 756, y: 1130 },
    { id: "2-gym", name: "Gym Khana", floor: "second", x: 1240, y: 456 },
    { id: "2-workshops", name: "Workshops", floor: "second", x: 1326, y: 331 },
    { id: "2-atrium", name: "Atrium", floor: "second", x: 696, y: 782 },
    { id: "2-l3", name: "L3", floor: "second", x: 895, y: 919 },
    { id: "2-p203", name: "P203", floor: "second", x: 962, y: 1009 },
    { id: "2-p202", name: "P202", floor: "second", x: 1015, y: 986 },
    { id: "2-r201", name: "R201", floor: "second", x: 550, y: 1132 },
    { id: "2-r202", name: "R202", floor: "second", x: 550, y: 1193 },
    { id: "2-r203", name: "R203", floor: "second", x: 551, y: 1265 },
    { id: "2-pce", name: "PCE Library", floor: "second", x: 757, y: 1300 },
    { id: "2-exam", name: "Exam Cell", floor: "second", x: 837, y: 894 },
    { id: "2-o201", name: "O201", floor: "second", x: 737, y: 861 },
    { id: "2-o202", name: "O202", floor: "second", x: 736, y: 928 },
    { id: "2-o203", name: "O203", floor: "second", x: 741, y: 1054 },
    { id: "2-o204", name: "O204", floor: "second", x: 803, y: 1054 },
    { id: "2-g201", name: "G201", floor: "second", x: 661, y: 609 },
    { id: "2-g202", name: "G202", floor: "second", x: 651, y: 691 },
    { id: "2-g203", name: "G203", floor: "second", x: 575, y: 609 },
    { id: "2-staff", name: "Staff room", floor: "second", x: 557, y: 684 },
    { id: "2-l202", name: "L202", floor: "second", x: 601, y: 862 },
    { id: "2-l203", name: "L203", floor: "second", x: 601, y: 900 },
    { id: "2-l204", name: "L204", floor: "second", x: 600, y: 933 },
    { id: "2-vp", name: "V- Principle Cabin", floor: "second", x: 600, y: 971 },
    { id: "2-cons", name: "Consetition desk", floor: "second", x: 539, y: 956 },
    { id: "2-arch", name: "Architecture Wing", floor: "second", x: 858, y: 656 },
    { id: "2-t201", name: "T201", floor: "second", x: 967, y: 1060 },
    { id: "2-t202", name: "T202", floor: "second", x: 967, y: 1120 },
    { id: "2-t203", name: "T203", floor: "second", x: 967, y: 1180 },
    { id: "2-t204", name: "T204", floor: "second", x: 966, y: 1253 },
    { id: "2-conf", name: "Conference Hall", floor: "second", x: 655, y: 900 },
    { id: "2-hod", name: "HOD Room", floor: "second", x: 654, y: 967 },
    { id: "2-j201", name: "J201", floor: "second", x: 1049, y: 811 },
    { id: "2-j202", name: "J202", floor: "second", x: 1050, y: 744 },
    { id: "2-j203", name: "J203", floor: "second", x: 1050, y: 680 },
    { id: "2-bio", name: "Biotech Lab", floor: "second", x: 1020, y: 573 },
  ];

  // Fixed lifts (corridor cells next to shafts — never on washroom doors).
  // Stairs are also discovered from #D9D9D9 step icons on each floor.
  const VERTICAL = [
    { id: "lift-a", x: 918, y: 850, kind: "lift" },
    { id: "lift-b", x: 700, y: 640, kind: "lift" },
    { id: "lift-c", x: 545, y: 870, kind: "lift" },
    { id: "stair-a", x: 918, y: 780, kind: "stairs" },
    { id: "stair-b", x: 918, y: 910, kind: "stairs" },
    // West stairs near Staff / L202 (corridor just east of the step icons)
    { id: "stair-w1", x: 565, y: 736, kind: "stairs" },
    { id: "stair-w2", x: 565, y: 897, kind: "stairs" },
  ];

  /**
   * Hard corridor backbone (map px). Painted after color raster so left/right
   * wings stay linked WITHOUT crossing the Quad (center ~780,980).
   * Format: [x1, y1, x2, y2]
   */
  const CORRIDOR_SPINES = [
    // West N–S spine — inset from Architecture Wing wall
    [705, 560, 705, 1380],
    // East N–S spine — centered in hall (was 930, hugged Oc/stair wall)
    [900, 560, 900, 1380],
    // North link (above Quad)
    [705, 650, 900, 650],
    // Second northish link
    [705, 850, 900, 850],
    // Far south link
    [705, 1300, 900, 1300],
    // South choke beside Quad (green dilate used to erase these halls)
    [705, 1180, 705, 1320],
    [780, 1180, 780, 1260],
    [900, 1180, 900, 1320],
    [930, 1180, 930, 1260],
    [705, 1210, 930, 1210],
    [780, 1280, 930, 1280],
    // Spur to default start / stilt
    [705, 1380, 760, 1380],
    [760, 1380, 915, 1380],
    // West hall to west stairs
    [565, 900, 705, 900],
    [565, 740, 705, 740],
    // East spur toward J / Biotech (from centered spine)
    [900, 600, 1040, 600],
    [900, 780, 990, 780],
    [900, 1000, 970, 1000],
    // O203 / mid-west approach
    [705, 1005, 760, 1005],
    [741, 1005, 741, 1060],
  ];

  function portalPos(v) {
    return {
      x: v.snapX != null ? v.snapX : v.x,
      y: v.snapY != null ? v.snapY : v.y,
    };
  }

  /** Discover stair step icons (#D9D9D9 plates with #595959 bars) on this map */
  function discoverStairs(map) {
    const found = [];
    map.querySelectorAll("div").forEach((el) => {
      const st = styleMap(el);
      const bg = (st["background-color"] || "").toUpperCase();
      if (bg !== STAIR_MARK) return;
      // Prefer the outer wrapper that carries left/top (parent of the plate)
      const host =
        el.parentElement &&
        styleMap(el.parentElement).left != null
          ? el.parentElement
          : el;
      const hs = styleMap(host);
      const w = parseCssLen(hs.width, MAP_W) || parseCssLen(st.width, MAP_W) || 36;
      const h = parseCssLen(hs.height, MAP_H) || parseCssLen(st.height, MAP_H) || 20;
      let x = parseCssLen(hs.left, MAP_W);
      let y = parseCssLen(hs.top, MAP_H);
      if (x == null || y == null) return;
      if (hs.translate && hs.translate.includes("-50%")) {
        x -= w / 2;
        y -= h / 2;
      }
      found.push({ x: x + w / 2, y: y + h / 2 });
    });
    // Dedup overlapping markers from multi-flight stacks
    const uniq = [];
    for (const p of found) {
      if (uniq.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 36)) continue;
      uniq.push(p);
    }
    return uniq.map((p, i) => ({
      id: "stair-auto-" + i,
      x: p.x,
      y: p.y,
      kind: "stairs",
    }));
  }

  /** Lifts + hardcoded stairs + per-map stair icons */
  function verticalsFor(map) {
    const auto = discoverStairs(map);
    const merged = VERTICAL.slice();
    for (const s of auto) {
      if (
        merged.some(
          (v) =>
            v.kind === "stairs" &&
            Math.hypot(v.x - s.x, v.y - s.y) < 48
        )
      )
        continue;
      merged.push(s);
    }
    return merged;
  }

  /** All #0043C8 door centers on this map */
  function collectDoors(map) {
    const doors = [];
    map.querySelectorAll("div").forEach((el) => {
      const st = styleMap(el);
      const bg = (st["background-color"] || "").toUpperCase();
      if (bg !== ENTRY_COLOR) return;
      const w = parseCssLen(st.width, MAP_W) || 3;
      const h = parseCssLen(st.height, MAP_H) || 14;
      let x = parseCssLen(st.left, MAP_W);
      let y = parseCssLen(st.top, MAP_H);
      if (x == null || y == null) return;
      if (st.translate && st.translate.includes("-50%")) {
        x -= w / 2;
        y -= h / 2;
      }
      doors.push({ x: x + w / 2, y: y + h / 2 });
    });
    return doors;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function parseCssLen(expr, percentBase) {
    if (expr == null) return null;
    const s = String(expr).trim();
    const calc = s.match(/^calc\(50%\s*([+-])\s*([\d.]+)px\)$/i);
    if (calc) {
      return percentBase / 2 + (calc[1] === "-" ? -1 : 1) * Number(calc[2]);
    }
    const pct = s.match(/^([\d.]+)%$/);
    if (pct) return (Number(pct[1]) / 100) * percentBase;
    const px = s.match(/^([\d.]+)px$/i);
    if (px) return Number(px[1]);
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function styleMap(el) {
    const raw = el.getAttribute("style") || "";
    const out = {};
    raw.split(";").forEach((part) => {
      const i = part.indexOf(":");
      if (i < 0) return;
      out[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
    });
    return out;
  }

  function svgLayout(svg) {
    const st = styleMap(svg);
    let left = parseCssLen(st.left, MAP_W);
    let top = parseCssLen(st.top, MAP_H);
    const w = parseCssLen(st.width, MAP_W) ?? svg.viewBox?.baseVal?.width ?? 0;
    const h = parseCssLen(st.height, MAP_H) ?? svg.viewBox?.baseVal?.height ?? 0;
    if (st.translate && st.translate.includes("-50%")) {
      left -= w / 2;
      top -= h / 2;
    }
    const rot = st.rotate ? parseFloat(st.rotate) : 0;
    // transform-origin: 0% 0% → top-left; default center for translate-centered nodes
    const originLeft =
      st["transform-origin"] && st["transform-origin"].startsWith("0%")
        ? left
        : left + w / 2;
    const originTop =
      st["transform-origin"] && st["transform-origin"].includes("0%")
        ? top
        : top + h / 2;
    return {
      left: left ?? 0,
      top: top ?? 0,
      w,
      h,
      rot: Number.isFinite(rot) ? rot : 0,
      ox: originLeft ?? 0,
      oy: originTop ?? 0,
    };
  }

  function svgOrigin(svg) {
    const L = svgLayout(svg);
    return { left: L.left, top: L.top };
  }

  /** Paint div rectangles whose background is in `colors` */
  function paintDivFills(ctx, map, colors, pad = 0) {
    map.querySelectorAll("div").forEach((el) => {
      if (el.classList.contains("user-location") || el.classList.contains("map-label"))
        return;
      const st = styleMap(el);
      const bg = (st["background-color"] || "").toUpperCase();
      if (!colors.has(bg)) return;
      const w = parseCssLen(st.width, MAP_W);
      const h = parseCssLen(st.height, MAP_H);
      let x = parseCssLen(st.left, MAP_W);
      let y = parseCssLen(st.top, MAP_H);
      if (w == null || h == null || x == null || y == null) return;
      if (st.translate && st.translate.includes("-50%")) {
        x -= w / 2;
        y -= h / 2;
      }
      const rot = st.rotate ? parseFloat(st.rotate) : 0;
      ctx.save();
      ctx.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
      if (rot) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
      } else {
        ctx.fillRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
      }
      ctx.restore();
    });
  }

  function paintPathSvgs(ctx, map, colorSet, maxViewArea = Infinity) {
    map.querySelectorAll("path").forEach((pathEl) => {
      const fill = (pathEl.getAttribute("fill") || "").toUpperCase();
      if (!colorSet.has(fill)) return;
      const svg = pathEl.ownerSVGElement;
      if (!svg) return;
      const vb = svg.viewBox?.baseVal;
      if (vb && vb.width * vb.height > maxViewArea) return;
      const L = svgLayout(svg);
      const d = pathEl.getAttribute("d");
      if (!d) return;
      try {
        const p = new Path2D(d);
        ctx.save();
        ctx.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
        if (L.rot) {
          ctx.translate(L.ox, L.oy);
          ctx.rotate((L.rot * Math.PI) / 180);
          ctx.translate(-L.ox, -L.oy);
        }
        ctx.translate(L.left, L.top);
        ctx.fill(p, pathEl.getAttribute("fill-rule") || "nonzero");
        ctx.restore();
      } catch (_) {}
    });
  }

  function rasterMask(paintFn) {
    const c = document.createElement("canvas");
    c.width = COLS;
    c.height = ROWS;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, COLS, ROWS);
    ctx.fillStyle = "#fff";
    paintFn(ctx);
    const data = ctx.getImageData(0, 0, COLS, ROWS).data;
    const mask = new Uint8Array(COLS * ROWS);
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4] > 128 ? 1 : 0;
    return mask;
  }

  function dilateMask(src, intoBlocked) {
    const out = new Uint8Array(src);
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const i = y * COLS + x;
        if (src[i]) continue;
        if (intoBlocked && intoBlocked[i]) continue;
        if (
          src[i - 1] ||
          src[i + 1] ||
          src[i - COLS] ||
          src[i + COLS]
        ) {
          out[i] = 1;
        }
      }
    }
    return out;
  }

  /**
   * Paint known corridor backbone.
   * - Never open solid rooms (unless that pixel was already corridor paint).
   * - `overGreen` restores halls beside the Quad after green dilate ate them.
   */
  function paintCorridorSpines(walk, blockedGreen, opts = {}) {
    const overGreen = !!opts.overGreen;
    const blockedRooms = opts.blockedRooms || null;
    const corridor = opts.corridor || null; // walk0|strips — real hall paint
    const radius = opts.radius || 2;
    for (const [x1, y1, x2, y2] of CORRIDOR_SPINES) {
      const a = toCell(x1, y1);
      const b = toCell(x2, y2);
      const tmp = new Uint8Array(walk.length);
      paintBridge(tmp, a.cx, a.cy, b.cx, b.cy, radius);
      for (let i = 0; i < tmp.length; i++) {
        if (!tmp[i]) continue;
        if (!overGreen && blockedGreen && blockedGreen[i]) continue;
        // Do not tunnel through rooms — that drew the line through Library etc.
        if (
          blockedRooms &&
          blockedRooms[i] &&
          !(corridor && corridor[i])
        ) {
          continue;
        }
        walk[i] = 1;
      }
    }
  }

  /** Rasterize corridors; block rooms/Quad; snap stairs onto main path */
  function buildWalkGrid(map) {
    // Walkable = corridor paints ONLY (#D9DFE3 etc), including faded opacity 0.3
    // pieces. Never the white building plate — that made routes run "outside".
    const walk0 = rasterMask((ctx) => {
      paintPathSvgs(ctx, map, PATH_COLORS); // includes big Union @ opacity 0.3
      paintDivFills(ctx, map, PATH_COLORS); // solid + faded div corridors
    });

    // Blocked = rooms + Quad. Inflate greens so Quad cannot be skimmed.
    const roomOnly = new Set(
      [...ROOM_COLORS].filter((c) => c !== "#A2E274")
    );
    const blockedRooms = rasterMask((ctx) => {
      paintPathSvgs(ctx, map, roomOnly);
    });
    const blockedGreen = dilateMask(
      dilateMask(
        rasterMask((ctx) => {
          paintPathSvgs(ctx, map, new Set(["#A2E274"]));
        }),
        null
      ),
      null
    );

    const walk = new Uint8Array(COLS * ROWS);
    for (let i = 0; i < walk.length; i++) {
      walk[i] = walk0[i] && !blockedRooms[i] && !blockedGreen[i] ? 1 : 0;
    }

    // Thin corridor sticks + doors
    const strips = rasterMask((ctx) => {
      paintDivFills(ctx, map, PATH_COLORS);
      paintPathSvgs(ctx, map, PATH_COLORS, 80000);
    });
    const doors = rasterMask((ctx) => {
      paintDivFills(ctx, map, new Set([ENTRY_COLOR]), 2);
    });
    for (let i = 0; i < walk.length; i++) {
      if (strips[i] && !blockedGreen[i] && !blockedRooms[i]) walk[i] = 1;
      if (doors[i]) walk[i] = 1;
      if (blockedGreen[i]) walk[i] = 0;
    }

    const corridorPaint = new Uint8Array(COLS * ROWS);
    for (let i = 0; i < corridorPaint.length; i++) {
      corridorPaint[i] = walk0[i] || strips[i] || doors[i] ? 1 : 0;
    }

    // Force connected hallways around Quad / between wings
    paintCorridorSpines(walk, blockedGreen, {
      blockedRooms,
      corridor: corridorPaint,
    });

    const dilate = dilateMask(walk, blockedGreen);
    for (let i = 0; i < dilate.length; i++) {
      if (doors[i]) dilate[i] = 1;
      if (strips[i] && !blockedGreen[i]) dilate[i] = 1;
      // Rooms block unless a spine/door/strip already claimed the cell
      if (blockedRooms[i] && !doors[i] && !strips[i] && !walk[i]) dilate[i] = 0;
      if (blockedGreen[i]) dilate[i] = 0;
    }

    // Re-apply spines after cleanup so west↔east stays linked
    paintCorridorSpines(dilate, blockedGreen, {
      blockedRooms,
      corridor: corridorPaint,
    });
    for (let i = 0; i < dilate.length; i++) {
      if (doors[i]) dilate[i] = 1;
      if (blockedGreen[i]) dilate[i] = 0;
    }

    // Restore inside halls beside Quad (green only — never punch rooms)
    paintCorridorSpines(dilate, blockedGreen, {
      overGreen: true,
      blockedRooms,
      corridor: corridorPaint,
      radius: 2,
    });
    // Hard guarantee: no walk through solid rooms
    for (let i = 0; i < dilate.length; i++) {
      if (blockedRooms[i] && !doors[i] && !corridorPaint[i]) dilate[i] = 0;
      if (doors[i]) dilate[i] = 1;
    }

    // Last-chance seam seal: if south/north inside components don't meet,
    // bridge only green cells (not rooms) along the Quad-side halls.
    sealInsideSeam(dilate, blockedRooms, corridorPaint, blockedGreen);

    // Door pads can sit 6–10 cells off the hall after Quad carve
    joinNearbyIslands(dilate, 10);
    connectPortalsToMain(dilate, map);
    return dilate;
  }

  /** Bridge the y≈1210–1250 gap beside Quad without opening rooms */
  function sealInsideSeam(walk, blockedRooms, corridorPaint, blockedGreen) {
    const seals = [
      [705, 1195, 705, 1245],
      [780, 1195, 780, 1245],
      [900, 1195, 900, 1255],
      [930, 1195, 930, 1255],
      [705, 1212, 930, 1212],
      [705, 1240, 930, 1240],
    ];
    for (const [x1, y1, x2, y2] of seals) {
      const a = toCell(x1, y1);
      const b = toCell(x2, y2);
      const tmp = new Uint8Array(walk.length);
      paintBridge(tmp, a.cx, a.cy, b.cx, b.cy, 2);
      for (let i = 0; i < tmp.length; i++) {
        if (!tmp[i]) continue;
        // Never open solid rooms — green/empty hall seam only
        if (blockedRooms[i] && !corridorPaint[i]) continue;
        walk[i] = 1;
      }
    }
  }

  /**
   * Distance-to-inside-spine cost. Outer perimeter halls are walkable but
   * should lose to the central corridors (user's red paths).
   */
  function buildSpineCost(walk) {
    if (walk.__ulSpineCost) return walk.__ulSpineCost;
    const pref = new Uint8Array(walk.length); // 1 = near spine
    for (const [x1, y1, x2, y2] of CORRIDOR_SPINES) {
      const a = toCell(x1, y1);
      const b = toCell(x2, y2);
      const tmp = new Uint8Array(walk.length);
      paintBridge(tmp, a.cx, a.cy, b.cx, b.cy, 5);
      for (let i = 0; i < tmp.length; i++) if (tmp[i]) pref[i] = 1;
    }
    // Also mark the main inside band (between outer walls)
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const i = idx(cx, cy);
        if (!walk[i] || pref[i]) continue;
        const x = cx * CELL + CELL / 2;
        // Outer ring used by the wrong (blue) routes
        if (x < 545 || x > 980) continue;
        pref[i] = 1;
      }
    }
    const cost = new Float32Array(walk.length);
    for (let i = 0; i < walk.length; i++) {
      if (!walk[i]) continue;
      cost[i] = pref[i] ? 0 : 4.5; // strong bias: stay inside, not outer ring
    }
    walk.__ulSpineCost = cost;
    return cost;
  }

  /** Short-bridge small walkable islands onto the main corridor (doors, stubs) */
  function joinNearbyIslands(walk, maxCells) {
    const { label, sizes, mainId } = labelComponents(walk);
    if (!sizes.length || sizes[mainId] < 200) return;
    const nbrs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (let id = 0; id < sizes.length; id++) {
      if (id === mainId || sizes[id] > 400) continue;
      // Find a cell in this island closest to main
      let best = null;
      let bestD = Infinity;
      for (let i = 0; i < walk.length; i++) {
        if (label[i] !== id) continue;
        const cx = i % COLS;
        const cy = (i - cx) / COLS;
        for (let r = 1; r <= maxCells; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
              if (label[idx(nx, ny)] !== mainId) continue;
              const d = dx * dx + dy * dy;
              if (d < bestD) {
                bestD = d;
                best = { cx, cy, tx: nx, ty: ny };
              }
            }
          }
        }
      }
      if (best) paintBridge(walk, best.cx, best.cy, best.tx, best.ty, 1);
    }
  }

  /** Paint a thick cell disk into the walk mask */
  function paintDisk(walk, cx, cy, r) {
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        walk[idx(nx, ny)] = 1;
      }
    }
  }

  /** Bresenham-ish thick line between two cells */
  function paintBridge(walk, x0, y0, x1, y1, radius) {
    let cx = x0;
    let cy = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      paintDisk(walk, cx, cy, radius);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  /** Largest connected walkable component id per cell (-1 = blocked) */
  function labelComponents(walk) {
    const label = new Int32Array(walk.length);
    label.fill(-1);
    const sizes = [];
    let compId = 0;
    const nbrs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (let i = 0; i < walk.length; i++) {
      if (!walk[i] || label[i] >= 0) continue;
      const stack = [i];
      label[i] = compId;
      let n = 0;
      while (stack.length) {
        const k = stack.pop();
        n++;
        const cx = k % COLS;
        const cy = (k - cx) / COLS;
        for (const [dx, dy] of nbrs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          const nk = idx(nx, ny);
          if (!walk[nk] || label[nk] >= 0) continue;
          label[nk] = compId;
          stack.push(nk);
        }
      }
      sizes[compId] = n;
      compId++;
    }
    let mainId = 0;
    for (let id = 1; id < sizes.length; id++) {
      if (sizes[id] > sizes[mainId]) mainId = id;
    }
    return { label, sizes, mainId };
  }

  /**
   * Snap each lift/stair onto the main corridor — never onto a room door
   * (washroom doors sit right next to this stair cluster).
   */
  function connectPortalsToMain(walk, map) {
    const { label, sizes, mainId } = labelComponents(walk);
    if (!sizes.length || sizes[mainId] < 200) return;
    const doors = map ? collectDoors(map) : [];
    const nearDoor = (wx, wy) =>
      doors.some((d) => Math.hypot(d.x - wx, d.y - wy) < 28);

    const isCorridor = (id) =>
      id === mainId || (id >= 0 && sizes[id] >= 400);

    for (const v of verticalsFor(map)) {
      const { cx, cy } = toCell(v.x, v.y);
      let best = null;
      let bestD = Infinity;
      const maxR = Math.ceil(100 / CELL);
      for (let r = 0; r <= maxR; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (r && Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            const id = label[idx(nx, ny)];
            if (!isCorridor(id)) continue;
            const world = toWorld(nx, ny);
            if (nearDoor(world.x, world.y)) continue;
            const d = dx * dx + dy * dy + (id === mainId ? 0 : 40);
            if (d < bestD) {
              bestD = d;
              best = { cx: nx, cy: ny, world };
            }
          }
        }
        if (best && bestD <= r * r + 2) break;
      }
      if (!best) {
        v.snapX = v.x;
        v.snapY = v.y;
        continue;
      }
      v.snapX = best.world.x;
      v.snapY = best.world.y;
    }
  }

  function toCell(x, y) {
    // Use floor so toWorld(cx,cy) → toCell round-trips (round() jumps +1 at *.5)
    return {
      cx: Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))),
      cy: Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL))),
    };
  }

  function toWorld(cx, cy) {
    return { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 };
  }

  function idx(cx, cy) {
    return cy * COLS + cx;
  }

  /** Closest walkable cell to a map point (BFS ring). Prefer hall center when tied. */
  function nearestWalkable(walk, x, y, maxR = 80, clr = null) {
    const { cx, cy } = toCell(x, y);
    if (walk[idx(cx, cy)]) return { cx, cy, ...toWorld(cx, cy) };
    const maxCells = Math.ceil(maxR / CELL);
    for (let r = 1; r <= maxCells; r++) {
      let best = null;
      let bestClr = -1;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          if (!walk[idx(nx, ny)]) continue;
          const c = clr ? clr[idx(nx, ny)] : 0;
          if (!best || c > bestClr) {
            best = { cx: nx, cy: ny, ...toWorld(nx, ny) };
            bestClr = c;
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  /**
   * Chebyshev clearance from walls (0 = touches blocked). Used so A* prefers
   * the middle of corridors over wall-hugging / “outside” edges.
   */
  function buildClearance(walk) {
    if (walk.__ulClr) return walk.__ulClr;
    const clr = new Uint8Array(walk.length);
    const MAX = 4;
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const i = idx(cx, cy);
        if (!walk[i]) continue;
        let d = MAX;
        outer: for (let r = 1; r <= MAX; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
              const nx = cx + dx;
              const ny = cy + dy;
              if (
                nx < 0 ||
                ny < 0 ||
                nx >= COLS ||
                ny >= ROWS ||
                !walk[idx(nx, ny)]
              ) {
                d = r - 1;
                break outer;
              }
            }
          }
        }
        clr[i] = d;
      }
    }
    walk.__ulClr = clr;
    return clr;
  }

  /**
   * Door for this room only — must be closer to `dest` than to any other
   * destination label (stops P203 routes ending in the washroom next door).
   * Prefer an explicit dest.doorX/doorY when the label sits far from the entry.
   */
  function nearestEntryOnPath(map, walk, dest) {
    if (dest.doorX != null && dest.doorY != null) {
      const pinned = nearestWalkable(walk, dest.doorX, dest.doorY, 72);
      if (pinned && dist(pinned, { x: dest.doorX, y: dest.doorY }) < 40) {
        return pinned;
      }
    }

    const doors = collectDoors(map);
    let best = null;
    let bestScore = Infinity;
    for (const door of doors) {
      const dDest = dist(dest, door);
      if (dDest > 180) continue;
      // Voronoi: door belongs to closest room label
      let owner = dest;
      let ownerD = dDest;
      for (const other of DESTINATIONS) {
        if (other.floor !== dest.floor) continue;
        if (other.id === dest.id) continue;
        const dO = dist(other, door);
        if (dO < ownerD) {
          owner = other;
          ownerD = dO;
        }
      }
      if (owner.id !== dest.id) continue;
      // Door must sit on / next to the walkable hall — reject wall-only snaps
      const snap = nearestWalkable(walk, door.x, door.y, 36);
      if (!snap) continue;
      const dSnap = dist(snap, door);
      if (dSnap > 28) continue;
      const score = dDest + dSnap * 2;
      if (score < bestScore) {
        bestScore = score;
        best = snap;
      }
    }
    if (best) return best;
    // Last resort: corridor near the label (may hug a wall — avoid when possible)
    return nearestWalkable(walk, dest.x, dest.y, 220);
  }

  /** Extra cost when a cell sits against a wall / non-walkable edge */
  function edgePenalty(walk, cx, cy) {
    let pen = 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || !walk[idx(nx, ny)]) {
        pen += 0.85;
      }
    }
    return pen;
  }

  /**
   * Prefer inside the hall — punish wall-adjacent cells only.
   * Soft steps avoid diagonal staircasing from a steep clearance gradient.
   */
  function interiorPenalty(clr, cx, cy) {
    const c = clr[idx(cx, cy)] || 0;
    if (c === 0) return 1.4;
    if (c === 1) return 0.45;
    return 0;
  }

  function astar(walk, start, goal) {
    const clr = buildClearance(walk);
    const spineCost = buildSpineCost(walk);
    const s = nearestWalkable(walk, start.x, start.y, 80, clr);
    const g = nearestWalkable(walk, goal.x, goal.y, 80, clr);
    if (!s || !g) return null;
    if (s.cx === g.cx && s.cy === g.cy) return [toWorld(s.cx, s.cy)];

    const open = new Map(); // key -> f
    const gScore = new Map([[idx(s.cx, s.cy), 0]]);
    const came = new Map();
    const key = (cx, cy) => idx(cx, cy);
    const h = (cx, cy) => Math.hypot(cx - g.cx, cy - g.cy);

    open.set(key(s.cx, s.cy), h(s.cx, s.cy));

    // Prefer orthogonal moves — diagonals caused wall-hugging zigzags
    const nbrs = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
    ];

    let guard = 0;
    while (open.size && guard++ < 200000) {
      let bestK = null;
      let bestF = Infinity;
      for (const [k, f] of open) {
        if (f < bestF) {
          bestF = f;
          bestK = k;
        }
      }
      open.delete(bestK);
      const cx = bestK % COLS;
      const cy = (bestK - cx) / COLS;
      if (cx === g.cx && cy === g.cy) {
        const path = [];
        let cur = bestK;
        while (cur != null) {
          const x = cur % COLS;
          const y = (cur - x) / COLS;
          path.push(toWorld(x, y));
          cur = came.has(cur) ? came.get(cur) : null;
        }
        path.reverse();
        return stringPull(walk, simplify(path));
      }
      const baseG = gScore.get(bestK);
      for (const [dx, dy, cost] of nbrs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        if (!walk[idx(nx, ny)]) continue;
        const nk = key(nx, ny);
        const tg =
          baseG +
          cost +
          edgePenalty(walk, nx, ny) +
          interiorPenalty(clr, nx, ny) +
          (spineCost[nk] || 0);
        if (tg < (gScore.get(nk) ?? Infinity)) {
          came.set(nk, bestK);
          gScore.set(nk, tg);
          open.set(nk, tg + h(nx, ny));
        }
      }
    }
    return null;
  }

  function lineClear(walk, cx0, cy0, cx1, cy1) {
    if (cx0 === cx1) {
      const y0 = Math.min(cy0, cy1);
      const y1 = Math.max(cy0, cy1);
      for (let y = y0; y <= y1; y++) if (!walk[idx(cx0, y)]) return false;
      return true;
    }
    if (cy0 === cy1) {
      const x0 = Math.min(cx0, cx1);
      const x1 = Math.max(cx0, cx1);
      for (let x = x0; x <= x1; x++) if (!walk[idx(x, cy0)]) return false;
      return true;
    }
    return false;
  }

  /** Orthogonal L through a corner if both legs stay on the walk mask */
  function orthoBridge(walk, a, b) {
    const ca = toCell(a.x, a.y);
    const cb = toCell(b.x, b.y);
    if (ca.cx === cb.cx || ca.cy === cb.cy) {
      return lineClear(walk, ca.cx, ca.cy, cb.cx, cb.cy) ? [b] : null;
    }
    if (
      lineClear(walk, ca.cx, ca.cy, cb.cx, ca.cy) &&
      lineClear(walk, cb.cx, ca.cy, cb.cx, cb.cy)
    ) {
      return [toWorld(cb.cx, ca.cy), b];
    }
    if (
      lineClear(walk, ca.cx, ca.cy, ca.cx, cb.cy) &&
      lineClear(walk, ca.cx, cb.cy, cb.cx, cb.cy)
    ) {
      return [toWorld(ca.cx, cb.cy), b];
    }
    return null;
  }

  /** Collapse wall-hugging staircases into clean inside L / straight runs */
  function stringPull(walk, points) {
    if (points.length < 3) return points;
    const out = [points[0]];
    let i = 0;
    while (i < points.length - 1) {
      let bestJ = i + 1;
      let bestVia = [points[i + 1]];
      for (let j = points.length - 1; j > i + 1; j--) {
        const via = orthoBridge(walk, points[i], points[j]);
        if (via) {
          bestJ = j;
          bestVia = via;
          break;
        }
      }
      for (const p of bestVia) out.push(p);
      i = bestJ;
    }
    return simplify(out);
  }

  function simplify(points) {
    if (points.length < 3) return points;
    const out = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const a = out[out.length - 1];
      const b = points[i];
      const c = points[i + 1];
      const cross =
        (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(cross) > 2) out.push(b);
    }
    out.push(points[points.length - 1]);
    return out;
  }

  function pathLength(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
    return L;
  }

  function floorSteps(from, to) {
    return Math.abs(FLOOR_ORDER.indexOf(from) - FLOOR_ORDER.indexOf(to));
  }

  /** Next adjacent floor toward dest (ground ↔ first ↔ second) */
  function nextFloorToward(from, to) {
    const a = FLOOR_ORDER.indexOf(from);
    const b = FLOOR_ORDER.indexOf(to);
    if (a < 0 || b < 0 || a === b) return null;
    return FLOOR_ORDER[a + (b > a ? 1 : -1)];
  }

  function makeContinue(dest, verticalId, portal) {
    return {
      destId: dest.id,
      destName: dest.name,
      destFloor: dest.floor,
      destX: dest.x,
      destY: dest.y,
      verticalId,
      portalX: portal.x,
      portalY: portal.y,
    };
  }

  /** Walk to a vertical shaft along corridors only, then mark a floor hop */
  function buildHopPlan(walk, start, dest, hopTo, preferredId, map) {
    let best = null;
    const shafts = map ? verticalsFor(map) : VERTICAL;
    const ordered = preferredId
      ? [
          ...shafts.filter((v) => v.id === preferredId),
          ...shafts.filter((v) => v.id !== preferredId),
        ]
      : shafts.slice();

    for (const v of ordered) {
      const shaft = portalPos(v);
      const portal = nearestWalkable(walk, shaft.x, shaft.y, 140);
      if (!portal) continue;
      const toPortal = astar(walk, start, portal);
      if (!toPortal || toPortal.length < 1) {
        // Preferred shaft and already on it — hop in place (no room-cut)
        if (v.id === preferredId) {
          const here = nearestWalkable(walk, start.x, start.y, 24);
          if (
            here &&
            Math.hypot(here.x - portal.x, here.y - portal.y) < 40
          ) {
            best = {
              score: -100,
              kind: v.kind,
              portal,
              toPortal: [here, { ...portal }],
              verticalId: v.id,
            };
            break;
          }
        }
        continue;
      }
      // Prefer stairs (arrow icons) over lifts when walking distance is similar
      const transfer =
        (v.kind === "stairs" ? 25 : 50) + (v.id === preferredId ? -100 : 0);
      const score = pathLength(toPortal) + transfer;
      if (!best || score < best.score) {
        best = { score, kind: v.kind, portal, toPortal, verticalId: v.id };
      }
      if (v.id === preferredId) break;
    }
    if (!best) return null;

    const points = best.toPortal.map((p) => ({
      ...p,
      floor: currentFloor,
      via: "path",
    }));
    if (points.length === 1) points.push({ ...points[0] });
    points[points.length - 1] = {
      ...points[points.length - 1],
      x: best.portal.x,
      y: best.portal.y,
      kind: best.kind,
      verticalId: best.verticalId,
      nextFloor: hopTo,
      via: best.kind,
    };
    return {
      points,
      meters: pathLength(best.toPortal),
      viaLabel: best.kind,
      continue: makeContinue(dest, best.verticalId, best.portal),
    };
  }

  /**
   * Build route on corridors only. Cross-floor: walk to lift/stair,
   * then hop one floor at a time until destination floor.
   */
  function planRoute(walk, map, start, dest, preferredVerticalId) {
    if (dest.floor === currentFloor) {
      const goalOnPath = nearestEntryOnPath(map, walk, dest);
      if (!goalOnPath) return null;
      const pts = astar(walk, start, goalOnPath);
      if (!pts) return null;
      return {
        points: pts.map((p) => ({ ...p, floor: currentFloor, via: "path" })),
        meters: pathLength(pts),
        viaLabel: "path",
      };
    }

    const hopTo = nextFloorToward(currentFloor, dest.floor);
    if (!hopTo) return null;
    return buildHopPlan(walk, start, dest, hopTo, preferredVerticalId, map);
  }

  // Chevron points left in local SVG; +180deg → points +X so wrapper uses atan2 directly
  const TIP_SVG = `
    <svg viewBox="0 0 19.5 31" width="20" height="31" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(#00000040 0px 4px 2px);transform:rotate(180deg);transform-origin:center">
      <path d="M14.879 3.791C14.879 3.791 0.973 15.202 0.973 15.202C0.737 15.395 0.603 15.686 0.607 15.990C0.612 16.295 0.756 16.581 0.998 16.767C0.998 16.767 15.737 28.106 15.737 28.106C16.112 28.394 16.638 28.380 16.997 28.073C17.356 27.766 17.451 27.249 17.225 26.834C13.308 18.167 13.254 12.224 16.365 5.089C16.621 4.673 16.540 4.132 16.172 3.811C15.804 3.490 15.257 3.481 14.879 3.791Z" fill-rule="nonzero" fill="#49B0FF"></path>
      <path d="M14.879 3.791C14.879 3.791 0.973 15.202 0.973 15.202C0.737 15.395 0.603 15.686 0.607 15.990C0.612 16.295 0.756 16.581 0.998 16.767C0.998 16.767 15.737 28.106 15.737 28.106C16.112 28.394 16.638 28.380 16.997 28.073C17.356 27.766 17.451 27.249 17.225 26.834C13.308 18.167 13.254 12.224 16.365 5.089C16.621 4.673 16.540 4.132 16.172 3.811C15.804 3.490 15.257 3.481 14.879 3.791Z" fill="none" stroke="#FFFFFF" stroke-width="2"></path>
    </svg>`;

  function ensureUserPin(map, x, y) {
    let pin = map.querySelector(".user-location");
    if (!pin) {
      pin = document.createElement("div");
      pin.className = "user-location";
      pin.setAttribute("aria-label", "Your location");
      pin.innerHTML = `
        <div class="user-location-tip" style="position:absolute;left:22px;top:39px;width:20px;height:31px;margin-left:-10px;margin-top:-15.5px;transform-origin:center center;will-change:transform;z-index:3;pointer-events:none">
          ${TIP_SVG}
        </div>
        <div class="user-location-avatar" style="background-color:#FFFFFF;border-radius:65px;box-shadow:#00000040 2px 4px 4.2px;box-sizing:border-box;height:44px;left:0;overflow:visible;position:absolute;top:17px;width:44px;z-index:2">
          <div style="background-image:url(https://app.paper.design/file-assets/01M6ZJNBHTQTRXCQ5Y82G5QKNC/7ZW9MS8CV6NPMEFTQHZKDGX58G.png);background-position:50% 23.66%;background-repeat:no-repeat;background-size:132.13% 185.71%;border-radius:65px;box-sizing:border-box;height:81.8182%;left:9.09091%;overflow:visible;position:absolute;top:9.09091%;width:81.8182%"></div>
        </div>`;
      map.appendChild(pin);
    } else if (!pin.querySelector(".user-location-tip")) {
      // Rebuild tip from Paper markup so the triangle can rotate with travel
      const oldSvg = pin.querySelector(":scope > svg");
      const avatar = pin.querySelector(":scope > div");
      if (oldSvg) oldSvg.remove();
      const tip = document.createElement("div");
      tip.className = "user-location-tip";
      tip.style.cssText =
        "position:absolute;left:22px;top:39px;width:20px;height:31px;margin-left:-10px;margin-top:-15.5px;transform-origin:center center;will-change:transform;z-index:3;pointer-events:none";
      tip.innerHTML = TIP_SVG;
      pin.prepend(tip);
      if (avatar) {
        avatar.classList.add("user-location-avatar");
        avatar.style.zIndex = "2";
      }
    }
    pin.style.cssText = `box-sizing:border-box;height:61px;width:44px;left:${x - 22}px;top:${y - 55}px;position:absolute;z-index:12;transition:left 40ms linear, top 40ms linear;pointer-events:none;`;
    return pin;
  }

  /** Point the blue triangle along the movement vector (avatar stays upright) */
  function facePin(pin, from, to) {
    const tip = pin.querySelector(".user-location-tip");
    if (!tip) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.hypot(dx, dy) < 0.5) return;
    // Tip SVG is rotated to +X; wrapper angle = screen movement direction
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    tip.style.transform = `rotate(${deg}deg)`;
  }

  function ensureRouteLayer(map) {
    let layer = map.querySelector("#nav-route-layer");
    if (!layer) {
      layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      layer.setAttribute("id", "nav-route-layer");
      layer.setAttribute("viewBox", `0 0 ${MAP_W} ${MAP_H}`);
      layer.setAttribute("width", String(MAP_W));
      layer.setAttribute("height", String(MAP_H));
      layer.style.cssText =
        "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:10;overflow:visible";
      map.appendChild(layer);
    }
    return layer;
  }

  function drawRoute(map, points) {
    const layer = ensureRouteLayer(map);
    layer.innerHTML = "";
    if (!points || points.length < 2) return;
    const d = points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#49B0FF");
    path.setAttribute("stroke-width", "8");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("opacity", "0.9");
    layer.appendChild(path);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function animateAlong(pin, from, to, speed = 320) {
    facePin(pin, from, to);
    const len = dist(from, to);
    const steps = Math.max(4, Math.ceil(len / 10));
    const dt = Math.max(12, (len / speed) * 1000) / steps;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      facePin(pin, from, to);
      pin.style.left = `${x - 22}px`;
      pin.style.top = `${y - 55}px`;
      await sleep(dt);
    }
  }

  function saveNav(state) {
    const raw = JSON.stringify(state);
    try {
      sessionStorage.setItem(STORAGE_KEY, raw);
    } catch (_) {}
    try {
      localStorage.setItem(STORAGE_KEY, raw);
    } catch (_) {}
  }
  function loadNav() {
    // 1) URL payload survives file:// and flaky sessionStorage across hops
    try {
      const q = new URLSearchParams(location.search).get("resume");
      if (q) {
        const parsed = JSON.parse(decodeURIComponent(q));
        if (parsed?.active && parsed?.resume) return parsed;
      }
    } catch (_) {}
    for (const store of [sessionStorage, localStorage]) {
      try {
        const parsed = JSON.parse(store.getItem(STORAGE_KEY) || "null");
        if (parsed) return parsed;
      } catch (_) {}
    }
    return null;
  }
  function clearNav() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    // Strip resume from URL without reloading
    try {
      const url = new URL(location.href);
      if (url.searchParams.has("resume")) {
        url.searchParams.delete("resume");
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    } catch (_) {}
  }

  function goFloor(floor, state) {
    const prev = loadNav() || {};
    // Never drop resume across a hop — merge with whatever was already saved
    const resume = state.resume || prev.resume || null;
    const payload = {
      ...prev,
      ...state,
      active: true,
      resume,
      destName: state.destName || prev.destName,
      navVersion: NAV_VERSION,
    };
    saveNav(payload);
    const enc = encodeURIComponent(JSON.stringify(payload));
    // resume= in the query string is the source of truth across floor pages
    location.assign(
      FLOOR_PAGES[floor] + "?nav=" + NAV_VERSION + "&resume=" + enc
    );
  }

  function userPos(map) {
    const pin = map.querySelector(".user-location");
    if (pin) {
      return {
        x: parseFloat(pin.style.left) + 22,
        y: parseFloat(pin.style.top) + 55,
      };
    }
    return { x: 735, y: 1370 };
  }

  async function runPoints(map, points, destName, continueInfo) {
    if (!points?.length) return;
    const status = document.getElementById("navStatus");
    const pin = ensureUserPin(map, points[0].x, points[0].y);
    drawRoute(map, points);
    if (status) {
      status.textContent = `Closest path → ${destName}`;
    }

    let pos = { x: points[0].x, y: points[0].y };
    for (let i = 1; i < points.length; i++) {
      const next = points[i];
      await animateAlong(pin, pos, next);
      pos = { x: next.x, y: next.y };
    }

    // Transfer AFTER walking — including "already at stairs/lift" routes
    const end = points[points.length - 1];
    if (end?.nextFloor && end.nextFloor !== currentFloor) {
      const mode = end.kind === "lift" ? "Lift" : "Stairs";
      if (status) status.textContent = `${mode} → ${FLOOR_LABEL[end.nextFloor]}…`;
      await sleep(280);
      const resume =
        continueInfo ||
        loadNav()?.resume ||
        (end.verticalId
          ? {
              destName,
              destFloor: end.nextFloor,
              verticalId: end.verticalId,
              portalX: end.x,
              portalY: end.y,
            }
          : null);
      goFloor(end.nextFloor, {
        active: true,
        resume,
        destName,
      });
      return;
    }

    if (status) status.textContent = `Arrived · ${destName}`;
    clearNav();
  }

  function startToDestination(dest, walk, map) {
    const status = document.getElementById("navStatus");
    const start = userPos(map);
    const startOnPath = nearestWalkable(walk, start.x, start.y, 100);
    if (!startOnPath) {
      if (status) status.textContent = "Not on a path — move closer to a corridor";
      return;
    }

    const plan = planRoute(walk, map, startOnPath, dest);
    if (!plan) {
      if (status) status.textContent = "No path along corridors";
      return;
    }

    // Snap onto path first — never cut through rooms to join the corridor
    ensureUserPin(map, startOnPath.x, startOnPath.y);

    saveNav({
      active: true,
      destName: dest.name,
      resume: plan.continue || null,
    });
    runPoints(map, plan.points, dest.name, plan.continue || null);
  }

  function resumeOnFloor(walk, map, pending) {
    const r = pending.resume;
    if (!r) return;

    // Resolve destination from resume payload (ids may be missing after hop)
    const fromList = r.destId
      ? DESTINATIONS.find((d) => d.id === r.destId)
      : null;
    const dest = fromList || {
      id: r.destId || "resume-dest",
      name: r.destName || pending.destName || "Destination",
      floor: r.destFloor,
      x: r.destX,
      y: r.destY,
    };
    if (!dest.floor || dest.x == null || dest.y == null) {
      clearNav();
      return;
    }

    const start = nearestWalkable(walk, r.portalX, r.portalY, 160) || {
      x: r.portalX,
      y: r.portalY,
    };
    ensureUserPin(map, start.x, start.y);
    const status = document.getElementById("navStatus");

    // Still need another hop (e.g. landed on 1st via stairs, dest is 2nd)
    if (dest.floor !== currentFloor) {
      const hopTo = nextFloorToward(currentFloor, dest.floor);
      if (!hopTo) {
        if (status) status.textContent = "Cannot reach that floor";
        clearNav();
        return;
      }
      const plan =
        buildHopPlan(walk, start, dest, hopTo, r.verticalId, map) ||
        planRoute(walk, map, start, dest, r.verticalId);
      if (!plan) {
        // Last resort: only if we are already standing on the shaft — never cut rooms
        const shafts = verticalsFor(map);
        const shaft =
          shafts.find((v) => v.id === r.verticalId) ||
          shafts.find(
            (v) =>
              Math.hypot(v.x - start.x, v.y - start.y) < 60
          ) ||
          shafts[0];
        const shaftAt = shaft ? portalPos(shaft) : null;
        const portal = shaftAt
          ? nearestWalkable(walk, shaftAt.x, shaftAt.y, 40)
          : null;
        if (
          !shaft ||
          !portal ||
          Math.hypot(start.x - portal.x, start.y - portal.y) > 48
        ) {
          if (status) status.textContent = "No lift/stairs route onward";
          clearNav();
          return;
        }
        const points = [
          { x: start.x, y: start.y, floor: currentFloor, via: "path" },
          {
            ...portal,
            floor: currentFloor,
            kind: shaft.kind,
            verticalId: shaft.id,
            nextFloor: hopTo,
            via: shaft.kind,
          },
        ];
        if (status) {
          status.textContent = `${shaft.kind === "lift" ? "Lift" : "Stairs"} → continuing to ${dest.name}`;
        }
        runPoints(map, points, dest.name, makeContinue(dest, shaft.id, portal));
        return;
      }
      if (status) {
        status.textContent = `${plan.viaLabel === "lift" ? "Lift" : "Stairs"} → continuing to ${dest.name}`;
      }
      runPoints(map, plan.points, dest.name, plan.continue);
      return;
    }

    // Final floor — walk portal → door on corridors only (never cut rooms)
    let goal = nearestEntryOnPath(map, walk, dest);
    if (!goal) {
      goal = nearestWalkable(walk, dest.x, dest.y, 280);
    }
    if (!goal) {
      if (status) status.textContent = "No path to door on this floor";
      clearNav();
      return;
    }
    const pts = astar(walk, start, goal);
    if (!pts) {
      if (status) status.textContent = "No corridor path on this floor";
      clearNav();
      return;
    }
    const points = pts.map((p) => ({ ...p, floor: currentFloor, via: "path" }));
    runPoints(map, points, dest.name, null);
  }

  function estimatePathHint(walk, map, dest, start) {
    // Same-floor: real corridor distance. Cross-floor: walk to nearest shaft + hop cost.
    const steps = floorSteps(currentFloor, dest.floor);
    if (steps === 0) {
      const goal = nearestEntryOnPath(map, walk, dest);
      if (!goal) return Infinity;
      return dist(start, goal);
    }
    let bestShaft = Infinity;
    for (const v of verticalsFor(map)) {
      const p = portalPos(v);
      const onPath = nearestWalkable(walk, p.x, p.y, 80);
      if (!onPath) continue;
      bestShaft = Math.min(bestShaft, dist(start, onPath));
    }
    if (!Number.isFinite(bestShaft)) bestShaft = dist(start, dest);
    return bestShaft + 700 * steps;
  }

  function mountSearchUI(walk, map) {
    const controls = document.querySelector(".controls");
    if (!controls || controls.querySelector("#navSearch")) return;

    const wrap = document.createElement("div");
    wrap.className = "nav-search";
    wrap.innerHTML = `
      <label for="navSearch">Search</label>
      <input id="navSearch" type="search" placeholder="Room, wing, library…" autocomplete="off" />
      <ul id="navResults" class="nav-results" hidden></ul>
      <button type="button" id="navGo" class="nav-go">Start navigation</button>
      <p id="navStatus" class="nav-status">Routes stay on path (#D9DFE3)</p>
    `;
    const floorSwitch = controls.querySelector(".floor-switch");
    const h1 = controls.querySelector("h1");
    if (floorSwitch) floorSwitch.after(wrap);
    else if (h1) h1.after(wrap);
    else controls.prepend(wrap);

    if (!document.getElementById("nav-search-style")) {
      const style = document.createElement("style");
      style.id = "nav-search-style";
      style.textContent = `
        .nav-search { margin-bottom: 12px; display: grid; gap: 6px; }
        .nav-search label { font-size: 11px; font-weight: 600; }
        .nav-search input {
          width: 100%; border: 1px solid #e6e6e6; padding: 8px 10px;
          font: inherit; font-size: 13px; background: #fff;
        }
        .nav-results {
          list-style: none; margin: 0; padding: 0; max-height: 160px; overflow: auto;
          border: 1px solid #e6e6e6; background: #fff;
        }
        .nav-results li {
          padding: 8px 10px; font-size: 12px; cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
        }
        .nav-results li:hover, .nav-results li.is-active { background: #f5f5f5; }
        .nav-results .meta { color: #777; float: right; font-size: 10px; }
        .nav-go {
          width: 100%; border: 1px solid #2a2a2a; background: #2a2a2a; color: #fff;
          padding: 8px 0; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .nav-go:disabled { opacity: 0.4; cursor: default; }
        .nav-status { margin: 0; font-size: 11px; color: #555; min-height: 1.2em; }
        .user-location { z-index: 12 !important; }
      `;
      document.head.appendChild(style);
    }

    const input = wrap.querySelector("#navSearch");
    const results = wrap.querySelector("#navResults");
    const goBtn = wrap.querySelector("#navGo");
    let selected = null;
    goBtn.disabled = true;

    function renderResults(q) {
      const query = q.trim().toLowerCase();
      results.innerHTML = "";
      selected = null;
      goBtn.disabled = true;
      if (!query) {
        results.hidden = true;
        return;
      }
      const start = userPos(map);
      const hits = DESTINATIONS.filter((d) =>
        d.name.toLowerCase().includes(query)
      )
        .map((d) => ({
          d,
          score: estimatePathHint(walk, map, d, start),
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 12);

      if (!hits.length) {
        results.hidden = true;
        return;
      }
      for (const { d, score } of hits) {
        const li = document.createElement("li");
        const near =
          Number.isFinite(score) && score < 1e8
            ? ` · ~${Math.round(score)}`
            : "";
        li.innerHTML = `${d.name}<span class="meta">${FLOOR_LABEL[d.floor]}${near}</span>`;
        li.addEventListener("click", () => {
          selected = d;
          input.value = d.name;
          results.hidden = true;
          goBtn.disabled = false;
        });
        results.appendChild(li);
      }
      results.hidden = false;
    }

    input.addEventListener("input", () => renderResults(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const first = results.querySelector("li");
        if (first) first.click();
        if (selected) startToDestination(selected, walk, map);
      }
    });
    goBtn.addEventListener("click", () => {
      if (selected) startToDestination(selected, walk, map);
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) results.hidden = true;
    });
  }

  // ---- boot ----
  const map = document.querySelector(".map");
  if (!map) return;

  document.body.dataset.floor = currentFloor;
  const statusBoot = () => {
    const s = document.getElementById("navStatus");
    if (s) s.textContent = "Building path grid…";
  };

  // Build walk grid after paint so layout styles are applied
  requestAnimationFrame(() => {
    statusBoot();
    const walk = buildWalkGrid(map);
    const walkable = walk.reduce((a, b) => a + b, 0);
    console.info("[nav] walkable cells", walkable, "/", walk.length);
    window.__ulWalk = walk;
    window.__ulMeta = {
      walkable,
      COLS,
      ROWS,
      CELL,
      VERTICAL: verticalsFor(map).map((v) => ({
        id: v.id,
        kind: v.kind,
        x: portalPos(v).x,
        y: portalPos(v).y,
      })),
    };
    // Always show you-are-here after load/refresh (all floors)
    {
      const pendingBoot = loadNav();
      const resumeAt = pendingBoot?.resume;
      const pos =
        resumeAt?.portalX != null
          ? { x: resumeAt.portalX, y: resumeAt.portalY }
          : userPos(map);
      ensureUserPin(map, pos.x, pos.y);
    }

    mountSearchUI(walk, map);

    document.querySelectorAll(".floor-btn").forEach((a) => {
      a.addEventListener("click", (ev) => {
        // Manual floor tap cancels nav; programmatic hops use location.assign
        if (!ev.isTrusted) return;
        clearNav();
      });
    });

    const pending = loadNav();
    if (pending?.active && pending.resume) {
      const s = document.getElementById("navStatus");
      if (s) s.textContent = `Continuing to ${pending.destName || pending.resume.destName}…`;
      // Yield a frame so the tip/pin can mount before animating the next leg
      requestAnimationFrame(() => resumeOnFloor(walk, map, pending));
    } else if (pending?.active && !pending.resume) {
      clearNav();
    }

    const s = document.getElementById("navStatus");
    if (s && !pending?.active) {
      s.textContent = walkable
        ? "Routes stay on path · closest first"
        : "Path grid empty — check #D9DFE3";
    }
  });
})();
