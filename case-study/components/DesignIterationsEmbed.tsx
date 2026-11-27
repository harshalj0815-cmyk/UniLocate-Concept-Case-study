"use client";

import { useEffect, useRef, useState } from "react";
import {
  attachStickerCursor,
  hidePrototypeCursor,
  resyncCursor,
  setLastPoint,
} from "@/lib/frameCursor";

/**
 * Design iterations animation. The page inside the iframe reports its own
 * height, so the frame grows with its bento grid at any width. The tiles are
 * clickable, so the page's sticker cursor is handed to the frame while the
 * pointer is inside it (same handoff as the prototype).
 */
export function DesignIterationsEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1100);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { type?: string; height?: number } | null;
      if (data?.type === "ul-iter-height" && typeof data.height === "number") {
        setHeight(data.height);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  /* The iframe can finish loading before React hydrates, so onLoad alone can be missed */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    /* The frame's own height message can arrive before this listener exists, and the
       frame then keeps its 1100px default. Same-origin, so read the real height here too. */
    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const h = Math.ceil(doc.documentElement.scrollHeight);
      if (h > 0) setHeight(h);
    };
    const run = () => {
      attachStickerCursor(iframe);
      measure();
    };
    iframe.addEventListener("load", run);
    run();
    return () => iframe.removeEventListener("load", run);
  }, []);

  /* A pointer move on the page itself means the pointer is not in the frame */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setLastPoint({ x: e.clientX, y: e.clientY });
      hidePrototypeCursor(iframeRef.current);
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        resyncCursor(iframeRef.current);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Cursor handoffs between page and frame must be instant, not a 0.15s fade */
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
      className="section-visual__embed section-visual__embed--iterations"
      src="/design-iterations.html?v=4"
      title="Design iterations: every version tried, one component at a time"
      loading="lazy"
      scrolling="no"
      style={{ height }}
      onMouseEnter={(e) => {
        setLastPoint({ x: e.clientX, y: e.clientY });
        resyncCursor(iframeRef.current);
        setStickerCursor(false);
      }}
      onMouseLeave={(e) => {
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
