"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

const MAX_ANGLE = 36;

type HangingLogoProps = {
  className?: string;
};

/**
 * Shared UniLocate mark on a rope.
 * Drag sideways to swing; hinged at the rope apex so logo stays stuck.
 */
export default function HangingLogo({ className = "" }: HangingLogoProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const [angle, setAngle] = useState(0);

  const stopSpring = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const settle = useCallback(() => {
    stopSpring();
    const tick = () => {
      const stiffness = 0.12;
      const damping = 0.86;
      velocityRef.current =
        (velocityRef.current - angleRef.current * stiffness) * damping;
      angleRef.current += velocityRef.current;
      if (
        Math.abs(angleRef.current) < 0.15 &&
        Math.abs(velocityRef.current) < 0.15
      ) {
        angleRef.current = 0;
        velocityRef.current = 0;
        setAngle(0);
        rafRef.current = 0;
        return;
      }
      setAngle(angleRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopSpring]);

  const angleFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = rootRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const pivotX = rect.left + rect.width / 2;
    const pivotY = rect.top + 2;
    const dx = clientX - pivotX;
    const dy = Math.max(clientY - pivotY, 8);
    // Negate so drag right swings the badge right (CSS rotate is clockwise)
    const deg = (-Math.atan2(dx, dy) * 180) / Math.PI;
    return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, deg));
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      draggingRef.current = true;
      stopSpring();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* window move/up still drive swing */
      }
      const next = angleFromPointer(e.clientX, e.clientY);
      angleRef.current = next;
      velocityRef.current = 0;
      setAngle(next);
      e.preventDefault();
    },
    [angleFromPointer, stopSpring],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!draggingRef.current) return;
      const next = angleFromPointer(e.clientX, e.clientY);
      velocityRef.current = next - angleRef.current;
      angleRef.current = next;
      setAngle(next);
    },
    [angleFromPointer],
  );

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    settle();
  }, [settle]);

  useEffect(() => () => stopSpring(), [stopSpring]);

  return (
    <button
      type="button"
      ref={rootRef}
      className={`su-hang ${className}`.trim()}
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: "50% 2px",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="UniLocate logo"
      data-angle={angle.toFixed(1)}
    >
      <svg
        className="su-hang__rope"
        viewBox="0 0 28 46"
        width={28}
        height={46}
        aria-hidden
      >
        <path
          d="M0.5 45.5C0.5 45.5 13.06 3.2 13.06 3.2C13.18 2.79 13.57 2.49 14.01 2.49C14.45 2.49 14.85 2.78 14.97 3.2C14.97 3.2 27.5 45.5 27.5 45.5"
          fill="none"
          stroke="#306A1E"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="su-hang__icon"
        src={UL_ASSETS.appIcon}
        alt=""
        width={110}
        height={110}
        draggable={false}
      />
    </button>
  );
}
