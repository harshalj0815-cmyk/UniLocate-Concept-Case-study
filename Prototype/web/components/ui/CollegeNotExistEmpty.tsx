"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useDemoReduceMotion } from "@/lib/demoMotion";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
/** If the animation never reports in, still reveal the copy + CTA */
const FALLBACK_MS = 4200;

type CollegeNotExistEmptyProps = {
  className?: string;
  /** Bump to replay (remounts the animation) */
  playKey?: number | string;
  /** Label + parent CTA show after the buildings settle */
  copyReady?: boolean;
  onUnfoldComplete?: () => void;
};

/** Not-exist empty — isometric map + buildings, caption blur-fades in after */
export default function CollegeNotExistEmpty({
  className = "",
  playKey = 0,
  copyReady = false,
  onUnfoldComplete,
}: CollegeNotExistEmptyProps) {
  const reduce = useDemoReduceMotion();
  const onCompleteRef = useRef(onUnfoldComplete);
  onCompleteRef.current = onUnfoldComplete;

  /* The embedded animation posts a message when the buildings have settled */
  useEffect(() => {
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      onCompleteRef.current?.();
    };
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; name?: string } | null;
      if (d?.type === "ul-anim-done" && d.name === "isometric-map") fire();
    };
    window.addEventListener("message", onMessage);
    const t = window.setTimeout(fire, reduce ? 900 : FALLBACK_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(t);
    };
  }, [playKey, reduce]);

  const chromeInTx = reduce
    ? { duration: 0 }
    : { duration: 0.48, ease: EASE_OUT };

  return (
    <div
      className={`sco-empty sco-empty--settled sco-empty--iso ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="sco-empty__cluster">
        <iframe
          key={`iso-${playKey}-${reduce ? "0" : "1"}`}
          className="sco-empty__iso"
          title=""
          src={`/animations/isometric-map-buildings.html?embed=1&v=3&reduce=${reduce ? "1" : "0"}`}
          tabIndex={-1}
          aria-hidden
          scrolling="no"
        />
        <motion.p
          className="sco-empty__label"
          initial={false}
          animate={
            copyReady
              ? {
                  opacity: 1,
                  transform: "translate3d(0, 0, 0)",
                  filter: "blur(0px)",
                }
              : {
                  opacity: 0,
                  transform: "translate3d(0, 10px, 0)",
                  filter: reduce ? "blur(0px)" : "blur(10px)",
                }
          }
          transition={chromeInTx}
        >
          College doesn’t exist
        </motion.p>
      </div>
    </div>
  );
}
