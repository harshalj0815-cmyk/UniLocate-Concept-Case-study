/** Demo board — screens you can jump to from the right-rail stepper */

export type PrototypeStepId =
  | "college-home"
  | "college-search"
  | "college-results"
  | "signup"
  | "map-idle"
  | "map-nav"
  | "map-success"
  | "map-profile";

export type PrototypeStep = {
  id: PrototypeStepId;
  label: string;
  hint: string;
  /** When set, used instead of hint for Signed in audience */
  signedInHint?: string;
  /** When set, used instead of label for Signed in audience */
  signedInLabel?: string;
};

export const PROTOTYPE_STEPS: readonly PrototypeStep[] = [
  {
    id: "college-home",
    label: "College home",
    hint: "First-time search screen",
  },
  {
    id: "college-search",
    label: "Search college",
    hint: "Keyboard + suggestions",
  },
  {
    id: "college-results",
    label: "College results",
    hint: "Result cards or not mapped",
  },
  {
    id: "map-idle",
    label: "Campus map",
    hint: "Map + destination search",
  },
  {
    id: "map-nav",
    label: "Navigating",
    hint: "Route to O104",
  },
  {
    id: "map-success",
    label: "Arrived",
    hint: "Success burst",
  },
  {
    id: "map-profile",
    label: "Create profile",
    hint: "Post-arrival CTA",
    /* Signed-in skips the gate — step opens campus map */
    signedInLabel: "After arrival",
    signedInHint: "Back to campus map",
  },
  {
    id: "signup",
    label: "Sign up",
    hint: "Auth gate",
  },
] as const;

export function stepIndex(id: PrototypeStepId) {
  return PROTOTYPE_STEPS.findIndex((s) => s.id === id);
}
