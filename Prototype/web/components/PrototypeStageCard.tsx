"use client";

import ProtoSquircle from "@/components/ui/ProtoSquircle";

type SearchRecVariant = "recommendation" | "empty" | "not-exist";
/** First open = just after download; Signed in = after signup */
export type AudienceMode = "first-open" | "signed-in";
/** Demo network — Online | Offline */
export type ConnectivityMode = "online" | "offline";

type Props = {
  motion: boolean;
  sound: boolean;
  onRefresh: () => void;
  onMotionChange: (on: boolean) => void;
  onSoundChange: (on: boolean) => void;
  /** Global — all screens */
  audience: {
    value: AudienceMode;
    onChange: (v: AudienceMode) => void;
  };
  /** Global — Online | Offline */
  connectivity: {
    value: ConnectivityMode;
    onChange: (v: ConnectivityMode) => void;
  };
  /**
   * Search / results — Recommendation|Results vs Empty.
   * Always rendered; `enabled` false greys it out with a page tooltip.
   */
  searchSegment: {
    value: SearchRecVariant;
    onChange: (v: SearchRecVariant) => void;
    mode?: "search" | "results";
    enabled: boolean;
    /** Page name(s) shown in the disabled tooltip */
    availableOn: string;
  };
};

/** Right-rail stage tools — sticker squircles matching in-app cards */
export default function PrototypeStageCard({
  motion,
  sound,
  onRefresh,
  onMotionChange,
  onSoundChange,
  audience,
  connectivity,
  searchSegment,
}: Props) {
  const searchActive = searchSegment.enabled;
  const resultsMode = searchSegment.mode === "results";

  return (
    <div className="proto-stage-stack">
      <ProtoSquircle
        className="proto-stage"
        radius={16}
        seedWidth={286}
        seedHeight={44}
        aria-label="Stage controls"
      >
        <button
          type="button"
          className="proto-stage__refresh"
          aria-label="Refresh screen"
          onClick={onRefresh}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
            <path
              d="M16.5 10a6.5 6.5 0 1 1-1.7-4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M16.5 3.8v3.8h-3.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="proto-stage__chip">
          <span className="proto-stage__chip-lead">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path
                d="M3.5 8.2v3.6c0 .6.4 1.1 1 1.2l5.2 1.1c.5.1 1-.3 1-.8V7.7c0-.5-.5-.9-1-.8L4.5 8c-.6.1-1 .6-1 1.2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M13.2 7.2a3.2 3.2 0 0 1 0 5.6M15.4 5.4a6 6 0 0 1 0 9.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="proto-stage__label" id="proto-sound-label">
              Sound
            </span>
          </span>
          <button
            type="button"
            role="switch"
            className="proto-toggle"
            aria-checked={sound}
            aria-labelledby="proto-sound-label"
            onClick={() => onSoundChange(!sound)}
          >
            <span className="proto-toggle__thumb" />
          </button>
        </div>

        <div className="proto-stage__chip">
          <span className="proto-stage__chip-lead">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path
                d="M2.5 10c1.4-2.8 2.8-2.8 4.2 0s2.8 2.8 4.2 0 2.8-2.8 4.2 0 2.8 2.8 4.2 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="proto-stage__label" id="proto-motion-label">
              Motion
            </span>
          </span>
          <button
            type="button"
            role="switch"
            className="proto-toggle"
            aria-checked={motion}
            aria-labelledby="proto-motion-label"
            onClick={() => onMotionChange(!motion)}
          >
            <span className="proto-toggle__thumb" />
          </button>
        </div>
      </ProtoSquircle>

      <ProtoSquircle
        className="proto-segment"
        radius={16}
        seedWidth={286}
        seedHeight={36}
      >
        <div
          className="proto-segment__track"
          role="tablist"
          aria-label="Account state"
        >
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={audience.value === "first-open"}
            onClick={() => audience.onChange("first-open")}
          >
            First open
          </button>
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={audience.value === "signed-in"}
            onClick={() => audience.onChange("signed-in")}
          >
            Signed in
          </button>
        </div>
      </ProtoSquircle>

      <ProtoSquircle
        className={`proto-segment${searchActive ? "" : " proto-segment--disabled"}`}
        radius={16}
        seedWidth={286}
        seedHeight={36}
      >
        <div
          className="proto-segment__track proto-segment__track--3"
          role="tablist"
          aria-label={resultsMode ? "College results" : "Search outcomes"}
          aria-disabled={!searchActive}
          data-tooltip={
            searchActive
              ? undefined
              : `Available on ${searchSegment.availableOn}`
          }
        >
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={
              searchActive && searchSegment.value === "recommendation"
            }
            disabled={!searchActive}
            onClick={() => {
              if (!searchActive) return;
              searchSegment.onChange("recommendation");
            }}
          >
            {resultsMode ? "On the map" : "Mapped"}
          </button>
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={searchActive && searchSegment.value === "empty"}
            disabled={!searchActive}
            onClick={() => {
              if (!searchActive) return;
              searchSegment.onChange("empty");
            }}
          >
            Not mapped
          </button>
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={
              searchActive && searchSegment.value === "not-exist"
            }
            disabled={!searchActive}
            onClick={() => {
              if (!searchActive) return;
              searchSegment.onChange("not-exist");
            }}
          >
            Not exist
          </button>
        </div>
      </ProtoSquircle>

      <ProtoSquircle
        className="proto-segment"
        radius={16}
        seedWidth={286}
        seedHeight={36}
      >
        <div
          className="proto-segment__track"
          role="tablist"
          aria-label="Network"
        >
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={connectivity.value === "online"}
            onClick={() => connectivity.onChange("online")}
          >
            Online
          </button>
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={connectivity.value === "offline"}
            onClick={() => connectivity.onChange("offline")}
          >
            Offline
          </button>
        </div>
      </ProtoSquircle>
    </div>
  );
}
