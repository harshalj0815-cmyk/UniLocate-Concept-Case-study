"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SearchCollegeFirstTime from "@/components/screens/SearchCollegeFirstTime";
import CollegeResultsList from "@/components/ui/CollegeResultsList";
import FocusedSearchField from "@/components/ui/FocusedSearchField";
import IosKeyboard from "@/components/ui/IosKeyboard";
import RecommendationList from "@/components/ui/RecommendationList";
import ScenePolaroid from "@/components/ui/ScenePolaroid";
import SearchField from "@/components/ui/SearchField";
import { SCENE_POLAROIDS } from "@/lib/scenePolaroids";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

type Phase = "home" | "search" | "closing" | "results";

const DEMO_QUERY = "Pillai College";
/** Matches .scf__title — home stack centered on 874px screen */
const HOME_TITLE_Y = 332;
const FOCUS_TITLE_Y = 65;
const HOME_TITLE = (
  <>
    New here? Let’s find
    <br />
    your campus
  </>
);
const HOME_SEARCH_Y = 415;
const FOCUS_SEARCH_Y = 116;
/** Search + results tuck up here when title/back hide on scroll */
const COLLAPSED_SEARCH_Y = FOCUS_TITLE_Y;
const RESULTS_LIFT = FOCUS_SEARCH_Y - COLLAPSED_SEARCH_Y;
const MOVE_S = 0.28;
const FADE_S = 0.22;
const TYPE_MS = 36;
const EASE_MOVE = [0.77, 0, 0.175, 1] as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

type SearchCollegeFlowProps = {
  onGetStarted?: () => void;
  /** False while SignUp/LogIn sits on top — used to remount polaroid drag */
  active?: boolean;
};

/** Prototype flow: FirstTime ↔ OnClick ↔ CollegeResults */
export default function SearchCollegeFlow({
  onGetStarted,
  active = true,
}: SearchCollegeFlowProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("home");
  /** CSS first-visit enter — settles so hide→show from SignUp won't replay */
  const [homeEnter, setHomeEnter] = useState(true);
  /** After first search open — shared title/search/polaroid scene */
  const [useShared, setUseShared] = useState(false);
  const [query, setQuery] = useState("");
  const [showRecs, setShowRecs] = useState(false);
  /** Visual focus — lags one frame on open so motion runs from home poses */
  const [focused, setFocused] = useState(false);
  /** Results “fetch” — Paper skeleton for 2s */
  const [resultsLoading, setResultsLoading] = useState(false);
  /** Results header (title + back) — hide on scroll down, show on scroll up */
  const [resultsHeader, setResultsHeader] = useState(true);
  /** Bumps when returning from SignUp so Framer drag elastic remounts cleanly */
  const [polaroidGen, setPolaroidGen] = useState(0);
  const wasActiveRef = useRef(active);
  const typingRef = useRef(false);
  const typeTimerRef = useRef<number | null>(null);
  const resultsTimerRef = useRef<number | null>(null);

  const showingResults = phase === "results";
  const searchChrome = focused || showingResults;
  const duration = reduce ? 0 : MOVE_S;
  const fade = reduce ? 0 : FADE_S;

  const stopTyping = useCallback(() => {
    typingRef.current = false;
    if (typeTimerRef.current != null) {
      window.clearTimeout(typeTimerRef.current);
      typeTimerRef.current = null;
    }
  }, []);

  const clearResultsTimer = useCallback(() => {
    if (resultsTimerRef.current != null) {
      window.clearTimeout(resultsTimerRef.current);
      resultsTimerRef.current = null;
    }
  }, []);

  const openSearch = useCallback(() => {
    stopTyping();
    setHomeEnter(false);
    setUseShared(true);
    setQuery("");
    setShowRecs(false);
    setPhase("search");
    setFocused(false);
  }, [stopTyping]);

  const handleGetStarted = useCallback(() => {
    setHomeEnter(false);
    onGetStarted?.();
  }, [onGetStarted]);

  /* After first enter finishes, lock settled so SignUp round-trip can't replay */
  useEffect(() => {
    if (!homeEnter || useShared) return;
    const ms = reduce ? 0 : 1700;
    const t = window.setTimeout(() => setHomeEnter(false), ms);
    return () => window.clearTimeout(t);
  }, [homeEnter, reduce, useShared]);

  /* Remount polaroids when college screen becomes active again */
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      setPolaroidGen((n) => n + 1);
    }
    wasActiveRef.current = active;
  }, [active]);

  const closeSearch = useCallback(() => {
    stopTyping();
    setShowRecs(false);
    setFocused(false);
    setPhase("closing");
  }, [stopTyping]);

  const openResults = useCallback(() => {
    stopTyping();
    clearResultsTimer();
    setShowRecs(false);
    if (!query.trim()) setQuery(DEMO_QUERY);
    setResultsHeader(true);
    setResultsLoading(true);
    setPhase("results");
    setFocused(true);
    resultsTimerRef.current = window.setTimeout(() => {
      setResultsLoading(false);
      resultsTimerRef.current = null;
    }, 2000);
  }, [clearResultsTimer, query, stopTyping]);

  const backFromChrome = useCallback(() => {
    if (showingResults) {
      clearResultsTimer();
      setResultsLoading(false);
      setResultsHeader(true);
      setPhase("search");
      setFocused(true);
      setShowRecs(Boolean(query.trim()));
      return;
    }
    closeSearch();
  }, [clearResultsTimer, closeSearch, query, showingResults]);

  const resultsHeaderShown = !showingResults || resultsHeader;
  const resultsCollapsed = showingResults && !resultsHeader;
  const titleY =
    (searchChrome ? FOCUS_TITLE_Y : HOME_TITLE_Y) -
    (resultsCollapsed ? 10 : 0);
  const searchY = !searchChrome
    ? HOME_SEARCH_Y
    : resultsCollapsed
      ? COLLAPSED_SEARCH_Y
      : FOCUS_SEARCH_Y;

  /* Open: mount shared scene at home poses, then ease to focused */
  useEffect(() => {
    if (phase !== "search") return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFocused(true));
    });
    return () => cancelAnimationFrame(id);
  }, [phase]);

  /* Close: wait for reverse motion, then settle on home */
  useEffect(() => {
    if (phase !== "closing") return;
    const ms = reduce ? 0 : MOVE_S * 1000;
    const t = window.setTimeout(() => setPhase("home"), ms);
    return () => window.clearTimeout(t);
  }, [phase, reduce]);

  useEffect(
    () => () => {
      stopTyping();
      clearResultsTimer();
    },
    [clearResultsTimer, stopTyping],
  );

  const startTyping = useCallback(() => {
    if (!focused || phase !== "search") return;
    if (typingRef.current) return;
    if (query === DEMO_QUERY) return;

    stopTyping();
    typingRef.current = true;
    setShowRecs(false);
    setQuery("");

    if (reduce) {
      setQuery(DEMO_QUERY);
      setShowRecs(true);
      typingRef.current = false;
      return;
    }

    let i = 0;
    const tick = () => {
      i += 1;
      const next = DEMO_QUERY.slice(0, i);
      setQuery(next);
      if (i === 1) setShowRecs(true);
      if (i >= DEMO_QUERY.length) {
        typingRef.current = false;
        typeTimerRef.current = null;
        return;
      }
      typeTimerRef.current = window.setTimeout(tick, TYPE_MS);
    };
    typeTimerRef.current = window.setTimeout(tick, TYPE_MS);
  }, [focused, phase, query, reduce, stopTyping]);

  const clearSearch = useCallback(() => {
    stopTyping();
    clearResultsTimer();
    setQuery("");
    setShowRecs(false);
    setResultsLoading(false);
    if (showingResults) {
      setPhase("search");
      setFocused(true);
    }
  }, [clearResultsTimer, showingResults, stopTyping]);

  const onFocusedFieldActivate = useCallback(() => {
    /* Results → back to recommendation list */
    if (showingResults) {
      clearResultsTimer();
      setResultsLoading(false);
      setResultsHeader(true);
      setPhase("search");
      setFocused(true);
      setShowRecs(true);
      return;
    }
    if (!query.trim()) {
      startTyping();
      return;
    }
    setShowRecs(true);
  }, [clearResultsTimer, query, showingResults, startTyping]);

  const dismissOutside = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (showingResults) return;
      if (!focused || phase !== "search") return;
      const target = e.target as Element | null;
      if (!target?.closest) return;
      if (
        target.closest(
          ".ul-search, .ul-shared-search, .sco-recs, .ul-shared-recs, .sco-kb, .ul-shared-kb, .ul-back",
        )
      ) {
        return;
      }
      /* Text present → only dismiss suggestions; empty → leave search */
      if (query.trim()) {
        setShowRecs(false);
        return;
      }
      closeSearch();
    },
    [closeSearch, focused, phase, query, showingResults],
  );

  if (!useShared) {
    return (
      <SearchCollegeFirstTime
        key={`home-${polaroidGen}`}
        animate={homeEnter}
        onSearchActivate={openSearch}
        onGetStarted={handleGetStarted}
      />
    );
  }

  const moveTx = {
    duration,
    ease: EASE_MOVE,
  };
  const fadeTx = {
    duration: fade,
    ease: EASE_OUT,
  };
  /** Text morph — ease-in-out + blur seams the swap into one transform */
  const titleMorphTx = {
    duration: fade,
    ease: EASE_MOVE,
  };
  const chromeTx = showingResults ? fadeTx : moveTx;
  const drawerTx = {
    duration,
    ease: EASE_DRAWER,
  };

  return (
    <div
      className={`ul-flow${searchChrome ? " ul-flow--focused" : ""}${showingResults ? " ul-flow--results" : ""}${resultsCollapsed ? " ul-flow--results-collapsed" : ""}`}
      onClick={dismissOutside}
    >
      <div className="ul-flow__map" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ul-flow__map-img" src={UL_ASSETS.backgroundMap} alt="" />
      </div>

      {/* Same polaroids — slide out to focused poses / back home */}
      <div className="ul-flow__polaroids" aria-hidden>
        {SCENE_POLAROIDS.map((card) => (
          <ScenePolaroid
            key={`${card.id}-${polaroidGen}`}
            card={card}
            focused={searchChrome}
            moveDuration={MOVE_S}
          />
        ))}
      </div>

      {/* Home chrome only — logo / divider / CTA */}
      <motion.div
        className="ul-flow__home"
        aria-hidden={searchChrome}
        initial={false}
        animate={{
          opacity: searchChrome ? 0 : 1,
          transform: searchChrome
            ? "translate3d(0, -8px, 0)"
            : "translate3d(0, 0, 0)",
        }}
        transition={
          searchChrome ? fadeTx : { ...fadeTx, delay: reduce ? 0 : 0.04 }
        }
      >
        <SearchCollegeFirstTime
          animate={false}
          hideSearch
          hideTitle
          hideMap
          hidePolaroids
          dimmed={false}
          onGetStarted={handleGetStarted}
        />
      </motion.div>

      {/* Back — focused search + results */}
      <motion.button
        type="button"
        className="ul-back"
        aria-label="Back"
        initial={false}
        animate={{
          opacity: searchChrome && resultsHeaderShown ? 1 : 0,
          transform:
            searchChrome && resultsHeaderShown
              ? "translate3d(0, 0, 0)"
              : searchChrome
                ? "translate3d(0, -8px, 0)"
                : "translate3d(-6px, 0, 0)",
        }}
        transition={fadeTx}
        style={{
          pointerEvents: searchChrome && resultsHeaderShown ? "auto" : "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          backFromChrome();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={UL_ASSETS.careLeft} alt="" width={20} height={26} />
      </motion.button>

      {/* Shared title — home copy morphs into “Search College” on focus */}
      <motion.h1
        className={`ul-shared-title${searchChrome ? " ul-shared-title--focus" : " ul-shared-title--home"}`}
        initial={false}
        animate={{
          opacity: resultsHeaderShown ? 1 : 0,
          transform: `translate3d(-50%, ${titleY}px, 0)`,
        }}
        transition={chromeTx}
        aria-hidden={!resultsHeaderShown}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={searchChrome ? "focus" : "home"}
            className="ul-shared-title__copy"
            initial={
              reduce
                ? false
                : { opacity: 0, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={
              reduce
                ? undefined
                : { opacity: 0, filter: "blur(8px)" }
            }
            transition={titleMorphTx}
          >
            {searchChrome ? "Search College" : HOME_TITLE}
          </motion.span>
        </AnimatePresence>
      </motion.h1>

      {/* Shared search bar — tucks up when results header collapses */}
      <motion.div
        className="ul-shared-search"
        initial={false}
        animate={{
          transform: `translate3d(0, ${searchY}px, 0)`,
        }}
        transition={chromeTx}
      >
        <div className="ul-shared-search__stack">
          <motion.div
            className="ul-shared-search__face"
            initial={false}
            animate={{ opacity: searchChrome ? 0 : 1 }}
            transition={fadeTx}
            style={{ pointerEvents: searchChrome ? "none" : "auto" }}
          >
            <SearchField animate={false} onActivate={openSearch} />
          </motion.div>
          <motion.div
            className="ul-shared-search__face ul-shared-search__face--focus"
            initial={false}
            animate={{ opacity: searchChrome ? 1 : 0 }}
            transition={fadeTx}
            style={{ pointerEvents: searchChrome ? "auto" : "none" }}
          >
            <FocusedSearchField
              query={query}
              onClear={clearSearch}
              onActivate={onFocusedFieldActivate}
              showCaret={!showingResults}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Recommendations — appear as typing starts */}
      <motion.div
        className="ul-shared-recs"
        initial={false}
        animate={{
          opacity: focused && showRecs && !showingResults ? 1 : 0,
          transform:
            focused && showRecs && !showingResults
              ? "translate3d(0, 0, 0) scale(1)"
              : "translate3d(0, -8px, 0) scale(0.97)",
        }}
        transition={{
          duration: fade,
          ease: EASE_OUT,
        }}
        style={{
          pointerEvents:
            focused && showRecs && !showingResults ? "auto" : "none",
        }}
      >
        <RecommendationList />
      </motion.div>

      {/* College results — keyboard Return; lifts with collapsed search */}
      <motion.div
        className="ul-shared-results"
        initial={false}
        animate={{
          opacity: showingResults ? 1 : 0,
          transform: showingResults
            ? `translate3d(0, ${resultsCollapsed ? -RESULTS_LIFT : 0}px, 0)`
            : "translate3d(0, 12px, 0)",
        }}
        transition={fadeTx}
        style={{ pointerEvents: showingResults ? "auto" : "none" }}
        aria-hidden={!showingResults}
      >
        <CollegeResultsList
          loading={resultsLoading}
          onHeaderVisible={setResultsHeader}
        />
      </motion.div>

      {/* Keyboard — slides with drawer curve; hidden on results */}
      <motion.div
        className="ul-shared-kb"
        initial={false}
        animate={{
          transform:
            focused && !showingResults
              ? "translate3d(0, 0, 0)"
              : "translate3d(0, 100%, 0)",
        }}
        transition={drawerTx}
        aria-hidden={!focused || showingResults}
      >
        <IosKeyboard
          onActivate={
            focused && !showingResults ? startTyping : undefined
          }
          onEnter={focused && !showingResults ? openResults : undefined}
        />
      </motion.div>
    </div>
  );
}
