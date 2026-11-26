"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  MotionIcon,
  RefreshIcon,
  VolumeHighIcon,
  VolumeOffIcon,
  Wifi01Icon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
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
        aria-label="Stage controls"
      >
        <button
          type="button"
          className="proto-stage__refresh"
          aria-label="Refresh screen"
          onClick={onRefresh}
        >
          <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={2} />
        </button>

        <div className="proto-stage__chip">
          <span className="proto-stage__chip-lead">
            <HugeiconsIcon
              icon={sound ? VolumeHighIcon : VolumeOffIcon}
              size={16}
              strokeWidth={1.8}
            />
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
            <HugeiconsIcon icon={MotionIcon} size={16} strokeWidth={1.8} />
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
            <HugeiconsIcon icon={Wifi01Icon} size={14} strokeWidth={2} />
            Online
          </button>
          <button
            type="button"
            role="tab"
            className="proto-segment__btn"
            aria-selected={connectivity.value === "offline"}
            onClick={() => connectivity.onChange("offline")}
          >
            <HugeiconsIcon icon={WifiOff01Icon} size={14} strokeWidth={2} />
            Offline
          </button>
        </div>
      </ProtoSquircle>
    </div>
  );
}
