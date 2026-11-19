"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
import { useDemoReduceMotion } from "@/lib/demoMotion";
import { useSquirclePath } from "@/hooks/useSquirclePath";
import { paperSquirclePath } from "@/lib/continuousCorner";
import {
  BUILDING_FILTERS,
  OTHER_FILTERS,
  WING_FILTERS,
  type OtherFilter,
} from "@/lib/mapFilters";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
/** Occasional modal — under 300ms, ease-out enter/exit */
const FILTER_S = 0.24;

const FILTER_W = 360;
const FILTER_R = 16;
/** Paper 62C-0 floor — seed squircle so enter doesn't resize-flash */
const FILTER_MIN_H = 423;
/** Idle open: short settle. From keyboard: rise into freed space. */
const RISE_IDLE_PX = 20;
const RISE_FROM_KB_PX = 48;

const CLEAR_W = 336;
const CLEAR_H = 48;
const CLEAR_PATH = paperSquirclePath(CLEAR_W, CLEAR_H, 16);

export type MapFilterSelection = {
  /** Active wing/building section id, or null */
  sectionId: string | null;
  /** Active Other chip labels */
  other: Set<string>;
};

type Props = {
  onClose: () => void;
  /** Active wing/building section ids — multi-select */
  sectionIds: Set<string>;
  /** Active Other chip labels — lifted so reopen keeps selection */
  other: Set<string>;
  onSectionToggle: (sectionId: string) => void;
  onOtherChange: (filter: OtherFilter, on: boolean) => void;
  onClearAll: () => void;
  /** Opened while search keyboard was up — larger sheet rise */
  fromKeyboard?: boolean;
};

/** Map marks — campus-map.css --ul-sec */
const CHIP_ON_WING = "#6c72e0";
const CHIP_ON_BUILDING = "#FC3477";
/** Other filters — emergency / restroom / staff accent */
const CHIP_ON_OTHER = "#FF922D";

function FilterChip({
  label,
  on,
  onToggle,
  accent = "wing",
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  /** Match map section mark colors */
  accent?: "wing" | "building" | "other";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onFill =
    accent === "building"
      ? CHIP_ON_BUILDING
      : accent === "other"
        ? CHIP_ON_OTHER
        : CHIP_ON_WING;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (w < 1 || h < 1) return;
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label, on, onFill]);

  const path = box.w > 0 ? paperSquirclePath(box.w, box.h, 8) : "";

  return (
    <button
      ref={ref}
      type="button"
      className={`mf__filter-chip${on ? " mf__filter-chip--on" : ""}`}
      aria-pressed={on}
      onClick={onToggle}
    >
      {path ? (
        <svg
          className="mf__filter-chip__shape"
          viewBox={`0 0 ${box.w} ${box.h}`}
          width={box.w}
          height={box.h}
          aria-hidden
        >
          <path
            d={path}
            fill={on ? onFill : "#FFFFFF"}
            stroke={on ? "#FFFFFF" : "#EAEAEA"}
            strokeWidth={on ? 2 : 1}
          />
        </svg>
      ) : null}
      <span className="mf__filter-chip__label">{label}</span>
    </button>
  );
}

/** Map-Filter-FirstTime — Paper Filters card (62C-0), wired to campus-map filters */
export default function MapFilterPanel({
  onClose,
  sectionIds,
  other,
  onSectionToggle,
  onOtherChange,
  onClearAll,
  fromKeyboard = false,
}: Props) {
  const reduce = useDemoReduceMotion();
  const { ref, path, height } = useSquirclePath<HTMLDivElement>(
    FILTER_W,
    FILTER_R,
    FILTER_MIN_H,
  );

  const risePx = fromKeyboard ? RISE_FROM_KB_PX : RISE_IDLE_PX;
  const tx = {
    duration: reduce ? 0 : FILTER_S,
    ease: EASE_OUT,
  };
  /** Dim leads; sheet follows so it doesn't fight the keyboard exit */
  const sheetTx = {
    duration: reduce ? 0 : FILTER_S,
    ease: EASE_OUT,
    delay: reduce ? 0 : fromKeyboard ? 0.06 : 0,
  };

  const toggleOther = useCallback(
    (filter: OtherFilter) => {
      onOtherChange(filter, !other.has(filter.label));
    },
    [onOtherChange, other],
  );

  const clearAll = useCallback(() => {
    for (const f of OTHER_FILTERS) {
      if (other.has(f.label)) onOtherChange(f, false);
    }
    onClearAll();
  }, [onClearAll, onOtherChange, other]);

  const sectionChips = (
    items: readonly { label: string; id: string }[],
    accent: "wing" | "building",
  ) =>
    items.map((item) => (
      <FilterChip
        key={item.id}
        label={item.label}
        accent={accent}
        on={sectionIds.has(item.id)}
        onToggle={() => onSectionToggle(item.id)}
      />
    ));

  return (
    <motion.div
      className="mf__filter-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={tx}
    >
      <button
        type="button"
        className="mf__filter-dim"
        aria-label="Dismiss filters"
        onClick={onClose}
      />
      <motion.div
        ref={ref}
        className="mf__filter"
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        initial={
          reduce
            ? false
            : { transform: `translate3d(-50%, ${risePx}px, 0)` }
        }
        animate={{ transform: "translate3d(-50%, 0, 0)" }}
        exit={
          reduce
            ? undefined
            : { transform: `translate3d(-50%, ${RISE_IDLE_PX}px, 0)` }
        }
        transition={sheetTx}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <svg
          className="mf__filter__shape"
          viewBox={`0 0 ${FILTER_W} ${height}`}
          width={FILTER_W}
          height={height}
          aria-hidden
        >
          <path d={path} fill="#FFFFFF" stroke="#EAEAEA" strokeWidth="1" />
        </svg>

        <div className="mf__filter__body">
          <p className="mf__filter-section">Wings</p>
          <div className="mf__filter-chips">
            {sectionChips(WING_FILTERS, "wing")}
          </div>

          <div className="mf__filter-rule" aria-hidden />

          <p className="mf__filter-section">Building</p>
          <div className="mf__filter-chips">
            {sectionChips(BUILDING_FILTERS, "building")}
          </div>

          <div className="mf__filter-rule" aria-hidden />

          <p className="mf__filter-section">Other</p>
          <div className="mf__filter-chips">
            {OTHER_FILTERS.map((f) => (
              <FilterChip
                key={f.label}
                label={f.label}
                accent="other"
                on={other.has(f.label)}
                onToggle={() => toggleOther(f)}
              />
            ))}
          </div>

          <div className="mf__filter-rule mf__filter-rule--foot" aria-hidden />

          <button
            type="button"
            className="mf__filter-clear"
            onClick={clearAll}
          >
            <svg
              className="mf__filter-clear__shape"
              viewBox={`0 0 ${CLEAR_W} ${CLEAR_H}`}
              width={CLEAR_W}
              height={CLEAR_H}
              aria-hidden
            >
              <path
                d={CLEAR_PATH}
                fill="#FFFFFF"
                stroke="#EAEAEA"
                strokeWidth="1"
              />
            </svg>
            <span className="mf__filter-clear__label">Clear All</span>
          </button>
        </div>

        <button
          type="button"
          className="mf__filter-close"
          aria-label="Close filters"
          onClick={onClose}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UL_ASSETS.clearIcon} alt="" width={22} height={22} />
        </button>
      </motion.div>
    </motion.div>
  );
}
