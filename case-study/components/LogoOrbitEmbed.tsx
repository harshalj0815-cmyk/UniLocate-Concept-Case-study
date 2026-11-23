"use client";

import { useEffect, useRef } from "react";

const PLAY = "orbit-play";
const PAUSE = "orbit-pause";

export function LogoOrbitEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const send = (type: string) => {
      try {
        iframe.contentWindow?.postMessage({ type }, window.location.origin);
      } catch {
        /* ignore cross-origin / not ready */
      }
    };

    const sync = () => send(visibleRef.current ? PLAY : PAUSE);

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.2, rootMargin: "0px" },
    );
    io.observe(iframe);

    const onLoad = () => sync();
    iframe.addEventListener("load", onLoad);

    return () => {
      io.disconnect();
      iframe.removeEventListener("load", onLoad);
      send(PAUSE);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className="section-visual__embed"
      src="/logo-orbit-animation.html?v=orbit-logo-bw"
      title="UniLocate logo with orbiting location stickers"
      loading="lazy"
    />
  );
}
