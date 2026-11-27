"use client";

import { useEffect, useRef } from "react";

/**
 * Prioritization bars. The animation runs once from its start, so this asks
 * the frame to replay each time it scrolls into view. The first visit counts
 * too, since the frame may load before the reader gets to it.
 */
export function BarsEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let wasOut = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio === 0) {
          wasOut = true;
          return;
        }
        if (entry.intersectionRatio >= 0.5 && wasOut) {
          wasOut = false;
          iframe.contentWindow?.postMessage(
            { type: "ul-restart" },
            window.location.origin,
          );
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(iframe);
    return () => io.disconnect();
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className="section-visual__embed section-visual__embed--bars"
      src="/prioritization-bars.html?v=6"
      title="Four bars rising and falling as priorities are traded off"
      loading="lazy"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
