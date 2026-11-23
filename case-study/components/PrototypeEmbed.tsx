"use client";

import { useRef } from "react";
import { PROTOTYPE_SRC } from "@/lib/prototype";

/**
 * Interactive prototype with its own stepper + stage controls.
 * The sticker cursor lives in this page, so it freezes over an iframe;
 * hide it while the pointer is inside and let the prototype use the normal cursor.
 */
export function PrototypeEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      onMouseEnter={() => setStickerCursor(false)}
      onMouseLeave={() => setStickerCursor(true)}
    />
  );
}
