"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import CollegeResultCard from "@/components/ui/CollegeResultCard";
import CollegeResultSkeleton from "@/components/ui/CollegeResultSkeleton";
import {
  COLLEGE_RESULTS,
  type CollegeResult,
} from "@/lib/collegeResults";

type Props = {
  className?: string;
  /** Show Paper skeleton cards while “fetching” */
  loading?: boolean;
  /** Title/back chrome — false while scrolling down, true while scrolling up */
  onHeaderVisible?: (visible: boolean) => void;
  onSelectCollege?: (college: CollegeResult) => void;
};

const SKELETON_COUNT = 3;
/** Gradient blur height under sticky search while scrolled */
const FADE_PX = 64;
/** Title/back: hide past this offset, show again only when closer to top */
const HEADER_HIDE_Y = -36;
const HEADER_SHOW_Y = -10;
const RUBBER = { bounceStiffness: 400, bounceDamping: 28, power: 0.28 } as const;
const RUBBER_SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;

/** Scrollable results stack — fade under search + drag with rubber band */
export default function CollegeResultsList({
  className = "",
  loading = false,
  onHeaderVisible,
  onSelectCollege,
}: Props) {
  const reduce = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const minYRef = useRef(0);
  const lastYRef = useRef(0);
  const headerVisibleRef = useRef(true);
  const onHeaderVisibleRef = useRef(onHeaderVisible);
  const y = useMotionValue(0);
  const [minY, setMinY] = useState(0);
  const [dragging, setDragging] = useState(false);

  onHeaderVisibleRef.current = onHeaderVisible;

  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const setHeaderVisible = useCallback((visible: boolean) => {
    if (headerVisibleRef.current === visible) return;
    headerVisibleRef.current = visible;
    onHeaderVisibleRef.current?.(visible);
  }, []);

  /**
   * Blur while cards are under the gate, and during bottom rubber-band.
   * Top elastic (pull past start) stays sharp — no blur.
   */
  const syncUnder = useCallback((value: number) => {
    const el = viewportRef.current;
    if (!el) return;
    if (loadingRef.current) {
      el.removeAttribute("data-under");
      return;
    }
    // Top overscroll — never blur
    if (value > 0) {
      el.removeAttribute("data-under");
      return;
    }
    const minY = minYRef.current;
    // Bottom elastic or scrolled under the gate
    const bottomElastic = minY < 0 && value < minY;
    el.toggleAttribute("data-under", bottomElastic || value < -1);
  }, []);

  useMotionValueEvent(y, "change", (value) => {
    syncUnder(value);
    lastYRef.current = value;

    /*
     * Position hysteresis — not scroll-direction.
     * Direction deltas flicker during drag/elastic and left title+back stuck on.
     */
    if (value >= HEADER_SHOW_Y) {
      setHeaderVisible(true);
    } else if (value <= HEADER_HIDE_Y) {
      setHeaderVisible(false);
    }
  });

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    // Skeleton is locked — no scroll range
    if (loadingRef.current) {
      minYRef.current = 0;
      setMinY(0);
      y.set(0);
      return;
    }
    const next = Math.min(0, viewport.clientHeight - content.scrollHeight);
    minYRef.current = next;
    setMinY(next);
    if (y.get() < next) y.set(next);
    if (y.get() > 0) y.set(0);
  }, [y]);

  useLayoutEffect(() => {
    y.set(0);
    lastYRef.current = 0;
    setDragging(false);
    setHeaderVisible(true);
    syncUnder(0);
    measure();
  }, [loading, measure, setHeaderVisible, syncUnder, y]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);
    ro.observe(content);
    return () => ro.disconnect();
  }, [loading, measure]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      if (loadingRef.current) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const lo = minYRef.current;
      const next = Math.min(0, Math.max(lo, y.get() - event.deltaY));
      y.set(next);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [y]);

  const settleIfNeeded = useCallback(() => {
    const lo = minYRef.current;
    const current = y.get();
    if (current > 0 || current < lo) {
      // Drop blur for the whole elastic settle, restore after it lands
      syncUnder(current);
      void animate(y, current > 0 ? 0 : lo, {
        ...(reduce ? { duration: 0.2 } : RUBBER_SPRING),
        onComplete: () => syncUnder(y.get()),
      });
    }
  }, [reduce, syncUnder, y]);

  const listClass = `cr-results ${loading ? "cr-results--loading" : "cr-results--ready"}`.trim();

  return (
    <div
      ref={viewportRef}
      className={`cr-scroll ${className}`.trim()}
      data-dragging={dragging ? "" : undefined}
      data-locked={loading ? "" : undefined}
      style={
        {
          "--cr-fade": `${FADE_PX}px`,
        } as CSSProperties
      }
    >
      {/* Fixed gate in the gap under search — on with first scroll; cards pass through */}
      <div className="cr-scroll-blur" aria-hidden>
        <div className="cr-scroll-blur__soft" />
        <div className="cr-scroll-blur__hard" />
      </div>

      <div className="cr-scroll__clip">
        <motion.div
          ref={contentRef}
          className={listClass}
          role={loading ? "status" : "list"}
          aria-live={loading ? "polite" : undefined}
          aria-label={loading ? "Loading colleges" : undefined}
          style={{ y }}
          drag={loading ? false : "y"}
          dragConstraints={{ top: minY, bottom: 0 }}
          dragElastic={loading || reduce ? 0 : 0.18}
          dragMomentum={!loading && !reduce}
          dragTransition={loading || reduce ? undefined : RUBBER}
          onDragStart={() => {
            if (loading) return;
            setDragging(true);
          }}
          onDragEnd={() => {
            setDragging(false);
            if (!loading) settleIfNeeded();
          }}
        >
          {loading
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <CollegeResultSkeleton key={`skel-${i}`} />
              ))
            : COLLEGE_RESULTS.map((result) => (
                <CollegeResultCard
                  key={result.id}
                  result={result}
                  onSelect={
                    onSelectCollege
                      ? () => onSelectCollege(result)
                      : undefined
                  }
                />
              ))}
        </motion.div>
      </div>
    </div>
  );
}
