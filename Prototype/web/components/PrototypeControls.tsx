"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import {
  isMapNavStep,
  PROTOTYPE_STEPS,
  type PrototypeStep,
  type PrototypeStepId,
} from "@/lib/prototypeSteps";
import ProtoSquircle from "@/components/ui/ProtoSquircle";

type Props = {
  active: PrototypeStepId;
  onJump: (id: PrototypeStepId) => void;
  /** Signed-in audience — Sign up is first-open only */
  hideSignup?: boolean;
  /** Offline — hide campus map / nav / arrived steps */
  hideMapNav?: boolean;
};

function stepState(
  steps: readonly PrototypeStep[],
  active: PrototypeStepId,
  index: number,
) {
  const current = steps.findIndex((s) => s.id === active);
  if (index < current) return "done";
  if (index === current) return "current";
  return "todo";
}

function StepperList({
  steps,
  active,
  onJump,
  inert,
}: {
  steps: readonly PrototypeStep[];
  active: PrototypeStepId;
  onJump?: (id: PrototypeStepId) => void;
  /** Height sizer — not interactive */
  inert?: boolean;
}) {
  return (
    <ol
      className="proto-stepper"
      aria-label={inert ? undefined : "Flow progress"}
      aria-hidden={inert || undefined}
    >
      {steps.map((step, i) => {
        const state = stepState(steps, active, i);
        return (
          <li key={step.id} className="proto-stepper__item" data-state={state}>
            {inert ? (
              <div className="proto-stepper__btn">
                <span className="proto-stepper__rail" aria-hidden>
                  <span className="proto-stepper__dot" />
                  {i < steps.length - 1 ? (
                    <span className="proto-stepper__line" />
                  ) : null}
                </span>
                <span className="proto-stepper__copy">
                  <span className="proto-stepper__label">{step.label}</span>
                  <span className="proto-stepper__hint">{step.hint}</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="proto-stepper__btn"
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onJump?.(step.id)}
              >
                <span className="proto-stepper__rail" aria-hidden>
                  <span className="proto-stepper__dot">
                    {state === "done" ? (
                      <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.4} />
                    ) : state === "current" ? (
                      <span className="proto-stepper__ellipsis" />
                    ) : null}
                  </span>
                  {i < steps.length - 1 ? (
                    <span className="proto-stepper__line" />
                  ) : null}
                </span>
                <span className="proto-stepper__copy">
                  <span className="proto-stepper__label">{step.label}</span>
                  <span className="proto-stepper__hint">{step.hint}</span>
                </span>
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function resolveSteps(
  signedIn: boolean,
  hideMapNav: boolean,
): PrototypeStep[] {
  let base = [...PROTOTYPE_STEPS];
  if (signedIn) base = base.filter((s) => s.id !== "signup");
  if (hideMapNav) base = base.filter((s) => !isMapNavStep(s.id));
  if (!signedIn) return base;
  return base.map((s) => ({
    ...s,
    label: s.signedInLabel ?? s.label,
    hint: s.signedInHint ?? s.hint,
  }));
}

/**
 * Demo controls — vertical progress stepper (Metaview via Refero).
 * check = done, ellipsis current, hollow upcoming + connector.
 *
 * Shell keeps full (with Sign up) height so board centering never jumps;
 * the white card shrinks from the bottom when hideSignup.
 */
export default function PrototypeControls({
  active,
  onJump,
  hideSignup = false,
  hideMapNav = false,
}: Props) {
  const visibleSteps = resolveSteps(hideSignup, hideMapNav);
  /* Sizer always uses first-open full list so shell height stays put */
  const sizerSteps = [...PROTOTYPE_STEPS];
  const compact = hideSignup || hideMapNav;

  return (
    <aside
      className={`proto-controls-shell${compact ? " proto-controls-shell--compact" : ""}`}
      aria-label="Prototype screens"
    >
      <div className="proto-controls-shell__sizer" aria-hidden>
        <StepperList steps={sizerSteps} active={active} inert />
      </div>
      <ProtoSquircle
        className="proto-controls"
        radius={20}
      >
        <StepperList
          steps={visibleSteps}
          active={active}
          onJump={onJump}
        />
      </ProtoSquircle>
    </aside>
  );
}
