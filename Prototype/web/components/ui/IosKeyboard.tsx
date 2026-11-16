import type { MouseEvent as ReactMouseEvent } from "react";
import { UL_ASSETS } from "@/lib/uniLocateTokens";

type IosKeyboardProps = {
  className?: string;
  /** Tap letter keys / general keyboard */
  onActivate?: () => void;
  /** Tap Return (bottom-right) */
  onEnter?: () => void;
};

/**
 * Reusable iOS keyboard — `Screen Images/Keyboard.svg` (402×332).
 * Return key hit zone ≈ right 25% × bottom 30%.
 */
export default function IosKeyboard({
  className = "",
  onActivate,
  onEnter,
}: IosKeyboardProps) {
  const live = Boolean(onActivate || onEnter);

  const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const hitEnter = x > 0.74 && y > 0.68;
    if (hitEnter && onEnter) {
      onEnter();
      return;
    }
    onActivate?.();
  };

  return (
    <div
      className={`sco-kb sco-kb--asset ${live ? "sco-kb--tappable" : ""} ${className}`.trim()}
      aria-hidden={!live}
      onClick={live ? onClick : undefined}
      role={live ? "group" : undefined}
      aria-label={live ? "Keyboard" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="sco-kb__img"
        src={UL_ASSETS.iosKeyboard}
        alt=""
        width={402}
        height={332}
        draggable={false}
      />
    </div>
  );
}
