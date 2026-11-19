"use client";

import { useDemoReduceMotion } from "@/lib/demoMotion";

import { useCallback, useState } from "react";

type ScfLogoProps = {
  /** When false, skip entrance and allow tap bounce immediately */
  animate?: boolean;
};

export default function ScfLogo({ animate = true }: ScfLogoProps) {
  const reduce = useDemoReduceMotion();
  const [ready, setReady] = useState(!animate);
  const [tap, setTap] = useState(false);

  const onTap = useCallback(() => {
    if (reduce || !ready) return;
    setTap(false);
    requestAnimationFrame(() => setTap(true));
  }, [reduce, ready]);

  return (
    <button
      type="button"
      className={[
        "scf__icon",
        ready ? "scf__icon--ready" : "",
        tap ? "scf__icon--tap" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="UniLocate"
      onClick={onTap}
      onAnimationEnd={(e) => {
        if (e.animationName === "scf-logo-enter") setReady(true);
        if (e.animationName === "scf-logo-tap") setTap(false);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/Icon.svg" alt="" width={110} height={110} />
    </button>
  );
}
