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
import { AnimatePresence, motion } from "motion/react";
import { useDemoReduceMotion } from "@/lib/demoMotion";
import IosKeyboard from "@/components/ui/IosKeyboard";
import NavManeuverSign from "@/components/ui/NavManeuverSign";
import MapFilterPanel from "@/components/ui/MapFilterPanel";
import PrimaryCta from "@/components/ui/PrimaryCta";
import QrScannerCard from "@/components/ui/QrScannerCard";
import SearchField from "@/components/ui/SearchField";
import { OTHER_FILTERS, type OtherFilter } from "@/lib/mapFilters";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

type MapNavApi = {
  confirmFloor?: () => boolean;
  play?: (leg: number) => void;
  /** Offline: next QR along the current route */
  nextCheckpoint?: () => {
    floor: FloorId;
    x: number;
    y: number;
    final: boolean;
  } | null;
  state?: { to?: string | null };
  setSection?: (id: string | null) => void;
  setSectionIds?: (ids: string[]) => void;
  toggleSectionId?: (id: string) => void;
  setLayer?: (id: string, on: boolean) => void;
  focusPoi?: (kind: string, on?: boolean) => void;
  getFilter?: () => {
    mode?: string;
    id?: string | null;
    ids?: string[];
  };
};

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
/** Nav card → success card reshape (taller + higher) */
const ARRIVAL_MORPH_S = 0.36;
/** Nav shell box — success grows from here */
const NAV_CARD_TOP = 696;
const NAV_CARD_H = 146;
const SUCCESS_CARD_TOP = 456;
const SUCCESS_CARD_H = 386;
const FLOORS = [
  { id: "ground", short: "G" },
  { id: "first", short: "1" },
  { id: "second", short: "2" },
] as const;

/** Demo board Navigating jump — campus-data place id */
const DEMO_NAV_DEST = { id: "1-o104", name: "O104" } as const;

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

type MapScene = "idle" | "navigating" | "success" | "profile";

type Props = {
  collegeName: string;
  /** Owned by UniLocateFlow so it survives leave / re-enter map */
  needsProfile?: boolean;
  /** Signed-in success — share location instead of Done */
  signedIn?: boolean;
  /**
   * Campus map stepper page only — loading sticker.
   * False for Arrived / Navigating / Create profile (even if scene is idle).
   */
  campusMapHome?: boolean;
  /** Offline map — shows the QR scan button bottom-left (Paper 6VJ-0) */
  offline?: boolean;
  /** Demo board — jump into a map beat (applied on remount) */
  scene?: MapScene;
  /** Stage card — mute arrival burst SFX when false */
  soundEnabled?: boolean;
  onSceneChange?: (scene: MapScene) => void;
  onNeedsProfile?: () => void;
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

function buildMapSrc(
  floor: FloorId,
  view: ViewState,
  reduceMotion = false,
  /** Offline — no user pin / no route; `place` opens straight on that place */
  opts: {
    offline?: boolean;
    place?: string;
    /** QR already scanned — keep the user pin at the checkpoint */
    located?: boolean;
    /** Scan just finished — drop the pin in with a centre-on-user */
    reveal?: boolean;
    /** Place picked before scanning: route to it from the QR spot */
    go?: string;
    /** A later checkpoint (not the first QR) the pin should sit at */
    spot?: { floor: FloorId; x: number; y: number };
  } = {},
) {
  const params = new URLSearchParams({ embed: "1", v: "42" });
  if (reduceMotion) params.set("reduce", "1");
  if (opts.offline) params.set("offline", "1");
  if (opts.offline && opts.place) params.set("place", opts.place);
  if (opts.offline && opts.located) params.set("located", "1");
  if (opts.offline && opts.reveal) params.set("reveal", "1");
  if (opts.offline && opts.reveal && opts.go) params.set("go", opts.go);
  if (opts.offline && opts.spot) {
    params.set("ff", opts.spot.floor);
    params.set("fx", String(opts.spot.x));
    params.set("fy", String(opts.spot.y));
  }
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
  reduceMotion = false,
) {
  const params = new URLSearchParams({ embed: "1", v: "41" });
  if (reduceMotion) params.set("reduce", "1");
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
  /** False while campus loading sticker covers the frame */
  mapRevealed: boolean;
  reduce: boolean;
  iframeRef: Ref<HTMLIFrameElement>;
  mapSwapVariants: Record<string, unknown>;
  mapSwapTx: { duration: number; ease: readonly number[] };
};

/** Loader ↔ real map dissolve — opacity only (blur/scale on iframes reads muddy) */
const MAP_REVEAL_S = 0.52;
const MAP_REVEAL_EASE = [0.23, 1, 0.32, 1] as const;

/** Keep the heavy iframe tree out of nav-card re-renders */
const MapLayers = memo(function MapLayers({
  layers,
  stepDir,
  mapReady,
  mapRevealed,
  reduce,
  iframeRef,
  mapSwapVariants,
  mapSwapTx,
}: MapLayersProps) {
  const revealTx = {
    duration: reduce ? 0 : MAP_REVEAL_S,
    ease: MAP_REVEAL_EASE,
  };

  return (
    <>
      <motion.div
        className="mf__map-stack"
        initial={false}
        animate={
          mapRevealed
            ? { opacity: 1, transform: "translate3d(0, 0, 0)" }
            : reduce
              ? { opacity: 0 }
              : { opacity: 0, transform: "translate3d(0, 10px, 0)" }
        }
        transition={revealTx}
      >
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
      </motion.div>
      <AnimatePresence>
        {!mapRevealed ? (
          <motion.div
            key="map-loader"
            className="mf__loading"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={revealTx}
            aria-busy
            aria-label="Loading campus map"
          >
            <iframe
              className="mf__loading-frame"
              title="Loading campus map"
              src={`/animations/campus-map-loading.html?embed=1&v=6&dur=4.2&reduce=${reduce ? "1" : "0"}`}
              tabIndex={-1}
              aria-hidden
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="mf__frame-shade" aria-hidden />
    </>
  );
});

/** Map-FirstTime — campus map chrome around the existing floor HTML + nav logic */
export default function MapFirstTime({
  collegeName,
  needsProfile = false,
  signedIn = false,
  campusMapHome = false,
  offline = false,
  scene = "idle",
  soundEnabled = true,
  onSceneChange,
  onNeedsProfile,
  onBack,
  onCreateProfile,
}: Props) {
  const reduce = useDemoReduceMotion();
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
      src: buildMapSrc("ground", { x: 0, y: 0, zoom: null }, reduce, {
        offline,
      }),
    },
  ]);
  const [query, setQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  /**
   * Campus map stepper page only — never after arrival / nav / profile.
   * Offline opens straight on the saved map (no loading sticker).
   */
  const showMapLoadIntro =
    !reduce && !offline && campusMapHome && scene === "idle" && !needsProfile;
  const [mapRevealed, setMapRevealed] = useState(!showMapLoadIntro);
  const mapLoadGenRef = useRef(0);
  const MAP_LOAD_MS = 4500;
  /** Map-Search-FirstTime — shrink map, lift search, show keyboard */
  const [searching, setSearching] = useState(false);
  /** Offline QR scanner (Paper 6HU-0) — camera card above a shorter map */
  const [scanning, setScanning] = useState(false);
  /** Scanner locked onto the code (brackets snap in) just before it closes */
  const [scanHit, setScanHit] = useState(false);
  const locatedRef = useRef(false);
  const revealTimer = useRef<number | null>(null);
  /** Latest checkpoint the user scanned; floor swaps keep the pin here */
  const spotRef = useRef<{ floor: FloorId; x: number; y: number } | null>(null);
  const navigatingRef = useRef(false);
  /** Offline: the place last marked on the map, routed to once the QR is scanned */
  const placeRef = useRef<{ id: string; name: string } | null>(null);
  useEffect(
    () => () => {
      if (revealTimer.current != null) window.clearTimeout(revealTimer.current);
    },
    [],
  );
  /** Map-Filter-FirstTime — Wings / Building / Other sheet */
  const [filtering, setFiltering] = useState(false);
  /** Filter opened from search+keyboard — sheet rises into freed space */
  const [filterFromKeyboard, setFilterFromKeyboard] = useState(false);
  /** Active campus section ids (wing-* / bldg-*) — multi-select */
  const [filterSectionIds, setFilterSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  /** Other chip labels — survive panel close/reopen (map keeps POI overlays) */
  const [filterOther, setFilterOther] = useState<Set<string>>(
    () => new Set(),
  );
  const filterOtherRef = useRef(filterOther);
  filterOtherRef.current = filterOther;
  const filterSectionIdsRef = useRef(filterSectionIds);
  filterSectionIdsRef.current = filterSectionIds;
  /** Map-Navigation-FirstTime — nav card after a destination search */
  /**
   * Offline demo jump onto Navigating: nothing is located yet, so land on the
   * saved map with O104 marked and the QR scanner opening. Scanning then drops
   * the pin and starts the route, same as the live flow.
   */
  const offlineDemoNavRef = useRef(offline && scene === "navigating");
  const [navigating, setNavigating] = useState(
    () => scene === "navigating" && !offlineDemoNavRef.current,
  );
  /** Map-Success-FirstTime — after the pin reaches the room */
  const [arrived, setArrived] = useState(() => scene === "success");
  /**
   * Hint + Create Profile — blur-fade in after sticker burst settles.
   * Motion off / profile jump: already settled (show end state).
   * Success with motion on: wait for unilocate-burst settled.
   */
  const [burstSettled, setBurstSettled] = useState(
    () => scene === "profile" || reduce,
  );
  /** Scrim only after the success card has finished growing — never during morph */
  const [arrivalScrim, setArrivalScrim] = useState(
    () => scene === "success" || scene === "profile",
  );
  /** Demo jump onto success — settle immediately; live nav→arrive still grows */
  const skipArrivalGrowRef = useRef(
    scene === "success" || scene === "profile" || reduce,
  );
  const onNeedsProfileRef = useRef(onNeedsProfile);
  onNeedsProfileRef.current = onNeedsProfile;
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;
  const [destination, setDestination] = useState(() =>
    (scene === "navigating" && !offlineDemoNavRef.current) ||
    scene === "success" ||
    scene === "profile"
      ? DEMO_NAV_DEST.name
      : "",
  );
  const [navStep, setNavStep] = useState<NavStep | null>(() =>
    scene === "navigating" && !offlineDemoNavRef.current
      ? {
          icon: "walk",
          text: `Head to ${DEMO_NAV_DEST.name}`,
          meters: 42,
          arrive: false,
        }
      : null,
  );
  /**
   * Seed O104 only when the screen is opened straight into Navigating via the
   * stepper. A search (or QR scan) that starts navigation later keeps its own
   * destination, so mark it as already seeded.
   */
  const demoNavSeededRef = useRef(scene !== "navigating");
  const playTimerRef = useRef<number | null>(null);
  const floorIndexRef = useRef(0);
  const arrivedRef = useRef(false);
  /** Leg to resume after stair confirm — from map nav payload */
  const resumeLegRef = useRef<number | null>(null);
  /**
   * After nav/success, remounted search must blur-in (hide layout stretch).
   * First map paint stays sharp — no trip morph yet.
   */
  const searchReturnBlurRef = useRef(false);
  arrivedRef.current = arrived;
  navigatingRef.current = navigating;
  if (navigating || arrived) searchReturnBlurRef.current = true;

  /** Idle after first arrival — Create Profile CTA; pan ok, places locked */
  const profileGate = needsProfile && !navigating && !arrived;
  const profileGateRef = useRef(profileGate);
  profileGateRef.current = profileGate;

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
  /** Search → nav shared morph (on-screen reshape) */
  const tripCardTx = {
    layout: {
      duration: reduce ? 0 : SEARCH_MOVE_S,
      ease: EASE_IN_OUT,
    },
    opacity: {
      duration: reduce ? 0 : 0.2,
      ease: EASE_OUT,
    },
  };
  /** Nav → success — timed grow from nav box (no layoutId = no scrim flash) */
  const arrivalCardTx = {
    duration: reduce ? 0 : ARRIVAL_MORPH_S,
    ease: EASE_OUT,
  };
  /**
   * Inner content fades + blurs while the shell morphs (hides stretch).
   * Hold until layout finishes — unblurring early shows the stretch.
   */
  const tripContentInTx = {
    duration: reduce ? 0 : 0.2,
    ease: EASE_OUT,
    delay: reduce ? 0 : SEARCH_MOVE_S,
  };
  const arrivalContentInTx = {
    duration: reduce ? 0 : 0.26,
    ease: EASE_OUT,
    delay: reduce ? 0 : ARRIVAL_MORPH_S * 0.65,
  };
  const tripContentOutTx = {
    duration: reduce ? 0 : 0.14,
    ease: EASE_OUT,
  };
  const tripShellVariants = {
    show: { opacity: 1, transform: "translate3d(0, 0, 0)" },
    exit: { opacity: 1 },
  };
  const tripContentHidden = reduce
    ? { opacity: 0 }
    : { opacity: 0, filter: "blur(10px)" };
  const tripContentShown = reduce
    ? { opacity: 1 }
    : { opacity: 1, filter: "blur(0px)" };
  const tripContentVariants = {
    show: { ...tripContentShown, transition: tripContentInTx },
    exit: { ...tripContentHidden, transition: tripContentOutTx },
  };
  const arrivalContentVariants = {
    show: { ...tripContentShown, transition: arrivalContentInTx },
    exit: { ...tripContentHidden, transition: tripContentOutTx },
  };
  const arrivalDimTx = {
    duration: reduce ? 0 : 0.32,
    ease: EASE_OUT,
  };
  const drawerTx = {
    duration: reduce ? 0 : SEARCH_MOVE_S,
    ease: EASE_DRAWER,
  };
  /** Maneuver sign + copy — near-imperceptible crossfade (tens/trip) */
  const stepFadeTx = {
    duration: reduce ? 0 : 0.14,
    ease: EASE_OUT,
  };
  /** Stair confirm ↔ walk step — blur hides the body layout swap */
  const navBodyTx = {
    duration: reduce ? 0 : 0.18,
    ease: EASE_OUT,
  };
  const navBodyHidden = reduce
    ? { opacity: 0 }
    : { opacity: 0, filter: "blur(10px)" };
  const navBodyShown = reduce
    ? { opacity: 1 }
    : { opacity: 1, filter: "blur(0px)" };

  const mapWin = useCallback(() => {
    const iframe =
      iframeRef.current ||
      (typeof document !== "undefined"
        ? document.querySelector<HTMLIFrameElement>("iframe.mf__iframe")
        : null);
    return iframe?.contentWindow as
      | (Window & { ulNav?: MapNavApi })
      | null
      | undefined;
  }, []);

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
        try {
          /* Prefer shell selection — map storage may lag after Clear All */
          const shellIds = [...filterSectionIdsRef.current];
          if (shellIds.length) {
            mapWin()?.ulNav?.setSectionIds?.(shellIds);
            post({ type: "filter", ids: shellIds });
          } else {
            const cur = mapWin()?.ulNav?.getFilter?.();
            if (cur) {
              const ids = Array.isArray(cur.ids)
                ? cur.ids
                : cur.id
                  ? [cur.id]
                  : [];
              setFilterSectionIds(new Set(ids));
            }
          }
          /* Re-apply stacked Other overlays after floor reload */
          for (const f of OTHER_FILTERS) {
            if (!filterOtherRef.current.has(f.label)) continue;
            mapWin()?.ulNav?.focusPoi?.(f.poi, true);
            post({ type: "poi-focus", kind: f.poi, on: true });
          }
          /* Re-apply Create Profile place-lock after floor reload */
          post({ type: "lock-hits", on: profileGateRef.current });
        } catch {
          /* ignore */
        }
        return;
      }
      if (d.type === "filter" && d.filter && typeof d.filter === "object") {
        const f = d.filter as { id?: string | null; ids?: string[] };
        const ids = Array.isArray(f.ids) ? f.ids : f.id ? [f.id] : [];
        setFilterSectionIds(new Set(ids));
        return;
      }
      if (d.type === "place") {
        /* Offline search — place sits on another floor: open that floor on it */
        if (typeof d.id === "string" && d.id) {
          placeRef.current = {
            id: d.id,
            name: typeof d.name === "string" ? d.name : "",
          };
        }
        const nextId = d.floor as FloorId;
        const nextIndex = FLOORS.findIndex((f) => f.id === nextId);
        if (nextIndex < 0 || nextIndex === floorIndexRef.current) return;
        if (typeof d.id !== "string" || !d.id) return;
        const dir: 1 | -1 = nextIndex > floorIndexRef.current ? 1 : -1;
        captureView();
        const src = buildMapSrc(nextId, viewRef.current, reduce, {
          offline: true,
          place: d.id,
          located: locatedRef.current,
          spot: spotRef.current ?? undefined,
        });
        setStepDir(dir);
        setMapReady(false);
        setFloor(nextId);
        setLayers((prev) => [
          ...prev,
          { key: `L${layerSeq.current++}`, floor: nextId, src },
        ]);
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
          reduce,
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
        /* Ignore duplicate arrived posts — replay would restart the burst */
        if (arrivedRef.current) return;
        arrivedRef.current = true;
        if (typeof d.destination === "string" && d.destination) {
          setDestination(d.destination);
        }
        setBurstSettled(false);
        onNeedsProfileRef.current?.();
        setArrived(true);
        onSceneChangeRef.current?.("success");
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
  }, [captureView, mapWin, post, reduce]);

  /** Offline Navigating jump — mark O104, then open the QR scanner */
  useEffect(() => {
    if (!mapReady || !offlineDemoNavRef.current) return;
    offlineDemoNavRef.current = false;
    post({ type: "select", id: DEMO_NAV_DEST.id, fit: true });
    /* O104 sits on the first floor: give the floor swap time to land */
    /* Not cleared on re-run: the floor swap flips mapReady and would cancel it */
    demoScanTimer.current = window.setTimeout(
      () => setScanning(true),
      reduce ? 500 : 3200,
    );
  }, [mapReady, post, reduce]);
  const demoScanTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (demoScanTimer.current != null) window.clearTimeout(demoScanTimer.current);
    },
    [],
  );

  /** Demo Navigating jump — select O104 as soon as the map is ready */
  useEffect(() => {
    if (!mapReady || !navigating || arrived) return;
    if (scene !== "navigating" || demoNavSeededRef.current) return;
    demoNavSeededRef.current = true;
    post({ type: "select", id: DEMO_NAV_DEST.id, fit: true });
    setDestination(DEMO_NAV_DEST.name);
  }, [arrived, mapReady, navigating, post, scene]);

  /* Create Profile — keep pan/zoom; block place taps */
  useEffect(() => {
    if (!mapReady) return;
    post({ type: "lock-hits", on: profileGate });
  }, [mapReady, post, profileGate]);

  /* Campus map home only — loading sticker once, then reveal */
  useEffect(() => {
    if (!showMapLoadIntro) {
      setMapRevealed(true);
      return;
    }
    const gen = ++mapLoadGenRef.current;
    setMapRevealed(false);
    const t = window.setTimeout(() => {
      if (mapLoadGenRef.current !== gen) return;
      setMapRevealed(true);
    }, MAP_LOAD_MS);
    return () => window.clearTimeout(t);
    // Mount / first open of campus map only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Ask the map for the upcoming turn, then auto-start walk ~3s later */
  useEffect(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (!navigating || arrived) return;
    post({ type: "nav-sync" });
    const syncAgain = window.setTimeout(() => post({ type: "nav-sync" }), 120);
    /* Offline: no walking animation. The user advances by scanning the next QR. */
    if (!offline) {
      playTimerRef.current = window.setTimeout(
        () => {
          playTimerRef.current = null;
          post({ type: "play", leg: 0 });
        },
        reduce ? 0 : 3000,
      );
    }
    return () => {
      window.clearTimeout(syncAgain);
      if (playTimerRef.current != null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [arrived, navigating, offline, post, reduce]);

  /** Motion off — skip burst; otherwise fallback if settled never posts */
  useEffect(() => {
    if (!arrived || burstSettled) return;
    if (reduce) {
      setBurstSettled(true);
      return;
    }
    const t = window.setTimeout(() => setBurstSettled(true), 9000);
    return () => window.clearTimeout(t);
  }, [arrived, burstSettled, reduce]);

  /** Scrim after card grow — never mounts during the nav→success reshape */
  useEffect(() => {
    if (!arrived) {
      setArrivalScrim(false);
      return;
    }
    if (reduce || skipArrivalGrowRef.current) {
      setArrivalScrim(true);
      return;
    }
    setArrivalScrim(false);
    const t = window.setTimeout(
      () => setArrivalScrim(true),
      Math.round(ARRIVAL_MORPH_S * 1000),
    );
    return () => window.clearTimeout(t);
  }, [arrived, reduce]);

  const footerInTx = useMemo(
    () =>
      reduce
        ? { duration: 0 }
        : { duration: 0.48, ease: EASE_OUT },
    [reduce],
  );

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
      const src = buildMapSrc(next.id, viewRef.current, reduce, {
        offline,
        located: locatedRef.current,
        spot: spotRef.current ?? undefined,
      });
      setStepDir(dir);
      setMapReady(false);
      setFloor(next.id);
      setLayers((prev) => [
        ...prev,
        { key: `L${layerSeq.current++}`, floor: next.id, src },
      ]);
    },
    [captureView, floorIndex, offline, reduce, swapping],
  );

  /* Offline scan: one full sweep → code locks → scanner closes → pin drops at the QR corridor */
  useEffect(() => {
    if (!offline || !scanning) {
      setScanHit(false);
      return;
    }
    const sweep = reduce ? 900 : 3000;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        setScanHit(true);
        timers.push(
          window.setTimeout(() => {
            setScanning(false);
            locatedRef.current = true;
            /* Own timer: closing the scanner re-runs this effect and must not cancel the reveal */
            revealTimer.current = window.setTimeout(
                () => {
                  /* Already navigating: this QR is the next checkpoint. Hop straight there. */
                  if (navigatingRef.current) {
                    const api = mapWin()?.ulNav;
                    const cp = api?.nextCheckpoint?.();
                    const to = api?.state?.to;
                    if (!cp || !to) return;
                    spotRef.current = { floor: cp.floor, x: cp.x, y: cp.y };
                    if (cp.floor === FLOORS[floorIndexRef.current]?.id) {
                      post({ type: "reveal-user", to, spot: cp, final: cp.final });
                      return;
                    }
                    const nextIndex = FLOORS.findIndex((f) => f.id === cp.floor);
                    captureView();
                    const hopSrc = buildMapSrc(cp.floor, viewRef.current, reduce, {
                      offline: true,
                      located: true,
                      reveal: true,
                      go: to,
                      spot: spotRef.current,
                    });
                    setStepDir(nextIndex > floorIndexRef.current ? 1 : -1);
                    setMapReady(false);
                    setFloor(cp.floor);
                    setLayers((prev) => [
                      ...prev,
                      { key: `L${layerSeq.current++}`, floor: cp.floor, src: hopSrc },
                    ]);
                    return;
                  }
                  /* Place already picked: start navigating to it from the QR spot */
                  spotRef.current = null;
                  const picked = placeRef.current;
                  if (picked) {
                    /* Real destination chosen: don't let the stepper demo seed O104 */
                    demoNavSeededRef.current = true;
                    setDestination(picked.name || picked.id);
                    setNavigating(true);
                    onSceneChangeRef.current?.("navigating");
                  }
                  if (floorIndexRef.current === 0) {
                    post({ type: "reveal-user", to: picked?.id });
                    return;
                  }
                  captureView();
                  const src = buildMapSrc("ground", viewRef.current, reduce, {
                    offline: true,
                    located: true,
                    reveal: true,
                    go: picked?.id,
                  });
                  setStepDir(-1);
                  setMapReady(false);
                  setFloor("ground");
                  setLayers((prev) => [
                    ...prev,
                    { key: `L${layerSeq.current++}`, floor: "ground", src },
                  ]);
                },
                reduce ? 0 : 420,
            );
          }, reduce ? 300 : 900),
        );
      }, sweep),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [offline, scanning, reduce, post, captureView, mapWin]);

  /* Offline navigation: 2 to 3 seconds at each QR, then the next scan moves the user on */
  useEffect(() => {
    if (!offline || !navigating || arrived || scanning || !mapReady) return;
    const t = window.setTimeout(() => setScanning(true), reduce ? 800 : 2600);
    return () => window.clearTimeout(t);
  }, [arrived, mapReady, navigating, offline, reduce, scanning]);

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

  /* Offline — emptying the search field drops the place pin */
  const prevQueryRef = useRef(query);
  useEffect(() => {
    const emptied = prevQueryRef.current.trim() !== "" && !query.trim();
    prevQueryRef.current = query;
    if (emptied) placeRef.current = null;
    if (!offline || !mapReady || navigating || query.trim()) return;
    post({ type: "clear-place" });
  }, [mapReady, navigating, offline, post, query]);

  const endNavigation = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    post({ type: "stop" });
    placeRef.current = null;
    setNavigating(false);
    setArrived(false);
    setArrivalScrim(false);
    setBurstSettled(false);
    setNavStep(null);
    /* Stay on post-arrival (Create profile / After arrival) — not Campus map */
    onSceneChange?.(needsProfile || signedIn ? "profile" : "idle");
  }, [needsProfile, onSceneChange, post, signedIn]);

  const confirmStairFloor = useCallback(() => {
    if (!navStep?.awaitConfirm) return;
    const leg = resumeLegRef.current;
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
  }, [mapWin, navStep?.awaitConfirm, post]);

  const toggleFilterSection = useCallback(
    (id: string) => {
      setFilterSectionIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        const ids = [...next];
        try {
          mapWin()?.ulNav?.setSectionIds?.(ids);
        } catch {
          /* ignore */
        }
        post({ type: "filter", ids });
        return next;
      });
    },
    [mapWin, post],
  );

  const applyOtherFilter = useCallback(
    (filter: OtherFilter, on: boolean) => {
      setFilterOther((prev) => {
        const next = new Set(prev);
        if (on) next.add(filter.label);
        else next.delete(filter.label);
        return next;
      });
      if (on && filter.layer) {
        try {
          mapWin()?.ulNav?.setLayer?.(filter.layer, true);
        } catch {
          /* ignore */
        }
        post({ type: "layer", id: filter.layer, on: true });
      }
      try {
        mapWin()?.ulNav?.focusPoi?.(filter.poi, on);
      } catch {
        /* ignore */
      }
      post({ type: "poi-focus", kind: filter.poi, on });
    },
    [mapWin, post],
  );

  const clearMapFilters = useCallback(() => {
    setFilterSectionIds(new Set());
    setFilterOther(new Set());
    try {
      mapWin()?.ulNav?.setSectionIds?.([]);
      mapWin()?.ulNav?.focusPoi?.("washroom", false);
      mapWin()?.ulNav?.focusPoi?.("exit", false);
      mapWin()?.ulNav?.focusPoi?.("staff", false);
    } catch {
      /* ignore */
    }
    post({ type: "filter", ids: [] });
    for (const f of OTHER_FILTERS) {
      post({ type: "poi-focus", kind: f.poi, on: false });
    }
  }, [mapWin, post]);

  const submitSearch = useCallback(() => {
    const q = queryRef.current.trim();
    if (!q) return;
    if (offline) {
      /* Offline — no location to route from: just mark where the place is */
      post({ type: "search", query: q, submit: true });
      setSearching(false);
      return;
    }
    post({ type: "search", query: q, submit: true });
    setDestination(q);
    setSearching(false);
    setNavigating(true);
    onSceneChange?.("navigating");
  }, [offline, onSceneChange, post]);

  const openSearch = useCallback(() => {
    if (navigating || needsProfile || filtering) return;
    setScanning(false);
    setSearching(true);
  }, [filtering, navigating, needsProfile]);
  const closeSearch = useCallback(() => setSearching(false), []);
  const openFilter = useCallback(() => {
    if (arrived) return;
    setFilterFromKeyboard(searching);
    setSearching(false);
    /* Drop field focus so the soft keyboard isn't fighting the sheet enter */
    if (typeof document !== "undefined") {
      const ae = document.activeElement as HTMLElement | null;
      ae?.blur?.();
    }
    try {
      const cur = mapWin()?.ulNav?.getFilter?.();
      if (cur) {
        const ids = Array.isArray(cur.ids)
          ? cur.ids
          : cur.id
            ? [cur.id]
            : [];
        setFilterSectionIds(new Set(ids));
      }
    } catch {
      /* ignore */
    }
    setFiltering(true);
  }, [arrived, mapWin, searching]);
  const closeFilter = useCallback(() => {
    setFiltering(false);
    setFilterFromKeyboard(false);
  }, []);

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
    if (filtering) {
      closeFilter();
      return;
    }
    if (scanning) {
      setScanning(false);
      return;
    }
    if (searching) {
      closeSearch();
      return;
    }
    if (arrived || navigating) {
      endNavigation();
      return;
    }
    onBack?.();
  }, [
    arrived,
    closeFilter,
    closeSearch,
    endNavigation,
    filtering,
    navigating,
    onBack,
    scanning,
    searching,
  ]);

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

  const mfMode = [
    arrived ? "mf--success" : "",
    filtering ? "mf--filtering" : "",
    navigating && !arrived ? "mf--navigating" : "",
    searching && !filtering && !arrived ? "mf--searching" : "",
    profileGate ? "mf--profile" : "",
    scanning ? "mf--scanning" : "",
    !mapRevealed ? "mf--loading" : "",
  ]
    .filter(Boolean)
    .map((c) => ` ${c}`)
    .join("");

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
        {offline ? (
          <QrScannerCard active={scanning} reduce={reduce} hit={scanHit} />
        ) : null}

        <div className="mf__frame">
          <div className="mf__frame-inner">
            <MapLayers
              layers={layers}
              stepDir={stepDir}
              mapReady={mapReady}
              mapRevealed={mapRevealed}
              reduce={reduce}
              iframeRef={iframeRef}
              mapSwapVariants={mapSwapVariants}
              mapSwapTx={mapSwapTx}
            />
          </div>
        </div>

        {!profileGate && mapRevealed ? (
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
        ) : null}

        {offline && !navigating && !arrived ? (
          <button
            type="button"
            className="mf__scan"
            aria-label={scanning ? "Close QR scanner" : "Scan QR code"}
            aria-pressed={scanning}
            onClick={() => setScanning((s) => !s)}
          >
            <span className="mf__scan-face">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scanning ? UL_ASSETS.qrCloseIcon : UL_ASSETS.qrIcon}
                alt=""
                width={28}
                height={28}
              />
            </span>
          </button>
        ) : null}
      </motion.div>

      {/* After first arrival — Create Profile sits in the search slot (no trip morph) */}
      {profileGate ? (
        <motion.div
          className="mf__search mf__search--profile"
          initial={
            reduce
              ? false
              : { opacity: 0, transform: "translate3d(0, 10px, 0)" }
          }
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          transition={enterTx(0.1)}
        >
          <div className="mf__profile-cta-shell">
            <PrimaryCta
              className="mf__profile-cta"
              label="Create profile to keep navigating"
              animate={false}
              onClick={onCreateProfile}
            />
          </div>
        </motion.div>
      ) : null}

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
        {filtering ? (
          <MapFilterPanel
            key="map-filter"
            onClose={closeFilter}
            sectionIds={filterSectionIds}
            other={filterOther}
            onSectionToggle={toggleFilterSection}
            onOtherChange={applyOtherFilter}
            onClearAll={clearMapFilters}
            fromKeyboard={filterFromKeyboard}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {arrived && arrivalScrim ? (
          <motion.button
            key="success-dim"
            type="button"
            className="mf__success-dim"
            aria-label="Dismiss arrival"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={arrivalDimTx}
            onClick={endNavigation}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {arrived ? (
          <>
            <motion.div
              key="success-card"
              /*
                Grow from the nav card box — explicit top/height, no layoutId,
                so the scrim never stacks over a projected shared shell.
              */
              className="mf__success"
              role="region"
              aria-label="Arrived"
              style={{ borderRadius: 16, zIndex: 6 }}
              initial={
                skipArrivalGrowRef.current
                  ? false
                  : {
                      top: NAV_CARD_TOP,
                      height: NAV_CARD_H,
                      opacity: 1,
                    }
              }
              animate={{
                top: SUCCESS_CARD_TOP,
                height: SUCCESS_CARD_H,
                opacity: 1,
              }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translate3d(0, 16px, 0)" }
              }
              transition={arrivalCardTx}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              data-settled={burstSettled ? "true" : "false"}
            >
              {/* White while the burst plays, blue sky fades in once it settles */}
              <motion.div
                className="mf__success-sky"
                aria-hidden
                initial={false}
                animate={{ opacity: burstSettled ? 1 : 0 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT }
                }
              />
              {/* Motion off — mount already at settled end (no fade/blur enter) */}
              <motion.div
                className="mf__success-inner"
                variants={reduce ? undefined : arrivalContentVariants}
                initial={reduce ? false : tripContentHidden}
                animate={reduce ? undefined : "show"}
                exit={reduce ? undefined : "exit"}
                style={
                  reduce
                    ? { opacity: 1, filter: "none" }
                    : undefined
                }
              >
              <motion.button
                type="button"
                className="mf__success-close"
                aria-label="Close"
                initial={false}
                animate={{
                  opacity: burstSettled ? 1 : 0,
                  filter: burstSettled
                    ? "blur(0px)"
                    : reduce
                      ? "blur(0px)"
                      : "blur(10px)",
                  transform: burstSettled
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, 8px, 0)",
                }}
                transition={footerInTx}
                style={{
                  pointerEvents: burstSettled ? "auto" : "none",
                }}
                onClick={endNavigation}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={UL_ASSETS.clearIcon}
                  alt=""
                  width={24}
                  height={24}
                />
              </motion.button>
              {/*
                Mount only after the card has grown — resizing the iframe
                mid-morph used to ResizeObserver→restart the burst (played twice).
              */}
              {arrivalScrim || skipArrivalGrowRef.current ? (
                <iframe
                  className="mf__success-burst"
                  title="Arrival celebration"
                  src={`/animations/campus-sticker-burst.html?embed=1&v=14&mute=${soundEnabled && !reduce ? "0" : "1"}&reduce=${reduce ? "1" : "0"}&sub=${encodeURIComponent(successSubtitle)}`}
                  style={{ background: "transparent" }}
                  allow="autoplay"
                  tabIndex={-1}
                  onLoad={(e) => {
                    /* Motion off settles inside the page; motion on unlocks audio */
                    if (reduce || !soundEnabled) return;
                    try {
                      e.currentTarget.contentWindow?.postMessage(
                        { type: "burst-unlock" },
                        "*",
                      );
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              ) : null}
              <motion.div
                className="mf__success-wash"
                aria-hidden
                initial={false}
                animate={{ opacity: burstSettled ? 1 : 0 }}
                transition={footerInTx}
              />
              <motion.p
                className="mf__success-hint"
                initial={false}
                animate={{
                  opacity: burstSettled ? 1 : 0,
                  filter: burstSettled
                    ? "blur(0px)"
                    : reduce
                      ? "blur(0px)"
                      : "blur(10px)",
                  transform: burstSettled
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, 10px, 0)",
                }}
                transition={footerInTx}
              >
                {needsProfile
                  ? "Create profile for more navigation"
                  : signedIn && !offline
                    ? "Share your location with a friend"
                    : "Nice, ready for the next stop"}
              </motion.p>
              <motion.div
                className="mf__success-cta-wrap"
                initial={false}
                animate={{
                  opacity: burstSettled ? 1 : 0,
                  filter: burstSettled
                    ? "blur(0px)"
                    : reduce
                      ? "blur(0px)"
                      : "blur(10px)",
                  transform: burstSettled
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, 12px, 0)",
                }}
                transition={footerInTx}
                style={{
                  pointerEvents: burstSettled ? "auto" : "none",
                }}
              >
                <PrimaryCta
                  className="mf__success-cta"
                  label={
                    needsProfile
                      ? "Create Profile"
                      : signedIn && !offline
                        ? "Share"
                        : "Done"
                  }
                  width={336}
                  height={48}
                  animate={false}
                  onClick={
                    needsProfile ? onCreateProfile : endNavigation
                  }
                />
              </motion.div>
              </motion.div>
            </motion.div>
          </>
        ) : navigating ? (
          <motion.div
            key="nav-card"
            layoutId="mf-trip-card"
            className="mf__nav"
            role="region"
            aria-label="Navigation"
            style={{ borderRadius: 16 }}
            initial="show"
            animate="show"
            /* Instant handoff into success grow — no ghost under the morph */
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, transition: { duration: 0 } }
            }
            variants={tripShellVariants}
            transition={tripCardTx}
          >
            <motion.div
              className="mf__nav-inner"
              variants={tripContentVariants}
              initial={tripContentHidden}
              animate="show"
              exit="exit"
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
                <p className="mf__nav-dest-name">
                  {destination || "Destination"}
                </p>
              </div>
              <button
                type="button"
                className="mf__nav-filter"
                aria-label="Filter"
                onClick={openFilter}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={UL_ASSETS.filterIcon}
                  alt=""
                  width={30}
                  height={28}
                />
              </button>
              <button
                type="button"
                className="mf__nav-end"
                onClick={endNavigation}
              >
                End
              </button>
              <div className="mf__nav-rule" aria-hidden />
              <div className="mf__nav-body">
                <AnimatePresence mode="sync" initial={false}>
                  {navStep?.awaitConfirm ? (
                    <motion.div
                      key="stair"
                      className="mf__nav-stair"
                      initial={navBodyHidden}
                      animate={navBodyShown}
                      exit={navBodyHidden}
                      transition={navBodyTx}
                    >
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
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step"
                      className="mf__nav-step"
                      initial={navBodyHidden}
                      animate={navBodyShown}
                      exit={navBodyHidden}
                      transition={navBodyTx}
                    >
                      {/*
                        Crossfade only when the maneuver changes — not every
                        meter tick (that remount was the nav-body blink).
                      */}
                      <AnimatePresence mode="sync" initial={false}>
                        <motion.div
                          key={`${navStep?.icon ?? "walk"}|${navStep?.text ?? ""}`}
                          className="mf__nav-step-face"
                          initial={reduce ? false : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={stepFadeTx}
                        >
                          <div className="mf__nav-sign" aria-hidden>
                            <NavManeuverSign
                              icon={navStep?.icon ?? "walk"}
                            />
                          </div>
                          <div className="mf__nav-copy">
                            <p className="mf__nav-instruction">
                              {navStep?.text || "Finding route…"}
                            </p>
                            <p className="mf__nav-distance">
                              {navStep
                                ? formatNavDistance(
                                    navStep.meters,
                                    navStep.arrive,
                                  )
                                : "—"}
                            </p>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : !needsProfile && mapRevealed ? (
          <motion.div
            key="search-card"
            /* Skip shared morph after nav/success — layout stretch warps the field */
            layoutId={
              reduce || searchReturnBlurRef.current
                ? undefined
                : "mf-trip-card"
            }
            className="mf__search"
            style={{ borderRadius: 16 }}
            initial={
              reduce
                ? "show"
                : { opacity: 0, transform: "translate3d(0, 10px, 0)" }
            }
            animate="show"
            exit="exit"
            variants={tripShellVariants}
            transition={tripCardTx}
            onFocusCapture={(e) => {
              const t = e.target as Element | null;
              if (t?.closest?.(".ul-search__filter, .ul-search__trailing")) {
                return;
              }
              openSearch();
            }}
            onClick={(e) => {
              const t = e.target as Element | null;
              if (t?.closest?.(".ul-search__filter, .ul-search__trailing")) {
                return;
              }
              openSearch();
            }}
          >
            <motion.div
              className="mf__search-inner"
              variants={tripContentVariants}
              initial={
                searchReturnBlurRef.current ? tripContentHidden : false
              }
              animate="show"
              exit="exit"
              transition={
                searchReturnBlurRef.current
                  ? {
                      duration: reduce ? 0 : 0.28,
                      ease: EASE_OUT,
                      delay: 0,
                    }
                  : undefined
              }
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
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openFilter();
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={UL_ASSETS.filterIcon}
                      alt=""
                      width={30}
                      height={28}
                    />
                  </button>
                }
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
