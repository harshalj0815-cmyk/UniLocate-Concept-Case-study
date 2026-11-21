"use client";

import { useEffect, useId, useRef } from "react";

export type SurveySlice = {
  k: string;
  n: number;
  c: string;
  t: string;
};

type SliceMath = SurveySlice & {
  a1: number;
  a2: number;
  mid: number;
  rank: number;
};

type IsometricSurveyChartProps = {
  title: string;
  data: SurveySlice[];
};

const CX = 350;
const CY = 245;
const A = 208;
const B = 120;
const H = 34;
/* Room above pie for outer callout labels; below for soft shadow */
const VB_Y = 0;
const VB_H = 440;
const TAU = Math.PI * 2;
const EDGE = "#FFFFFF";

function pct(n: number, total: number) {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function rankLabel(rank: number, len: number) {
  if (rank === 0) return "Most common answer";
  if (rank === len - 1) return "Least common answer";
  if (rank === 1) return "Second most common answer";
  if (rank === 2) return "Third most common answer";
  return `Rank ${rank + 1}`;
}

export function IsometricSurveyChart({
  title,
  data: rawData,
}: IsometricSurveyChartProps) {
  const uid = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const hovRef = useRef<number | null>(null);
  const selRef = useRef<number | null>(null);

  useEffect(() => {
    const TOTAL = rawData.reduce((s, d) => s + d.n, 0);
    let acc = 0;
    const data: SliceMath[] = rawData.map((d) => {
      const a1 = acc;
      acc += (TAU * d.n) / TOTAL;
      return { ...d, a1, a2: acc, mid: (a1 + acc) / 2, rank: 0 };
    });
    const ranked = data.slice().sort((a, b) => b.n - a.n);
    data.forEach((d) => {
      d.rank = ranked.indexOf(d);
    });

    const svg = svgRef.current;
    const stage = stageRef.current;
    const tip = tipRef.current;
    if (!svg || !stage || !tip) return;

    const pt = (phi: number, r: number, z: number): [number, number] => [
      CX + r * A * Math.cos(phi),
      CY + r * B * Math.sin(phi) - z,
    ];
    const str = (a: [number, number][]) =>
      a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const arc = (p1: number, p2: number, r: number, z: number) => {
      const n = Math.max(2, Math.ceil((p2 - p1) / (Math.PI / 45)));
      const a: [number, number][] = [];
      for (let i = 0; i <= n; i++) a.push(pt(p1 + (p2 - p1) * (i / n), r, z));
      return a;
    };
    const mix = (hex: string, t: number, amt: number) => {
      const n = parseInt(hex.slice(1), 16);
      const r = n >> 16;
      const g = (n >> 8) & 255;
      const b = n & 255;
      const f = (v: number) => Math.round(v + (t - v) * amt);
      return `rgb(${f(r)},${f(g)},${f(b)})`;
    };
    const poly = (a: [number, number][], fill: string, w: number) =>
      `<polygon points="${str(a)}" fill="${fill}" stroke="${EDGE}" stroke-width="${w}" stroke-linejoin="round"/>`;

    const wallPoly = (d: SliceMath, h: number) => {
      const lo = Math.max(d.a1, 0);
      const hi = Math.min(d.a2, Math.PI);
      if (hi <= lo) return null;
      return arc(lo, hi, 1, h).concat(arc(lo, hi, 1, 0).reverse());
    };

    const slice = (d: SliceMath, i: number, h: number, t: number) => {
      const dx = Math.cos(d.mid) * A * 0.09;
      const dy = Math.sin(d.mid) * B * 0.09 - 10;
      let s = `<g class="iso-slice" data-s="${i}" style="--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px">`;
      const wp = wallPoly(d, h);
      if (wp) s += poly(wp, mix(d.c, 0, 0.28), 1.5);
      if (Math.cos(d.a1) < 0)
        s += poly(
          [pt(d.a1, 0, h), pt(d.a1, 1, h), pt(d.a1, 1, 0), pt(d.a1, 0, 0)],
          mix(d.c, 0, 0.4),
          1.5,
        );
      if (Math.cos(d.a2) > 0)
        s += poly(
          [pt(d.a2, 0, h), pt(d.a2, 1, h), pt(d.a2, 1, 0), pt(d.a2, 0, 0)],
          mix(d.c, 0, 0.2),
          1.5,
        );
      s += poly([pt(0, 0, h)].concat(arc(d.a1, d.a2, 1, h)), d.c, 2);
      if (d.n / TOTAL >= 0.2) {
        const p = pt(d.mid, 0.58, h);
        s += `<text class="iso-pct" x="${p[0].toFixed(1)}" y="${(p[1] + 2).toFixed(1)}" fill="${d.t}" opacity="${t}">${pct(d.n, TOTAL)}</text>`;
        s += `<text class="iso-cat" x="${p[0].toFixed(1)}" y="${(p[1] + 20).toFixed(1)}" fill="${d.t}" opacity="${t}">${d.k}</text>`;
      } else {
        const a = pt(d.mid, 1, h);
        const b = pt(d.mid, 1.14, h);
        s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="var(--iso-muted)" stroke-width="1.2" opacity="${t}"/>`;
        s += `<text class="iso-pct iso-out" x="${(b[0] + 6).toFixed(1)}" y="${(b[1] + 2).toFixed(1)}" fill="var(--iso-ink)" opacity="${t}">${pct(d.n, TOTAL)}</text>`;
        s += `<text class="iso-cat iso-out" x="${(b[0] + 6).toFixed(1)}" y="${(b[1] + 20).toFixed(1)}" fill="var(--iso-muted)" opacity="${t}">${d.k}</text>`;
      }
      return `${s}</g>`;
    };

    const ratio = (d: SliceMath) => {
      const share = d.n / TOTAL;
      return share < 0.1
        ? `About 1 in ${Math.round(1 / share)} people`
        : `About ${Math.round(share * 10)} in 10 people`;
    };

    const active = () =>
      hovRef.current !== null ? hovRef.current : selRef.current;

    const showTip = (a: number | null) => {
      if (a === null) {
        tip.classList.remove("on");
        return;
      }
      const d = data[a];
      tip.style.setProperty("--c", d.c);
      tip.innerHTML =
        `<strong class="iso-survey__tip-title">${d.k}</strong>` +
        `<p class="iso-survey__tip-stat">${d.n} of ${TOTAL} respondents (${pct(d.n, TOTAL)})</p>` +
        `<p class="iso-survey__tip-ratio">${ratio(d)}</p>` +
        `<p class="iso-survey__tip-rank">${rankLabel(d.rank, data.length)}</p>`;
      const k = stage.clientWidth / 700;
      const p = pt(d.mid, 1.12, H);
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      const right = Math.cos(d.mid) >= 0;
      let x = p[0] * k + (right ? 10 : -10 - w);
      let y = (p[1] - VB_Y) * k - h / 2;
      x = Math.max(0, Math.min(x, stage.clientWidth - w));
      y = Math.max(0, Math.min(y, stage.clientHeight - h));
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.classList.add("on");
    };

    const apply = () => {
      const a = active();
      const sl = svg.querySelectorAll(".iso-slice");
      for (let i = 0; i < sl.length; i++) {
        const k = +(sl[i].getAttribute("data-s") || -1);
        sl[i].classList.toggle("hov", a === k);
        sl[i].classList.toggle("dim", a !== null && a !== k);
      }
      showTip(a);
    };

    const filterId = `iso-soft-shadow-${uid.replace(/:/g, "")}`;
    const render = (t: number) => {
      const h = H * t;
      let s =
        `<defs>` +
        `<filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%">` +
        `<feGaussianBlur in="SourceGraphic" stdDeviation="14"/>` +
        `</filter>` +
        `</defs>` +
        `<ellipse cx="${CX}" cy="${CY + 24}" rx="${A * 1.1}" ry="${B * 1.15}" fill="rgba(17,17,17,0.1)" filter="url(#${filterId})"/>` +
        `<ellipse cx="${CX}" cy="${CY + 18}" rx="${A * 0.88}" ry="${B * 0.88}" fill="rgba(17,17,17,0.04)" filter="url(#${filterId})"/>`;
      const order = data
        .map((_, i) => i)
        .sort((a, b) => Math.sin(data[a].mid) - Math.sin(data[b].mid));
      order.forEach((i) => {
        s += slice(data[i], i, h, t);
      });
      data.forEach((d, i) => {
        s += `<g class="iso-hit" data-i="${i}" tabindex="0" role="button" aria-label="${d.k}: ${d.n} responses, ${pct(d.n, TOTAL)}">`;
        s += `<polygon points="${str([pt(0, 0, H)].concat(arc(d.a1, d.a2, 1, H)))}"/>`;
        const wp = wallPoly(d, H);
        if (wp) s += `<polygon points="${str(wp)}"/>`;
        s += `</g>`;
      });
      svg.innerHTML = s;
      apply();
    };

    const idx = (e: Event) => {
      const g = (e.target as Element | null)?.closest?.(".iso-hit");
      return g ? +((g as HTMLElement).getAttribute("data-i") || -1) : null;
    };

    /* Phone layout + real touch devices: tip via press, not hover. */
    const pressMode = () =>
      window.matchMedia(
        "(max-width: 780px), (hover: none), (pointer: coarse)",
      ).matches;

    let pressHandled = false;

    const toggleSel = (i: number | null) => {
      selRef.current = i === null || selRef.current === i ? null : i;
      hovRef.current = null;
      apply();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !pressMode()) {
        hovRef.current = idx(e);
        apply();
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !pressMode()) {
        hovRef.current = null;
        apply();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!pressMode() && e.pointerType === "mouse") return;
      const i = idx(e);
      if (i === null) return;
      pressHandled = true;
      toggleSel(i);
    };
    const onClick = (e: MouseEvent) => {
      if (pressHandled) {
        pressHandled = false;
        return;
      }
      if (pressMode()) return;
      toggleSel(idx(e));
    };
    const onDocPointerDown = (e: PointerEvent) => {
      if (!stage.contains(e.target as Node)) {
        if (selRef.current !== null || hovRef.current !== null) {
          selRef.current = null;
          hovRef.current = null;
          apply();
        }
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const i = idx(e);
      if (i !== null) {
        hovRef.current = i;
        apply();
      }
    };
    const onFocusOut = () => {
      hovRef.current = null;
      apply();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        const i = idx(e);
        if (i !== null) {
          e.preventDefault();
          toggleSel(i);
        }
      }
    };
    const onResize = () => showTip(active());

    svg.addEventListener("pointerover", onOver);
    svg.addEventListener("pointerleave", onLeave);
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("click", onClick);
    svg.addEventListener("focusin", onFocusIn);
    svg.addEventListener("focusout", onFocusOut);
    svg.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDocPointerDown);
    window.addEventListener("resize", onResize);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf = 0;
    if (reduce) {
      render(1);
    } else {
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / 900, 1);
        const t = 1 - Math.pow(1 - p, 3);
        render(t);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      svg.removeEventListener("pointerover", onOver);
      svg.removeEventListener("pointerleave", onLeave);
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("click", onClick);
      svg.removeEventListener("focusin", onFocusIn);
      svg.removeEventListener("focusout", onFocusOut);
      svg.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDocPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [rawData, uid, title]);

  return (
    <article className="iso-survey" aria-labelledby={`${uid}-title`}>
      <h4 id={`${uid}-title`} className="iso-survey__title">
        {title}
      </h4>
      <div className="iso-survey__stage" ref={stageRef}>
        <svg
          ref={svgRef}
          className="iso-survey__chart"
          viewBox={`0 ${VB_Y} 700 ${VB_H}`}
          role="img"
          aria-label={title}
        />
        <div className="iso-survey__tip" ref={tipRef} />
      </div>
    </article>
  );
}
