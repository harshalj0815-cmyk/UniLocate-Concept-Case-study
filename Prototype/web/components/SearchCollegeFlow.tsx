"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDemoReduceMotion } from "@/lib/demoMotion";
import SearchCollegeFirstTime from "@/components/screens/SearchCollegeFirstTime";
import CollegeResultsList from "@/components/ui/CollegeResultsList";
import FocusedSearchField from "@/components/ui/FocusedSearchField";
import IosKeyboard from "@/components/ui/IosKeyboard";
import CollegeNotMappedEmpty from "@/components/ui/CollegeNotMappedEmpty";
import OfflineScreen from "@/components/ui/OfflineScreen";
import PrimaryCta from "@/components/ui/PrimaryCta";
import RecommendationList from "@/components/ui/RecommendationList";
import ScenePolaroid from "@/components/ui/ScenePolaroid";
import SearchField from "@/components/ui/SearchField";
import { SCENE_POLAROIDS } from "@/lib/scenePolaroids";
import type { CollegeResult } from "@/lib/collegeResults";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

type Phase = "home" | "search" | "closing" | "results";

const DEMO_QUERY_REC = "Pillai College";
const DEMO_QUERY_EMPTY = "Sies College";
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
/** Signed-in home — Create-profile / campus Destination slot */
const HOME_SEARCH_Y_SIGNED = 798;
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

type CollegeScene = "home" | "search" | "results";

export type SearchRecVariant = "recommendation" | "empty";

type SearchCollegeFlowProps = {
  onGetStarted?: () => void;
  /** Open campus map after tapping a college result */
  onSelectCollege?: (college: CollegeResult) => void;
  /** False while SignUp/LogIn sits on top — used to remount polaroid drag */
  active?: boolean;
  /** Demo board — jump into a college beat */
  scene?: CollegeScene;
  onSceneChange?: (scene: CollegeScene) => void;
  /** Demo board — Recommendation vs Empty under search */
  recVariant?: SearchRecVariant;
  /** Signed in — hide Get Started (post-signup) */
  signedIn?: boolean;
  /** Stage Online | Offline — offline replaces college UI with wifi empty */
  offline?: boolean;
  /** Offline + signed in — "Use Offline Maps" opens the offline campus map */
  onUseOfflineMaps?: () => void;
};

/** Prototype flow: FirstTime ↔ OnClick ↔ CollegeResults */
export default function SearchCollegeFlow({
  onGetStarted,
  onSelectCollege,
  active = true,
  scene = "home",
  onSceneChange,
  recVariant = "recommendation",
  signedIn = false,
  offline = false,
  onUseOfflineMaps,
}: SearchCollegeFlowProps) {
  const reduce = useDemoReduceMotion();
  const [phase, setPhase] = useState<Phase>(() =>
    scene === "results" ? "results" : scene === "search" ? "search" : "home",
  );
  /** CSS first-visit enter — never for signed-in (same settled SCF background) */
  const [homeEnter, setHomeEnter] = useState(
    () => scene === "home" && !signedIn,
  );
  /** After first search open — shared title/search/polaroid scene */
  const [useShared, setUseShared] = useState(() => scene !== "home");
  const [query, setQuery] = useState(() =>
    scene === "results"
      ? recVariant === "empty"
        ? DEMO_QUERY_EMPTY
        : DEMO_QUERY_REC
      : "",
  );
  const demoQuery =
    recVariant === "empty" ? DEMO_QUERY_EMPTY : DEMO_QUERY_REC;
  const prevRecVariantRef = useRef(recVariant);
  const [showRecs, setShowRecs] = useState(false);
  /** Remount blueprint unfold each empty-results enter */
  const [emptyPlayKey, setEmptyPlayKey] = useState(0);
  /** Copy + CTA after unfold settles */
  const [emptyChromeReady, setEmptyChromeReady] = useState(false);
  /** Visual focus — lags one frame on open so motion runs from home poses */
  const [focused, setFocused] = useState(() => scene === "results");
  /** Results “fetch” — Paper skeleton for 2s (skipped on demo jump remount) */
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
  /** College results empty — not-mapped (Sies) */
  const resultsEmpty = showingResults && recVariant === "empty";
  const kbOpen = focused && !showingResults;
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
    setEmptyChromeReady(false);
    setPhase("search");
    setFocused(false);
    onSceneChange?.("search");
  }, [onSceneChange, stopTyping]);

  const handleGetStarted = useCallback(() => {
    setHomeEnter(false);
    onGetStarted?.();
  }, [onGetStarted]);

  /* After first enter finishes, lock settled so SignUp round-trip can't replay */
  useEffect(() => {
    if (!homeEnter || useShared) return;
    const ms = reduce ? 0 : 2000;
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
    setEmptyChromeReady(false);
    setFocused(false);
    setPhase("closing");
    onSceneChange?.("home");
  }, [onSceneChange, stopTyping]);

  const openResults = useCallback(() => {
    stopTyping();
    clearResultsTimer();
    setShowRecs(false);
    if (!query.trim()) setQuery(demoQuery);
    setResultsHeader(true);
    setPhase("results");
    setFocused(true);
    onSceneChange?.("results");

    /* Empty results — unfold map, no skeleton cards */
    if (recVariant === "empty") {
      setResultsLoading(false);
      setResultsHeader(true);
      setEmptyChromeReady(false);
      setEmptyPlayKey((k) => k + 1);
      return;
    }

    /* Motion off — skip skeleton; show cards immediately */
    if (reduce) {
      setResultsLoading(false);
      return;
    }
    setResultsLoading(true);
    resultsTimerRef.current = window.setTimeout(() => {
      setResultsLoading(false);
      resultsTimerRef.current = null;
    }, 2000);
  }, [
    clearResultsTimer,
    demoQuery,
    onSceneChange,
    query,
    recVariant,
    reduce,
    stopTyping,
  ]);

  /** In-app stack: results → search → home (not the demo stepper) */
  const backFromChrome = useCallback(() => {
    if (showingResults) {
      clearResultsTimer();
      setResultsLoading(false);
      setResultsHeader(true);
      setEmptyChromeReady(false);
      setPhase("search");
      setFocused(true);
      setShowRecs(
        recVariant === "recommendation" && Boolean(query.trim()),
      );
      onSceneChange?.("search");
      return;
    }
    closeSearch();
  }, [
    clearResultsTimer,
    closeSearch,
    onSceneChange,
    query,
    recVariant,
    showingResults,
  ]);

  /* Empty results never hide chrome — back must stay tappable */
  const resultsHeaderShown =
    !showingResults || resultsEmpty || resultsHeader;
  const resultsCollapsed = showingResults && !resultsHeader;
  const titleY =
    (signedIn || searchChrome ? FOCUS_TITLE_Y : HOME_TITLE_Y) -
    (resultsCollapsed ? 10 : 0);
  const homeSearchY = signedIn ? HOME_SEARCH_Y_SIGNED : HOME_SEARCH_Y;
  const searchY = !searchChrome
    ? homeSearchY
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

  const startTyping = useCallback(
    (opts?: { force?: boolean }) => {
      if (!focused || phase !== "search") return;
      if (typingRef.current && !opts?.force) return;
      if (query === demoQuery && !opts?.force) return;

      stopTyping();
      typingRef.current = true;
      setShowRecs(false);
      setQuery("");

      /* Empty: type only — map empty reveals on Enter */
      const revealWhileTyping = recVariant !== "empty";

      if (reduce) {
        setQuery(demoQuery);
        if (revealWhileTyping) setShowRecs(true);
        typingRef.current = false;
        return;
      }

      let i = 0;
      const tick = () => {
        i += 1;
        const next = demoQuery.slice(0, i);
        setQuery(next);
        if (i === 1 && revealWhileTyping) setShowRecs(true);
        if (i >= demoQuery.length) {
          typingRef.current = false;
          typeTimerRef.current = null;
          return;
        }
        typeTimerRef.current = window.setTimeout(tick, TYPE_MS);
      };
      typeTimerRef.current = window.setTimeout(tick, TYPE_MS);
    },
    [demoQuery, focused, phase, query, recVariant, reduce, stopTyping],
  );

  /** Enter → college results (cards or not-mapped empty) */
  const onSearchEnter = useCallback(() => {
    stopTyping();
    setQuery(demoQuery);
    setShowRecs(false);
    openResults();
  }, [demoQuery, openResults, stopTyping]);

  /* Segment swap — search starts blank; type only on tap. Results toggles cards ↔ empty */
  useEffect(() => {
    if (prevRecVariantRef.current === recVariant) return;
    prevRecVariantRef.current = recVariant;
    setEmptyChromeReady(false);
    stopTyping();

    if (showingResults) {
      setQuery(demoQuery);
      setResultsHeader(true);
      if (recVariant === "empty") {
        setResultsLoading(false);
        setEmptyPlayKey((k) => k + 1);
      } else if (!reduce) {
        setResultsLoading(true);
        clearResultsTimer();
        resultsTimerRef.current = window.setTimeout(() => {
          setResultsLoading(false);
          resultsTimerRef.current = null;
        }, 2000);
      } else {
        setResultsLoading(false);
      }
      return;
    }

    if (!focused || phase !== "search") return;
    setQuery("");
    setShowRecs(false);
  }, [
    clearResultsTimer,
    demoQuery,
    focused,
    phase,
    recVariant,
    reduce,
    showingResults,
    stopTyping,
  ]);

  const clearSearch = useCallback(() => {
    stopTyping();
    clearResultsTimer();
    setQuery("");
    setShowRecs(false);
    setEmptyChromeReady(false);
    setResultsLoading(false);
    if (showingResults) {
      setPhase("search");
      setFocused(true);
    }
  }, [clearResultsTimer, showingResults, stopTyping]);

  const onFocusedFieldActivate = useCallback(() => {
    /* Results → back to search (keyboard) */
    if (showingResults) {
      clearResultsTimer();
      setResultsLoading(false);
      setResultsHeader(true);
      setPhase("search");
      setFocused(true);
      setEmptyChromeReady(false);
      setShowRecs(
        recVariant === "recommendation" && Boolean(query.trim()),
      );
      onSceneChange?.("search");
      return;
    }
    if (!query.trim()) {
      startTyping();
      return;
    }
    /* Empty waits for Enter; recs restore on tap */
    if (recVariant !== "empty") setShowRecs(true);
  }, [
    clearResultsTimer,
    onSceneChange,
    query,
    recVariant,
    showingResults,
    startTyping,
  ]);

  /* Physical keyboard — type starts the demo query; Enter commits */
  useEffect(() => {
    if (!active || !focused || phase !== "search" || showingResults) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as Element | null;
      if (target?.closest?.("input, textarea, [contenteditable=true]")) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onSearchEnter();
        return;
      }

      const isPrintable = e.key.length === 1 && e.key !== " ";
      if (!isPrintable && e.key !== "Backspace" && e.key !== " ") return;
      if (typingRef.current) return;

      e.preventDefault();
      startTyping();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, focused, onSearchEnter, phase, showingResults, startTyping]);

  const dismissOutside = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (showingResults) return;
      if (!focused || phase !== "search") return;
      const target = e.target as Element | null;
      if (!target?.closest) return;
      if (
        target.closest(
          ".ul-search, .ul-shared-search, .sco-recs, .ul-shared-recs, .sco-kb, .ul-shared-kb, .ul-back, .ul-kebab",
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

  /* Offline — per-step skeleton, then wifi empty (replay on scene change) */
  if (offline) {
    const offlineVariant =
      scene === "results" ? "results" : scene === "search" ? "search" : "home";
    return (
      <OfflineScreen
        key={offlineVariant}
        variant={offlineVariant}
        signedIn={signedIn}
        onUseOfflineMaps={onUseOfflineMaps}
      />
    );
  }

  if (!useShared) {
    return (
      <SearchCollegeFirstTime
        key={`home-${polaroidGen}`}
        animate={homeEnter && !signedIn}
        signedInHome={signedIn}
        hideGetStarted={signedIn}
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

      {/*
        Polaroids — home poses on first-open home; focus poses on search.
        Signed-in home uses the Search-college focus bed (always focus poses).
      */}
      <div className="ul-flow__polaroids" aria-hidden>
        {SCENE_POLAROIDS.map((card) => (
          <ScenePolaroid
            key={`${card.id}-${polaroidGen}`}
            card={card}
            focused={signedIn || searchChrome}
            moveDuration={signedIn ? 0 : MOVE_S}
          />
        ))}
      </div>

      {/*
        Signed-in flat-map bed — stays mounted; focus↔home is opacity fade only
        (unmounting would replay the HTML rise-from-bottom).
      */}
      {signedIn ? (
        <motion.div
          className="ul-signed-hero"
          aria-hidden
          initial={false}
          animate={{ opacity: searchChrome ? 0 : 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.36, ease: EASE_OUT }
          }
        >
          <iframe
            className="ul-signed-hero-frame"
            title=""
            src={`/animations/flat-map-endless-scroll.html?embed=1&v=3&reduce=${reduce ? "1" : "0"}`}
            tabIndex={-1}
          />
        </motion.div>
      ) : null}

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
        style={{ pointerEvents: searchChrome ? "none" : undefined }}
      >
        <SearchCollegeFirstTime
          animate={false}
          hideSearch
          hideTitle
          hideMap
          hidePolaroids
          hideSignedHero
          signedInHome={signedIn}
          hideGetStarted={signedIn}
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

      {/* Signed-in — kebab stays put home ↔ focus (no remount) */}
      {signedIn ? (
        <motion.button
          type="button"
          className="ul-kebab"
          aria-label="More"
          initial={false}
          animate={{
            opacity: resultsHeaderShown ? 1 : 0,
            transform: "translate3d(0, 0, 0)",
          }}
          transition={fadeTx}
          style={{
            pointerEvents: resultsHeaderShown ? "auto" : "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UL_ASSETS.kebabIcon} alt="" width={20} height={27} />
        </motion.button>
      ) : null}

      {/*
        Shared title — first-open morphs home↔focus.
        Signed-in keeps one static “Search College” (no remount on focus).
      */}
      <motion.h1
        className={`ul-shared-title${signedIn || searchChrome ? " ul-shared-title--focus" : " ul-shared-title--home"}`}
        initial={false}
        animate={{
          opacity: resultsHeaderShown ? 1 : 0,
          transform: `translate3d(-50%, ${titleY}px, 0)`,
        }}
        transition={signedIn ? { duration: 0 } : chromeTx}
        aria-hidden={!resultsHeaderShown}
      >
        {signedIn ? (
          <span className="ul-shared-title__copy">Search College</span>
        ) : (
          <AnimatePresence mode="sync" initial={false}>
            <motion.span
              key={searchChrome ? "focus" : "home"}
              className="ul-shared-title__copy"
              initial={
                reduce ? false : { opacity: 0, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={
                reduce ? undefined : { opacity: 0, filter: "blur(8px)" }
              }
              transition={titleMorphTx}
            >
              {searchChrome ? "Search College" : HOME_TITLE}
            </motion.span>
          </AnimatePresence>
        )}
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

      {/* Recommendations — after typing Pillai */}
      <motion.div
        className="ul-shared-recs"
        initial={false}
        animate={{
          opacity:
            focused &&
            !showingResults &&
            showRecs &&
            recVariant === "recommendation"
              ? 1
              : 0,
          transform:
            focused &&
            !showingResults &&
            showRecs &&
            recVariant === "recommendation"
              ? "translate3d(0, 0, 0) scale(1)"
              : "translate3d(0, -8px, 0) scale(0.97)",
        }}
        transition={{
          duration: fade,
          ease: EASE_OUT,
        }}
        style={{
          pointerEvents:
            focused &&
            !showingResults &&
            showRecs &&
            recVariant === "recommendation"
              ? "auto"
              : "none",
        }}
      >
        {showRecs && recVariant === "recommendation" ? (
          <RecommendationList />
        ) : null}
      </motion.div>

      {/* College results empty — map first; copy + CTA after unfold (success settle) */}
      <AnimatePresence>
        {resultsEmpty ? (
          <motion.div
            className="ul-empty-settled"
            key={`empty-${emptyPlayKey}`}
            initial={false}
            animate={{ opacity: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(6px)" }
            }
            transition={{ duration: fade, ease: EASE_OUT }}
          >
            <CollegeNotMappedEmpty
              playKey={emptyPlayKey}
              copyReady={emptyChromeReady}
              onUnfoldComplete={() => setEmptyChromeReady(true)}
            />
            <motion.div
              className="ul-empty-cta"
              initial={false}
              animate={
                emptyChromeReady
                  ? {
                      opacity: 1,
                      transform: "translate3d(0, 0, 0)",
                      filter: "blur(0px)",
                    }
                  : {
                      opacity: 0,
                      transform: "translate3d(0, 12px, 0)",
                      filter: reduce ? "blur(0px)" : "blur(10px)",
                    }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: 0.48,
                      ease: EASE_OUT,
                      delay: emptyChromeReady ? 0.06 : 0,
                    }
              }
              style={{
                pointerEvents: emptyChromeReady ? "auto" : "none",
              }}
            >
              <div className="ul-empty-cta__shell">
                <PrimaryCta
                  className="ul-empty-cta__btn"
                  label="Request Map"
                  animate={false}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* College results — keyboard Return; lifts with collapsed search */}
      <motion.div
        className="ul-shared-results"
        initial={false}
        animate={{
          opacity: showingResults && !resultsEmpty ? 1 : 0,
          transform:
            showingResults && !resultsEmpty
              ? `translate3d(0, ${resultsCollapsed ? -RESULTS_LIFT : 0}px, 0)`
              : "translate3d(0, 12px, 0)",
        }}
        transition={fadeTx}
        style={{
          pointerEvents:
            showingResults && !resultsEmpty ? "auto" : "none",
        }}
        aria-hidden={!showingResults || resultsEmpty}
      >
        {!resultsEmpty ? (
          <CollegeResultsList
            loading={resultsLoading}
            onHeaderVisible={setResultsHeader}
            onSelectCollege={onSelectCollege}
          />
        ) : null}
      </motion.div>

      {/* Keyboard — slides with drawer curve; hidden on results */}
      <motion.div
        className="ul-shared-kb"
        initial={false}
        animate={{
          transform: kbOpen
            ? "translate3d(0, 0, 0)"
            : "translate3d(0, 100%, 0)",
        }}
        transition={drawerTx}
        aria-hidden={!kbOpen}
      >
        <IosKeyboard
          onActivate={kbOpen ? () => startTyping() : undefined}
          onEnter={kbOpen ? onSearchEnter : undefined}
        />
      </motion.div>
    </div>
  );
}
