"use client";

import { useCallback, useState } from "react";
import SearchCollegeFlow from "@/components/SearchCollegeFlow";
import SignUp from "@/components/screens/SignUp";

type Screen = "college" | "signup" | "login";

/** Top-level prototype navigation: Search College ↔ Sign Up ↔ Log In */
export default function UniLocateFlow() {
  const [screen, setScreen] = useState<Screen>("college");

  const openSignup = useCallback(() => setScreen("signup"), []);
  const openLogin = useCallback(() => setScreen("login"), []);
  const backToCollege = useCallback(() => setScreen("college"), []);

  const onCollege = screen === "college";
  const authMode = screen === "login" ? "login" : "signup";

  return (
    <>
      <div
        className={`ul-root-screen${onCollege ? "" : " ul-root-screen--parked"}`}
        aria-hidden={!onCollege}
        inert={!onCollege ? true : undefined}
      >
        <SearchCollegeFlow active={onCollege} onGetStarted={openSignup} />
      </div>
      {screen === "signup" || screen === "login" ? (
        <SignUp
          key={screen}
          mode={authMode}
          onBack={backToCollege}
          onSwitchAuth={screen === "signup" ? openLogin : openSignup}
        />
      ) : null}
    </>
  );
}
