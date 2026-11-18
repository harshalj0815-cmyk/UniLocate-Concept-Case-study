"use client";

import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import IosKeyboard from "@/components/ui/IosKeyboard";
import NavManeuverSign from "@/components/ui/NavManeuverSign";
import PrimaryCta from "@/components/ui/PrimaryCta";
import SearchField from "@/components/ui/SearchField";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
const FLOOR_SLIDE_PX = 16;
const FLOOR_SLIDE_S = 0.18;
/** Map layer swap — same axis as the stepper label, slightly softer */
const MAP_SWAP_PX = 14;
const MAP_SWAP_S = 0.22;
/** Map-Search-FirstTime chrome morph */
const SEARCH_MOVE_S = 0.28;
const FLOORS = [
  { id: "ground", short: "G" },
  { id: "first", short: "1" },
  { id: "second", short: "2" },
] as const;

type FloorId = (typeof FLOORS)[number]["id"];

type ViewState = { x: number; y: number; zoom: number | null };

type MapLayer = { key: string; floor: FloorId; src: string };

type NavStep = {
  icon: string;
  text: string;
  meters: number;
  arrive?: boolean;
  transfer?: boolean;
  awaitConfirm?: boolean;
  toFloor?: FloorId;
  toFloorLabel?: string;
  kind?: "stairs" | "lift";
};

type NavTrip = {
  from?: unknown;
  to?: string | null;
  pref?: string;
};

type Props = {
  collegeName: string;
  onBack?: () => void;
  /** Map-Success → Create Profile */
  onCreateProfile?: () => void;
};

function formatNavDistance(meters: number, arrive?: boolean) {
  if (arrive) return "Arriving";
  if (!Number.isFinite(meters) || meters < 2) return "now";
  return `${Math.round(meters)} m`;
}

function truncateTitle(name: string, max = 28) {
  if (name.length <= max) return name;
  return `${name.slice(0, max).trimEnd()}…`;
}

function buildMapSrc(floor: FloorId, view: ViewState) {
  const params = new URLSearchParams({ embed: "1", v: "26" });
  if (view.zoom != null && Number.isFinite(view.zoom)) {
    params.set("vx", String(view.x));
    params.set("vy", String(view.y));
    params.set("vz", String(view.zoom));
  }
  return `/maps/${floor}-floor-map.html?${params}`;
}

function buildHandoffSrc(
  floor: FloorId,
  trip: NavTrip,
  leg: number,
  view: ViewState,
) {
  const params = new URLSearchParams({ embed: "1", v: "26" });
  params.set(
    "trip",
    JSON.stringify({
      from: trip.from,
      to: trip.to,
      pref: trip.pref || "stairs",
      leg,
      play: 1,
    }),
  );
  if (view.zoom != null && Number.isFinite(view.zoom)) {
    params.set("vx", String(view.x));
    params.set("vy", String(view.y));
    params.set("vz", String(view.zoom));
  }
  return `/maps/${floor}-floor-map.html?${params}`;
}

type MapLayersProps = {
  layers: MapLayer[];
  stepDir: 1 | -1;
  mapReady: boolean;
  iframeRef: Ref<HTMLIFrameElement>;
  mapSwapVariants: Record<string, unknown>;
  mapSwapTx: { duration: number; ease: readonly number[] };
};

/** Keep the heavy iframe tree out of nav-card re-renders */
const MapLayers = memo(function MapLayers({
  layers,
  stepDir,
  mapReady,
  iframeRef,
  mapSwapVariants,
  mapSwapTx,
}: MapLayersProps) {
  return (
    <>
      {layers.map((layer, i) => {
        const isActive = i === layers.length - 1;
        const isFirstPaint = layers.length === 1 && i === 0;
        return (
          <motion.div
            key={layer.key}
            className="mf__map-layer"
            custom={stepDir}
            variants={mapSwapVariants}
            initial={isFirstPaint ? false : "enter"}
            animate={
              isActive
                ? mapReady || isFirstPaint
                  ? "center"
                  : "enter"
                : mapReady
                  ? "exit"
                  : "center"
            }
            transition={mapSwapTx}
          >
            <iframe
              ref={isActive ? iframeRef : undefined}
              className="mf__iframe"
              title={isActive ? "Campus floor map" : ""}
              src={layer.src}
              allow={isActive ? "fullscreen" : undefined}
              tabIndex={isActive ? undefined : -1}
            />
          </motion.div>
        );
      })}
      <div className="mf__frame-shade" aria-hidden />
    </>
  );
});

/** Map-FirstTime — campus map chrome around the existing floor HTML + nav logic */
export default function MapFirstTime({
  collegeName,
  onBack,
  onCreateProfile,
}: Props) {
  const reduce = useReducedMotion();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const layerSeq = useRef(0);
  /** Carry pan/zoom across floor swaps so the same spot stays in view */
  const viewRef = useRef<ViewState>({ x: 0, y: 0, zoom: null });
  const [floor, setFloor] = useState<FloorId>("ground");
  /** +1 = climbing (G→1→2), −1 = descending */
  const [stepDir, setStepDir] = useState<1 | -1>(1);
  const [layers, setLayers] = useState<MapLayer[]>(() => [
    {
      key: `L${layerSeq.current++}`,
      floor: "ground",
      src: buildMapSrc("ground", { x: 0, y: 0, zoom: null }),
    },
  ]);
  const [query, setQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  /** Map-Search-FirstTime — shrink map, lift search, show keyboard */
  const [searching, setSearching] = useState(false);
  /** Map-Navigation-FirstTime — nav card after a destination search */
  const [navigating, setNavigating] = useState(false);
  /** Map-Success-FirstTime — after the pin reaches the room */
  const [arrived, setArrived] = useState(false);
  /** Hint + CTA after sticker burst settles */
  const [burstSettled, setBurstSettled] = useState(false);
  const [destination, setDestination] = useState("");
  const [navStep, setNavStep] = useState<NavStep | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const floorIndexRef = useRef(0);
  const arrivedRef = useRef(false);
  /** Leg to resume after stair confirm — from map nav payload */
  const resumeLegRef = useRef<number | null>(null);
  arrivedRef.current = arrived;

  const swapping = layers.length > 1;
  const floorIndex = FLOORS.findIndex((f) => f.id === floor);
  floorIndexRef.current = floorIndex;

  const enterTx = (delay = 0) => ({
    duration: reduce ? 0 : 0.24,
    ease: EASE_OUT,
    delay: reduce ? 0 : delay,
  });
  const floorSlideTx = {
    duration: reduce ? 0 : FLOOR_SLIDE_S,
    ease: EASE_OUT,
  };
  const mapSwapTx = useMemo(
    () => ({
      duration: reduce ? 0 : MAP_SWAP_S,
      ease: EASE_OUT,
    }),
    [reduce],
  );
  const chromeTx = {
    duration: reduce ? 0 : SEARCH_MOVE_S,
    ease: EASE_IN_OUT,
  };
  const drawerTx = {
    duration: reduce ? 0 : SEARCH_MOVE_S,
    ease: EASE_DRAWER,
  };

  const post = useCallback((payload: Record<string, unknown>) => {
    const iframe =
      iframeRef.current ||
      (typeof document !== "undefined"
        ? document.querySelector<HTMLIFrameElement>("iframe.mf__iframe")
        : null);
    iframe?.contentWindow?.postMessage(
      { source: "unilocate-shell", ...payload },
      "*",
    );
  }, []);

  const captureView = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow as
        | (Window & {
            ulView?: { state?: { x?: number; y?: number; zoom?: number } };
          })
        | null
        | undefined;
      const s = win?.ulView?.state;
      if (!s) return;
      const zoom = Number(s.zoom);
      if (!Number.isFinite(zoom) || zoom <= 0) return;
      viewRef.current = {
        x: Number(s.x) || 0,
        y: Number(s.y) || 0,
        zoom,
      };
    } catch {
      /* cross-origin or unloaded */
    }
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.source === "unilocate-burst" && d.type === "settled") {
        setBurstSettled(true);
        return;
      }
      if (d.source !== "unilocate-map") return;
      if (d.type === "ready") {
        setMapReady(true);
        if (typeof d.floor === "string") {
          const id = d.floor as FloorId;
          if (FLOORS.some((f) => f.id === id)) setFloor(id);
        }
        return;
      }
      if (d.type === "floor-handoff") {
        const nextId = d.floor as FloorId;
        if (!FLOORS.some((f) => f.id === nextId)) return;
        const nextIndex = FLOORS.findIndex((f) => f.id === nextId);
        const dir: 1 | -1 = nextIndex >= floorIndexRef.current ? 1 : -1;
        captureView();
        const trip: NavTrip = {
          from: d.trip?.from,
          to: d.trip?.to ?? null,
          pref: typeof d.trip?.pref === "string" ? d.trip.pref : "stairs",
        };
        const leg = Number(d.leg);
        if (Number.isFinite(leg)) resumeLegRef.current = leg;
        const src = buildHandoffSrc(
          nextId,
          trip,
          Number.isFinite(leg) ? leg : 0,
          viewRef.current,
        );
        setStepDir(dir);
        setMapReady(false);
        setFloor(nextId);
        /* Keep stair card visible — walk stays paused until confirm on the new floor */
        /* One iframe only — stacking two full floor maps stalls the shell */
        setLayers([
          { key: `L${layerSeq.current++}`, floor: nextId, src },
        ]);
        return;
      }
      if (d.type === "arrived") {
        if (typeof d.destination === "string" && d.destination) {
          setDestination(d.destination);
        }
        setBurstSettled(false);
        setArrived(true);
        return;
      }
      if (d.type === "nav") {
        if (d.clear) {
          /* Keep success card — map clears the trip after arrival */
          if (!arrivedRef.current) setNavStep(null);
          return;
        }
        if (typeof d.destination === "string" && d.destination) {
          setDestination(d.destination);
        }
        const s = d.step;
        if (s && typeof s.text === "string") {
          const toFloor = s.toFloor as FloorId | undefined;
          const resumeLeg = Number(s.nextLeg);
          if (s.awaitConfirm && Number.isFinite(resumeLeg)) {
            resumeLegRef.current = resumeLeg;
          } else if (!s.awaitConfirm) {
            resumeLegRef.current = null;
          }
          const next: NavStep = {
            icon: String(s.icon || "walk"),
            text: s.text,
            meters: Number(s.meters) || 0,
            arrive: Boolean(s.arrive),
            transfer: Boolean(s.transfer),
            awaitConfirm: Boolean(s.awaitConfirm),
            toFloor:
              toFloor && FLOORS.some((f) => f.id === toFloor)
                ? toFloor
                : undefined,
            toFloorLabel:
              typeof s.toFloorLabel === "string" ? s.toFloorLabel : undefined,
            kind:
              s.kind === "lift" ? "lift" : s.kind === "stairs" ? "stairs" : undefined,
          };
          const apply = () =>
            setNavStep((prev) => {
              if (
                prev &&
                prev.icon === next.icon &&
                prev.text === next.text &&
                prev.meters === next.meters &&
                prev.arrive === next.arrive &&
                prev.awaitConfirm === next.awaitConfirm &&
                prev.toFloor === next.toFloor &&
                prev.kind === next.kind
              ) {
                return prev;
              }
              return next;
            });
          if (next.awaitConfirm) apply();
          else startTransition(apply);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [captureView]);

  /** Ask the map for the upcoming turn, then auto-start walk ~3s later */
  useEffect(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (!navigating || arrived) return;
    post({ type: "nav-sync" });
    const syncAgain = window.setTimeout(() => post({ type: "nav-sync" }), 120);
    playTimerRef.current = window.setTimeout(
      () => {
        playTimerRef.current = null;
        post({ type: "play", leg: 0 });
      },
      reduce ? 0 : 3000,
    );
    return () => {
      window.clearTimeout(syncAgain);
      if (playTimerRef.current != null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [arrived, navigating, post, reduce]);

  /** Fallback if the burst page never posts settled */
  useEffect(() => {
    if (!arrived || burstSettled) return;
    const t = window.setTimeout(
      () => setBurstSettled(true),
      reduce ? 0 : 4200,
    );
    return () => window.clearTimeout(t);
  }, [arrived, burstSettled, reduce]);

  /** After the incoming floor settles, drop the held previous iframe */
  useEffect(() => {
    if (!mapReady || layers.length < 2) return;
    const ms = reduce ? 0 : Math.round(MAP_SWAP_S * 1000) + 40;
    const t = window.setTimeout(() => {
      setLayers((prev) => (prev.length ? [prev[prev.length - 1]!] : prev));
    }, ms);
    return () => window.clearTimeout(t);
  }, [mapReady, layers.length, reduce]);

  const floorShort = FLOORS[floorIndex]?.short ?? "G";
  const canGoUp = floorIndex < FLOORS.length - 1;
  const canGoDown = floorIndex > 0;

  const stepFloor = useCallback(
    (dir: 1 | -1) => {
      const next = FLOORS[floorIndex + dir];
      if (!next || swapping) return;
      captureView();
      const src = buildMapSrc(next.id, viewRef.current);
      setStepDir(dir);
      setMapReady(false);
      setFloor(next.id);
      setLayers((prev) => [
        ...prev,
        { key: `L${layerSeq.current++}`, floor: next.id, src },
      ]);
    },
    [captureView, floorIndex, swapping],
  );

  const floorLabelVariants = {
    enter: (d: 1 | -1) => ({
      opacity: 0,
      transform: `translate3d(0, ${(d === 1 ? -1 : 1) * FLOOR_SLIDE_PX}px, 0)`,
    }),
    center: {
      opacity: 1,
      transform: "translate3d(0, 0, 0)",
    },
    exit: (d: 1 | -1) => ({
      opacity: 0,
      transform: `translate3d(0, ${(d === 1 ? 1 : -1) * FLOOR_SLIDE_PX}px, 0)`,
    }),
  };

  /** Climb: new floor rises from below; descend: drops from above */
  const mapSwapVariants = useMemo(
    () => ({
      enter: (d: 1 | -1) =>
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              transform: `translate3d(0, ${(d === 1 ? 1 : -1) * MAP_SWAP_PX}px, 0)`,
            },
      center: {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
      },
      exit: (d: 1 | -1) =>
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              transform: `translate3d(0, ${(d === 1 ? -1 : 1) * MAP_SWAP_PX}px, 0)`,
            },
    }),
    [reduce],
  );

  const queryRef = useRef(query);
  queryRef.current = query;

  const endNavigation = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    post({ type: "stop" });
    setNavigating(false);
    setArrived(false);
    setBurstSettled(false);
    setNavStep(null);
  }, [post]);

  const confirmStairFloor = useCallback(() => {
    if (!navStep?.awaitConfirm) return;
    const leg = resumeLegRef.current;
    const mapWin = () => {
      const iframe =
        iframeRef.current ||
        document.querySelector<HTMLIFrameElement>("iframe.mf__iframe");
      return iframe?.contentWindow as
        | (Window & {
            ulNav?: {
              confirmFloor?: () => boolean;
              play?: (leg: number) => void;
            };
          })
        | null
        | undefined;
    };
    /* Same-origin: call the map directly — postMessage alone failed after embed query strip */
    const bump = () => {
      try {
        mapWin()?.ulNav?.confirmFloor?.();
      } catch {
        /* ignore */
      }
      post({ type: "confirm-floor" });
    };
    bump();
    window.setTimeout(bump, 120);
    window.setTimeout(bump, 360);
    if (leg != null) {
      window.setTimeout(() => {
        try {
          mapWin()?.ulNav?.play?.(leg);
        } catch {
          /* ignore */
        }
        post({ type: "play", leg });
      }, 280);
    }
  }, [navStep?.awaitConfirm, post]);

  const submitSearch = useCallback(() => {
    const q = queryRef.current.trim();
    if (!q) return;
    post({ type: "search", query: q, submit: true });
    setDestination(q);
    setSearching(false);
    setNavigating(true);
  }, [post]);

  const openSearch = useCallback(() => {
    if (navigating) return;
    setSearching(true);
  }, [navigating]);
  const closeSearch = useCallback(() => setSearching(false), []);

  /* Enter works even if the ghost input blurred (tap on keyboard / map) */
  useEffect(() => {
    if (!searching || navigating) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      submitSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigating, searching, submitSearch]);

  const handleBack = useCallback(() => {
    if (searching) {
      closeSearch();
      return;
    }
    if (arrived || navigating) {
      endNavigation();
      return;
    }
    onBack?.();
  }, [arrived, closeSearch, endNavigation, navigating, onBack, searching]);

  /** Tap outside map / search / keyboard → leave Map-Search */
  const dismissSearchOutside = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!searching) return;
      const target = e.target as Element | null;
      if (!target?.closest) return;
      if (target.closest(".mf__frame, .mf__search, .mf__kb, .mf__floors")) {
        return;
      }
      closeSearch();
    },
    [closeSearch, searching],
  );

  const successSubtitle = destination
    ? `${destination}, right on time`
    : "Right on time";

  const mfMode = arrived
    ? " mf--success"
    : navigating
      ? " mf--navigating"
      : searching
        ? " mf--searching"
        : "";

  return (
    <motion.div
      className={`mf${mfMode}`}
      aria-label="Campus map"
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, transform: "translate3d(0, 16px, 0)" }
      }
      animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
      transition={enterTx(0)}
      onMouseDown={dismissSearchOutside}
    >
      <div className="mf__wash" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mf__wash-map" src={UL_ASSETS.backgroundMap} alt="" />
      </div>

      <motion.header
        className="mf__header"
        initial={
          reduce
            ? false
            : { opacity: 0, transform: "translate3d(0, -8px, 0)" }
        }
        animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
        transition={enterTx(0.04)}
      >
        <button
          type="button"
          className="mf__back"
          aria-label="Back"
          onClick={handleBack}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UL_ASSETS.careLeft} alt="" width={20} height={26} />
        </button>
        <h1 className="mf__title">{truncateTitle(collegeName)}</h1>
        <button type="button" className="mf__kebab" aria-label="More">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UL_ASSETS.kebabIcon} alt="" width={20} height={27} />
        </button>
      </motion.header>

      <motion.div
        className="mf__stage"
        initial={
          reduce
            ? false
            : { opacity: 0, transform: "translate3d(0, 12px, 0)" }
        }
        animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
        transition={enterTx(0.06)}
      >
        <div className="mf__frame">
          <div className="mf__frame-inner">
            <MapLayers
              layers={layers}
              stepDir={stepDir}
              mapReady={mapReady}
              iframeRef={iframeRef}
              mapSwapVariants={mapSwapVariants}
              mapSwapTx={mapSwapTx}
            />
          </div>
        </div>

        <div className="mf__floors" role="group" aria-label="Floor stepper">
          <div className="mf__floors-face">
            <button
              type="button"
              className="mf__floors-btn"
              aria-label="Floor up"
              disabled={!canGoUp || swapping}
              onClick={() => stepFloor(1)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={UL_ASSETS.plusIcon} alt="" width={29} height={29} />
            </button>
            <div className="mf__floors-label" aria-live="polite">
              <AnimatePresence initial={false} custom={stepDir}>
                <motion.span
                  key={floorShort}
                  className="mf__floors-label-text"
                  aria-current="true"
                  custom={stepDir}
                  variants={floorLabelVariants}
                  initial={reduce ? false : "enter"}
                  animate="center"
                  exit={reduce ? undefined : "exit"}
                  transition={floorSlideTx}
                >
                  {floorShort}
                </motion.span>
              </AnimatePresence>
            </div>
            <button
              type="button"
              className="mf__floors-btn"
              aria-label="Floor down"
              disabled={!canGoDown || swapping}
              onClick={() => stepFloor(-1)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={UL_ASSETS.minusIcon} alt="" width={29} height={20} />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mf__search"
        initial={
          reduce
            ? false
            : { opacity: 0, transform: "translate3d(0, 10px, 0)" }
        }
        animate={{
          opacity: navigating || arrived ? 0 : 1,
          transform:
            navigating || arrived
              ? "translate3d(0, 12px, 0)"
              : "translate3d(0, 0, 0)",
        }}
        transition={
          navigating || arrived || searching ? chromeTx : enterTx(0.1)
        }
        style={{
          pointerEvents: navigating || arrived ? "none" : "auto",
        }}
        aria-hidden={navigating || arrived}
        onFocusCapture={openSearch}
        onClick={openSearch}
      >
        <SearchField
          animate={false}
          rotatingPlaceholder={false}
          customCaret
          autoFocus={searching}
          placeholder="Destination"
          value={query}
          onChange={setQuery}
          onSubmit={submitSearch}
          trailing={
            <button
              type="button"
              className="ul-search__filter"
              aria-label="Filter"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={UL_ASSETS.filterIcon} alt="" width={30} height={28} />
            </button>
          }
        />
      </motion.div>

      <motion.div
        className="mf__kb"
        initial={false}
        animate={{
          transform: searching
            ? "translate3d(0, 0, 0)"
            : "translate3d(0, 100%, 0)",
        }}
        transition={drawerTx}
        aria-hidden={!searching}
      >
        <IosKeyboard
          onActivate={searching ? openSearch : undefined}
          onEnter={searching ? submitSearch : undefined}
        />
      </motion.div>

      <AnimatePresence>
        {arrived ? (
          <>
            <motion.div
              key="success-dim"
              className="mf__success-dim"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={chromeTx}
            />
            <motion.div
              key="success-card"
              className="mf__success"
              role="region"
              aria-label="Arrived"
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translate3d(0, 20px, 0)" }
              }
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translate3d(0, 16px, 0)" }
              }
              transition={chromeTx}
            >
              <iframe
                className="mf__success-burst"
                title="Arrival celebration"
                src={`/animations/campus-sticker-burst.html?embed=1&v=3&sub=${encodeURIComponent(successSubtitle)}`}
                tabIndex={-1}
              />
              <div className="mf__success-wash" aria-hidden />
              <motion.p
                className="mf__success-hint"
                initial={false}
                animate={{
                  opacity: burstSettled ? 1 : 0,
                  transform: burstSettled
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, 8px, 0)",
                }}
                transition={chromeTx}
              >
                Create profile for more navigation
              </motion.p>
              <motion.div
                className="mf__success-cta-wrap"
                initial={false}
                animate={{
                  opacity: burstSettled ? 1 : 0,
                  transform: burstSettled
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, 10px, 0)",
                }}
                transition={chromeTx}
                style={{
                  pointerEvents: burstSettled ? "auto" : "none",
                }}
              >
                <PrimaryCta
                  className="mf__success-cta"
                  label="Create Profile"
                  width={336}
                  height={48}
                  animate={false}
                  onClick={onCreateProfile}
                />
              </motion.div>
            </motion.div>
          </>
        ) : navigating ? (
          <motion.div
            key="nav-card"
            className="mf__nav"
            role="region"
            aria-label="Navigation"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, transform: "translate3d(0, 16px, 0)" }
            }
            animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, transform: "translate3d(0, 12px, 0)" }
            }
            transition={chromeTx}
          >
            <div className="mf__nav-dest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="mf__nav-pin"
                src={UL_ASSETS.mapPinIcon}
                alt=""
                width={24}
                height={29}
              />
              <p className="mf__nav-dest-name">{destination || "Destination"}</p>
            </div>
            <button
              type="button"
              className="mf__nav-filter"
              aria-label="Filter"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={UL_ASSETS.filterIcon} alt="" width={30} height={28} />
            </button>
            <button
              type="button"
              className="mf__nav-end"
              onClick={endNavigation}
            >
              End
            </button>
            <div className="mf__nav-rule" aria-hidden />
            {navStep?.awaitConfirm ? (
              <div className="mf__nav-stair">
                <p className="mf__nav-stair-copy">
                  {navStep.kind === "lift" ? "Lift to " : "Stairs to "}
                  <span className="mf__nav-stair-floor">
                    {navStep.toFloorLabel || "the next floor"}
                  </span>
                  {" confirm when there."}
                </p>
                <PrimaryCta
                  className="mf__stair-cta"
                  label={`On ${navStep.toFloorLabel || "floor"}`}
                  width={112}
                  height={48}
                  animate={false}
                  onClick={confirmStairFloor}
                />
              </div>
            ) : (
              <div className="mf__nav-step">
                <div className="mf__nav-sign" aria-hidden>
                  <NavManeuverSign icon={navStep?.icon ?? "walk"} />
                </div>
                <div className="mf__nav-copy">
                  <p className="mf__nav-instruction">
                    {navStep?.text || "Finding route…"}
                  </p>
                  <p className="mf__nav-distance">
                    {navStep
                      ? formatNavDistance(navStep.meters, navStep.arrive)
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
