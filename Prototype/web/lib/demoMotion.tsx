"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

/** Stage card Motion toggle — true = animations allowed */
const DemoMotionContext = createContext(true);
/** Stage card Sound toggle */
const DemoSoundContext = createContext(true);

export function DemoMotionProvider({
  motion,
  sound = true,
  children,
}: {
  motion: boolean;
  sound?: boolean;
  children: ReactNode;
}) {
  return (
    <DemoMotionContext.Provider value={motion}>
      <DemoSoundContext.Provider value={sound}>
        {children}
      </DemoSoundContext.Provider>
    </DemoMotionContext.Provider>
  );
}

/** Prefer stage toggle; also honor OS reduced-motion */
export function useDemoReduceMotion() {
  const motionOn = useContext(DemoMotionContext);
  const osReduce = useReducedMotion();
  return !motionOn || Boolean(osReduce);
}

export function useDemoSound() {
  return useContext(DemoSoundContext);
}
