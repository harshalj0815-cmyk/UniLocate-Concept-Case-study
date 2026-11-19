"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import PolaroidCard, {
  type PolaroidFrom,
} from "@/components/ui/PolaroidCard";
import PrimaryCta from "@/components/ui/PrimaryCta";
import SearchField from "@/components/ui/SearchField";
import ScfLogo from "@/components/ui/ScfLogo";
import { useDemoReduceMotion, useDemoSound } from "@/lib/demoMotion";
import { playHomeEnterSfx } from "@/lib/homeEnterSfx";
import { SCENE_POLAROIDS } from "@/lib/scenePolaroids";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

/** Same settle as empty-search caption / success chrome */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** First-open home poses — same cards as SCENE_POLAROIDS.home */
const HOME_POLAROIDS = SCENE_POLAROIDS.map((card) => ({
  src: card.src,
  left: card.home.left,
  top: card.home.top,
  rotate: card.rotate,
  from: card.from as PolaroidFrom,
  imageStyle: card.imageStyle,
}));

/** Search-college focus bed — signed-in home matches this */
const FOCUS_POLAROIDS = SCENE_POLAROIDS.map((card) => ({
  src: card.src,
  left: card.focus.left,
  top: card.focus.top,
  rotate: card.rotate,
  from: card.from as PolaroidFrom,
  imageStyle: card.imageStyle,
}));

type Props = {
  /** Entrance motion — only on the very first visit */
  animate?: boolean;
  hideSearch?: boolean;
  hideTitle?: boolean;
  hideMap?: boolean;
  hidePolaroids?: boolean;
  /** Signed-in demo — no Get Started / Or divider */
  hideGetStarted?: boolean;
  /**
   * Signed-in home — same SCF background; college-home SearchField
   * sits in the Create-profile CTA slot (bottom).
   */
  signedInHome?: boolean;
  /** Shared flow owns the flat-map bed — skip duplicate hero */
  hideSignedHero?: boolean;
  dimmed?: boolean;
  onSearchActivate?: () => void;
  onGetStarted?: () => void;
};

export default function SearchCollegeFirstTime({
  animate = true,
  hideSearch = false,
  hideTitle = false,
  hideMap = false,
  hidePolaroids = false,
  hideGetStarted = false,
  signedInHome = false,
  hideSignedHero = false,
  dimmed = false,
  onSearchActivate,
  onGetStarted,
}: Props) {
  const reduce = useDemoReduceMotion();
  const soundOn = useDemoSound();

  /* Entrance bed — logo whoosh + polaroid taps; gated by Sound + Motion */
  useEffect(() => {
    if (!animate || signedInHome || reduce || !soundOn) return;
    let cancelled = false;
    let played = false;
    const run = async () => {
      if (cancelled || played) return;
      const ok = await playHomeEnterSfx();
      if (ok) played = true;
    };
    const id = requestAnimationFrame(() => {
      void run();
    });
    /* Autoplay may block until a gesture — first tap retries once */
    const onPointer = () => {
      void run();
    };
    window.addEventListener("pointerdown", onPointer, { once: true });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [animate, reduce, signedInHome, soundOn]);

  const hideChromeTitle = hideTitle || signedInHome;
  const hideChromeCta = hideGetStarted || signedInHome;
  /* Signed-in reuses the settled SCF bed — no entrance / sfx */
  const playEnter = animate && !signedInHome;
  const fadeIn = reduce
    ? false
    : {
        opacity: 0,
        filter: "blur(10px)",
        transform: "translate3d(0, 10px, 0)",
      };
  const fadeShow = {
    opacity: 1,
    filter: "blur(0px)",
    transform: "translate3d(0, 0, 0)",
  };
  const fadeTx = (delay: number) =>
    reduce ? { duration: 0 } : { duration: 0.48, ease: EASE_OUT, delay };

  return (
    <div
      className={[
        "scf",
        playEnter ? "scf--enter" : "scf--settled",
        signedInHome ? "scf--signed-in" : "",
        dimmed ? "scf--dimmed" : "",
        hideMap ? "scf--no-map" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={
        signedInHome ? "Search College — signed in" : "Search College — first time"
      }
    >
      {hideMap ? null : (
        <div className="scf__map-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scf__map" src={UL_ASSETS.backgroundMap} alt="" />
        </div>
      )}

      {hidePolaroids
        ? null
        : (signedInHome ? FOCUS_POLAROIDS : HOME_POLAROIDS).map((card, i) => (
            <PolaroidCard
              key={`${card.src}-${i}`}
              src={card.src}
              left={card.left}
              top={card.top}
              rotate={card.rotate}
              from={card.from}
              enterIndex={i}
              imageStyle={card.imageStyle}
              animate={playEnter}
              muted={signedInHome}
            />
          ))}

      {signedInHome ? null : <ScfLogo animate={playEnter} />}

      {/*
        Signed-in chrome — only on standalone home (!hideSignedHero).
        Shared flow owns title/kebab/hero so focus doesn’t remount “Search College”.
      */}
      {signedInHome && !hideSignedHero ? (
        <>
          <motion.h1
            className="scf__signed-title"
            initial={
              reduce
                ? false
                : {
                    opacity: 0,
                    filter: "blur(10px)",
                    transform: "translate3d(-50%, 10px, 0)",
                  }
            }
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              transform: "translate3d(-50%, 0, 0)",
            }}
            transition={fadeTx(0.1)}
          >
            Search College
          </motion.h1>
          <motion.button
            type="button"
            className="scf__kebab"
            aria-label="More"
            initial={fadeIn}
            animate={fadeShow}
            transition={fadeTx(0.1)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={UL_ASSETS.kebabIcon} alt="" width={20} height={27} />
          </motion.button>
          <div className="scf__signed-hero">
            <div className="scf__signed-hero-cluster">
              <motion.iframe
                className="scf__signed-hero-frame"
                title=""
                src={`/animations/flat-map-endless-scroll.html?embed=1&v=3&reduce=${reduce ? "1" : "0"}`}
                tabIndex={-1}
                aria-hidden
                initial={fadeIn}
                animate={fadeShow}
                transition={fadeTx(0.06)}
              />
            </div>
          </div>
        </>
      ) : null}

      {hideChromeTitle ? null : (
        <h1 className="scf__title">
          New here? Let’s find
          <br />
          your campus
        </h1>
      )}

      {hideSearch ? null : signedInHome ? (
        <motion.div
          className="scf__signed-search"
          initial={fadeIn}
          animate={fadeShow}
          transition={fadeTx(0.26)}
        >
          <SearchField
            className="scf__search"
            animate={false}
            onActivate={onSearchActivate}
          />
        </motion.div>
      ) : (
        <SearchField
          className="scf__search"
          animate={playEnter}
          onActivate={onSearchActivate}
        />
      )}

      {!hideChromeCta ? (
        <>
          <div className="scf__divider" aria-hidden>
            <hr className="scf__divider-line scf__divider-line--left" />
            <span className="scf__divider-label">Or</span>
            <hr className="scf__divider-line scf__divider-line--right" />
          </div>

          <PrimaryCta
            className="scf__cta"
            animate={playEnter}
            onClick={onGetStarted}
          />
        </>
      ) : null}
    </div>
  );
}
