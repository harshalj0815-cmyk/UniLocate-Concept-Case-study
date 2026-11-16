"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { paperSquircleClip } from "@/lib/continuousCorner";

/** Live clip-path squircle from measured box size (Paper / iOS continuous corner). */
export function useSquircleClip<T extends HTMLElement = HTMLElement>(
  cornerRadius: number,
): { ref: RefObject<T | null>; style: CSSProperties } {
  const ref = useRef<T | null>(null);
  const [clipPath, setClipPath] = useState<string | undefined>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (w < 1 || h < 1) return;
      setClipPath(paperSquircleClip(w, h, cornerRadius));
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cornerRadius]);

  return {
    ref,
    style: clipPath ? { clipPath, borderRadius: 0 } : {},
  };
}
