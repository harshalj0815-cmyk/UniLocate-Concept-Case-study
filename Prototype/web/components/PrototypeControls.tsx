"use client";

import {
  PROTOTYPE_STEPS,
  type PrototypeStep,
  type PrototypeStepId,
} from "@/lib/prototypeSteps";

type Props = {
  active: PrototypeStepId;
  onJump: (id: PrototypeStepId) => void;
  /** Signed-in audience — Sign up is first-open only */
  hideSignup?: boolean;
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
                      <svg viewBox="0 0 16 16" width="12" height="12">
                        <path
                          d="M3.5 8.2 6.6 11.2 12.5 4.8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
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

function resolveSteps(signedIn: boolean): PrototypeStep[] {
  const base = signedIn
    ? PROTOTYPE_STEPS.filter((s) => s.id !== "signup")
    : [...PROTOTYPE_STEPS];
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
}: Props) {
  const visibleSteps = resolveSteps(hideSignup);
  /* Sizer always uses first-open full list so shell height stays put */
  const sizerSteps = [...PROTOTYPE_STEPS];

  return (
    <aside
      className={`proto-controls-shell${hideSignup ? " proto-controls-shell--compact" : ""}`}
      aria-label="Prototype screens"
    >
      <div className="proto-controls-shell__sizer" aria-hidden>
        <StepperList steps={sizerSteps} active={active} inert />
      </div>
      <div className="proto-controls">
        <StepperList
          steps={visibleSteps}
          active={active}
          onJump={onJump}
        />
      </div>
    </aside>
  );
}
