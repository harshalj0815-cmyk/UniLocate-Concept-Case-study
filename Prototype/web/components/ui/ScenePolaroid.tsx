"use client";

import { motion } from "motion/react";
import { useDemoReduceMotion } from "@/lib/demoMotion";
import type { ScenePolaroid as ScenePolaroidData } from "@/lib/scenePolaroids";
import { paperSquircleClip } from "@/lib/continuousCorner";

const EASE_MOVE = [0.77, 0, 0.175, 1] as const;
const SHELL_CLIP = paperSquircleClip(126, 140, 12);
const PHOTO_CLIP = paperSquircleClip(112, 112, 8);
const SHELL_STYLE = { clipPath: SHELL_CLIP, borderRadius: 0 } as const;
const PHOTO_STYLE = { clipPath: PHOTO_CLIP, borderRadius: 0 } as const;

type Props = {
  card: ScenePolaroidData;
  focused: boolean;
  /** Stagger index for first-open settle only — unused for scene moves */
  moveDuration?: number;
};

/** One polaroid that physically moves home ↔ focused (not a crossfade swap) */
export default function ScenePolaroid({
  card,
  focused,
  moveDuration = 0.28,
}: Props) {
  const reduce = useDemoReduceMotion();
  const pose = focused ? card.focus : card.home;
  const duration = reduce ? 0 : moveDuration;

  return (
    <motion.div
      className="polaroid polaroid--scene"
      initial={false}
      animate={{
        transform: `translate3d(${pose.left}px, ${pose.top}px, 0) rotate(${card.rotate}deg)`,
        opacity: focused ? 0.3 : 1,
      }}
      transition={{ duration, ease: EASE_MOVE }}
    >
      <motion.div
        className="polaroid__drag"
        drag={!focused && !reduce}
        dragSnapToOrigin
        dragElastic={0.7}
        dragTransition={{
          bounceStiffness: 380,
          bounceDamping: 18,
          power: 0.2,
        }}
        onDragStart={() => window.getSelection()?.removeAllRanges()}
        whileDrag={
          focused || reduce ? undefined : { zIndex: 8, cursor: "grabbing" }
        }
      >
        <div className="polaroid__shell" style={SHELL_STYLE}>
          <div className="polaroid__photo" style={PHOTO_STYLE}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.src}
              alt=""
              style={card.imageStyle}
              draggable={false}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
