/**
 * Runs the sticker cursor inside the prototype iframe (and the map / animation
 * frames nested in it), so the custom cursor follows the pointer over the whole
 * prototype instead of freezing at the iframe edge.
 *
 * Everything here is same-origin, so the cursor script is evaluated directly in
 * each frame's window.
 */

type Win = Window & typeof globalThis;

let scriptPromise: Promise<string> | null = null;

function loadCursorScript(): Promise<string> {
  if (!scriptPromise) {
    scriptPromise = fetch("/sticker-cursor.js")
      .then((r) => r.text())
      // Inside the prototype, keep the page layout as it is: no `body{position:relative}`.
      .then((t) => t.replace('"body{position:relative}" +', ""));
  }
  return scriptPromise;
}

/** How much a frame is scaled on screen (the phone is scaled down inside the prototype). */
function frameScale(win: Win): number {
  let k = 1;
  let w: Window | null = win;
  try {
    while (w && w !== w.parent) {
      const el = w.frameElement as HTMLElement | null;
      if (!el) break;
      const w0 = el.clientWidth;
      if (w0 > 0) k *= el.getBoundingClientRect().width / w0;
      w = w.parent;
    }
  } catch {
    /* cross-origin: leave scale as is */
  }
  return k > 0 ? k : 1;
}

function applyScale(win: Win, style: HTMLStyleElement) {
  const k = frameScale(win);
  style.textContent = `#sc{transition:none!important;transform-origin:4px 4px;scale:${(1 / k).toFixed(3)}}`;
}

/** Hide the sticker cursor in every frame above `win`, up to the page. */
function hideAncestorCursors(win: Win) {
  let w: Window = win;
  try {
    while (w.parent && w.parent !== w) {
      w = w.parent;
      const el = w.document.getElementById("sc");
      if (el) el.style.setProperty("opacity", "0", "important");
    }
  } catch {
    /* cross-origin: nothing to hide */
  }
}

const booted = new WeakSet<object>();

/** Nested frame: no cursor of its own; replay the pointer in the parent frame. */
function bootNested(win: Win, doc: Document) {
  const frame = win.frameElement as HTMLIFrameElement | null;
  const host = win.parent as Win;
  if (!frame) return;

  const style = doc.createElement("style");
  style.textContent = "html,html *{cursor:none!important}";
  doc.head.appendChild(style);

  const forward = (type: string, e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    try {
      const r = frame.getBoundingClientRect();
      const sx = frame.clientWidth ? r.width / frame.clientWidth : 1;
      const sy = frame.clientHeight ? r.height / frame.clientHeight : 1;
      const PE = (host as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent;
      host.dispatchEvent(
        new PE(type, {
          clientX: r.left + e.clientX * sx,
          clientY: r.top + e.clientY * sy,
          pointerType: e.pointerType,
          button: e.button,
          buttons: e.buttons,
        }),
      );
      if (type === "pointermove") hideAncestorCursors(host);
    } catch {
      /* parent not reachable */
    }
  };

  for (const type of ["pointermove", "pointerdown", "pointerup", "pointercancel"]) {
    win.addEventListener(type, (e) => forward(type, e as PointerEvent), {
      capture: true,
      passive: true,
    });
  }
}

/* Last pointer position in page (viewport) coordinates. The browser sends no
   pointer events while the page scrolls under a still pointer, so the cursor is
   re-placed from this on scroll. */
let lastPoint: { x: number; y: number } | null = null;

export function setLastPoint(p: { x: number; y: number } | null) {
  lastPoint = p;
}

function trackHostPointer(win: Win) {
  win.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      const f = win.frameElement as HTMLIFrameElement | null;
      if (!f) return;
      const r = f.getBoundingClientRect();
      const k = f.clientWidth ? r.width / f.clientWidth : 1;
      lastPoint = { x: r.left + e.clientX * k, y: r.top + e.clientY * k };
    },
    { capture: true, passive: true },
  );
  /* Pointer left the frame for outside the page: nothing to re-place on scroll */
  win.document.addEventListener("pointerout", (e) => {
    if (!e.relatedTarget) lastPoint = null;
  });
}

/** Call on page scroll: put the cursor back under the (still) pointer. */
export function resyncCursor(iframe: HTMLIFrameElement | null) {
  const p = lastPoint;
  const win = iframe?.contentWindow as Win | null | undefined;
  if (!p || !iframe || !win) return;
  try {
    const r = iframe.getBoundingClientRect();
    const inside = p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
    if (inside) {
      const k = iframe.clientWidth ? r.width / iframe.clientWidth : 1;
      const PE = (win as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent;
      win.dispatchEvent(
        new PE("pointermove", {
          clientX: (p.x - r.left) / k,
          clientY: (p.y - r.top) / k,
          pointerType: "mouse",
        }),
      );
      const top = document.getElementById("sc");
      if (top) top.style.setProperty("opacity", "0", "important");
    } else {
      hidePrototypeCursor(iframe);
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: p.x, clientY: p.y, pointerType: "mouse" }),
      );
    }
  } catch {
    /* frame not reachable */
  }
}

/** Hide the prototype's cursor (call when the pointer is back on the page). */
export function hidePrototypeCursor(iframe: HTMLIFrameElement | null) {
  try {
    const el = iframe?.contentDocument?.getElementById("sc");
    if (el) el.style.setProperty("opacity", "0", "important");
  } catch {
    /* cross-origin */
  }
}

function boot(win: Win) {
  let doc: Document;
  try {
    doc = win.document;
  } catch {
    return;
  }
  if (!doc || !doc.body || booted.has(doc)) return;
  if (win.location.href === "about:blank") return;
  booted.add(doc);

  /* The prototype frame (a direct child of the page) draws the one cursor.
     Frames nested inside it (the map screens) would draw theirs underneath the
     prototype's own controls, so they only pass the pointer up. */
  if (win.parent !== win.top) {
    bootNested(win, doc);
    watchFrames(win);
    return;
  }

  trackHostPointer(win);

  loadCursorScript()
    .then((code) => {
      (win as unknown as { eval: (s: string) => void }).eval(code);
      const style = doc.createElement("style");
      doc.head.appendChild(style);
      applyScale(win, style);
      doc.addEventListener("mouseenter", () => applyScale(win, style));
      win.addEventListener("resize", () => applyScale(win, style));

      /* Only one arrow may show. While the pointer is in this frame (or in a frame
         nested inside it), every outer frame's cursor is hidden. */
      doc.addEventListener("pointermove", () => hideAncestorCursors(win), { passive: true });
      /* Pointer left this document for the outer page: hide our own arrow. */
      doc.addEventListener("pointerout", (e) => {
        if (e.relatedTarget) return;
        const own = doc.getElementById("sc");
        if (own) own.style.opacity = "0";
      });
    })
    .catch(() => {});

  watchFrames(win);
}

function watchFrames(win: Win) {
  const doc = win.document;
  const attach = (frame: HTMLIFrameElement) => {
    const run = () => {
      try {
        if (frame.contentDocument?.readyState === "complete") {
          boot(frame.contentWindow as Win);
        }
      } catch {
        /* cross-origin */
      }
    };
    frame.addEventListener("load", run);
    run();
  };

  doc.querySelectorAll("iframe").forEach(attach);
  new win.MutationObserver((records) => {
    for (const rec of records) {
      rec.addedNodes.forEach((n) => {
        if (!(n instanceof win.Element)) return;
        if (n.tagName === "IFRAME") attach(n as HTMLIFrameElement);
        n.querySelectorAll?.("iframe").forEach(attach);
      });
    }
  }).observe(doc.body, { childList: true, subtree: true });
}

/** Call from the iframe's onLoad. */
export function attachStickerCursor(iframe: HTMLIFrameElement) {
  const win = iframe.contentWindow as Win | null;
  if (!win) return;
  try {
    if (win.document.readyState !== "complete") return;
  } catch {
    return;
  }
  boot(win);
}
