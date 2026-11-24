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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).get("reduce") === "1";

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
  const isEmbed = new URLSearchParams(location.search).get("embed") === "1";
  /*
   * Offline (shell ?offline=1): no GPS, so the map never shows where the user is
   * and a search / tap only marks the place — no route from the user to it.
   */
  const isOffline =
    isEmbed && new URLSearchParams(location.search).get("offline") === "1";
  /*
   * Embed prototype: shell owns destination. Don't revive the last route from
   * sessionStorage on refresh — only honor an explicit ?trip= (floor handoff).
   */
  if (isEmbed && !(urlTrip && urlTrip.to)) {
    try {
      sessionStorage.removeItem("ul-trip");
      /* Fresh embed — use defaultStart, not a previous pin */
      sessionStorage.removeItem("ul-from");
    } catch (_) {}
  }
  const state = {
    from:
      urlTrip?.from ||
      (isEmbed ? { ...DATA.defaultStart } : store.get("ul-from")) ||
      { ...DATA.defaultStart },
    to: urlTrip
      ? urlTrip.to || null
      : isEmbed
        ? null
        : store.get("ul-trip")?.to || null,
    pref: urlTrip?.pref || store.get("ul-pref") || "stairs",
    layers: { ...Object.fromEntries(LAYERS.map((l) => [l.id, true])), ...(store.get("ul-layers") || {}) },
    route: null,
    costs: null,
    placing: false,
    playing: null, // { leg, cancel }
    awaitingConfirm: null, // stair/lift handoff waiting for shell CTA
    confirmQueued: false, // CTA clicked before wait was armed
    confirmedLeg: null, // leg already confirmed — skip wait if play restarts
    activeResult: -1,
    filter: (() => {
      const saved = store.get("ul-filter") || {};
      const ids = Array.isArray(saved.ids)
        ? saved.ids.filter(Boolean)
        : saved.id
          ? [saved.id]
          : [];
      return {
        mode: saved.mode || "wings",
        id: ids[0] || null,
        ids,
      };
    })(),
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

  /** Keep ?embed=1 across replaceState — bridge boots AFTER this file and reads location.search */
  function embedQuery(extra) {
    const q = tripParam(extra);
    return isEmbed ? `${q}&embed=1` : q;
  }

  function pageFor(floor, extra) {
    return `${FLOORS[floor].page}?${embedQuery(extra)}`;
  }

  function notifyShell(payload) {
    try {
      parent.postMessage({ source: "unilocate-map", ...payload }, "*");
    } catch (_) {
      /* ignore */
    }
  }

  function isManeuver(step) {
    if (!step) return false;
    if (step.arrive || step.transfer) return true;
    const ic = step.icon || "";
    return (
      ic === "left" ||
      ic === "right" ||
      ic === "back" ||
      ic === "stairs" ||
      ic === "stair" ||
      ic === "lift" ||
      ic === "elevator"
    );
  }

  /** Path distance along a leg to the nearest polyline vertex of point p */
  function alongLeg(legIndex, p) {
    const L = state.route && state.route.legs[legIndex];
    if (!L || !L.points || !L.points.length || !p) return 0;
    let best = 0;
    let bd = Infinity;
    let cum = 0;
    const distAt = [];
    for (let i = 0; i < L.points.length; i++) {
      if (i > 0) {
        cum += Math.hypot(
          L.points[i].x - L.points[i - 1].x,
          L.points[i].y - L.points[i - 1].y,
        );
      }
      distAt.push(cum);
      const d = Math.hypot(L.points[i].x - p.x, L.points[i].y - p.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return distAt[best];
  }

  /**
   * Next turn/stairs/arrive still ahead of the pin.
   * Once walked past a maneuver, skip it so distance can count down to the next one.
   */
  function guidanceAhead(walkedPx, legIndex) {
    const steps = state.route.steps;
    const PASS_PX = 10;
    const walked = Number.isFinite(walkedPx) ? walkedPx : 0;
    const leg = Number.isFinite(legIndex) ? legIndex : 0;
    for (let j = 0; j < steps.length; j++) {
      const s = steps[j];
      if (!isManeuver(s)) continue;
      if (s.leg < leg) continue;
      if (s.leg > leg) {
        return { index: j, step: s, remainPx: alongLeg(s.leg, s.at) };
      }
      const atD = alongLeg(leg, s.at);
      if (walked < atD + PASS_PX) {
        return { index: j, step: s, remainPx: Math.max(0, atD - walked) };
      }
    }
    const last = steps.length - 1;
    return { index: last, step: steps[last], remainPx: 0 };
  }

  function floorPhrase(floorId) {
    const f = FLOORS[floorId];
    if (!f) return "the next floor";
    if (f.short === "G") return "Ground";
    return `Floor ${f.short}`;
  }

  function tripPayload() {
    return { from: state.from, to: state.to, pref: state.pref };
  }

  let lastNavKey = "";

  /** Push the upcoming guidance step to the Map-Navigation chrome */
  function publishNav(stepIndex, walkedPx) {
    const t = state.to && router.targets.get(state.to);
    const r = state.route;
    if (!t || !r || r.error || !r.steps || !r.steps.length) {
      lastNavKey = "";
      notifyShell({ type: "nav", clear: true });
      return;
    }

    /* Stair / lift handoff — shell shows Map-StairNavigation confirm card */
    if (state.awaitingConfirm) {
      const ac = state.awaitingConfirm;
      const kind = ac.kind === "lift" || ac.kind === "elevator" ? "lift" : "stairs";
      const toFloorLabel = floorPhrase(ac.toFloor);
      const key = `ac:${ac.toFloor}:${kind}`;
      if (key === lastNavKey) return;
      lastNavKey = key;
      notifyShell({
        type: "nav",
        destination: t.name,
        stepIndex: -1,
        progressIndex: ac.legIndex,
        stepCount: r.steps.length,
        step: {
          icon: kind,
          text:
            kind === "lift"
              ? `Lift to ${toFloorLabel} confirm when there.`
              : `Stairs to ${toFloorLabel} confirm when there.`,
          meters: 0,
          transfer: true,
          awaitConfirm: true,
          toFloor: ac.toFloor,
          toFloorLabel,
          /* Leg to walk after confirm (this floor), not the following one */
          nextLeg: ac.legIndex,
          kind,
        },
        trip: tripPayload(),
        totalMeters: r.meters,
      });
      return;
    }

    const steps = r.steps;
    const progress = Math.max(0, Math.min(Number(stepIndex) || 0, steps.length - 1));
    const leg =
      (state.playing && Number.isFinite(state.playing.leg) && state.playing.leg) ||
      (steps[progress] && steps[progress].leg) ||
      0;
    const walked =
      Number.isFinite(walkedPx) ? walkedPx : state.playing ? null : 0;
    const pinWalked = walked == null ? 0 : walked;
    const { index, step, remainPx } = guidanceAhead(pinWalked, leg);
    const meters = Math.max(0, Math.round(remainPx * MPP));
    const arrive = !!step.arrive && meters < 2;
    const key = `${index}|${step.icon}|${step.text}|${meters}|${arrive ? 1 : 0}`;
    if (key === lastNavKey) return;
    lastNavKey = key;
    notifyShell({
      type: "nav",
      destination: t.name,
      stepIndex: index,
      progressIndex: progress,
      stepCount: steps.length,
      step: {
        icon: step.icon || "walk",
        text: step.text || "",
        meters,
        arrive,
        transfer: !!step.transfer,
        awaitConfirm: false,
      },
      trip: tripPayload(),
      totalMeters: r.meters,
    });
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
  for (const id of [
    "sections",
    "outer",
    "paths",
    "rooms",
    "washrooms",
    "exits",
    "verticals",
    "poiRoutes",
    "route",
    "marks",
  ]) {
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
    /* No SVG <title> — native browser tooltips feel like a hover effect */
  }

  function drawTargets() {
    for (const t of router.targets.values()) {
      if (t.layer === "verticals") {
        if (!t.accessPoints[FLOOR]) continue;
        const c = el("circle", { cx: t.icon[0], cy: t.icon[1], r: 17, class: "ul-hit", "data-id": t.id }, G.verticals);
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

  const activeSectionIds = () =>
    (Array.isArray(state.filter.ids) ? state.filter.ids : []).filter((id) =>
      SECTION_BY_ID.has(id),
    );

  const activeSections = () =>
    activeSectionIds().map((id) => SECTION_BY_ID.get(id)).filter(Boolean);

  /** First selected — placeholder / legacy single-section helpers */
  const activeSection = () => activeSections()[0] || null;

  const inAnyActiveSection = (targetId) => {
    const secs = activeSections();
    if (!secs.length) return true;
    return secs.some((sec) => sec.members.has(targetId));
  };

  const SEC_COLORS = {
    wings: { stroke: "#6c72e0", fill: "rgba(108, 114, 224, 0.32)" },
    buildings: { stroke: "#FC3477", fill: "rgba(252, 52, 119, 0.32)" },
  };

  function sectionTabAnchor(sec) {
    const xs = sec.poly.map((p) => p[0]);
    const ys = sec.poly.map((p) => p[1]);
    const top = Math.min(...ys);
    const topEdge = sec.poly
      .map((p, i) => [p, sec.poly[(i + 1) % sec.poly.length]])
      .filter(([a, b]) => a[1] === top && b[1] === top)
      .sort(
        (e1, e2) =>
          Math.abs(e2[1][0] - e2[0][0]) - Math.abs(e1[1][0] - e1[0][0]),
      )[0];
    const cx = topEdge
      ? (topEdge[0][0] + topEdge[1][0]) / 2
      : (Math.min(...xs) + Math.max(...xs)) / 2;
    const w = Math.max(56, sec.name.length * 8.4 + 26);
    return { sec, cx, top, w };
  }

  /** Tab labels use scale(var(--ul-k)); layout must use that visual width. */
  function currentTabK() {
    const zoom = view ? view.state.zoom : 0.5;
    return clamp(1 / zoom, 0.7, 3);
  }

  /** Spread overlapping name tabs horizontally so labels sit side by side. */
  function resolveTabOverlaps(tabs) {
    if (tabs.length < 2) return tabs;
    const k = currentTabK();
    const TOP_BAND = 36;
    const GAP = 14 * k;
    const placed = tabs.map((t) => ({ ...t, vw: t.w * k }));
    const used = new Set();

    for (let i = 0; i < placed.length; i++) {
      if (used.has(i)) continue;
      const cluster = [i];
      used.add(i);
      let grew = true;
      while (grew) {
        grew = false;
        for (let j = 0; j < placed.length; j++) {
          if (used.has(j)) continue;
          const a = placed[j];
          const hits = cluster.some((ci) => {
            const b = placed[ci];
            if (Math.abs(a.top - b.top) > TOP_BAND) return false;
            const a0 = a.cx - a.vw / 2;
            const a1 = a.cx + a.vw / 2;
            const b0 = b.cx - b.vw / 2;
            const b1 = b.cx + b.vw / 2;
            return a0 < b1 + GAP && a1 + GAP > b0;
          });
          if (hits) {
            cluster.push(j);
            used.add(j);
            grew = true;
          }
        }
      }
      if (cluster.length < 2) continue;
      /* Stable order: left→right by natural cx, then name */
      cluster.sort((ai, bi) => {
        const d = placed[ai].cx - placed[bi].cx;
        if (Math.abs(d) > 1) return d;
        return String(placed[ai].sec.name).localeCompare(placed[bi].sec.name);
      });
      const members = cluster.map((ci) => placed[ci]);
      const totalW =
        members.reduce((s, t) => s + t.vw, 0) + GAP * (members.length - 1);
      const mid =
        members.reduce((s, t) => s + t.cx, 0) / members.length;
      let x = mid - totalW / 2;
      const top = Math.min(...members.map((t) => t.top));
      for (const ci of cluster) {
        const t = placed[ci];
        t.cx = x + t.vw / 2;
        t.top = top;
        x += t.vw + GAP;
      }
    }
    return placed;
  }

  function drawOneSection(sec, tabCx, tabTop, tabW) {
    const colors = SEC_COLORS[sec.mode] || SEC_COLORS.buildings;
    const shape = el(
      "polygon",
      { points: sec.poly.map((p) => p.join(",")).join(" "), class: "ul-sec-shape" },
      G.sections,
    );
    shape.style.fill = colors.fill;
    shape.style.stroke = colors.stroke;
    const tab = el(
      "g",
      { class: "ul-scale ul-sec-tab", "data-sec-id": sec.id },
      G.sections,
    );
    tab.style.transform = `translate(${tabCx}px, ${tabTop}px) scale(var(--ul-k))`;
    const tabRect = el(
      "rect",
      { x: -tabW / 2, y: -24, width: tabW, height: 26, rx: 9 },
      tab,
    );
    tabRect.style.fill = colors.stroke;
    el("text", { x: 0, y: -11 }, tab).textContent = sec.name;
  }

  function placeSectionTabs() {
    const secs = activeSections();
    if (secs.length < 2) return;
    const byId = new Map(
      resolveTabOverlaps(secs.map(sectionTabAnchor)).map((t) => [t.sec.id, t]),
    );
    for (const node of G.sections.querySelectorAll(".ul-sec-tab")) {
      const t = byId.get(node.getAttribute("data-sec-id"));
      if (!t) continue;
      node.style.transform = `translate(${t.cx}px, ${t.top}px) scale(var(--ul-k))`;
    }
  }

  function drawSection() {
    G.sections.innerHTML = "";
    const secs = activeSections();
    const modes = new Set(secs.map((s) => s.mode));
    overlay.dataset.sectionMode =
      modes.size === 1 ? [...modes][0] : modes.size > 1 ? "mixed" : "";
    const tabs = resolveTabOverlaps(secs.map(sectionTabAnchor));
    for (const t of tabs) drawOneSection(t.sec, t.cx, t.top, t.w);
  }

  // ── Pin ───────────────────────────────────────────────
  const pin = document.createElement("div");
  pin.className = "ul-pin";
  pin.dataset.mood = "idle";
  pin.setAttribute("aria-label", "You are here");
  pin.innerHTML = `
    <div class="ul-pin-spin" aria-hidden="true">
      <div class="ul-pin-avatar">
        <svg class="ul-face" viewBox="0 0 36 36">
          <g class="ul-face-look">
            <g class="f-eyes-open">
              <rect class="f-eye" x="12.2" y="12.2" width="2.6" height="5.6" rx="1.3"/>
              <rect class="f-eye" x="21.2" y="12.2" width="2.6" height="5.6" rx="1.3"/>
            </g>
            <g class="f-eyes-happy">
              <path d="M11.2 16.2q2.2-3.4 4.4 0M20.4 16.2q2.2-3.4 4.4 0"/>
            </g>
            <path class="f-mouth-smile" d="M13 21.8q5 5.4 10 0"/>
            <path class="f-mouth-big" d="M12 20.4h12q0 6.6-6 6.6t-6-6.6Z"/>
            <ellipse class="f-mouth-o" cx="18" cy="23.2" rx="2.2" ry="2.6"/>
            <path class="f-mouth-flat" d="M14.2 23.2h7.6"/>
          </g>
        </svg>
      </div>
      <!-- Separate chevron with a clear gap from the disc (not tucked under) -->
      <svg class="ul-pin-arrow" viewBox="0 0 18 28" width="18" height="28">
        <path
          d="M2.2 2.4c-.4.35-.5.95-.2 1.45 2.6 6.1 2.65 11.2.15 18.4-.25.5-.15 1.1.25 1.4.4.3.95.3 1.35-.05L16.6 14.8c.35-.28.4-.75.15-1.1L3.55 2.35c-.35-.3-.9-.3-1.35.05Z"
          fill="#49B0FF"
          stroke="#fff"
          stroke-width="3"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </svg>
    </div>`;
  map.appendChild(pin);
  let pinHeading = 0;

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
    /* Anchor on avatar centre (pin box is wider to fit the arrow) */
    pin.style.left = `${x - 22}px`;
    pin.style.top = `${y - 22}px`;
    pin.hidden = false;
    if (heading != null) pinHeading = heading;
    /* Only the chevron turns — face stays upright */
    const arrow = pin.querySelector(".ul-pin-arrow");
    arrow.style.transform = `rotate(${pinHeading}deg)`;
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
    /* Embed: shell chrome only — don't inset for the hidden native panel */
    if (isEmbed) {
      return { left: 0, top: 0, width: vr.width, height: vr.height };
    }
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

  let centerAnim = 0;

  function fitPoints(points, pad = 70, opts = {}) {
    if (!view || !points.length) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const screenCenter = () => {
      const a = visibleArea();
      return { x: a.left + a.width / 2, y: a.top + a.height / 2 };
    };
    const a0 = visibleArea();
    const zRaw = Math.min(
      (a0.width - 40) / (maxX - minX),
      (a0.height - 60) /
        ((maxY - minY) * Math.cos((view.state.tilt * Math.PI) / 180)),
    );
    const bounds = window.ulEmbedZoomBounds?.();
    const minZ = bounds?.min ?? 0.3;
    const maxZ = bounds?.max ?? 1.2;
    const targetZ = clamp(zRaw * 0.88, minZ, Math.min(maxZ, 1.2));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const duration = reduceMotion
      ? 0
      : Number.isFinite(opts.duration)
        ? Math.max(0, opts.duration)
        : 0;

    const settle = (z) => {
      view.state.zoom = z;
      view.render();
      panTo(cx, cy, screenCenter());
    };

    if (centerAnim) {
      cancelAnimationFrame(centerAnim);
      centerAnim = 0;
    }

    if (duration <= 0) {
      settle(targetZ);
      return;
    }

    const z0 = Number(view.state.zoom) || minZ;
    const t0 = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      settle(z0 + (targetZ - z0) * easeOut(t));
      if (t < 1) centerAnim = requestAnimationFrame(frame);
      else {
        centerAnim = 0;
        settle(targetZ);
      }
    };
    centerAnim = requestAnimationFrame(frame);
  }

  /** Subtle 3D pitch after a destination is set (deg). Keep tiny. */
  const DEST_TILT_DEG = 8;

  /**
   * Animate zoom + pan so the user pin lands in the middle of the frame.
   * Starts from the current (wide) view — feels like the map finds you.
   * opts.tilt — absolute rotateX degrees (omit to leave tilt unchanged).
   */
  function centerOnUser(opts = {}) {
    if (!view || !state.from || state.from.floor !== FLOOR) return false;
    const bounds = window.ulEmbedZoomBounds?.();
    const minZ = bounds?.min ?? 0.3;
    const maxZ = bounds?.max ?? 2;
    const targetZ = clamp(
      opts.zoom != null && Number.isFinite(opts.zoom) ? opts.zoom : 0.88,
      minZ,
      maxZ,
    );
    const animateTilt = opts.tilt != null && Number.isFinite(opts.tilt);
    const targetTilt = animateTilt ? clamp(opts.tilt, 0, 28) : Number(view.state.tilt) || 0;
    const duration = reduceMotion
      ? 0
      : Number.isFinite(opts.duration)
        ? Math.max(0, opts.duration)
        : 860;
    const screenCenter = () => {
      const a = visibleArea();
      return { x: a.left + a.width / 2, y: a.top + a.height / 2 };
    };
    const settle = (z, tilt) => {
      view.state.zoom = z;
      if (animateTilt) view.state.tilt = tilt;
      view.render();
      panTo(state.from.x, state.from.y, screenCenter());
    };

    if (centerAnim) {
      cancelAnimationFrame(centerAnim);
      centerAnim = 0;
    }

    if (duration <= 0) {
      settle(targetZ, targetTilt);
      return true;
    }

    const z0 = Number(view.state.zoom) || minZ;
    const tilt0 = Number(view.state.tilt) || 0;
    const t0 = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const frame = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = easeOut(t);
      /* Zoom toward the pin while keeping it centred; ease in a light tilt */
      settle(z0 + (targetZ - z0) * e, tilt0 + (targetTilt - tilt0) * e);
      if (t < 1) {
        centerAnim = requestAnimationFrame(frame);
      } else {
        centerAnim = 0;
        settle(targetZ, targetTilt);
      }
    };
    centerAnim = requestAnimationFrame(frame);
    return true;
  }

  let followSkip = 0;
  function followPin(x, y) {
    if (!view) return;
    /* getBoundingClientRect + view.render is costly — every other frame is enough */
    if ((followSkip ^= 1)) return;
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
    /* Tabs are scale(--ul-k); re-spread whenever zoom changes */
    placeSectionTabs();
  }
  new MutationObserver(syncScale).observe(document.getElementById("stage"), {
    attributes: true,
    attributeFilter: ["style"],
  });

  // ── Panel ─────────────────────────────────────────────
  const panel = document.querySelector(".controls");
  const oldRows = [...panel.querySelectorAll(".control-row, .control-actions")];
  panel.classList.add("ul-panel");
  /* Embed shell owns chrome — keep panel mounted for search/route APIs, hide it */
  if (isEmbed) {
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    panel.style.setProperty("display", "none", "important");
  }
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
    const secs = activeSections();
    const hits = [];
    for (const t of router.targets.values()) {
      if (floorFilter && t.layer !== "verticals" && t.floor !== floorFilter) continue;
      if (secs.length && !inAnyActiveSection(t.id)) continue;
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

  /** Everything inside selected section(s): this floor first, then the others. */
  function sectionHits(secs) {
    const list = Array.isArray(secs) ? secs : secs ? [secs] : [];
    if (!list.length) return [];
    const C = costs();
    const level = (t) =>
      t.layer === "verticals" ? -1 : t.floor === FLOOR ? 0 : 1 + FLOORS[t.floor].level;
    const members = new Set();
    for (const sec of list) for (const id of sec.members) members.add(id);
    return [...members]
      .map((id) => router.targets.get(id))
      .filter(Boolean)
      .sort(
        (a, b) =>
          level(a) - level(b) ||
          (TYPE_ORDER[a.type] ?? 0) - (TYPE_ORDER[b.type] ?? 0) ||
          byName(a, b),
      )
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
    const secs = activeSections();
    const list = $("ulResults");
    if (!q.trim()) {
      lastHits = secs.length && !state.to ? sectionHits(secs) : [];
      state.activeResult = lastHits.length ? 0 : -1;
      const head =
        secs.length === 1
          ? secs[0].name
          : secs.length > 1
            ? `${secs.length} filters`
            : "";
      list.innerHTML = lastHits.length
        ? `<li class="ul-list-head">${head} · ${lastHits.length} places</li>` +
          lastHits.map(resultItem).join("")
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
    const chips = $("ulSecChips");
    if (chips) {
      const list = SECTIONS[state.filter.mode] || [];
      chips.dataset.mode = state.filter.mode;
      const selected = new Set(activeSectionIds());
      chips.innerHTML =
        `<button type="button" role="checkbox" aria-checked="${!selected.size}" data-sec="" class="${selected.size ? "" : "is-on"}">All</button>` +
        list
          .map((s) => {
            const on = selected.has(s.id);
            return `<button type="button" role="checkbox" aria-checked="${on}" data-sec="${s.id}" class="${on ? "is-on" : ""}">${s.name}</button>`;
          })
          .join("");
    }
    const q = $("ulQuery");
    if (q) {
      const secs = activeSections();
      q.placeholder =
        secs.length === 1
          ? `Search in ${secs[0].name}…`
          : secs.length > 1
            ? `Search in ${secs.length} areas…`
            : "Search a room, washroom, exit…";
    }
  }

  function setSectionIds(ids, opts = {}) {
    const clean = [
      ...new Set(
        (Array.isArray(ids) ? ids : []).filter((id) => SECTION_BY_ID.has(id)),
      ),
    ];
    state.filter.ids = clean;
    state.filter.id = clean[0] || null;
    if (clean[0]) state.filter.mode = SECTION_BY_ID.get(clean[0]).mode;
    persist();
    renderFilter();
    drawSection();
    renderResults();
    const secs = activeSections();
    if (secs.length && opts.fit !== false) {
      const pts = secs.flatMap((sec) =>
        sec.poly.map(([x, y]) => ({ x, y })),
      );
      fitPoints(pts, 60, {
        duration: Number.isFinite(opts.duration) ? opts.duration : 720,
      });
    }
    status(
      secs.length === 1
        ? `Showing ${secs[0].name}. Pick a room below or search inside it.`
        : secs.length > 1
          ? `Showing ${secs.length} areas.`
          : "",
    );
    notifyShell({
      type: "filter",
      filter: {
        mode: state.filter.mode,
        id: state.filter.id,
        ids: [...state.filter.ids],
      },
    });
  }

  function setSection(id, opts = {}) {
    if (id == null || id === "") setSectionIds([], opts);
    else setSectionIds([id], opts);
  }

  function toggleSectionId(id, opts = {}) {
    if (!SECTION_BY_ID.has(id)) return;
    const cur = new Set(activeSectionIds());
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    setSectionIds([...cur], opts);
  }

  function setLayer(id, on) {
    if (!LAYERS.some((l) => l.id === id)) return;
    state.layers[id] = !!on;
    applyLayers();
    persist();
    if ($("ulLayers")) renderLayers();
    notifyShell({ type: "layers", layers: { ...state.layers } });
  }

  /** Active Other overlays — can stack (exits + restrooms + staff). */
  const poiFocus = new Set();

  const STAFF_IDS = new Set(["1-o101", "2-o201", "2-staff"]);
  const STAFF_NAMES = /^(O101|O201)$/i;

  function poiMatches(t, kind) {
    if (kind === "washroom") return t.type === "washroom";
    if (kind === "exit") return t.type === "exit";
    if (kind === "staff") {
      return (
        STAFF_IDS.has(t.id) ||
        STAFF_NAMES.test(t.name || "") ||
        /staff/i.test(t.name || "")
      );
    }
    return false;
  }

  function clearPoiRoutes() {
    G.poiRoutes.innerHTML = "";
  }

  /**
   * Paths to every matching POI in #FF922D.
   * Nearest = solid (default) line; others = dashed.
   * Appends into G.poiRoutes (does not clear — redrawPoiOverlays owns that).
   */
  function drawMultiPoiRoutes(kind, fitPts) {
    const ranked = [];
    for (const t of router.targets.values()) {
      if (!poiMatches(t, kind)) continue;
      const r = router.route(state.from, t.id, { pref: state.pref });
      if (!r || r.error) continue;
      ranked.push({ t, r, meters: r.meters });
    }
    ranked.sort((a, b) => a.meters - b.meters);
    if (!ranked.length) return null;

    const nearId = ranked[0].t.id;
    /* Dashed first, nearest solid on top */
    const ordered = [
      ...ranked.filter((x) => x.t.id !== nearId),
      ...ranked.filter((x) => x.t.id === nearId),
    ];

    for (const { t, r } of ordered) {
      const near = t.id === nearId;
      for (const L of r.legs) {
        if (L.floor !== FLOOR) continue;
        const d = pathD(L.points);
        for (const p of L.points) fitPts.push(p);
        el(
          "path",
          { d, class: `ul-poi-route-casing${near ? " is-near" : ""}` },
          G.poiRoutes,
        );
        el(
          "path",
          { d, class: `ul-poi-route-line${near ? " is-near" : ""}` },
          G.poiRoutes,
        );
      }
      if (t.floor === FLOOR) {
        const p = anchorOf(t);
        if (p) {
          el(
            "circle",
            {
              cx: p[0],
              cy: p[1],
              r: near ? 10 : 7,
              class: `ul-poi-end${near ? " is-near" : ""}`,
            },
            G.poiRoutes,
          );
        }
      }
    }
    return ranked[0].t.id;
  }

  /** Orange room footprints — washrooms / staff (O101, O201, Staff room). No name tags. */
  function drawRoomHighlights(kind, fitPts) {
    let n = 0;
    for (const t of router.targets.values()) {
      if (!poiMatches(t, kind) || t.floor !== FLOOR || !t.rect) continue;
      const [x, y, w, h] = t.rect;
      const shape = el(
        "rect",
        {
          x,
          y,
          width: w,
          height: h,
          rx: 6,
          class: kind === "staff" ? "ul-poi-staff" : "ul-poi-wash",
        },
        G.poiRoutes,
      );
      shape.style.fill = "rgba(255, 146, 45, 0.32)";
      shape.style.stroke = "#FF922D";
      shape.style.strokeWidth = "3";
      fitPts.push({ x: x + w / 2, y: y + h / 2 });
      fitPts.push({ x, y }, { x: x + w, y: y + h });
      n += 1;
    }
    return n;
  }

  /** Redraw every active Other overlay so multiple chips can show together. */
  function redrawPoiOverlays(opts = {}) {
    clearPoiRoutes();
    const fitPts = [];
    let nearestExit = null;

    if (poiFocus.has("exit")) {
      nearestExit = drawMultiPoiRoutes("exit", fitPts);
    }
    if (poiFocus.has("washroom")) {
      drawRoomHighlights("washroom", fitPts);
    }
    if (poiFocus.has("staff")) {
      drawRoomHighlights("staff", fitPts);
    }

    if (opts.fit !== false && fitPts.length) {
      fitPoints(fitPts, 70, { duration: 720 });
    }

    if (nearestExit) {
      const t = router.targets.get(nearestExit);
      const r = t && router.route(state.from, t.id, { pref: state.pref });
      if (t && r && !r.error) {
        status(`Nearest exit: ${t.name} · ${r.meters} m`);
      }
    } else if (poiFocus.size === 0) {
      status("");
    }
  }

  function countPoiOnFloor(kind) {
    let n = 0;
    for (const t of router.targets.values()) {
      if (!poiMatches(t, kind) || t.floor !== FLOOR) continue;
      if (kind === "exit" || t.rect) n += 1;
    }
    return n;
  }

  /** Fit + peek POIs for shell Other chips (exit / washroom / staff). */
  function focusPoi(kind, on = true) {
    if (on) poiFocus.add(kind);
    else poiFocus.delete(kind);

    for (const t of router.targets.values()) {
      if (!poiMatches(t, kind)) continue;
      overlay.querySelectorAll(`.ul-hit[data-id="${t.id}"]`).forEach((n) => {
        n.classList.toggle("is-peek", poiFocus.has(kind));
      });
    }

    redrawPoiOverlays({ fit: on || poiFocus.size > 0 });

    if (on && (kind === "staff" || kind === "washroom") && !countPoiOnFloor(kind)) {
      const label = kind === "staff" ? "staff rooms" : "washrooms";
      if (poiFocus.size === 1) status(`No ${label} on this floor.`);
    }
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
    if (!id) setSectionIds([]);
    else toggleSectionId(id);
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
  /** Where to drop the destination pin for a place (room centre, else first door) */
  function placePoint(t) {
    if (t.rect) {
      const [x, y, w, h] = t.rect;
      return { x: x + w / 2, y: y + h / 2 };
    }
    const d = t.doors && t.doors[0];
    if (d) return { x: d[0], y: d[1] };
    const pts = t.accessPoints && t.accessPoints[FLOOR];
    if (pts && pts[0]) return { x: pts[0][0], y: pts[0][1] };
    return null;
  }

  /**
   * Offline — a QR checkpoint fixes the user's position. The checkpoint hangs in
   * the ground-floor main corridor (y≈831), so scanning it reveals the pin there.
   */
  const QR_SPOT = { floor: "ground", x: 785, y: 831, label: "Main corridor" };

  /** Offline hop length: each QR on the route sits about this far past the last one */
  const HOP_M = 30;

  function pointAlong(points, dist) {
    let left = dist;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (seg > 0 && left <= seg) {
        const t = left / seg;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      left -= seg;
    }
    const last = points[points.length - 1];
    return { x: last.x, y: last.y };
  }

  /**
   * Offline — where the next QR sits along the current route, or null with no route.
   * Long stretch: one hop ahead on this floor. Short stretch: the stair/lift exit's
   * far side (next floor), or the destination itself when it is the last leg.
   */
  function nextCheckpoint() {
    const r = state.route;
    if (!r || !r.legs || !r.legs.length) return null;
    const L0 = r.legs[0];
    const step = HOP_M / MPP;
    const round = (p, floor, extra) => ({ floor, x: Math.round(p.x), y: Math.round(p.y), ...extra });
    if (L0.px > step * 1.5) {
      return round(pointAlong(L0.points, step), L0.floor, { final: false, label: "Checkpoint" });
    }
    if (r.legs.length === 1) {
      const end = L0.points[L0.points.length - 1];
      return round(end, L0.floor, { final: true, label: "Destination" });
    }
    const L1 = r.legs[1];
    return round(L1.points[0], L1.floor, { final: false, label: "Checkpoint" });
  }

  /** Walk-less arrival: the last QR is at the destination, so finish the trip there */
  function arriveHere(end) {
    const t = state.to && router.targets.get(state.to);
    if (!t) return;
    showBanner(`${icon("arrive", "#fff")}<span>You’ve arrived at ${t.name}</span>`, 4000);
    status(`Arrived at ${t.name}. Your location is now set here.`);
    state.playing = null;
    state.from = { floor: FLOOR, x: Math.round(end.x), y: Math.round(end.y), label: t.name };
    state.costs = null;
    notifyShell({ type: "arrived", destination: t.name });
    state.to = null;
    persist();
    refreshRoute();
    renderFrom();
    setMood("happy", 6000);
  }

  function revealUser(opts = {}) {
    const spot = opts.spot && opts.spot.floor ? opts.spot : QR_SPOT;
    const snap = router.snap(spot.floor, spot.x, spot.y);
    state.from = {
      floor: spot.floor,
      x: Math.round(snap ? snap.x : spot.x),
      y: Math.round(snap ? snap.y : spot.y),
      label: spot.label || "Checkpoint",
    };
    state.costs = null;
    persist();
    document.documentElement.classList.add("ul-located");
    renderFrom();
    const dest = opts.to ? router.targets.get(String(opts.to)) : null;
    if (dest) {
      /* A place was already picked: route to it from the QR spot */
      stopPlaying();
      state.to = dest.id;
      state.confirmQueued = false;
      state.confirmedLeg = null;
      $("ulQuery").value = "";
      persist();
      renderResults();
      if (opts.final) {
        arriveHere({ x: state.from.x, y: state.from.y });
        return true;
      }
      refreshRoute({ fit: true });
      publishNav(0);
      if (state.from.floor === FLOOR) setMood("happy", 2200);
      notifyShell({ type: "located", floor: state.from.floor, routed: !!state.route });
      return true;
    }
    if (state.from.floor === FLOOR) {
      setMood("happy", 2200);
      if (opts.center) centerOnUser({ zoom: 0.95, duration: reduceMotion ? 0 : 720 });
    }
    notifyShell({ type: "located", floor: state.from.floor });
    return true;
  }

  /** Remove the offline place pin + highlight */
  function clearPlace() {
    G.marks.innerHTML = "";
    overlay.querySelectorAll(".ul-hit.is-dest").forEach((n) => n.classList.remove("is-dest"));
  }

  /**
   * Offline — show where a place is. No route, no steps, no nav card.
   * Places on another floor are handed to the shell, which opens that floor.
   */
  function showPlace(id, opts = {}) {
    stopPlaying();
    const t = router.targets.get(id);
    if (!t) return false;
    state.to = null;
    state.route = null;
    $("ulQuery").value = "";
    renderResults();
    renderRouteCard(null);
    drawRoute();
    clearPlace();
    const floor = t.floor || (t.floors && t.floors[0]) || FLOOR;
    notifyShell({ type: "place", id: t.id, floor, name: t.name });
    if (floor !== FLOOR) return true;
    const p = placePoint(t);
    if (!p) return false;
    destMarker(p);
    overlay.querySelectorAll(`.ul-hit[data-id="${t.id}"]`).forEach((n) => n.classList.add("is-dest"));
    if (opts.fit !== false) fitPoints([p], 170, { duration: 720 });
    return true;
  }

  function selectTarget(id, opts = {}) {
    if (isOffline) {
      showPlace(id, opts);
      return;
    }
    stopPlaying();
    state.to = id;
    state.confirmQueued = false;
    state.confirmedLeg = null;
    $("ulQuery").value = "";
    persist();
    renderResults();
    refreshRoute({ fit: opts.fit !== false });
  }

  function clearTarget() {
    stopPlaying();
    state.to = null;
    state.route = null;
    state.confirmQueued = false;
    state.confirmedLeg = null;
    if (view) {
      view.state.tilt = 0;
      view.render();
    }
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
      /* Embed: sight-zoom on user + a very light tilt once a destination exists */
      if (
        isEmbed &&
        centerOnUser({ zoom: 1.05, duration: 720, tilt: DEST_TILT_DEG })
      ) {
        /* animated */
      } else {
        const here = legsHere();
        if (here.length) fitPoints(here.flatMap(({ L }) => L.points));
      }
    }
    publishNav(0);
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
    if (state.awaitingConfirm) {
      const ac = state.awaitingConfirm;
      state.awaitingConfirm = null;
      if (ac.resolve) ac.resolve(false);
    }
    banner.classList.remove("is-on");
    if (state.route) renderRouteCard(router.targets.get(state.to));
    renderFrom();
  }

  /** Shell CTA — user confirms they reached the next floor */
  function confirmFloor() {
    const ac = state.awaitingConfirm;
    if (ac) {
      state.confirmedLeg = ac.legIndex;
      state.awaitingConfirm = null;
      state.confirmQueued = false;
      if (ac.resolve) ac.resolve(true);
      return true;
    }
    /* CTA can beat play() arming the wait after a floor handoff */
    state.confirmQueued = true;
    return true;
  }

  function waitForFloorConfirm(token, legIndex, kind) {
    return new Promise((resolve) => {
      if (state.confirmedLeg === legIndex || state.confirmQueued) {
        state.confirmQueued = false;
        state.confirmedLeg = legIndex;
        resolve(true);
        return;
      }
      state.awaitingConfirm = {
        legIndex,
        toFloor: FLOOR,
        kind,
        token,
        resolve,
      };
      lastNavKey = "";
      publishNav(0, 0);
    });
  }

  let lastStepActive = -2;

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
    /* List chrome only when the active step changes — distance ticks every frame */
    if (active !== lastStepActive) {
      lastStepActive = active;
      document.querySelectorAll("#ulSteps li[data-step]").forEach((li) => {
        const i = Number(li.dataset.step);
        li.classList.toggle("is-active", i === active);
        li.classList.toggle("is-done", i < active);
      });
      const li = document.querySelector(`#ulSteps li[data-step="${active}"]`);
      if (li) li.scrollIntoView({ block: "nearest" });
    }
    publishNav(active >= 0 ? active : 0, walked);
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
    // ~half prior pace — demo walk was racing the card guidance
    const speed = reduceMotion ? total * 4 : clamp(total / 18, 70, 140); // map px per second
    const walked = walkedEls[legIndex];
    return new Promise((resolve) => {
      let t0 = null;
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
        /*
         * Publish every frame — publishNav dedupes on whole meters so the
         * shell distance counts down 1 m at a time (was ~6 m / 28px buckets).
         */
        stepProgress(legIndex, d);
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

    /*
     * Shell CTA / confirm retries — never stopPlaying() while waiting on this leg.
     * A stray play() used to cancel the wait and re-arm it, so the button looked dead.
     */
    if (state.awaitingConfirm && state.awaitingConfirm.legIndex === legIndex) {
      confirmFloor();
      return;
    }
    if (state.playing && !state.playing.cancel && state.playing.leg === legIndex) {
      return;
    }

    if (L.floor !== FLOOR) {
      if (isEmbed) {
        notifyShell({
          type: "floor-handoff",
          floor: L.floor,
          href: pageFor(L.floor, { leg: legIndex, play: 1 }),
          leg: legIndex,
          trip: tripPayload(),
        });
        return;
      }
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

    /*
     * Embed: pause for floor confirm AFTER arriving on this floor (leg > 0),
     * not at the stairs on the previous floor.
     * Skip if this leg was already confirmed (CTA / queued / prior play).
     */
    if (isEmbed && legIndex > 0 && state.confirmedLeg !== legIndex) {
      const prev = r.legs[legIndex - 1];
      const kind = (prev && prev.exit && prev.exit.kind) || "stairs";
      setMood("excited");
      setLook(null);
      const confirmed = await waitForFloorConfirm(token, legIndex, kind);
      if (!confirmed || token.cancel) return;
      state.confirmedLeg = legIndex;
      /* Drop the stair card and resume guidance before walking */
      lastNavKey = "";
      publishNav(0, 0);
    } else if (isEmbed && legIndex > 0 && state.confirmedLeg === legIndex) {
      lastNavKey = "";
      publishNav(0, 0);
    } else if (legIndex > 0) {
      const prev = r.legs[legIndex - 1];
      setMood("excited");
      showBanner(`${icon(prev.exit.kind, "#fff")}<span>You’re on the ${FLOORS[FLOOR].label} — follow the blue line</span>`, 2200);
    }

    await sleep(reduceMotion ? 50 : legIndex > 0 ? (isEmbed ? 280 : 700) : 450);
    if (token.cancel) return;
    setMood("walk");
    const done = await walkLeg(legIndex, token);
    if (!done || token.cancel) return;

    if (L.exit) {
      const up = FLOORS[L.exit.toFloor].level > FLOORS[FLOOR].level;
      setMood("excited");
      setLook(up ? -90 : 90);
      const nextHref = pageFor(L.exit.toFloor, { leg: legIndex + 1, play: 1 });
      const kind = L.exit.kind || "stairs";

      /* Embed: jump to next floor immediately — confirm waits on arrival there */
      if (isEmbed) {
        state.playing = null;
        notifyShell({
          type: "floor-handoff",
          floor: L.exit.toFloor,
          href: nextHref,
          leg: legIndex + 1,
          trip: tripPayload(),
        });
        return;
      }

      showBanner(
        `${icon(kind, "#fff")}<span>Take ${L.exit.name} ${up ? "up" : "down"} to the ${FLOORS[L.exit.toFloor].label}</span><button type="button" id="ulNext">I’m there</button>`
      );
      const go = () => {
        if (!token.cancel) location.assign(nextHref);
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
    /* Shell swaps nav card → Map-Success before we clear the trip */
    notifyShell({ type: "arrived", destination: t.name });
    state.to = null;
    persist();
    refreshRoute();
    renderFrom();
    setPin(end.x, end.y, pinHeading, null);
    setMood("happy", 6000);
    history.replaceState(null, "", `${FLOORS[FLOOR].page}?${embedQuery()}`);
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
  refreshRoute({ fit: false });
  persist();

  const resumeLeg = Number(urlTrip?.leg);
  const resumingPlay = !!(urlTrip?.play && state.route && Number.isFinite(resumeLeg));
  if (resumingPlay) {
    history.replaceState(null, "", `${FLOORS[FLOOR].page}?${embedQuery()}`);
    setTimeout(() => play(resumeLeg), 120);
  } else if (!state.route) {
    status("Search a room, or tap any room on the map.");
  }

  /*
   * Open on the wide cover view first, then animate in on the user.
   * Skip when a handoff restored vx/vy/vz or play is about to frame the leg.
   */
  const urlHasView = (() => {
    const vz = Number(new URLSearchParams(location.search).get("vz"));
    return Number.isFinite(vz) && vz > 0;
  })();
  if (isOffline) {
    /* No user location — stay on the wide cover view; open straight on a place if asked */
    const q = new URLSearchParams(location.search);
    const placeId = q.get("place");
    /* Already scanned a QR — keep the pin when stepping between floors */
    /* A later QR (not the first) puts the pin at that checkpoint instead */
    const spot = q.get("ff")
      ? { floor: q.get("ff"), x: Number(q.get("fx")), y: Number(q.get("fy")), label: "Checkpoint" }
      : null;
    if (q.get("located") === "1" && q.get("reveal") !== "1") {
      revealUser({ center: false, spot });
    }
    if (q.get("reveal") === "1") {
      setTimeout(
        () => revealUser({ center: true, to: q.get("go"), spot }),
        reduceMotion ? 0 : 320,
      );
    }
    if (placeId) {
      setTimeout(() => showPlace(placeId), reduceMotion ? 0 : isEmbed ? 320 : 0);
    }
  } else if (!resumingPlay && !urlHasView) {
    const focus = () => {
      if (
        centerOnUser({
          zoom: state.to ? 1.05 : 0.88,
          duration: reduceMotion ? 0 : state.to ? 720 : 920,
        })
      ) {
        return;
      }
      if (!state.to && activeSections().length) {
        fitPoints(
          activeSections().flatMap((sec) =>
            sec.poly.map(([x, y]) => ({ x, y })),
          ),
          60,
          { duration: 0 },
        );
      }
    };
    /* Motion off: settle on user with no wide→zoom beat */
    if (reduceMotion) focus();
    else setTimeout(focus, isEmbed ? 320 : 0);
  } else if (!resumingPlay && state.to && !isEmbed) {
    const here = legsHere();
    if (here.length) fitPoints(here.flatMap(({ L }) => L.points));
  }

  window.ulNav = {
    router,
    state,
    selectTarget,
    showPlace,
    clearPlace,
    revealUser,
    nextCheckpoint,
    setFrom,
    play,
    stopPlaying,
    clearTarget,
    confirmFloor,
    publishNav,
    centerOnUser,
    screenToMap,
    mapToScreen,
    setSection,
    setSectionIds,
    toggleSectionId,
    setLayer,
    focusPoi,
    getFilter: () => ({
      mode: state.filter.mode,
      id: state.filter.id,
      ids: [...(state.filter.ids || [])],
    }),
    getLayers: () => ({ ...state.layers }),
  };
})();
