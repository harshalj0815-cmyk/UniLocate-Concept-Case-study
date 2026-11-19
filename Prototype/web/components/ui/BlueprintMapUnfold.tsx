"use client";

import { useEffect, useRef } from "react";
import { useDemoReduceMotion } from "@/lib/demoMotion";

const KS = [-1, 2, -2, 2, -2] as const;
const STOPS = [
  { o: 0, a: 86, t: 1, e: "out" as const },
  { o: 0.38, a: 12, t: 0.1, e: "inout" as const },
  { o: 0.58, a: 46, t: 0.2, e: "inout" as const },
  { o: 0.74, a: 26, t: 0.05, e: "inout" as const },
  { o: 0.88, a: 37, t: 0.02, e: "inout" as const },
  { o: 1, a: 34, t: 0, e: "lin" as const },
];
const DUR = 1200;
const DELAY = 350;
/** Rise + unfold settle — chrome (copy / CTA) waits for this */
export const BLUEPRINT_UNFOLD_MS = DELAY + DUR;
const EASE_CSS = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inout: "cubic-bezier(0.77, 0, 0.175, 1)",
  lin: "linear",
} as const;

function bezier(x1: number, y1: number, x2: number, y2: number) {
  return (t: number) => {
    if (t <= 0 || t >= 1) return t;
    let lo = 0;
    let hi = 1;
    let s = 0.5;
    for (let i = 0; i < 28; i++) {
      s = (lo + hi) / 2;
      const x =
        3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
      if (x < t) lo = s;
      else hi = s;
    }
    return (
      3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s
    );
  };
}

const FN = {
  out: bezier(0.23, 1, 0.32, 1),
  inout: bezier(0.77, 0, 0.175, 1),
  lin: (t: number) => t,
};

function sampleFrames() {
  const out: { o: number; a: number }[] = [];
  for (let j = 0; j < STOPS.length - 1; j++) {
    const A = STOPS[j];
    const B = STOPS[j + 1];
    const n = A.a === B.a ? 1 : 14;
    for (let k = 0; k < n; k++) {
      const u = k / n;
      out.push({
        o: A.o + (B.o - A.o) * u,
        a: A.a + (B.a - A.a) * FN[A.e](u),
      });
    }
  }
  const L = STOPS[STOPS.length - 1];
  out.push({ o: L.o, a: L.a });
  return out;
}

type BlueprintMapUnfoldProps = {
  className?: string;
  /** Bump to replay */
  playKey?: number | string;
  /** Fires when unfold settles (immediate when motion off) */
  onComplete?: () => void;
};

/** Paper “College not mapped” — isometric blueprint unfold */
export default function BlueprintMapUnfold({
  className = "",
  playKey = 0,
  onComplete,
}: BlueprintMapUnfoldProps) {
  const reduce = useDemoReduceMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const stage = stageRef.current;
    const map = mapRef.current;
    if (!stage || !map) return;

    map.replaceChildren();
    const panels: HTMLDivElement[] = [];
    const shades: HTMLDivElement[] = [];
    let host: HTMLElement = map;
    let doneTimer: number | null = null;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      onCompleteRef.current?.();
    };

    for (let i = 0; i < 5; i++) {
      const p = document.createElement("div");
      p.className =
        "ul-blueprint__p " +
        (i % 2 ? "ul-blueprint__p--o" : "ul-blueprint__p--e") +
        (i === 0 ? " ul-blueprint__p--f" : "") +
        (i === 4 ? " ul-blueprint__p--l" : "");
      p.style.setProperty("--k", String(KS[i]));
      const face = document.createElement("div");
      face.className = "ul-blueprint__face";
      if (i % 2) {
        const shade = document.createElement("div");
        shade.className = "ul-blueprint__shade";
        face.appendChild(shade);
        shades.push(shade);
      }
      p.appendChild(face);
      host.appendChild(p);
      panels.push(p);
      host = p;
    }

    const anims: Animation[] = [];
    const play = () => {
      anims.forEach((a) => a.cancel());
      anims.length = 0;
      stage.classList.toggle("ul-blueprint--reduce", reduce);
      stage.classList.remove("ul-blueprint--play");
      void stage.offsetWidth;
      stage.classList.add("ul-blueprint--play");

      if (reduce || !panels[0]?.animate) {
        finish();
        return;
      }

      const W = panels[0].offsetWidth;
      const frames = sampleFrames();
      const opt: KeyframeAnimationOptions = {
        duration: DUR,
        delay: DELAY,
        fill: "both",
        easing: "linear",
      };
      panels.forEach((p, i) => {
        anims.push(
          p.animate(
            frames.map((f) => ({
              offset: f.o,
              transform: `rotateY(${KS[i] * f.a}deg)`,
            })),
            opt,
          ),
        );
      });
      anims.push(
        map.animate(
          frames.map((f) => ({
            offset: f.o,
            transform: `translateX(${-2.5 * W * Math.cos((f.a * Math.PI) / 180)}px)`,
          })),
          opt,
        ),
      );
      shades.forEach((sh) => {
        anims.push(
          sh.animate(
            STOPS.map((s) => ({
              offset: s.o,
              opacity: s.t,
              easing: EASE_CSS[s.e],
            })),
            opt,
          ),
        );
      });

      doneTimer = window.setTimeout(finish, BLUEPRINT_UNFOLD_MS);
    };

    /* Next frame — layout settled before WAAPI measures panel width */
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(play);
    });
    return () => {
      cancelAnimationFrame(id);
      if (doneTimer != null) window.clearTimeout(doneTimer);
      anims.forEach((a) => a.cancel());
    };
  }, [playKey, reduce]);

  return (
    <div
      ref={stageRef}
      className={`ul-blueprint ${className}`.trim()}
      role="img"
      aria-label="Blueprint map unfolding"
    >
      <div className="ul-blueprint__cast">
        <div className="ul-blueprint__float">
          <div className="ul-blueprint__rise">
            <div className="ul-blueprint__persp">
              <div className="ul-blueprint__scene">
                <div ref={mapRef} className="ul-blueprint__map" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
