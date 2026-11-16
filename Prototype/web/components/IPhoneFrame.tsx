import type { ReactNode } from "react";

type IPhoneFrameProps = {
  children: ReactNode;
  time?: string;
};

/**
 * Bezel + screen share one corner family (circular) so no white gap.
 * Side buttons sit outside the clipped bezel shell.
 */
export default function IPhoneFrame({
  children,
  time = "9:41",
}: IPhoneFrameProps) {
  return (
    <div className="iphone-scale">
      <div className="iphone-frame" aria-label="iPhone 16 Pro frame">
        <span className="iphone-frame__btn iphone-frame__btn--action" aria-hidden />
        <span className="iphone-frame__btn iphone-frame__btn--vol-up" aria-hidden />
        <span className="iphone-frame__btn iphone-frame__btn--vol-down" aria-hidden />
        <span className="iphone-frame__btn iphone-frame__btn--power" aria-hidden />

        <div className="iphone-frame__bezel">
          <div className="iphone-frame__screen">
            <div className="iphone-frame__island" aria-hidden />
            <div className="iphone-frame__status">
              <span>{time}</span>
              <div className="iphone-frame__status-right" aria-hidden>
                <svg
                  className="iphone-frame__signal"
                  width="18"
                  height="12"
                  viewBox="0 0 18 12"
                >
                  <rect x="0" y="7" width="3" height="5" rx="0.6" />
                  <rect x="5" y="5" width="3" height="7" rx="0.6" />
                  <rect x="10" y="2.5" width="3" height="9.5" rx="0.6" />
                  <rect x="15" y="0" width="3" height="12" rx="0.6" />
                </svg>
                <svg
                  className="iphone-frame__wifi"
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                >
                  <path d="M8 10.8a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm-3.3-3.1a4.7 4.7 0 0 1 6.6 0l-1.1 1.1a3.1 3.1 0 0 0-4.4 0L4.7 7.7Zm-2.3-2.3a7.8 7.8 0 0 1 11.2 0l-1.1 1.1a6.2 6.2 0 0 0-9 0L2.4 5.4Z" />
                </svg>
                <svg
                  className="iphone-frame__battery"
                  width="27"
                  height="13"
                  viewBox="0 0 27 13"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="23"
                    height="12"
                    rx="2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.45"
                  />
                  <rect x="2" y="2" width="18" height="9" rx="1.5" />
                  <path
                    d="M25 4.2v4.6c.9-.4 1.4-1 1.4-2.3S25.9 4.6 25 4.2Z"
                    fillOpacity="0.45"
                  />
                </svg>
              </div>
            </div>
            {children}
            <div className="iphone-frame__home-indicator" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
