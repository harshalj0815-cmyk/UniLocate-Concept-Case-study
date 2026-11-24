"use client";

import { UL_ASSETS } from "@/lib/uniLocateTokens";

type Props = {
  /** Scanner open — scan line sweeps only while visible */
  active: boolean;
  /** Motion off — scan line parks mid-frame */
  reduce?: boolean;
  /** Code locked: brackets snap in and the scan line fades */
  hit?: boolean;
};

/**
 * Offline QR scanner — Paper 6HU-0 "Scanning frame" (360×284):
 * camera photo, dark mask with a rounded viewfinder cutout, four corner
 * brackets and a gradient scan line that sweeps the viewfinder.
 */
export default function QrScannerCard({ active, reduce = false, hit = false }: Props) {
  return (
    <div
      className="mf__scanner"
      data-active={active ? "true" : "false"}
      data-hit={hit ? "true" : "false"}
      aria-hidden={!active}
      role="img"
      aria-label="Camera scanning a QR code"
    >
      <div className="mf__scanner-inner">
        <div className="mf__scanner-scene">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mf__scanner-photo"
            src={UL_ASSETS.qrScanPhoto}
            alt=""
            width={360}
            height={284}
            draggable={false}
          />
          <svg
            className="mf__scanner-mask"
            viewBox="0 0 360 284"
            aria-hidden
            focusable="false"
          >
            <path
              fillRule="evenodd"
              fill="#000"
              d="M360 284H0V0H360V284ZM86 32C77.163 32 70 39.163 70 48V236C70 244.837 77.163 252 86 252H274C282.837 252 290 244.837 290 236V48C290 39.163 282.837 32 274 32H86Z"
            />
          </svg>
          <div className="mf__scanner-lane" aria-hidden>
            {/* Down pass — trail rides above the line */}
            {reduce ? null : (
              <div className="mf__scanner-line mf__scanner-line--down" />
            )}
            {/* Up pass — trail below the line (Paper Flair); parked when motion is off */}
            <div
              className={`mf__scanner-line mf__scanner-line--up${reduce ? " is-still" : ""}`}
            />
          </div>
          <svg
            className="mf__scanner-brackets"
            viewBox="0 0 360 284"
            aria-hidden
            focusable="false"
          >
            <g
              fill="none"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* top-right */}
              <path d="M227 32H275C279.243 32 283.313 33.686 286.314 36.686C289.314 39.687 291 43.757 291 48V96" />
              {/* bottom-right */}
              <path d="M227 251H275C279.243 251 283.313 249.314 286.314 246.314C289.314 243.313 291 239.243 291 235V187" />
              {/* top-left */}
              <path d="M133 32H85C80.757 32 76.687 33.686 73.686 36.686C70.686 39.687 69 43.757 69 48V96" />
              {/* bottom-left */}
              <path d="M133 251H85C80.757 251 76.687 249.314 73.686 246.314C70.686 243.313 69 239.243 69 235V187" />
            </g>
          </svg>
        </div>
        <div className="mf__scanner-shade" aria-hidden />
      </div>
    </div>
  );
}
