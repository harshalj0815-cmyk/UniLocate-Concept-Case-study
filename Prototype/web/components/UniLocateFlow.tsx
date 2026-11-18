"use client";

import { useCallback, useState } from "react";
import SearchCollegeFlow from "@/components/SearchCollegeFlow";
import MapFirstTime from "@/components/screens/MapFirstTime";
import SignUp from "@/components/screens/SignUp";
import type { CollegeResult } from "@/lib/collegeResults";

type Screen = "college" | "signup" | "login" | "map";

/** Top-level prototype navigation: Search College ↔ Sign Up ↔ Log In ↔ Map */
export default function UniLocateFlow() {
  const [screen, setScreen] = useState<Screen>("college");
  const [mapCollege, setMapCollege] = useState<CollegeResult | null>(null);

  const openSignup = useCallback(() => setScreen("signup"), []);
  const openLogin = useCallback(() => setScreen("login"), []);
  const backToCollege = useCallback(() => setScreen("college"), []);

  const openMap = useCallback((college: CollegeResult) => {
    setMapCollege(college);
    setScreen("map");
  }, []);

  const onCollege = screen === "college";
  const authMode = screen === "login" ? "login" : "signup";

  return (
    <>
      <div
        className={`ul-root-screen${onCollege ? "" : " ul-root-screen--parked"}`}
        aria-hidden={!onCollege}
        inert={!onCollege ? true : undefined}
      >
        <SearchCollegeFlow
          active={onCollege}
          onGetStarted={openSignup}
          onSelectCollege={openMap}
        />
      </div>
      {screen === "signup" || screen === "login" ? (
        <SignUp
          key={screen}
          mode={authMode}
          onBack={backToCollege}
          onSwitchAuth={screen === "signup" ? openLogin : openSignup}
        />
      ) : null}
      {screen === "map" && mapCollege ? (
        <MapFirstTime
          collegeName={mapCollege.name}
          onBack={backToCollege}
          onCreateProfile={openSignup}
        />
      ) : null}
    </>
  );
}
