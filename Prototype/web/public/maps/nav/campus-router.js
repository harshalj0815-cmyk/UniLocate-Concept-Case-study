/*
 * UniLocate multi-floor router.
 *
 * Builds one graph from the layered campus data:
 *   - path nodes per floor, joined by the authored corridor / outer-path chains
 *   - every door, lift/stair access point and the user's position snapped
 *     perpendicular onto the nearest segment of the same floor
 *   - lifts link all floors they serve; stairs link consecutive floors they open on
 * Shortest route = Dijkstra; output is split into one leg per floor.
 */
(function (root) {
  const WALK_SPEED = 1.25; // m/s
  const COST = {
    stairsPerFloor: 110, // px-equivalent of climbing one floor
    liftBase: 210, // waiting for the lift
    liftPerFloor: 35,
  };
  const PREF = {
    stairs: { stairs: 1, lift: 2.5 },
    lift: { stairs: 5, lift: 1 },
    "lift-only": { stairs: Infinity, lift: 1 },
  };
  const TURN_MIN_DEG = 35;

  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  function projectOnSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = ax + dx * t;
    const y = ay + dy * t;
    return { x, y, t, d: dist(px, py, x, y) };
  }

  function create(data) {
    const floorIds = data.floors.map((f) => f.id);
    const floorById = Object.fromEntries(data.floors.map((f) => [f.id, f]));
    const nodes = new Map(); // key -> {key, floor, x, y, label?}
    const adj = new Map(); // key -> [{to, w, kind, ref}]
    const segments = {}; // floor -> [{a, b, outer, unpaved}]

    const key = (floor, id) => `${floor}|${id}`;

    function addNode(k, floor, x, y, extra) {
      if (!nodes.has(k)) {
        nodes.set(k, { key: k, floor, x, y, ...extra });
        adj.set(k, []);
      }
      return nodes.get(k);
    }

    function addEdge(a, b, w, kind, ref) {
      adj.get(a).push({ to: b, w, kind, ref });
      adj.get(b).push({ to: a, w, kind, ref });
    }

    function addArc(a, b, w, kind, ref) {
      adj.get(a).push({ to: b, w, kind, ref });
    }

    const segProjections = new Map(); // segment -> projection keys snapped onto it

    function removeNode(k) {
      const n = nodes.get(k);
      if (n && n.seg) {
        const list = segProjections.get(n.seg);
        if (list) segProjections.set(n.seg, list.filter((x) => x !== k));
      }
      for (const e of adj.get(k) || []) {
        const back = adj.get(e.to);
        if (back) adj.set(e.to, back.filter((x) => x.to !== k));
      }
      adj.delete(k);
      nodes.delete(k);
    }

    // ── Path layers ────────────────────────────────────────
    for (const floor of floorIds) {
      const layer = data.paths[floor];
      segments[floor] = [];
      if (!layer) continue;
      for (const [id, [x, y]] of Object.entries(layer.nodes)) {
        addNode(key(floor, id), floor, x, y, { pathId: id });
      }
      const addChains = (chains, outer) => {
        for (const item of chains || []) {
          const chain = Array.isArray(item) ? item : item.chain;
          const unpaved = !Array.isArray(item) && !!item.unpaved;
          for (let i = 1; i < chain.length; i++) {
            const a = key(floor, chain[i - 1]);
            const b = key(floor, chain[i]);
            if (!nodes.has(a) || !nodes.has(b)) {
              throw new Error(`Unknown path node in ${floor}: ${chain[i - 1]} → ${chain[i]}`);
            }
            const A = nodes.get(a);
            const B = nodes.get(b);
            addEdge(a, b, dist(A.x, A.y, B.x, B.y), outer ? "outer" : "walk");
            segments[floor].push({ a, b, outer, unpaved });
          }
        }
      };
      addChains(layer.indoor, false);
      addChains(layer.outer, true);
    }

    function nearestSegment(floor, x, y) {
      let best = null;
      for (const s of segments[floor] || []) {
        const A = nodes.get(s.a);
        const B = nodes.get(s.b);
        const p = projectOnSegment(x, y, A.x, A.y, B.x, B.y);
        if (!best || p.d < best.p.d) best = { seg: s, p };
      }
      return best;
    }

    /** Snap a point onto the network: point node + projection node wired to the segment ends. */
    function attach(k, floor, x, y, extra) {
      const hit = nearestSegment(floor, x, y);
      if (!hit) return null;
      const { seg, p } = hit;
      const pk = `${k}~p`;
      addNode(k, floor, x, y, extra);
      addNode(pk, floor, p.x, p.y, { projection: true, seg });
      const A = nodes.get(seg.a);
      const B = nodes.get(seg.b);
      const kind = seg.outer ? "outer" : "walk";
      addEdge(pk, seg.a, dist(p.x, p.y, A.x, A.y), kind);
      addEdge(pk, seg.b, dist(p.x, p.y, B.x, B.y), kind);
      // Points on the same segment reach each other directly, not via a segment end and back.
      const siblings = segProjections.get(seg) || [];
      for (const other of siblings) {
        const O = nodes.get(other);
        addEdge(pk, other, dist(p.x, p.y, O.x, O.y), kind);
      }
      segProjections.set(seg, [...siblings, pk]);
      addEdge(k, pk, p.d, "connector");
      return { node: k, snap: p, gap: p.d };
    }

    // ── Searchable targets ────────────────────────────────
    const targets = new Map(); // id -> target
    const register = (t, layer) => {
      const target = { ...t, layer, doorKeys: [] };
      (t.doors || []).forEach(([x, y], i) => {
        const k = key(t.floor, `@${t.id}#${i}`);
        const a = attach(k, t.floor, x, y, { targetId: t.id });
        if (a) target.doorKeys.push(k);
      });
      targets.set(t.id, target);
    };
    (data.places || []).forEach((p) => register(p, "rooms"));
    (data.washrooms || []).forEach((w) => register({ ...w, type: "washroom" }, "washrooms"));
    (data.exits || []).forEach((e) => register({ ...e, type: "exit" }, "exits"));

    // ── Verticals (lifts + stairs) ─────────────────────────
    // access[floor] is either [x, y] (one opening used both ways) or
    // { out, in }: `out` = where you go in to leave this floor (plate arrow points away
    // from the corridor), `in` = where you come out on this floor (arrow points at it).
    const pointList = (p) => (!p ? [] : typeof p[0] === "number" ? [p] : p);
    for (const v of data.verticals || []) {
      const ends = {}; // floor -> { out: [keys], in: [keys], points: [[x, y]] }
      for (const f of floorIds) {
        const a = v.access[f];
        if (!a) continue;
        const end = { out: [], in: [], points: [] };
        const add = (p, suffix, roles) => {
          const k = key(f, `@${v.id}${suffix}`);
          if (!attach(k, f, p[0], p[1], { verticalId: v.id })) return;
          roles.forEach((r) => end[r].push(k));
          end.points.push(p);
        };
        if (Array.isArray(a)) add(a, "", ["out", "in"]);
        else {
          pointList(a.out).forEach((p, i) => add(p, `>${i}`, ["out"]));
          pointList(a.in).forEach((p, i) => add(p, `<${i}`, ["in"]));
        }
        if (end.points.length) ends[f] = end;
      }
      const lvl = (f) => floorById[f].level;
      const ordered = Object.keys(ends).sort((a, b) => lvl(a) - lvl(b));
      for (let i = 0; i < ordered.length; i++) {
        for (let j = i + 1; j < ordered.length; j++) {
          const floors = Math.abs(lvl(ordered[j]) - lvl(ordered[i]));
          const w = v.kind === "lift" ? COST.liftBase + COST.liftPerFloor * floors : COST.stairsPerFloor * floors;
          const A = ends[ordered[i]];
          const B = ends[ordered[j]];
          for (const a of A.out) for (const b of B.in) addArc(a, b, w, v.kind, v.id);
          for (const b of B.out) for (const a of A.in) addArc(b, a, w, v.kind, v.id);
        }
      }
      targets.set(v.id, {
        ...v,
        type: v.kind,
        layer: "verticals",
        floors: ordered,
        accessPoints: Object.fromEntries(ordered.map((f) => [f, ends[f].points])),
        doorKeys: [...new Set(ordered.flatMap((f) => [...ends[f].out, ...ends[f].in]))],
      });
    }

    const verticalById = Object.fromEntries((data.verticals || []).map((v) => [v.id, v]));

    // ── Dijkstra ───────────────────────────────────────────
    function edgeWeight(e, pref) {
      if (e.kind === "lift" || e.kind === "stairs") {
        const m = (PREF[pref] || PREF.stairs)[e.kind];
        return e.w * m;
      }
      return e.w;
    }

    function dijkstra(sourceKey, pref, goalKeys) {
      const distMap = new Map([[sourceKey, 0]]);
      const prev = new Map();
      const done = new Set();
      const heap = [[0, sourceKey]];
      const goals = goalKeys ? new Set(goalKeys) : null;
      const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          [heap[p], heap[i]] = [heap[i], heap[p]];
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = i * 2 + 1;
            const r = l + 1;
            let m = i;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === i) break;
            [heap[m], heap[i]] = [heap[i], heap[m]];
            i = m;
          }
        }
        return top;
      };
      while (heap.length) {
        const [d, k] = pop();
        if (done.has(k)) continue;
        done.add(k);
        if (goals && goals.has(k)) return { distMap, prev, reached: k };
        for (const e of adj.get(k) || []) {
          const w = edgeWeight(e, pref);
          if (!Number.isFinite(w)) continue;
          const nd = d + w;
          if (nd < (distMap.get(e.to) ?? Infinity)) {
            distMap.set(e.to, nd);
            prev.set(e.to, { from: k, edge: e });
            push([nd, e.to]);
          }
        }
      }
      return { distMap, prev, reached: null };
    }

    const START = "__start__";

    function withStart(start, fn) {
      const k = key(start.floor, START);
      removeNode(k);
      removeNode(`${k}~p`);
      const a = attach(k, start.floor, start.x, start.y, { start: true });
      try {
        return fn(k, a);
      } finally {
        removeNode(k);
        removeNode(`${k}~p`);
      }
    }

    // ── Route → legs + steps ───────────────────────────────
    function simplify(points) {
      const out = [];
      for (const p of points) {
        const last = out[out.length - 1];
        if (last && dist(last.x, last.y, p.x, p.y) < 0.5) continue;
        out.push(p);
      }
      for (let i = out.length - 2; i > 0; i--) {
        const a = out[i - 1];
        const b = out[i];
        const c = out[i + 1];
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
        if (Math.abs(cross) < 1.5 && dot >= 0) out.splice(i, 1);
      }
      return out;
    }

    function polylineLength(pts) {
      let L = 0;
      for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      return L;
    }

    /** Named things near a point on a floor — used to anchor turn instructions. */
    function landmarkNear(floor, x, y, exclude) {
      let best = null;
      for (const t of targets.values()) {
        if (t.id === exclude) continue;
        if (t.layer === "verticals") {
          for (const [ax, ay] of t.accessPoints[floor] || []) {
            const d = dist(ax, ay, x, y);
            if (d < 34 && (!best || d < best.d)) best = { d, name: t.name };
          }
          continue;
        }
        if (t.floor !== floor || t.type === "open") continue;
        for (const [dx, dy] of t.doors || []) {
          const d = dist(dx, dy, x, y);
          if (d < 30 && (!best || d < best.d)) best = { d, name: t.type === "washroom" ? "the washroom" : t.name };
        }
      }
      return best && best.name;
    }

    function turnWord(a, b, c) {
      const v1x = b.x - a.x;
      const v1y = b.y - a.y;
      const v2x = c.x - b.x;
      const v2y = c.y - b.y;
      const ang = (Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y) * 180) / Math.PI;
      if (Math.abs(ang) < TURN_MIN_DEG) return null;
      const side = ang > 0 ? "right" : "left"; // screen y points down
      if (Math.abs(ang) > 150) return "Turn around";
      return Math.abs(ang) < 60 ? `Bear ${side}` : `Turn ${side}`;
    }

    function sideOf(a, b, p) {
      const cross = (b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x);
      if (Math.abs(cross) < 1) return "ahead";
      return cross > 0 ? "on your right" : "on your left";
    }

    function compass(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (Math.abs(dx) > Math.abs(dy) * 1.6) return dx > 0 ? "east" : "west";
      if (Math.abs(dy) > Math.abs(dx) * 1.6) return dy > 0 ? "south" : "north";
      return `${dy > 0 ? "south" : "north"}-${dx > 0 ? "east" : "west"}`;
    }

    const mpp = data.metersPerPx || 0.22;
    const meters = (px) => Math.max(1, Math.round((px * mpp) / 5) * 5);

    function buildLegs(pathKeys, target) {
      const raw = pathKeys.map((k) => nodes.get(k));
      const legs = [];
      let cur = null;
      for (let i = 0; i < raw.length; i++) {
        const n = raw[i];
        if (!cur || cur.floor !== n.floor) {
          if (cur) {
            const via = adj.get(pathKeys[i - 1]).find((e) => e.to === pathKeys[i]);
            cur.exit = {
              kind: via.kind,
              verticalId: via.ref,
              name: verticalById[via.ref]?.name || via.kind,
              toFloor: n.floor,
            };
          }
          cur = { floor: n.floor, points: [] };
          legs.push(cur);
        }
        cur.points.push({ x: n.x, y: n.y });
      }
      // Pass-through floors (stairs continuing straight up) collapse into one transfer.
      for (let i = legs.length - 2; i > 0; i--) {
        const L = legs[i];
        if (L.points.length <= 1 && legs[i - 1].exit && L.exit && legs[i - 1].exit.verticalId === L.exit.verticalId) {
          legs[i - 1].exit.toFloor = L.exit.toFloor;
          legs.splice(i, 1);
        }
      }
      for (const L of legs) {
        L.points = simplify(L.points);
        L.px = polylineLength(L.points);
      }
      const last = legs[legs.length - 1];
      last.arrive = target ? { id: target.id, name: target.name } : null;
      return legs;
    }

    function floorLabel(id) {
      return floorById[id]?.label || id;
    }

    const CONNECTOR_MAX = 32; // px — the short hop between a door/shaft and its corridor

    function stepsFor(legs, target) {
      const steps = [];
      legs.forEach((L, li) => {
        const pts = L.points;
        const n = pts.length;
        const segLen = (i) => dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        // Ignore the snap-in from the start pin and the snap-out into the door/shaft.
        const head = li === 0 && n >= 3 && segLen(1) < CONNECTOR_MAX ? 1 : 0;
        const tail = n >= 3 && segLen(n - 1) < CONNECTOR_MAX ? 1 : 0;
        const legSteps = [];
        if (n >= 2) {
          let run = 0;
          let from = pts[head];
          for (let i = head + 1; i < n - tail; i++) {
            run += segLen(i);
            const last = i === n - 1 - tail;
            const turn = last ? null : turnWord(pts[i - 1], pts[i], pts[i + 1]);
            if (!turn && !last) continue;
            if (!legSteps.length) {
              const dir = compass(from, pts[i]);
              legSteps.push({
                icon: "walk",
                text: li === 0 ? `Head ${dir}` : `Leave ${legs[li - 1].exit.name} and head ${dir}`,
                meters: meters(run),
                floor: L.floor,
                leg: li,
                at: { x: pts[head].x, y: pts[head].y },
              });
            } else {
              legSteps[legSteps.length - 1].meters = meters(run);
            }
            if (turn) {
              let lm = landmarkNear(L.floor, pts[i].x, pts[i].y, target && target.id);
              if (li > 0 && lm === legs[li - 1].exit.name) lm = null;
              legSteps.push({
                icon: turn.includes("left") ? "left" : turn.includes("right") ? "right" : "back",
                text: lm ? `${turn} at ${lm}` : turn,
                meters: 0,
                floor: L.floor,
                leg: li,
                at: { x: pts[i].x, y: pts[i].y },
              });
              from = pts[i];
              run = 0;
            }
          }
        }
        // A short left-right (or right-left) wiggle is a corridor offset, not two real turns.
        for (let i = legSteps.length - 2; i >= 1; i--) {
          const a = legSteps[i];
          const b = legSteps[i + 1];
          if (!b) continue;
          const opposite =
            (a.icon === "left" && b.icon === "right") || (a.icon === "right" && b.icon === "left");
          if (opposite && a.meters <= 5 && a.text.startsWith("Bear") && b.text.startsWith("Bear")) {
            legSteps[i - 1].meters += a.meters + b.meters;
            legSteps.splice(i, 2);
          }
        }
        // Stepping out of a stairwell/lift straight into a turn reads as one instruction.
        if (li > 0 && legSteps.length > 1 && legSteps[0].meters <= 5 && /^(Turn|Bear)/.test(legSteps[1].text)) {
          const t = legSteps[1];
          t.text = `Leave ${legs[li - 1].exit.name} and ${t.text[0].toLowerCase()}${t.text.slice(1)}`;
          t.at = legSteps[0].at;
          legSteps.shift();
        }
        steps.push(...legSteps);
        if (L.exit) {
          const up = floorById[L.exit.toFloor].level > floorById[L.floor].level;
          steps.push({
            icon: L.exit.kind,
            text: `Take ${L.exit.name} ${up ? "up" : "down"} to ${floorLabel(L.exit.toFloor)}`,
            meters: 0,
            floor: L.floor,
            leg: li,
            at: pts[n - 1],
            transfer: true,
          });
        } else if (target) {
          const side = n >= 3 && tail ? sideOf(pts[n - 3], pts[n - 2], pts[n - 1]) : "ahead";
          steps.push({
            icon: "arrive",
            text: side === "ahead" ? `Arrive at ${target.name}` : `${target.name} is ${side}`,
            meters: 0,
            floor: L.floor,
            leg: li,
            at: pts[n - 1],
            arrive: true,
          });
        }
      });
      return steps;
    }

    function route(start, targetId, opts = {}) {
      const pref = opts.pref || "stairs";
      const target = targets.get(targetId);
      if (!target) return { error: `Unknown destination ${targetId}` };
      return withStart(start, (sk, snap) => {
        if (!snap) return { error: "You are not near any mapped path on this floor" };
        const { prev, distMap, reached } = dijkstra(sk, pref, target.doorKeys);
        if (!reached) return { error: `No route to ${target.name} with the current lift/stairs setting` };
        const keys = [reached];
        while (keys[0] !== sk) keys.unshift(prev.get(keys[0]).from);
        const legs = buildLegs(keys, target);
        const walkPx = legs.reduce((s, L) => s + L.px, 0);
        let seconds = (walkPx * mpp) / WALK_SPEED;
        for (const L of legs) {
          if (!L.exit) continue;
          const floors = Math.abs(floorById[L.exit.toFloor].level - floorById[L.floor].level);
          seconds += L.exit.kind === "lift" ? 40 + 6 * floors : 18 * floors;
        }
        return {
          target: { id: target.id, name: target.name, floor: target.floor, type: target.type },
          start: { ...start, snapGap: snap.gap },
          legs,
          steps: stepsFor(legs, target),
          cost: distMap.get(reached),
          meters: meters(walkPx),
          minutes: Math.max(1, Math.round(seconds / 60)),
        };
      });
    }

    /** Route cost from `start` to every target (for "nearest" ranking). */
    function costsFrom(start, opts = {}) {
      const pref = opts.pref || "stairs";
      return withStart(start, (sk, snap) => {
        const out = new Map();
        if (!snap) return out;
        const { distMap } = dijkstra(sk, pref, null);
        for (const t of targets.values()) {
          let best = Infinity;
          for (const k of t.doorKeys) best = Math.min(best, distMap.get(k) ?? Infinity);
          out.set(t.id, best);
        }
        return out;
      });
    }

    function snap(floor, x, y) {
      const hit = nearestSegment(floor, x, y);
      return hit ? { x: hit.p.x, y: hit.p.y, gap: hit.p.d } : null;
    }

    function segmentsFor(floor) {
      return (segments[floor] || []).map((s) => ({
        a: nodes.get(s.a),
        b: nodes.get(s.b),
        outer: s.outer,
        unpaved: s.unpaved,
      }));
    }

    /** Every door / access connector, for validation overlays. */
    function connectorsFor(floor) {
      const out = [];
      for (const [k, n] of nodes) {
        if (n.floor !== floor || n.projection || n.start || n.pathId) continue;
        const p = nodes.get(`${k}~p`);
        if (p) out.push({ key: k, from: { x: n.x, y: n.y }, to: { x: p.x, y: p.y }, gap: dist(n.x, n.y, p.x, p.y) });
      }
      return out;
    }

    return {
      data,
      floors: data.floors,
      floorLabel,
      targets,
      route,
      costsFrom,
      snap,
      segmentsFor,
      connectorsFor,
    };
  }

  const api = { create, COST, PREF };
  root.ULRouter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
