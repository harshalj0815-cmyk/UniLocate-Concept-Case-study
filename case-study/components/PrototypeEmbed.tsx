"use client";

import { useEffect, useRef } from "react";
import {
  attachStickerCursor,
  hidePrototypeCursor,
  resyncCursor,
  setLastPoint,
} from "@/lib/frameCursor";
import {
  PROTOTYPE_FONT_CSS,
  PROTOTYPE_SRC,
  PROTOTYPE_WARM_URLS,
} from "@/lib/prototype";

/** Pull the latin woff2 file out of a Google Fonts stylesheet. */
function latinFontFiles(css: string): string[] {
  const files: string[] = [];
  for (const block of css.split(/\/\*\s*/)) {
    if (!block.startsWith("latin ") && !block.startsWith("latin*")) continue;
    for (const m of block.matchAll(/url\((https:[^)]+\.woff2)\)/g)) {
      files.push(m[1]);
    }
  }
  return files;
}

/** Warm the HTTP cache so the map screens do not open on a blank, loading frame. */
function warmPrototypeAssets() {
  for (const url of PROTOTYPE_WARM_URLS) {
    fetch(url).catch(() => {});
  }
  for (const href of PROTOTYPE_FONT_CSS) {
    fetch(href)
      .then((r) => r.text())
      .then((css) => {
        for (const file of latinFontFiles(css)) {
          fetch(file, { mode: "cors" }).catch(() => {});
        }
      })
      .catch(() => {});
  }
}

/**
 * Interactive prototype with its own stepper + stage controls.
 * The page's sticker cursor freezes over an iframe, so it is hidden while the
 * pointer is inside and the same cursor runs inside the prototype instead.
 */
export function PrototypeEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* The iframe can finish loading before React hydrates, so onLoad alone can be missed */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const run = () => attachStickerCursor(iframe);
    iframe.addEventListener("load", run);
    run();
    return () => iframe.removeEventListener("load", run);
  }, []);

  /* A pointer move on the page itself means the pointer is not in the prototype */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setLastPoint({ x: e.clientX, y: e.clientY });
      hidePrototypeCursor(iframeRef.current);
    };
    const onLeave = () => setLastPoint(null);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    /* Scrolling moves the page under a still pointer: re-place the cursor */
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        resyncCursor(iframeRef.current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const idle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 1200);
    const handle = idle(warmPrototypeAssets);
    return () => {
      if ("cancelIdleCallback" in window && typeof handle === "number") {
        window.cancelIdleCallback(handle);
      }
    };
  }, []);

  /* Cursor handoffs between page and prototype must be instant, not a 0.15s fade */
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "#sc{transition:none!important}";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const setStickerCursor = (visible: boolean) => {
    const el = document.getElementById("sc");
    if (!el) return;
    if (visible) el.style.removeProperty("opacity");
    else el.style.setProperty("opacity", "0", "important");
  };

  return (
    <iframe
      ref={iframeRef}
      className="section-visual__embed section-visual__embed--prototype"
      src={PROTOTYPE_SRC}
      title="UniLocate interactive prototype with screen and state controls"
      loading="lazy"
      onMouseEnter={(e) => {
        /* Hand the cursor to the prototype at the exact crossing point */
        setLastPoint({ x: e.clientX, y: e.clientY });
        resyncCursor(iframeRef.current);
        setStickerCursor(false);
      }}
      onMouseLeave={(e) => {
        /* ...and back to the page's cursor, with no gap and no fade-out */
        setLastPoint({ x: e.clientX, y: e.clientY });
        hidePrototypeCursor(iframeRef.current);
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerType: "mouse",
          }),
        );
      }}
    />
  );
}
