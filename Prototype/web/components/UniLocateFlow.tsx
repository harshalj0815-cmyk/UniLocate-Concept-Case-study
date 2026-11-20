"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import IPhoneFrame from "@/components/IPhoneFrame";
import PrototypeControls from "@/components/PrototypeControls";
import PrototypeStageCard, {
  type AudienceMode,
  type ConnectivityMode,
} from "@/components/PrototypeStageCard";
import SearchCollegeFlow, {
  type SearchRecVariant,
} from "@/components/SearchCollegeFlow";
import MapFirstTime from "@/components/screens/MapFirstTime";
import SignUp from "@/components/screens/SignUp";
import OfflineScreen from "@/components/ui/OfflineScreen";
import { COLLEGE_RESULTS, type CollegeResult } from "@/lib/collegeResults";
import { DemoMotionProvider } from "@/lib/demoMotion";
import type { PrototypeStepId } from "@/lib/prototypeSteps";

type Screen = "college" | "signup" | "login" | "map";

type CollegeScene = "home" | "search" | "results";
type MapScene = "idle" | "navigating" | "success" | "profile";

function stepToScreen(id: PrototypeStepId): Screen {
  if (id === "signup") return "signup";
  if (id.startsWith("map-")) return "map";
  return "college";
}

function stepToCollegeScene(id: PrototypeStepId): CollegeScene | null {
  if (id === "college-home") return "home";
  if (id === "college-search") return "search";
  if (id === "college-results") return "results";
  return null;
}

function stepToMapScene(id: PrototypeStepId): MapScene | null {
  if (id === "map-idle") return "idle";
  if (id === "map-nav") return "navigating";
  if (id === "map-success") return "success";
  if (id === "map-profile") return "profile";
  return null;
}

/** Top-level prototype navigation + right-rail screen stepper */
export default function UniLocateFlow() {
  const [demoStep, setDemoStep] = useState<PrototypeStepId>("college-home");
  const [screen, setScreen] = useState<Screen>("college");
  const [mapCollege, setMapCollege] = useState<CollegeResult | null>(
    () => COLLEGE_RESULTS[0] ?? null,
  );
  /** Survives leaving map — first arrival swaps search → Create Profile CTA */
  const [mapNeedsProfile, setMapNeedsProfile] = useState(false);
  const [collegeScene, setCollegeScene] = useState<CollegeScene>("home");
  const [mapScene, setMapScene] = useState<MapScene>("idle");
  /** Bump to remount map / college when jumping via stepper */
  const [jumpKey, setJumpKey] = useState(0);
  const [motionOn, setMotionOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [searchRecVariant, setSearchRecVariant] =
    useState<SearchRecVariant>("recommendation");
  /** First open = just downloaded; Signed in = after signup */
  const [audience, setAudience] = useState<AudienceMode>("first-open");
  const [connectivity, setConnectivity] =
    useState<ConnectivityMode>("online");
  const signedIn = audience === "signed-in";
  const offline = connectivity === "offline";

  const refreshScreen = useCallback(() => {
    setJumpKey((k) => k + 1);
  }, []);

  const setMotion = useCallback((on: boolean) => {
    setMotionOn(on);
    /* Remount so CSS/Framer enter beats restart under the new reduce flag */
    setJumpKey((k) => k + 1);
  }, []);

  const backToCollege = useCallback(() => {
    setDemoStep("college-home");
    setCollegeScene("home");
    setScreen("college");
  }, []);

  const setConnectivityMode = useCallback((mode: ConnectivityMode) => {
    setConnectivity(mode);
    /* Remount so offline skeleton / wifi sequence restarts on current step */
    setJumpKey((k) => k + 1);
  }, []);

  const setAudienceMode = useCallback(
    (mode: AudienceMode) => {
      setAudience(mode);
      if (mode === "signed-in") {
        setMapNeedsProfile(false);
        setMapScene((s) => (s === "profile" ? "idle" : s));
        /* Sign up is first-open only — leave auth for college home */
        if (screen === "signup" || screen === "login") {
          setDemoStep("college-home");
          setCollegeScene("home");
          setScreen("college");
        }
      }
      setJumpKey((k) => k + 1);
    },
    [screen],
  );

  const openSignup = useCallback(() => {
    if (signedIn) {
      backToCollege();
      return;
    }
    setDemoStep("signup");
    setScreen("signup");
  }, [backToCollege, signedIn]);
  const openLogin = useCallback(() => {
    if (signedIn) {
      backToCollege();
      return;
    }
    setDemoStep("signup");
    setScreen("login");
  }, [backToCollege, signedIn]);
  const markMapNeedsProfile = useCallback(() => {
    setMapNeedsProfile(true);
  }, []);

  const openMap = useCallback((college: CollegeResult) => {
    setMapCollege(college);
    setMapNeedsProfile(false);
    setMapScene("idle");
    setDemoStep("map-idle");
    setScreen("map");
    setJumpKey((k) => k + 1);
  }, []);

  const onCollegeScene = useCallback((scene: CollegeScene) => {
    if (scene === "home") setDemoStep("college-home");
    else if (scene === "search") setDemoStep("college-search");
    else setDemoStep("college-results");
    setCollegeScene(scene);
  }, []);

  const onMapScene = useCallback(
    (scene: MapScene) => {
      if (scene === "idle") setDemoStep("map-idle");
      else if (scene === "navigating") setDemoStep("map-nav");
      else if (scene === "success") setDemoStep("map-success");
      else setDemoStep("map-profile");
      setMapScene(scene);
      if (
        !signedIn &&
        (scene === "profile" || scene === "success")
      ) {
        setMapNeedsProfile(true);
      }
    },
    [signedIn],
  );

  const jumpTo = useCallback((id: PrototypeStepId) => {
    /* Signed-in has no auth gate — send Sign up jumps to college home */
    if (id === "signup" && signedIn) {
      setDemoStep("college-home");
      setCollegeScene("home");
      setScreen("college");
      setJumpKey((k) => k + 1);
      return;
    }
    setDemoStep(id);
    const nextScreen = stepToScreen(id);
    setScreen(nextScreen);

    const c = stepToCollegeScene(id);
    if (c) {
      setCollegeScene(c);
      setJumpKey((k) => k + 1);
    }

    if (id === "signup") {
      setJumpKey((k) => k + 1);
    }

    const m = stepToMapScene(id);
    if (m) {
      if (!mapCollege) setMapCollege(COLLEGE_RESULTS[0] ?? null);
      setMapScene(m);
      /* Signed-in users skip the Create Profile gate */
      setMapNeedsProfile(
        !signedIn && (m === "profile" || m === "success"),
      );
      setJumpKey((k) => k + 1);
    }
  }, [mapCollege, signedIn]);

  const onCollege = screen === "college";
  const authMode = screen === "login" ? "login" : "signup";
  const boardRef = useRef<HTMLDivElement>(null);

  /* Stage card top matches stepper shell top — shell stays board-centered */
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const controls = board.querySelector<HTMLElement>(".proto-controls-shell");
    const stage = board.querySelector<HTMLElement>(".proto-stage-stack");
    if (!controls || !stage) return;

    const sync = () => {
      if (getComputedStyle(board).flexDirection === "column") {
        stage.style.marginTop = "";
        return;
      }
      const boardTop = board.getBoundingClientRect().top;
      const controlsTop = controls.getBoundingClientRect().top;
      stage.style.marginTop = `${Math.max(0, controlsTop - boardTop)}px`;
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(board);
    ro.observe(controls);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      stage.style.marginTop = "";
    };
  }, []);

  return (
    <DemoMotionProvider motion={motionOn} sound={soundOn}>
      <div className="prototype-board" ref={boardRef}>
        <PrototypeControls
          active={demoStep}
          onJump={jumpTo}
          hideSignup={signedIn}
        />

        <div
          className="prototype-board__phone"
          data-ul-motion={motionOn ? "on" : "off"}
        >
          <MotionConfig reducedMotion={motionOn ? "never" : "always"}>
            <IPhoneFrame>
              <div
                className={`ul-root-screen${onCollege ? "" : " ul-root-screen--parked"}`}
                aria-hidden={!onCollege}
                inert={!onCollege ? true : undefined}
              >
                <SearchCollegeFlow
                  key={`college-${jumpKey}`}
                  active={onCollege}
                  scene={collegeScene}
                  recVariant={searchRecVariant}
                  signedIn={signedIn}
                  offline={offline}
                  onSceneChange={onCollegeScene}
                  onGetStarted={openSignup}
                  onSelectCollege={openMap}
                />
              </div>
              {!signedIn && (screen === "signup" || screen === "login") ? (
                offline ? (
                  <OfflineScreen key={`signup-offline-${jumpKey}`} variant="signup" />
                ) : (
                  <SignUp
                    key={`${screen}-${jumpKey}`}
                    mode={authMode}
                    onBack={backToCollege}
                    onSwitchAuth={
                      screen === "signup" ? openLogin : openSignup
                    }
                  />
                )
              ) : null}
              {screen === "map" && mapCollege ? (
                offline ? (
                  <OfflineScreen
                    key={`map-offline-${jumpKey}`}
                    variant="map"
                    signedIn={signedIn}
                  />
                ) : (
                  <MapFirstTime
                    key={`map-${jumpKey}`}
                    collegeName={mapCollege.name}
                    needsProfile={mapNeedsProfile && !signedIn}
                    signedIn={signedIn}
                    campusMapHome={demoStep === "map-idle"}
                    scene={
                      signedIn && mapScene === "profile" ? "idle" : mapScene
                    }
                    soundEnabled={soundOn}
                    onSceneChange={onMapScene}
                    onNeedsProfile={
                      signedIn ? undefined : markMapNeedsProfile
                    }
                    onBack={backToCollege}
                    onCreateProfile={openSignup}
                  />
                )
              ) : null}
            </IPhoneFrame>
          </MotionConfig>
        </div>

        <PrototypeStageCard
          motion={motionOn}
          sound={soundOn}
          onRefresh={refreshScreen}
          onMotionChange={setMotion}
          onSoundChange={setSoundOn}
          audience={{
            value: audience,
            onChange: setAudienceMode,
          }}
          connectivity={{
            value: connectivity,
            onChange: setConnectivityMode,
          }}
          searchSegment={{
            value: searchRecVariant,
            onChange: setSearchRecVariant,
            mode:
              demoStep === "college-results" ? "results" : "search",
            enabled:
              demoStep === "college-search" ||
              demoStep === "college-results",
            /* Disabled tooltip names the pages where this segment applies */
            availableOn: "Search college",
          }}
        />
      </div>
    </DemoMotionProvider>
  );
}
