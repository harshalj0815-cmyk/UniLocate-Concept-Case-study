/**
 * Prototype shell bridge — hide native map chrome when ?embed=1,
 * lock zoom-out so the map always covers the frame (no empty gutters),
 * clamp pan so the map can't leave the frame.
 *
 * Hooks into each floor page's local setZoom/render (wheel/drag use those
 * closures, not window.ulView.* — so we must set globals they call).
 */
(() => {
  const params = new URLSearchParams(location.search);
  /*
   * campus-map may replaceState and strip ?embed=1 before this file runs.
   * Still treat framed pages as embed so shell postMessage keeps working.
   */
  const framed = (() => {
    try {
      return window.parent != null && window.parent !== window;
    } catch (_) {
      return true;
    }
  })();
  if (params.get("embed") !== "1" && !framed) return;

  document.documentElement.classList.add("ul-embed");

  const MAP_W = 2184;
  const MAP_H = 2114;
  /** Cover the frame; pad > 1 blocks peeking white edges */
  const EMBED_COVER_PAD = 1.04;

  const css = document.createElement("style");
  css.textContent = `
    /* Native map chrome stays in the DOM for logic — never shown in the shell */
    html.ul-embed .controls,
    html.ul-embed .controls.ul-panel,
    html.ul-embed aside.controls,
    html.ul-embed .ul-banner {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      opacity: 0 !important;
      position: fixed !important;
      left: -9999px !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    html.ul-embed,
    html.ul-embed body {
      background: #ffffff !important;
    }
    html.ul-embed .viewport {
      width: 100% !important;
      height: 100% !important;
      background: #ffffff !important;
    }
    html.ul-embed .ul-hit:hover,
    html.ul-embed .ul-hit.is-peek,
    html.ul-embed .ul-hit:focus {
      fill: transparent !important;
      stroke: transparent !important;
      filter: none !important;
      opacity: 1 !important;
    }
    html.ul-embed .ul-hit {
      cursor: grab !important;
      transition: none !important;
    }
    /* Create Profile — pan/zoom ok; places not tappable */
    html.ul-embed.ul-lock-hits .ul-hit {
      pointer-events: none !important;
      cursor: inherit !important;
    }
  `;
  document.head.appendChild(css);

  function setHitsLocked(on) {
    document.documentElement.classList.toggle("ul-lock-hits", !!on);
  }

  /* Block place selection even if a hit somehow receives the event */
  document.addEventListener(
    "click",
    (e) => {
      if (!document.documentElement.classList.contains("ul-lock-hits")) return;
      if (e.target?.closest?.(".ul-hit")) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  function withEmbed(href) {
    const url = new URL(href, location.href);
    url.searchParams.set("embed", "1");
    return url.pathname + url.search;
  }

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!/floor-map\.html/i.test(href)) return;
      e.preventDefault();
      location.href = withEmbed(href);
    },
    true,
  );

  /** Farthest zoom-out: map must still cover the whole frame. */
  function minZoomCover(viewport) {
    const vw = Math.max(1, viewport.clientWidth);
    const vh = Math.max(1, viewport.clientHeight);
    return Math.max(vw / MAP_W, vh / MAP_H) * EMBED_COVER_PAD;
  }

  /**
   * Keep the map from leaving the frame.
   * Smaller than the viewport → locked to center.
   * Larger → edges cannot pull past the viewport.
   */
  function clampPan(state, viewport) {
    if (!state || !viewport) return;
    const zoom = Number(state.zoom) || 1;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const mw = MAP_W * zoom;
    const mh = MAP_H * zoom;

    if (mw <= vw + 0.5) {
      state.x = 0;
    } else {
      const maxX = (mw - vw) / 2;
      state.x = Math.min(maxX, Math.max(-maxX, state.x));
    }

    if (mh <= vh + 0.5) {
      state.y = 0;
    } else {
      const maxY = (mh - vh) / 2;
      state.y = Math.min(maxY, Math.max(-maxY, state.y));
    }
  }

  function installHooks(viewport) {
    window.ulEmbedZoomBounds = () => ({
      min: minZoomCover(viewport),
      max: 2,
    });

    window.ulEmbedBeforeRender = (state) => {
      const minZ = minZoomCover(viewport);
      if (Number(state.zoom) < minZ) state.zoom = minZ;
      if (Number(state.zoom) > 2) state.zoom = 2;
      clampPan(state, viewport);
    };
  }

  function applyRestoredView(view, viewport) {
    view.state.tilt = 0;
    view.state.rotate = 0;

    const vz = Number(params.get("vz"));
    if (Number.isFinite(vz) && vz > 0) {
      const vx = Number(params.get("vx"));
      const vy = Number(params.get("vy"));
      view.state.x = Number.isFinite(vx) ? vx : 0;
      view.state.y = Number.isFinite(vy) ? vy : 0;
      view.state.zoom = vz;
      view.render();
      return true; /* handoff restored — don't re-center */
    }
    view.state.x = 0;
    view.state.y = 0;
    view.state.zoom = minZoomCover(viewport);
    view.render();
    return false;
  }

  function patchView() {
    const view = window.ulView;
    if (!view || view.__ulEmbedPatched) return false;
    const viewport = document.getElementById("viewport");
    if (!viewport) return false;

    view.__ulEmbedPatched = true;
    installHooks(viewport);
    const restored = applyRestoredView(view, viewport);

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        installHooks(viewport);
        const minZ = minZoomCover(viewport);
        if (view.state.zoom < minZ) view.state.zoom = minZ;
        view.render();
      });
      ro.observe(viewport);
    }

    /*
     * Leave the wide cover view as the first frame.
     * campus-map animates centerOnUser after a short beat.
     */
    void restored;

    return true;
  }

  function boot() {
    if (patchView()) {
      ping();
      return;
    }
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      if (patchView() || n > 40) {
        window.clearInterval(t);
        ping();
      }
    }, 50);
  }

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.source !== "unilocate-shell") return;

    if (d.type === "zoom-by" && window.ulView?.setZoom) {
      const cur = Number(window.ulView.state?.zoom ?? 0.5);
      window.ulView.setZoom(cur + Number(d.delta || 0));
      return;
    }

    if (d.type === "set-view" && window.ulView?.state) {
      const view = window.ulView;
      if (Number.isFinite(Number(d.x))) view.state.x = Number(d.x);
      if (Number.isFinite(Number(d.y))) view.state.y = Number(d.y);
      if (Number.isFinite(Number(d.zoom)) && Number(d.zoom) > 0) {
        view.state.zoom = Number(d.zoom);
      }
      view.state.tilt = 0;
      view.state.rotate = 0;
      view.render();
      return;
    }

    if (d.type === "floor" && window.UL_CAMPUS?.floors) {
      const floor = window.UL_CAMPUS.floors.find((f) => f.id === d.floor);
      if (floor?.page) location.href = withEmbed(floor.page);
      return;
    }

    if (d.type === "search" && typeof d.query === "string") {
      const input = document.getElementById("ulQuery");
      if (!input) return;
      input.value = d.query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (d.submit) {
        input.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
        /* Route + steps publish after selectTarget — nudge sync for the shell card */
        window.setTimeout(() => window.ulNav?.publishNav?.(0), 60);
      }
      return;
    }

    /* Demo board — jump straight to a known place (e.g. O104) */
    if (d.type === "select" && d.id && window.ulNav?.selectTarget) {
      window.ulNav.selectTarget(String(d.id), { fit: d.fit !== false });
      window.setTimeout(() => window.ulNav?.publishNav?.(0), 60);
      return;
    }

    if (d.type === "nav-sync") {
      window.ulNav?.publishNav?.(0);
      return;
    }

    if (d.type === "play" && window.ulNav?.play) {
      window.ulNav.play(Number(d.leg) || 0);
      return;
    }

    if (d.type === "stop") {
      if (window.ulNav?.clearTarget) window.ulNav.clearTarget();
      else window.ulNav?.stopPlaying?.();
      return;
    }

    if (d.type === "confirm-floor") {
      const run = () => window.ulNav?.confirmFloor?.();
      if (!run()) {
        window.setTimeout(run, 80);
        window.setTimeout(run, 200);
        window.setTimeout(run, 450);
      }
      return;
    }

    /* Shell MapFilterPanel → campus section / layer / POI filters */
    if (d.type === "filter") {
      if (Array.isArray(d.ids)) {
        window.ulNav?.setSectionIds?.(d.ids.map(String));
      } else {
        const id = d.id == null || d.id === "" ? null : String(d.id);
        window.ulNav?.setSection?.(id);
      }
      return;
    }

    if (d.type === "layer" && d.id) {
      window.ulNav?.setLayer?.(String(d.id), d.on !== false);
      return;
    }

    if (d.type === "poi-focus" && d.kind) {
      window.ulNav?.focusPoi?.(String(d.kind), d.on !== false);
      return;
    }

    if (d.type === "lock-hits") {
      setHitsLocked(!!d.on);
      return;
    }
  });

  function ping() {
    try {
      parent.postMessage(
        {
          source: "unilocate-map",
          type: "ready",
          floor: document.body.dataset.floor || "ground",
        },
        "*",
      );
    } catch (_) {
      /* ignore */
    }
  }

  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
