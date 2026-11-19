"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { paperSquirclePath } from "@/lib/continuousCorner";

/** Live SVG path for a fixed-width, variable-height squircle shell. */
export function useSquirclePath<T extends HTMLElement = HTMLElement>(
  width: number,
  cornerRadius: number,
  /** Seed height so the first paint matches layout (avoids enter jump). */
  initialHeight = width,
): { ref: RefObject<T | null>; path: string; height: number } {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(initialHeight);
  const [path, setPath] = useState(() =>
    paperSquirclePath(width, initialHeight, cornerRadius),
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      const h = Math.max(1, Math.round(el.offsetHeight));
      setHeight(h);
      setPath(paperSquirclePath(width, h, cornerRadius));
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cornerRadius, width]);

  return { ref, path, height };
}
