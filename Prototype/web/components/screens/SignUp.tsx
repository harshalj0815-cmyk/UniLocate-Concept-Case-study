"use client";

import { motion, useReducedMotion } from "motion/react";
import HangingLogo from "@/components/ui/HangingLogo";
import SecondaryCta from "@/components/ui/SecondaryCta";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export type AuthMode = "signup" | "login";

type SignUpProps = {
  mode?: AuthMode;
  onBack?: () => void;
  onSwitchAuth?: () => void;
};

/** Auth gate — Sign Up / Log In share the door scene; title + footer swap */
export default function SignUp({
  mode = "signup",
  onBack,
  onSwitchAuth,
}: SignUpProps) {
  const reduce = useReducedMotion();
  const fadeTx = {
    duration: reduce ? 0 : 0.22,
    ease: EASE_OUT,
  };

  const isLogin = mode === "login";
  const title = isLogin ? "Log In" : "Sign Up";
  const footerLead = isLogin
    ? "Don't have an account?"
    : "Already have an account?";
  const footerAction = isLogin ? "Sign Up" : "Log In";

  return (
    <div className="su su--enter" aria-label={title}>
      <div className="su__map-wrap" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="su__map" src={UL_ASSETS.backgroundMap} alt="" />
      </div>

      <div className="su__door-wrap" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="su__door"
          src={`${UL_ASSETS.signupDoor}?v=2`}
          alt=""
          width={496}
          height={744}
          draggable={false}
        />
      </div>

      <HangingLogo className="su__hanging" />

      <motion.button
        type="button"
        className="su__back"
        aria-label="Back"
        initial={
          reduce
            ? false
            : { opacity: 0, transform: "translate3d(-6px, 0, 0)" }
        }
        animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
        transition={fadeTx}
        onClick={onBack}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={UL_ASSETS.careLeft} alt="" width={20} height={26} />
      </motion.button>

      <h1 className="su__title">{title}</h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="su__badge"
        src={UL_ASSETS.signupBadge}
        alt="Student Id Recommended"
        width={176}
        height={32}
        draggable={false}
      />

      <SecondaryCta
        className="su__cta su__cta--google"
        label="Continue with Google"
        iconSrc={UL_ASSETS.googleIcon}
        iconWidth={30}
        iconHeight={30}
      />
      <SecondaryCta
        className="su__cta su__cta--apple"
        label="Continue with Apple"
        iconSrc={UL_ASSETS.appleIcon}
        iconWidth={27}
        iconHeight={30}
      />
      <SecondaryCta
        className="su__cta su__cta--email"
        label="Continue with Email"
        iconSrc={UL_ASSETS.mailIcon}
        iconWidth={30}
        iconHeight={24}
      />

      <p className="su__footer">
        {footerLead}{" "}
        <button
          type="button"
          className="su__footer-link"
          onClick={onSwitchAuth}
        >
          {footerAction}
        </button>
      </p>
    </div>
  );
}
