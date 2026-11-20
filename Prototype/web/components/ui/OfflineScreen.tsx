"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import CollegeResultsList from "@/components/ui/CollegeResultsList";
import FocusedSearchField from "@/components/ui/FocusedSearchField";
import PrimaryCta from "@/components/ui/PrimaryCta";
import { useDemoReduceMotion } from "@/lib/demoMotion";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
/** College results skeleton hold */
const RESULTS_SKELETON_MS = 2000;
/** Match campus map loading sticker */
const MAP_LOADER_MS = 4500;

export type OfflineVariant =
  | "home"
  | "search"
  | "results"
  | "map"
  | "signup";

type Props = {
  variant: OfflineVariant;
  /** Signed-in offline — bottom CTA for saved campus maps */
  signedIn?: boolean;
};

/** Preload only for college results + campus map */
function usesPreload(variant: OfflineVariant) {
  return variant === "results" || variant === "map";
}

function preloadMs(variant: OfflineVariant) {
  return variant === "map" ? MAP_LOADER_MS : RESULTS_SKELETON_MS;
}

/** Campus map — existing campus-map-loading sticker in map frame */
function OfflineMapLoader({ reduce }: { reduce: boolean }) {
  return (
    <div className="mf mf--loading scf__offline-map" aria-busy aria-label="Loading campus map">
      <div className="mf__stage">
        <div className="mf__frame">
          <div className="mf__frame-inner">
            <div className="mf__loading">
              <iframe
                className="mf__loading-frame"
                title="Loading campus map"
                src={`/animations/campus-map-loading.html?embed=1&v=5&dur=4.2&reduce=${reduce ? "1" : "0"}`}
                tabIndex={-1}
                aria-hidden
              />
            </div>
            <div className="mf__frame-shade" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * College results — same structure: blank search on top + existing
 * CollegeResultsList skeleton cards underneath.
 */
function OfflineResultsSkeleton() {
  return (
    <div
      className="ul-flow ul-flow--focused ul-flow--results scf__offline-results"
      aria-busy
      aria-label="Loading colleges"
    >
      <div className="scf__map-wrap" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="scf__map" src={UL_ASSETS.backgroundMap} alt="" />
      </div>
      {/* Blank search — same slot as results chrome (y = 116) */}
      <div
        className="ul-shared-search"
        style={{ transform: "translate3d(0, 116px, 0)" }}
      >
        <FocusedSearchField query="" showCaret={false} />
      </div>
      <div className="ul-shared-results">
        <CollegeResultsList loading />
      </div>
    </div>
  );
}

function OfflineWifi({
  reduce,
  signedIn,
}: {
  reduce: boolean;
  signedIn: boolean;
}) {
  const textIn = reduce
    ? false
    : {
        opacity: 0,
        filter: "blur(10px)",
        transform: "translate3d(0, 10px, 0)",
      };
  const textShow = {
    opacity: 1,
    filter: "blur(0px)",
    transform: "translate3d(0, 0, 0)",
  };
  const textTx = (delay: number) =>
    reduce ? { duration: 0 } : { duration: 0.48, ease: EASE_OUT, delay };

  return (
    <>
      <div className="scf__offline">
        <motion.div
          className="scf__offline-icon"
          initial={
            reduce
              ? false
              : {
                  opacity: 0,
                  filter: "blur(14px)",
                  transform: "translate3d(0, 14px, 0)",
                }
          }
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            transform: "translate3d(0, 0, 0)",
          }}
          transition={textTx(0.06)}
        >
          <iframe
            key={`wifi-${reduce ? "0" : "1"}`}
            className="scf__offline-frame"
            title=""
            src={`/animations/wifi-elastic-entrance.html?embed=1&v=4&reduce=${reduce ? "1" : "0"}`}
            tabIndex={-1}
            aria-hidden
            scrolling="no"
          />
        </motion.div>
        <motion.h1
          className="scf__offline-title"
          initial={textIn}
          animate={textShow}
          transition={textTx(0.55)}
        >
          You’re offline
        </motion.h1>
        <motion.p
          className="scf__offline-copy"
          initial={textIn}
          animate={textShow}
          transition={textTx(0.68)}
        >
          {signedIn
            ? "Saved campus maps still work without a connection."
            : "Reconnect to keep finding your campus."}
        </motion.p>
      </div>

      {/* Same bottom CTA slot as empty results / Create Profile */}
      {signedIn ? (
        <motion.div
          className="ul-empty-cta scf__offline-cta"
          initial={
            reduce
              ? false
              : {
                  opacity: 0,
                  transform: "translate3d(0, 12px, 0)",
                  filter: "blur(10px)",
                }
          }
          animate={{
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
            filter: "blur(0px)",
          }}
          transition={textTx(0.82)}
        >
          <div className="ul-empty-cta__shell">
            <PrimaryCta
              className="ul-empty-cta__btn"
              label="Use Offline Maps"
              animate={false}
            />
          </div>
        </motion.div>
      ) : null}
    </>
  );
}

/**
 * Offline empty — wifi on every step.
 * Campus map: existing map loader → wifi.
 * College results: blank search + existing result skeletons → wifi.
 */
export default function OfflineScreen({
  variant,
  signedIn = false,
}: Props) {
  const reduce = useDemoReduceMotion();
  const withPreload = usesPreload(variant);
  const [phase, setPhase] = useState<"preload" | "wifi">(() =>
    reduce || !withPreload ? "wifi" : "preload",
  );

  useEffect(() => {
    if (reduce || !withPreload) {
      setPhase("wifi");
      return;
    }
    setPhase("preload");
    const t = window.setTimeout(
      () => setPhase("wifi"),
      preloadMs(variant),
    );
    return () => window.clearTimeout(t);
  }, [reduce, variant, withPreload]);

  const crossfade = {
    duration: reduce ? 0 : 0.4,
    ease: EASE_OUT,
  };

  return (
    <div
      className={`scf scf--settled scf--offline${variant === "map" && phase === "preload" ? " scf--offline-map" : ""}${signedIn ? " scf--offline-signed" : ""}`}
      aria-label="You’re offline"
      aria-busy={phase === "preload"}
    >
      {variant === "results" && phase === "preload" ? null : (
        <div className="scf__map-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scf__map" src={UL_ASSETS.backgroundMap} alt="" />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {phase === "preload" && withPreload ? (
          <motion.div
            key={`preload-${variant}`}
            className="scf__offline-phase"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossfade}
          >
            {variant === "map" ? (
              <OfflineMapLoader reduce={reduce} />
            ) : (
              <OfflineResultsSkeleton />
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`wifi-${variant}`}
            className="scf__offline-phase"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossfade}
          >
            <OfflineWifi reduce={reduce} signedIn={signedIn} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
