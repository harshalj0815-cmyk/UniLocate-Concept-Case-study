"use client";

import { motion } from "motion/react";
import BlueprintMapUnfold from "@/components/ui/BlueprintMapUnfold";
import { useDemoReduceMotion } from "@/lib/demoMotion";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type CollegeNotMappedEmptyProps = {
  className?: string;
  playKey?: number | string;
  /** Label + parent CTA show after unfold */
  copyReady?: boolean;
  onUnfoldComplete?: () => void;
};

/** Settled empty — map unfolds first; caption blur-fades after (success-footer timing) */
export default function CollegeNotMappedEmpty({
  className = "",
  playKey = 0,
  copyReady = false,
  onUnfoldComplete,
}: CollegeNotMappedEmptyProps) {
  const reduce = useDemoReduceMotion();
  /** Same settle as map-success hint/CTA after the burst */
  const chromeInTx = reduce
    ? { duration: 0 }
    : { duration: 0.48, ease: EASE_OUT };

  return (
    <div
      className={`sco-empty sco-empty--settled ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="sco-empty__cluster">
        <BlueprintMapUnfold
          className="sco-empty__map"
          playKey={playKey}
          onComplete={onUnfoldComplete}
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
          Sorry, College not mapped yet
        </motion.p>
      </div>
    </div>
  );
}
