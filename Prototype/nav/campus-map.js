/*
 * UniLocate floor page — layered map, search, multi-floor navigation.
 * Needs: nav/campus-data.js, nav/campus-router.js, and window.ulView from the page script.
 */
(() => {
  const DATA = window.UL_CAMPUS;
  const router = window.ULRouter.create(DATA);
  const FLOOR = document.body.dataset.floor;
  const FLOORS = Object.fromEntries(DATA.floors.map((f) => [f.id, f]));
  const view = window.ulView || null;
  const map = document.querySelector(".map");
  const viewport = document.getElementById("viewport");
  const NS = "http://www.w3.org/2000/svg";
  const MPP = DATA.metersPerPx;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LAYERS = [
    { id: "rooms", label: "Classrooms & rooms", swatch: "#9AABB2" },
    { id: "paths", label: "Paths & walkways", swatch: "#D9DFE3" },
    { id: "verticals", label: "Lifts & stairs", swatch: "#595959" },
    { id: "washrooms", label: "Washrooms", swatch: "#6FB7E8" },
    { id: "exits", label: "Exit points", swatch: "#FF8543" },
    { id: "grounds", label: "Grounds & outline", swatch: "#A2E274" },
    { id: "labels", label: "Labels", swatch: "#2A2A2A" },
  ];

  const TYPE_LABEL = {
    classroom: "Classroom",
    lab: "Lab",
    office: "Office",
    facility: "Facility",
    open: "Open space",
    washroom: "Washroom",
    exit: "Exit",
    lift: "Lift",
    stairs: "Stairs",
  };

  const TYPE_WORDS = {
    washroom: ["washroom", "toilet", "restroom", "bathroom", "wc", "loo"],
    exit: ["exit", "gate", "entry", "entrance", "way out"],
    lift: ["lift", "elevator"],
    stairs: ["stairs", "stair", "staircase", "steps"],
    classroom: ["class", "classroom", "room", "lecture"],
    lab: ["lab", "laboratory"],
    office: ["office", "desk", "cabin", "cell"],
    facility: [],
    open: ["ground", "outdoor", "open"],
  };

  const FLOOR_WORDS = {
    ground: ["ground", "g", "gf"],
    first: ["1st", "first", "1"],
    second: ["2nd", "second", "2"],
  };

  const ICON = {
    walk: '<path d="M8 13V3M4 7l4-4 4 4"/>',
    left: '<path d="M12 13V8a3 3 0 0 0-3-3H4M7 2 4 5l3 3"/>',
    right: '<path d="M4 13V8a3 3 0 0 1 3-3h5M9 2l3 3-3 3"/>',
    back: '<path d="M11 13V6a3 3 0 0 0-6 0v4M3 8l2 2 2-2"/>',
    stairs: '<path d="M2 13h3v-3h3V7h3V4h3"/>',
    lift: '<rect x="3" y="2" width="10" height="12" rx="2"/><path d="M6 6l2-2 2 2M6 10l2 2 2-2"/>',
    arrive: '<path d="M8 14s5-4.5 5-8A5 5 0 0 0 3 6c0 3.5 5 8 5 8Z"/><circle cx="8" cy="6" r="1.6"/>',
    washroom: '<circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.6"/>',
    exit: '<path d="M7 3H3v10h4M10 5l3 3-3 3M13 8H6"/>',
    room: '<rect x="3" y="3" width="10" height="10" rx="2"/><path d="M3 7h10"/>',
    open: '<path d="M2 12c2-4 4-6 6-6s4 2 6 6"/>',
  };
  const icon = (name, color = "currentColor") =>
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ICON.room}</svg>`;

  const iconForType = (t) =>
    t === "washroom" ? "washroom" : t === "exit" ? "exit" : t === "lift" ? "lift" : t === "stairs" ? "stairs" : t === "open" ? "open" : "room";

  // ── State ─────────────────────────────────────────────
  const store = {
    get(k) {
      for (const s of [sessionStorage, localStorage]) {
        try {
          const v = s.getItem(k);
          if (v) return JSON.parse(v);
        } catch (_) {}
      }
      return null;
    },
    set(k, v, persist) {
      try {
        (persist ? localStorage : sessionStorage).setItem(k, JSON.stringify(v));
      } catch (_) {}
    },
  };

  function readTripFromUrl() {
    try {
      const raw = new URLSearchParams(location.search).get("trip");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  const urlTrip = readTripFromUrl();
  const state = {
    from: urlTrip?.from || store.get("ul-from") || { ...DATA.defaultStart },
    to: urlTrip ? urlTrip.to || null : store.get("ul-trip")?.to || null,
    pref: urlTrip?.pref || store.get("ul-pref") || "stairs",
    layers: { ...Object.fromEntries(LAYERS.map((l) => [l.id, true])), ...(store.get("ul-layers") || {}) },
    route: null,
    costs: null,
    placing: false,
    playing: null, // { leg, cancel }
    activeResult: -1,
    filter: { mode: "wings", id: null, ...(store.get("ul-filter") || {}) },
  };

  function persist() {
    store.set("ul-from", state.from);
    store.set("ul-pref", state.pref, true);
    store.set("ul-trip", { to: state.to });
    store.set("ul-layers", state.layers, true);
    store.set("ul-filter", state.filter);
  }

  function tripParam(extra) {
    const trip = { from: state.from, to: state.to, pref: state.pref, ...extra };
    return "trip=" + encodeURIComponent(JSON.stringify(trip));
  }

  function pageFor(floor, extra) {
    return `${FLOORS[floor].page}?${tripParam(extra)}`;
  }

  // ── Art → layers ──────────────────────────────────────
  function classifyArt() {
    const iconKind = (svg) => (svg && svg.getAttribute("viewBox") === "0 0 12 12" ? "verticals" : "washrooms");
    for (const el of [...map.children]) {
      if (el.id && el.id.startsWith("ul-")) continue;
      if (el.classList.contains("user-location")) {
        el.remove();
        continue;
      }
      let cat = null;
      if (el.classList.contains("map-label")) cat = "labels";
      else if (el.tagName.toLowerCase() === "svg") {
        const fills = new Set([...el.querySelectorAll("path")].map((p) => (p.getAttribute("fill") || "").toUpperCase()));
        if (fills.has("#9AABB2")) cat = "rooms";
        else if (fills.has("#D9DFE3") || fills.has("#E9E9E9")) cat = "paths";
        else if (fills.has("#595959")) cat = iconKind(el);
        else cat = "grounds";
      } else {
        const bg = el.style.backgroundColor;
        const nested = [el, ...el.querySelectorAll("div")].map((n) => n.style.backgroundColor);
        if (bg === "rgb(0, 67, 200)") cat = "rooms";
        else if (bg === "rgb(255, 133, 67)") cat = "exits";
        else if (bg === "rgb(217, 223, 227)" || bg === "rgb(233, 233, 233)") cat = "paths";
        else if (nested.includes("rgb(217, 217, 217)")) cat = "verticals";
        else if (el.querySelector('path[fill="#595959"]')) cat = iconKind(el.querySelector("svg"));
        else if (el.textContent.trim()) cat = "labels";
      }
      if (cat) el.dataset.ulArt = cat;
    }
  }

  // ── Overlay ───────────────────────────────────────────
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  const overlay = el("svg", { id: "ul-overlay", viewBox: `0 0 ${DATA.size.w} ${DATA.size.h}` });
  const G = {};
  for (const id of ["sections", "outer", "paths", "rooms", "washrooms", "exits", "verticals", "route", "marks"]) {
    G[id] = el("g", { class: `ul-ov-${id}` }, overlay);
  }
  map.appendChild(overlay);

  const probe = document.createElement("div");
  probe.id = "ul-probe";
  probe.style.cssText = "position:absolute;width:2px;height:2px;margin:-1px 0 0 -1px;visibility:hidden;pointer-events:none";
  map.appendChild(probe);

  function drawNetwork() {
    for (const s of router.segmentsFor(FLOOR)) {
      el(
        "line",
        { x1: s.a.x, y1: s.a.y, x2: s.b.x, y2: s.b.y, class: s.unpaved ? "is-unpaved" : null },
        s.outer ? G.outer : G.paths
      );
    }
  }

  function hitRect(t, group, pad = 0) {
    const [x, y, w, h] = t.rect;
    const r = el(
      "rect",
      { x: x - pad, y: y - pad, width: w + pad * 2, height: h + pad * 2, rx: 6, class: "ul-hit", "data-id": t.id },
      group
    );
    el("title", {}, r).textContent = `${t.name}${t.near ? " · " + t.near : ""}`;
  }

  function drawTargets() {
    for (const t of router.targets.values()) {
      if (t.layer === "verticals") {
        if (!t.accessPoints[FLOOR]) continue;
        const c = el("circle", { cx: t.icon[0], cy: t.icon[1], r: 17, class: "ul-hit", "data-id": t.id }, G.verticals);
        el("title", {}, c).textContent = `${t.name} · ${t.near}`;
        continue;
      }
      if (t.floor !== FLOOR || !t.rect) continue;
      if (t.layer === "rooms") hitRect(t, G.rooms);
      else if (t.layer === "washrooms") hitRect(t, G.washrooms, 2);
      else if (t.layer === "exits") hitRect(t, G.exits, 10);
    }
  }

  // ── Sections (wings / buildings) ──────────────────────
  const SECTIONS = DATA.sections || { wings: [], buildings: [] };
  const SECTION_BY_ID = new Map(
    Object.entries(SECTIONS).flatMap(([mode, list]) => list.map((s) => [s.id, { ...s, mode }]))
  );

  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /** Where a target sits on the plan: room centre, or the stair/lift icon. */
  function anchorOf(t) {
    if (t.layer === "verticals") return t.icon;
    if (t.rect) return [t.rect[0] + t.rect[2] / 2, t.rect[1] + t.rect[3] / 2];
    return t.doors && t.doors[0];
  }

  for (const sec of SECTION_BY_ID.values()) {
    sec.members = new Set();
    for (const t of router.targets.values()) {
      const p = anchorOf(t);
      if (p && inPoly(p[0], p[1], sec.poly)) sec.members.add(t.id);
    }
  }

  const activeSection = () => (state.filter.id && SECTION_BY_ID.get(state.filter.id)) || null;

  function drawSection() {
    G.sections.innerHTML = "";
    const sec = activeSection();
    overlay.dataset.sectionMode = sec ? sec.mode : "";
    if (!sec) return;
    el("polygon", { points: sec.poly.map((p) => p.join(",")).join(" "), class: "ul-sec-shape" }, G.sections);
    const xs = sec.poly.map((p) => p[0]);
    const ys = sec.poly.map((p) => p[1]);
    const top = Math.min(...ys);
    // Tab sits on the widest top edge so L-shaped sections still read clearly.
    const topEdge = sec.poly
      .map((p, i) => [p, sec.poly[(i + 1) % sec.poly.length]])
      .filter(([a, b]) => a[1] === top && b[1] === top)
      .sort((e1, e2) => Math.abs(e2[1][0] - e2[0][0]) - Math.abs(e1[1][0] - e1[0][0]))[0];
    const cx = topEdge ? (topEdge[0][0] + topEdge[1][0]) / 2 : (Math.min(...xs) + Math.max(...xs)) / 2;
    const tab = el("g", { class: "ul-scale ul-sec-tab" }, G.sections);
    tab.style.transform = `translate(${cx}px, ${top}px) scale(var(--ul-k))`;
    const w = Math.max(56, sec.name.length * 8.4 + 26);
    el("rect", { x: -w / 2, y: -24, width: w, height: 26, rx: 9 }, tab);
    el("text", { x: 0, y: -11 }, tab).textContent = sec.name;
  }

  // ── Pin ───────────────────────────────────────────────
  const pin = document.createElement("div");
  pin.className = "ul-pin";
  pin.dataset.mood = "idle";
  pin.setAttribute("aria-label", "You are here");
  pin.innerHTML = `
    <div class="ul-pin-dir"><svg viewBox="0 0 19.5 31" width="14" height="22"><path d="M14.879 3.791 0.973 15.202c-.236.193-.37.484-.366.788.005.305.149.591.391.777l14.739 11.339c.375.288.901.274 1.26-.033.359-.307.454-.824.228-1.239-3.917-8.667-3.971-14.61-.86-21.745.256-.416.175-.957-.193-1.278-.368-.321-.915-.33-1.293-.02Z" fill="#32A9FF" stroke="#fff" stroke-width="2" transform="rotate(180 9.75 15.5)"/></svg></div>
    <div class="ul-pin-avatar">
      <svg class="ul-face" viewBox="0 0 36 36" aria-hidden="true">
        <g class="ul-face-look">
          <g class="f-eyes-open">
            <rect class="f-eye" x="11.6" y="12" width="3.4" height="6" rx="1.7"/>
            <rect class="f-eye" x="21" y="12" width="3.4" height="6" rx="1.7"/>
          </g>
          <g class="f-eyes-happy">
            <path d="M11 16.5q2.3-3.6 4.6 0M20.4 16.5q2.3-3.6 4.6 0"/>
          </g>
          <path class="f-mouth-smile" d="M12.6 21.6q5.4 5 10.8 0"/>
          <path class="f-mouth-big" d="M11.8 20.6h12.4q0 6.8-6.2 6.8t-6.2-6.8Z"/>
          <ellipse class="f-mouth-o" cx="18" cy="23.4" rx="2.3" ry="2.7"/>
          <path class="f-mouth-flat" d="M14.4 23.4h7.2"/>
        </g>
      </svg>
    </div>`;
  map.appendChild(pin);
  let pinHeading = null;

  /**
   * Face moods: idle (smile), walk (smile, eyes lead the way), excited (stairs/lift ahead),
   * happy (arrived), curious (choosing a spot), confused (tap missed the paths).
   */
  function setMood(mood, ms) {
    pin.dataset.mood = mood;
    clearTimeout(setMood.t);
    if (ms) setMood.t = setTimeout(() => (pin.dataset.mood = state.placing ? "curious" : "idle"), ms);
  }

  /** Eyes and mouth drift a little toward a direction (degrees, map space), or back to centre. */
  function setLook(deg, amount = 2.4) {
    const r = (deg * Math.PI) / 180;
    pin.style.setProperty("--look-x", deg == null ? "0px" : `${(Math.cos(r) * amount).toFixed(2)}px`);
    pin.style.setProperty("--look-y", deg == null ? "0px" : `${(Math.sin(r) * amount).toFixed(2)}px`);
  }

  function setPin(x, y, heading, look) {
    pin.style.left = `${x - 22}px`;
    pin.style.top = `${y - 22}px`;
    pin.hidden = false;
    if (heading != null) pinHeading = heading;
    const dir = pin.querySelector(".ul-pin-dir");
    dir.style.opacity = pinHeading == null ? "0" : "1";
    if (pinHeading != null) dir.style.transform = `rotate(${pinHeading}deg)`;
    if (look !== undefined) setLook(look);
  }

  // ── View helpers ──────────────────────────────────────
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  function mapToScreen(x, y) {
    probe.style.left = `${x}px`;
    probe.style.top = `${y}px`;
    const r = probe.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /** Invert the 3D map transform numerically (works with tilt + rotation). */
  function screenToMap(sx, sy) {
    let g = { x: DATA.size.w / 2, y: DATA.size.h / 2 };
    for (let i = 0; i < 8; i++) {
      const s0 = mapToScreen(g.x, g.y);
      const s1 = mapToScreen(g.x + 20, g.y);
      const s2 = mapToScreen(g.x, g.y + 20);
      const a = (s1.x - s0.x) / 20;
      const c = (s1.y - s0.y) / 20;
      const b = (s2.x - s0.x) / 20;
      const d = (s2.y - s0.y) / 20;
      const det = a * d - b * c;
      if (Math.abs(det) < 1e-9) break;
      const ex = sx - s0.x;
      const ey = sy - s0.y;
      const dx = (d * ex - b * ey) / det;
      const dy = (-c * ex + a * ey) / det;
      g = { x: g.x + dx, y: g.y + dy };
      if (Math.hypot(dx, dy) < 0.4) break;
    }
    return g;
  }

  function visibleArea() {
    const vr = viewport.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const left = pr.right + 24 < vr.width * 0.62 ? pr.right + 16 : 0;
    return { left, top: 0, width: vr.width - left, height: vr.height };
  }

  function panTo(x, y, target) {
    if (!view) return;
    for (let i = 0; i < 4; i++) {
      const s = mapToScreen(x, y);
      const dx = target.x - s.x;
      const dy = target.y - s.y;
      if (Math.hypot(dx, dy) < 1) break;
      view.state.x += dx;
      view.state.y += dy;
      view.render();
    }
  }

  function fitPoints(points, pad = 70) {
    if (!view || !points.length) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const a = visibleArea();
    const z = Math.min((a.width - 40) / (maxX - minX), (a.height - 60) / ((maxY - minY) * Math.cos((view.state.tilt * Math.PI) / 180)));
    view.state.zoom = clamp(z * 0.88, 0.3, 1.2);
    view.render();
    panTo((minX + maxX) / 2, (minY + maxY) / 2, { x: a.left + a.width / 2, y: a.top + a.height / 2 });
  }

  function followPin(x, y) {
    if (!view) return;
    const a = visibleArea();
    const s = mapToScreen(x, y);
    const cx = a.left + a.width / 2;
    const cy = a.top + a.height / 2;
    const mx = a.width * 0.22;
    const my = a.height * 0.22;
    let dx = 0;
    let dy = 0;
    if (s.x < cx - mx) dx = cx - mx - s.x;
    if (s.x > cx + mx) dx = cx + mx - s.x;
    if (s.y < cy - my) dy = cy - my - s.y;
    if (s.y > cy + my) dy = cy + my - s.y;
    if (!dx && !dy) return;
    view.state.x += dx * 0.12;
    view.state.y += dy * 0.12;
    view.render();
  }

  function syncScale() {
    const zoom = view ? view.state.zoom : 0.5;
    const k = clamp(1 / zoom, 0.7, 3);
    map.style.setProperty("--ul-k", k.toFixed(3));
  }
  new MutationObserver(syncScale).observe(document.getElementById("stage"), {
    attributes: true,
    attributeFilter: ["style"],
  });

  // ── Panel ─────────────────────────────────────────────
  const panel = document.querySelector(".controls");
  const oldRows = [...panel.querySelectorAll(".control-row, .control-actions")];
  panel.classList.add("ul-panel");
  panel.innerHTML = `
    <div class="ul-panel-scroll">
      <header class="ul-head">
        <div class="ul-brand">UniLocate<small>${FLOORS[FLOOR].label} · campus map</small></div>
        <nav class="ul-floors" aria-label="Floors">
          ${DATA.floors.map((f) => `<a data-floor="${f.id}" class="${f.id === FLOOR ? "is-active" : ""}" href="${f.page}">${f.short}</a>`).join("")}
        </nav>
      </header>

      <section class="ul-from" aria-label="Starting point">
        <span class="ul-dot"></span>
        <div><small>From</small><strong id="ulFrom"></strong></div>
        <button type="button" class="ul-btn" id="ulSetFrom">Set on map</button>
      </section>

      <section class="ul-search">
        <input id="ulQuery" type="search" autocomplete="off" spellcheck="false"
          placeholder="Search a room, washroom, exit…" aria-label="Search destinations" />
        <div class="ul-chips">
          <button type="button" data-quick="washroom">Nearest washroom</button>
          <button type="button" data-quick="exit">Nearest exit</button>
          <button type="button" data-quick="lift">Nearest lift</button>
        </div>
        <div class="ul-filter">
          <div class="ul-filter-head">
            <span>Filter by</span>
            <div class="ul-seg" role="radiogroup" aria-label="Filter by">
              <button type="button" data-mode="wings">Wings</button>
              <button type="button" data-mode="buildings">Buildings</button>
            </div>
          </div>
          <div class="ul-sec-chips" id="ulSecChips" role="radiogroup" aria-label="Sections"></div>
        </div>
        <ul class="ul-results" id="ulResults" role="listbox"></ul>
      </section>

      <section class="ul-route" id="ulRoute" hidden>
        <div class="ul-route-head">
          <div><strong id="ulDestName"></strong><small id="ulDestMeta"></small></div>
          <button type="button" class="ul-close" id="ulClear" aria-label="Clear destination">×</button>
        </div>
        <div class="ul-pref" role="radiogroup" aria-label="Change floors by">
          <button type="button" data-pref="stairs">Stairs</button>
          <button type="button" data-pref="lift">Lift</button>
        </div>
        <div class="ul-summary" id="ulSummary"></div>
        <button type="button" class="ul-go" id="ulGo">Start navigation</button>
        <ol class="ul-steps" id="ulSteps"></ol>
      </section>

      <details class="ul-section" open>
        <summary>Layers</summary>
        <div class="ul-layer-list" id="ulLayers"></div>
      </details>

      <details class="ul-section" id="ulView">
        <summary>View</summary>
      </details>

      <p class="ul-status" id="ulStatus" role="status"></p>
    </div>`;
  const $ = (id) => document.getElementById(id);
  oldRows.forEach((r) => $("ulView").appendChild(r));

  const banner = document.createElement("div");
  banner.className = "ul-banner";
  banner.setAttribute("role", "status");
  document.body.appendChild(banner);

  function showBanner(html, ms) {
    banner.innerHTML = html;
    banner.classList.add("is-on");
    clearTimeout(showBanner.t);
    if (ms) showBanner.t = setTimeout(() => banner.classList.remove("is-on"), ms);
  }

  function status(text) {
    $("ulStatus").textContent = text || "";
  }

  // ── Layers UI ─────────────────────────────────────────
  function layerCount(id) {
    if (id === "paths" || id === "grounds" || id === "labels") return null;
    let n = 0;
    for (const t of router.targets.values()) {
      if (id === "verticals" ? t.layer === "verticals" && t.accessPoints[FLOOR] : t.layer === id && t.floor === FLOOR) n++;
    }
    return n;
  }

  function renderLayers() {
    $("ulLayers").innerHTML = LAYERS.map((l) => {
      const n = layerCount(l.id);
      return `<label>
        <input type="checkbox" data-layer="${l.id}" ${state.layers[l.id] ? "checked" : ""} />
        <span class="ul-sw" style="background:${l.swatch}"></span>
        <span>${l.label}</span>
        <small>${n == null ? "" : n}</small>
      </label>`;
    }).join("");
    applyLayers();
  }

  function applyLayers() {
    for (const l of LAYERS) map.classList.toggle(`ul-hide-${l.id}`, !state.layers[l.id]);
  }

  $("ulLayers").addEventListener("change", (e) => {
    const id = e.target.dataset.layer;
    if (!id) return;
    state.layers[id] = e.target.checked;
    applyLayers();
    persist();
  });

  // ── From ──────────────────────────────────────────────
  function describePoint(floor, x, y) {
    let best = null;
    for (const t of router.targets.values()) {
      if (t.layer === "verticals" || t.floor !== floor) continue;
      for (const [dx, dy] of t.doors || []) {
        const d = Math.hypot(dx - x, dy - y);
        if (d < 90 && (!best || d < best.d)) best = { d, t };
      }
    }
    if (!best) return "Pinned location";
    if (best.t.type === "washroom") return best.t.near ? `Near ${best.t.near} washroom` : "Near washroom";
    return `Near ${best.t.name}`;
  }

  function renderFrom() {
    $("ulFrom").textContent = `${state.from.label || "Pinned location"} · ${FLOORS[state.from.floor].label}`;
    $("ulSetFrom").classList.toggle("is-on", state.placing);
    $("ulSetFrom").textContent = state.placing ? "Tap the map…" : "Set on map";
    viewport.classList.toggle("ul-placing", state.placing);
    pin.classList.toggle("is-placing", state.placing);
    if (state.placing) setMood("curious");
    else if (pin.dataset.mood === "curious") setMood("idle");
    if (!state.playing) {
      if (state.from.floor === FLOOR) setPin(state.from.x, state.from.y, null);
      else pin.hidden = true;
    }
  }

  $("ulSetFrom").addEventListener("click", () => {
    state.placing = !state.placing;
    status(state.placing ? "Tap a corridor on the map to set where you are." : "");
    renderFrom();
  });

  function setFrom(floor, x, y) {
    const s = router.snap(floor, x, y);
    if (!s || s.gap > 70) {
      status("That spot is not near a path — tap a corridor or walkway.");
      setMood("confused", 1600);
      return false;
    }
    state.from = { floor, x: Math.round(s.x), y: Math.round(s.y), label: describePoint(floor, s.x, s.y) };
    state.costs = null;
    persist();
    renderFrom();
    refreshRoute();
    renderResults();
    return true;
  }

  // ── Search ────────────────────────────────────────────
  const norm = (s) => String(s || "").toLowerCase().replace(/[\s\-_.]+/g, "");

  function costs() {
    if (!state.costs) state.costs = router.costsFrom(state.from, { pref: state.pref });
    return state.costs;
  }

  function etaFromCost(c) {
    if (!Number.isFinite(c)) return "";
    const min = Math.max(1, Math.round((c * MPP) / 1.25 / 60));
    return `~${min} min`;
  }

  function search(q) {
    const raw = q.trim().toLowerCase();
    if (!raw) return [];
    let tokens = raw.split(/\s+/);
    let floorFilter = null;
    tokens = tokens.filter((tok) => {
      for (const [f, words] of Object.entries(FLOOR_WORDS)) {
        if (words.includes(tok) && tokens.length > 1) {
          floorFilter = f;
          return false;
        }
      }
      return true;
    });
    const nq = norm(tokens.join(" "));
    const C = costs();
    const sec = activeSection();
    const hits = [];
    for (const t of router.targets.values()) {
      if (floorFilter && t.layer !== "verticals" && t.floor !== floorFilter) continue;
      if (sec && !sec.members.has(t.id)) continue;
      const name = norm(t.name);
      let rank = null;
      if (name === nq) rank = 0;
      else if (name.startsWith(nq)) rank = 1;
      else if (name.includes(nq)) rank = 2;
      else {
        const extra = [...(t.aliases || []), t.near, TYPE_LABEL[t.type], ...(TYPE_WORDS[t.type] || [])].map(norm);
        if (extra.some((w) => w && (w.startsWith(nq) || (nq.length > 2 && w.includes(nq))))) rank = 3;
      }
      if (rank == null) continue;
      hits.push({ t, rank, cost: C.get(t.id) ?? Infinity });
    }
    hits.sort((a, b) => a.rank - b.rank || a.cost - b.cost);
    return hits.slice(0, 14);
  }

  function subtitle(t) {
    const type = TYPE_LABEL[t.type] || "Place";
    if (t.layer === "verticals") return `${type} · ${t.near} · ${t.floors.map((f) => FLOORS[f].short).join("/")}`;
    const near = t.near ? ` · ${t.near}` : "";
    return `${type}${near} · ${FLOORS[t.floor].label}`;
  }

  const TYPE_ORDER = { classroom: 0, lab: 0, office: 0, facility: 0, open: 1, washroom: 2, lift: 3, stairs: 3 };
  const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });

  /** Everything inside the selected section: this floor first, then the others. */
  function sectionHits(sec) {
    const C = costs();
    const level = (t) => (t.layer === "verticals" ? -1 : t.floor === FLOOR ? 0 : 1 + FLOORS[t.floor].level);
    return [...sec.members]
      .map((id) => router.targets.get(id))
      .sort((a, b) => level(a) - level(b) || (TYPE_ORDER[a.type] ?? 0) - (TYPE_ORDER[b.type] ?? 0) || byName(a, b))
      .map((t) => ({ t, cost: C.get(t.id) ?? Infinity }));
  }

  function resultItem(h, i) {
    return `<li role="option" data-id="${h.t.id}" class="${i === 0 ? "is-active" : ""}">
          <span class="ul-ic">${icon(iconForType(h.t.type), "#4f6b80")}</span>
          <span><strong>${h.t.name}</strong><small>${subtitle(h.t)}</small></span>
          <span class="ul-eta">${etaFromCost(h.cost)}</span>
        </li>`;
  }

  let lastHits = [];
  function renderResults() {
    const q = $("ulQuery").value;
    const sec = activeSection();
    const list = $("ulResults");
    if (!q.trim()) {
      lastHits = sec && !state.to ? sectionHits(sec) : [];
      state.activeResult = lastHits.length ? 0 : -1;
      list.innerHTML = lastHits.length
        ? `<li class="ul-list-head">${sec.name} · ${lastHits.length} places</li>` + lastHits.map(resultItem).join("")
        : "";
      return;
    }
    lastHits = search(q);
    state.activeResult = lastHits.length ? 0 : -1;
    if (!lastHits.length) {
      const where = sec ? ` in ${sec.name}` : "";
      list.innerHTML = `<li class="ul-empty">No room called “${q.replace(/</g, "&lt;")}”${where}. Check the spelling or try a room code like T201.</li>`;
      return;
    }
    list.innerHTML = lastHits.map(resultItem).join("");
  }

  // ── Filter (wings / buildings) ────────────────────────
  function renderFilter() {
    document.querySelectorAll(".ul-seg button").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === state.filter.mode));
    const list = SECTIONS[state.filter.mode] || [];
    $("ulSecChips").dataset.mode = state.filter.mode;
    $("ulSecChips").innerHTML =
      `<button type="button" role="radio" aria-checked="${!state.filter.id}" data-sec="" class="${state.filter.id ? "" : "is-on"}">All</button>` +
      list
        .map((s) => {
          const on = s.id === state.filter.id;
          return `<button type="button" role="radio" aria-checked="${on}" data-sec="${s.id}" class="${on ? "is-on" : ""}">${s.name}</button>`;
        })
        .join("");
    $("ulQuery").placeholder = activeSection() ? `Search in ${activeSection().name}…` : "Search a room, washroom, exit…";
  }

  function setSection(id, opts = {}) {
    state.filter.id = id || null;
    persist();
    renderFilter();
    drawSection();
    renderResults();
    const sec = activeSection();
    if (sec && opts.fit !== false) fitPoints(sec.poly.map(([x, y]) => ({ x, y })), 60);
    status(sec ? `Showing ${sec.name}. Pick a room below or search inside it.` : "");
  }

  document.querySelector(".ul-seg").addEventListener("click", (e) => {
    const mode = e.target.dataset.mode;
    if (!mode || mode === state.filter.mode) return;
    state.filter.mode = mode;
    setSection(null);
  });

  $("ulSecChips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-sec]");
    if (!b) return;
    const id = b.dataset.sec;
    setSection(id === state.filter.id ? null : id);
  });

  $("ulQuery").addEventListener("input", renderResults);
  $("ulQuery").addEventListener("keydown", (e) => {
    const items = [...$("ulResults").querySelectorAll("li[data-id]")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      state.activeResult = (state.activeResult + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle("is-active", i === state.activeResult));
    } else if (e.key === "Enter" && items[state.activeResult]) {
      selectTarget(items[state.activeResult].dataset.id);
    } else if (e.key === "Escape") {
      $("ulQuery").value = "";
      renderResults();
    }
  });
  $("ulResults").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li) selectTarget(li.dataset.id);
  });
  $("ulResults").addEventListener("mouseover", (e) => {
    const li = e.target.closest("li[data-id]");
    overlay.querySelectorAll(".ul-hit.is-peek").forEach((n) => n.classList.remove("is-peek"));
    if (li) overlay.querySelectorAll(`.ul-hit[data-id="${li.dataset.id}"]`).forEach((n) => n.classList.add("is-peek"));
  });
  $("ulResults").addEventListener("mouseleave", () => {
    overlay.querySelectorAll(".ul-hit.is-peek").forEach((n) => n.classList.remove("is-peek"));
  });

  document.querySelector(".ul-chips").addEventListener("click", (e) => {
    const kind = e.target.dataset.quick;
    if (!kind) return;
    const C = costs();
    let best = null;
    for (const t of router.targets.values()) {
      if (t.type !== kind) continue;
      const c = C.get(t.id) ?? Infinity;
      if (!best || c < best.c) best = { t, c };
    }
    if (best && Number.isFinite(best.c)) selectTarget(best.t.id);
    else status(`No reachable ${kind} from here.`);
  });

  // ── Route ─────────────────────────────────────────────
  function selectTarget(id, opts = {}) {
    stopPlaying();
    state.to = id;
    $("ulQuery").value = "";
    persist();
    renderResults();
    refreshRoute({ fit: opts.fit !== false });
  }

  function clearTarget() {
    stopPlaying();
    state.to = null;
    state.route = null;
    persist();
    refreshRoute();
    renderResults();
  }
  $("ulClear").addEventListener("click", clearTarget);

  document.querySelector(".ul-pref").addEventListener("click", (e) => {
    const pref = e.target.dataset.pref;
    if (!pref || pref === state.pref) return;
    stopPlaying();
    state.pref = pref;
    state.costs = null;
    persist();
    refreshRoute({ fit: true });
  });

  function legsHere() {
    return state.route ? state.route.legs.map((L, i) => ({ L, i })).filter(({ L }) => L.floor === FLOOR) : [];
  }

  function refreshRoute(opts = {}) {
    const t = state.to && router.targets.get(state.to);
    state.route = t ? router.route(state.from, t.id, { pref: state.pref }) : null;
    if (state.route && state.route.error) {
      status(state.route.error);
      state.route = null;
    }
    renderRouteCard(t);
    drawRoute();
    updateFloorTabs();
    overlay.querySelectorAll(".ul-hit.is-dest").forEach((n) => n.classList.remove("is-dest"));
    if (t) overlay.querySelectorAll(`.ul-hit[data-id="${t.id}"]`).forEach((n) => n.classList.add("is-dest"));
    if (opts.fit && state.route) {
      const here = legsHere();
      if (here.length) fitPoints(here.flatMap(({ L }) => L.points));
    }
  }

  function renderRouteCard(t) {
    const card = $("ulRoute");
    if (!t || !state.route) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const r = state.route;
    $("ulDestName").textContent = t.name;
    $("ulDestMeta").textContent = subtitle(t);
    document.querySelectorAll(".ul-pref button").forEach((b) => b.classList.toggle("is-on", b.dataset.pref === state.pref));
    const transfers = r.legs.filter((L) => L.exit).map((L) => L.exit.name);
    const startsElsewhere = r.legs[0].floor !== FLOOR;
    const passes = r.legs.some((L) => L.floor === FLOOR);
    let note = transfers.length ? `via ${transfers.join(", then ")}` : "Same floor — no stairs or lift";
    if (startsElsewhere) note += ` · starts on ${FLOORS[r.legs[0].floor].label}`;
    else if (!passes) note += " · not on this floor";
    $("ulSummary").innerHTML = `${r.meters} m · ~${r.minutes} min<small>${note}</small>`;
    $("ulGo").textContent = state.playing ? "Stop" : startsElsewhere ? `Start on ${FLOORS[r.legs[0].floor].label}` : "Start navigation";

    const items = [];
    let lastLeg = -1;
    r.steps.forEach((s, i) => {
      if (s.leg !== lastLeg) {
        items.push(`<li class="ul-step-floor">${FLOORS[s.floor].label}</li>`);
        lastLeg = s.leg;
      }
      const cls = [s.transfer ? "is-transfer" : "", s.arrive ? "is-arrive" : ""].join(" ");
      items.push(`<li data-step="${i}" class="${cls}">${icon(s.icon, "#4f6b80")}<span>${s.text}</span><span class="ul-m">${s.meters ? s.meters + " m" : ""}</span></li>`);
    });
    $("ulSteps").innerHTML = items.join("");
  }

  function updateFloorTabs() {
    const floorsInRoute = new Set(state.route ? state.route.legs.map((L) => L.floor) : []);
    document.querySelectorAll(".ul-floors a").forEach((a) => {
      const f = a.dataset.floor;
      a.classList.toggle("has-route", floorsInRoute.has(f) && f !== FLOOR);
      a.href = state.to || state.from.floor !== DATA.defaultStart.floor ? pageFor(f) : FLOORS[f].page;
    });
  }

  function pathD(points) {
    return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }

  let walkedEls = {};
  function drawRoute() {
    G.route.innerHTML = "";
    G.marks.innerHTML = "";
    walkedEls = {};
    if (!state.route) return;
    const r = state.route;
    r.legs.forEach((L, i) => {
      if (L.floor !== FLOOR) return;
      const d = pathD(L.points);
      el("path", { d, class: "ul-route-casing" }, G.route);
      el("path", { d, class: "ul-route-line" }, G.route);
      const walked = el("path", { d, class: "ul-route-walked", "stroke-dasharray": `0 ${L.px + 50}` }, G.route);
      walkedEls[i] = walked;

      const end = L.points[L.points.length - 1];
      if (L.exit) {
        const up = FLOORS[L.exit.toFloor].level > FLOORS[L.floor].level;
        marker(end, up ? "up" : "down", `${L.exit.name} ${up ? "↑" : "↓"} ${FLOORS[L.exit.toFloor].label}`);
      } else {
        destMarker(end);
      }
      if (i > 0) {
        const prev = r.legs[i - 1];
        const up = FLOORS[L.floor].level > FLOORS[prev.floor].level;
        marker(L.points[0], up ? "up" : "down", `From ${FLOORS[prev.floor].label} via ${prev.exit.name}`);
      }
    });
  }

  function scaled(x, y) {
    const g = el("g", { class: "ul-scale" }, G.marks);
    g.style.transform = `translate(${x}px, ${y}px) scale(var(--ul-k))`;
    return g;
  }

  function marker(p, dir, text) {
    const g = scaled(p.x, p.y);
    g.classList.add("ul-marker-transfer");
    el("circle", { r: 12 }, g);
    el("path", { d: dir === "up" ? "M-4 2 0 -3 4 2" : "M-4 -2 0 3 4 -2" }, g);
    const pill = el("g", { class: "ul-marker-pill", transform: "translate(18 -11)" }, g);
    const w = Math.max(60, text.length * 6.6 + 16);
    el("rect", { width: w, height: 22, rx: 11 }, pill);
    el("text", { x: 8, y: 11 }, pill).textContent = text;
  }

  function destMarker(p) {
    const g = scaled(p.x, p.y);
    g.classList.add("ul-marker-dest");
    el("path", { d: "M0 0C-3-6-11-11-11-19a11 11 0 0 1 22 0C11-11 3-6 0 0Z" }, g);
    el("circle", { cx: 0, cy: -19, r: 4 }, g);
  }

  // ── Playback ──────────────────────────────────────────
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function stopPlaying() {
    if (state.playing) {
      state.playing.cancel = true;
      setMood("idle");
      setLook(null);
    }
    state.playing = null;
    banner.classList.remove("is-on");
    if (state.route) renderRouteCard(router.targets.get(state.to));
    renderFrom();
  }

  function stepProgress(legIndex, walked) {
    const r = state.route;
    const L = r.legs[legIndex];
    const cum = [0];
    for (let i = 1; i < L.points.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(L.points[i].x - L.points[i - 1].x, L.points[i].y - L.points[i - 1].y));
    }
    const at = (p) => {
      let best = 0;
      let bd = Infinity;
      L.points.forEach((q, i) => {
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return cum[best];
    };
    let active = -1;
    r.steps.forEach((s, i) => {
      if (s.leg < legIndex) return;
      if (s.leg === legIndex && at(s.at) <= walked + 4) active = i;
    });
    document.querySelectorAll("#ulSteps li[data-step]").forEach((li) => {
      const i = Number(li.dataset.step);
      li.classList.toggle("is-active", i === active);
      li.classList.toggle("is-done", i < active);
    });
    const li = document.querySelector(`#ulSteps li[data-step="${active}"]`);
    if (li) li.scrollIntoView({ block: "nearest" });
  }

  function walkLeg(legIndex, token) {
    const L = state.route.legs[legIndex];
    const pts = L.points;
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push({ a: pts[i - 1], b: pts[i], from: total, len });
      total += len;
    }
    const speed = reduceMotion ? total * 4 : clamp(total / 9, 150, 320); // map px per second
    const walked = walkedEls[legIndex];
    return new Promise((resolve) => {
      let t0 = null;
      let lastStep = -1;
      const frame = (ts) => {
        if (token.cancel) return resolve(false);
        if (t0 == null) t0 = ts;
        const d = Math.min(total, ((ts - t0) / 1000) * speed);
        let s = segs.find((g) => d <= g.from + g.len) || segs[segs.length - 1];
        if (s && s.len < 0.5) s = segs.find((g) => g.len >= 0.5 && d <= g.from + g.len) || s;
        const t = s && s.len ? (d - s.from) / s.len : 1;
        const x = s ? s.a.x + (s.b.x - s.a.x) * clamp(t, 0, 1) : pts[0].x;
        const y = s ? s.a.y + (s.b.y - s.a.y) * clamp(t, 0, 1) : pts[0].y;
        const angle = (g) => (Math.atan2(g.b.y - g.a.y, g.b.x - g.a.x) * 180) / Math.PI;
        const heading = s && s.len ? angle(s) : null;
        // Eyes glance into the next corridor just before a turn.
        const next = s && segs[segs.indexOf(s) + 1];
        const look = next && next.len >= 0.5 && s.from + s.len - d < 22 ? angle(next) : heading;
        setPin(x, y, heading, look);
        if (walked) walked.setAttribute("stroke-dasharray", `${d.toFixed(1)} ${total + 50}`);
        followPin(x, y);
        const stepBucket = Math.floor(d / 12);
        if (stepBucket !== lastStep) {
          lastStep = stepBucket;
          stepProgress(legIndex, d);
        }
        if (d >= total) return resolve(true);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  async function play(legIndex) {
    const r = state.route;
    if (!r) return;
    const L = r.legs[legIndex];
    if (!L) return;
    if (L.floor !== FLOOR) {
      location.assign(pageFor(L.floor, { leg: legIndex, play: 1 }));
      return;
    }
    stopPlaying();
    const token = { leg: legIndex, cancel: false };
    state.playing = token;
    state.placing = false;
    renderFrom();
    renderRouteCard(router.targets.get(state.to));
    fitPoints(L.points.length > 1 ? L.points.slice(0, Math.min(L.points.length, 3)) : L.points, 160);
    setPin(L.points[0].x, L.points[0].y, null, null);
    if (legIndex > 0) {
      const prev = r.legs[legIndex - 1];
      setMood("excited");
      showBanner(`${icon(prev.exit.kind, "#fff")}<span>You’re on the ${FLOORS[FLOOR].label} — follow the blue line</span>`, 2200);
    }
    await sleep(reduceMotion ? 50 : legIndex > 0 ? 700 : 450);
    if (token.cancel) return;
    setMood("walk");
    const done = await walkLeg(legIndex, token);
    if (!done || token.cancel) return;

    if (L.exit) {
      const up = FLOORS[L.exit.toFloor].level > FLOORS[FLOOR].level;
      setMood("excited");
      setLook(up ? -90 : 90);
      const next = pageFor(L.exit.toFloor, { leg: legIndex + 1, play: 1 });
      showBanner(
        `${icon(L.exit.kind, "#fff")}<span>Take ${L.exit.name} ${up ? "up" : "down"} to the ${FLOORS[L.exit.toFloor].label}</span><button type="button" id="ulNext">I’m there</button>`
      );
      const go = () => {
        if (!token.cancel) location.assign(next);
      };
      $("ulNext").addEventListener("click", go);
      await sleep(reduceMotion ? 800 : 2200);
      go();
      return;
    }

    const t = router.targets.get(state.to);
    const end = L.points[L.points.length - 1];
    showBanner(`${icon("arrive", "#fff")}<span>You’ve arrived at ${t.name}</span>`, 4000);
    status(`Arrived at ${t.name}. Your location is now set here.`);
    stepProgress(legIndex, Infinity);
    state.playing = null;
    state.from = { floor: FLOOR, x: Math.round(end.x), y: Math.round(end.y), label: t.name };
    state.costs = null;
    state.to = null;
    persist();
    refreshRoute();
    renderFrom();
    setPin(end.x, end.y, pinHeading, null);
    setMood("happy", 6000);
    history.replaceState(null, "", `${FLOORS[FLOOR].page}?${tripParam()}`);
  }

  $("ulGo").addEventListener("click", () => {
    if (state.playing) {
      stopPlaying();
      return;
    }
    if (!state.route) return;
    // Start pin lives on its own floor: begin there.
    play(0);
  });

  // ── Taps on the map ───────────────────────────────────
  let down = null;
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest(".controls, .ul-banner")) {
        down = null;
        return;
      }
      down = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target };
    },
    true
  );
  window.addEventListener(
    "pointerup",
    (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 700;
      const target = down.target;
      down = null;
      if (moved > 6 || !quick) return;
      if (state.placing) {
        const p = screenToMap(e.clientX, e.clientY);
        if (setFrom(FLOOR, p.x, p.y)) {
          state.placing = false;
          status("Location set. Search for where you want to go.");
          renderFrom();
        }
        return;
      }
      const hit = target.closest && target.closest(".ul-hit");
      if (hit) selectTarget(hit.dataset.id, { fit: false });
    },
    true
  );

  // ── Boot ──────────────────────────────────────────────
  classifyArt();
  drawNetwork();
  drawTargets();
  renderLayers();
  renderFrom();
  renderFilter();
  drawSection();
  renderResults();
  syncScale();
  refreshRoute({ fit: !!state.to && !urlTrip?.play });
  if (!state.to && activeSection()) fitPoints(activeSection().poly.map(([x, y]) => ({ x, y })), 60);
  persist();

  if (urlTrip?.play && state.route && Number.isInteger(urlTrip.leg)) {
    history.replaceState(null, "", `${FLOORS[FLOOR].page}?${tripParam()}`);
    setTimeout(() => play(urlTrip.leg), 120);
  } else if (!state.route) {
    status("Search a room, or tap any room on the map.");
  }

  window.ulNav = { router, state, selectTarget, setFrom, play, stopPlaying, screenToMap, mapToScreen };
})();
