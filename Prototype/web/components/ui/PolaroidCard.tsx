"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { useDemoReduceMotion } from "@/lib/demoMotion";
import { paperSquircleClip } from "@/lib/continuousCorner";

const SHELL_CLIP = paperSquircleClip(126, 140, 12);
const PHOTO_CLIP = paperSquircleClip(112, 112, 8);
const SHELL_STYLE = { clipPath: SHELL_CLIP, borderRadius: 0 } as const;
const PHOTO_STYLE = { clipPath: PHOTO_CLIP, borderRadius: 0 } as const;

export type PolaroidFrom = "left" | "right" | "top" | "bottom";

type PolaroidCardProps = {
  src: string;
  alt?: string;
  left: number;
  top: number;
  rotate: number;
  from: PolaroidFrom;
  enterIndex?: number;
  imageStyle?: CSSProperties;
  /** Slide-in entrance — off when returning to home */
  animate?: boolean;
  /** OnClick screen — faded, static, no drag */
  muted?: boolean;
};

const ENTER_OFFSET: Record<PolaroidFrom, { x: number; y: number }> = {
  left: { x: -72, y: 0 },
  right: { x: 72, y: 0 },
  top: { x: 0, y: -72 },
  bottom: { x: 0, y: 72 },
};

/** Extra tilt on the way in; settles to 0 on the drag layer (Paper angle is on the shell) */
function enterKick(from: PolaroidFrom): number {
  return from === "left" || from === "top" ? -20 : 20;
}

function PolaroidFace({
  src,
  alt,
  imageStyle,
}: {
  src: string;
  alt: string;
  imageStyle?: CSSProperties;
}) {
  return (
    <div className="polaroid__shell" style={SHELL_STYLE}>
      <div className="polaroid__photo" style={PHOTO_STYLE}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={imageStyle} draggable={false} />
      </div>
    </div>
  );
}

export default function PolaroidCard({
  src,
  alt = "",
  left,
  top,
  rotate,
  from,
  enterIndex = 0,
  imageStyle,
  animate = true,
  muted = false,
}: PolaroidCardProps) {
  const reduce = useDemoReduceMotion();
  const offset = ENTER_OFFSET[from];
  const kick = enterKick(from);
  const delay = 0.78 + enterIndex * 0.055;
  const skipEnter = muted || !animate || reduce;

  if (muted) {
    return (
      <div
        className="polaroid polaroid--muted"
        style={{ left, top, transform: `rotate(${rotate}deg)` }}
      >
        <div className="polaroid__drag">
          <PolaroidFace src={src} alt={alt} imageStyle={imageStyle} />
        </div>
      </div>
    );
  }

  return (
    /* Shell keeps Paper angle as a static CSS rotate — avoids soft GPU bitmaps */
    <div
      className="polaroid"
      style={{ left, top, transform: `rotate(${rotate}deg)` }}
    >
      <motion.div
        className="polaroid__drag"
        initial={
          skipEnter
            ? { opacity: 1, x: 0, y: 0, rotate: 0 }
            : {
                opacity: 0,
                x: offset.x,
                y: offset.y,
                rotate: kick,
              }
        }
        animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
        transition={
          skipEnter
            ? { duration: 0 }
            : {
                delay,
                duration: 0.32,
                ease: [0.23, 1, 0.32, 1],
              }
        }
        drag={!reduce}
        dragSnapToOrigin
        dragElastic={0.7}
        dragTransition={{
          bounceStiffness: 380,
          bounceDamping: 18,
          power: 0.2,
        }}
        onDragStart={() => window.getSelection()?.removeAllRanges()}
        whileDrag={reduce ? undefined : { zIndex: 8, cursor: "grabbing" }}
      >
        <PolaroidFace src={src} alt={alt} imageStyle={imageStyle} />
      </motion.div>
    </div>
  );
}
