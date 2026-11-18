"use client";

import type {
  AnimationEvent,
  CSSProperties,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { paperSquirclePath } from "@/lib/continuousCorner";
import { UL, UL_ASSETS } from "@/lib/uniLocateTokens";

const PATH = paperSquirclePath(UL.control.w, UL.control.h, UL.control.radius);

/** Always starts on “College Name”, then cycles */
const ROTATING_PHRASES = [
  "College Name",
  "College Location",
  "College Acronym",
  "College Pincode",
  "College Address",
] as const;

const TYPE_MS = 78;
const DELETE_MS = 48;
const HOLD_MS = 2200;
const GAP_MS = 480;

type SearchFieldProps = {
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  /** Entrance blur→sharp — skip when returning to home */
  animate?: boolean;
  /** Typewriter cycle through search hints — default on */
  rotatingPlaceholder?: boolean;
  onActivate?: () => void;
  /** Trailing control — e.g. map Filter.svg */
  trailing?: ReactNode;
  /** Editable value — same shell, real input */
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  /** College-style blue blink caret (hide native caret) */
  customCaret?: boolean;
  /** Focus the field when this flips true (map search open) */
  autoFocus?: boolean;
};

/** Shared UniLocate search control — 360×48, radius 16, Paper Search.svg */
export default function SearchField({
  placeholder = "College Name",
  className = "",
  style,
  animate = true,
  rotatingPlaceholder = true,
  onActivate,
  trailing,
  value,
  onChange,
  onSubmit,
  customCaret = false,
  autoFocus = false,
}: SearchFieldProps) {
  const reduce = useReducedMotion();
  const editable = onChange != null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [crisp, setCrisp] = useState(!animate);
  const [inputFocused, setInputFocused] = useState(false);
  const [typed, setTyped] = useState(
    rotatingPlaceholder && !reduce ? "" : placeholder,
  );
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const useCustomCaret = editable && customCaret;

  const markCrisp = useCallback(() => setCrisp(true), []);

  useEffect(() => {
    if (!autoFocus || !useCustomCaret) return;
    inputRef.current?.focus();
  }, [autoFocus, useCustomCaret]);

  const onAnimEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (
        e.animationName === "scf-search-enter" ||
        e.animationName === "scf-fade-in"
      ) {
        markCrisp();
      }
    },
    [markCrisp],
  );

  /* Fallback if animationend is missed — delay 1500 + duration 260 */
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(markCrisp, 1860);
    return () => window.clearTimeout(t);
  }, [animate, markCrisp]);

  /* Typewriter: type → hold → delete → next (always begins at College Name) */
  useEffect(() => {
    if (editable || !rotatingPlaceholder) {
      setTyped(rotatingPlaceholder ? ROTATING_PHRASES[0] : placeholder);
      return;
    }
    if (reduce) {
      setTyped(ROTATING_PHRASES[0]);
      return;
    }

    let cancelled = false;
    indexRef.current = 0;
    setTyped("");

    const clear = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timerRef.current = window.setTimeout(resolve, ms);
      });

    const run = async () => {
      while (!cancelled) {
        const phrase = ROTATING_PHRASES[indexRef.current];

        for (let i = 1; i <= phrase.length; i += 1) {
          if (cancelled) return;
          setTyped(phrase.slice(0, i));
          await wait(TYPE_MS);
        }

        if (cancelled) return;
        await wait(HOLD_MS);
        if (cancelled) return;

        for (let i = phrase.length - 1; i >= 0; i -= 1) {
          if (cancelled) return;
          setTyped(phrase.slice(0, i));
          await wait(DELETE_MS);
        }

        if (cancelled) return;
        await wait(GAP_MS);
        if (cancelled) return;

        indexRef.current =
          (indexRef.current + 1) % ROTATING_PHRASES.length;
      }
    };

    void run();
    return () => {
      cancelled = true;
      clear();
    };
  }, [editable, placeholder, reduce, rotatingPlaceholder]);

  const label = rotatingPlaceholder
    ? reduce
      ? ROTATING_PHRASES[0]
      : typed
    : placeholder;

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
    },
    [onSubmit],
  );

  const onFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onSubmit?.();
    },
    [onSubmit],
  );

  return (
    <div
      className={`ul-search ${crisp ? "ul-search--crisp" : ""} ${useCustomCaret && inputFocused ? "ul-search--focused" : ""} ${onActivate && !editable ? "ul-search--tappable" : ""} ${trailing ? "ul-search--trailing" : ""} ${className}`.trim()}
      role="search"
      style={style}
      onAnimationEnd={onAnimEnd}
      onClick={!editable ? onActivate : undefined}
      onKeyDown={
        onActivate && !editable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      tabIndex={onActivate && !editable ? 0 : undefined}
    >
      <svg
        className="ul-search__shape"
        viewBox={`0 0 ${UL.control.w} ${UL.control.h}`}
        width={UL.control.w}
        height={UL.control.h}
        aria-hidden
      >
        <path
          d={PATH}
          fill={UL.search.fill}
          stroke={UL.search.stroke}
          strokeWidth="1"
        />
      </svg>
      <form
        className={`ul-search__row${useCustomCaret ? " ul-search__row--focused" : ""}`}
        onSubmit={onFormSubmit}
      >
        {/* Focused college-style chrome: no leading search icon */}
        {!(useCustomCaret && inputFocused) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="ul-search__icon"
            src={UL_ASSETS.searchIcon}
            alt=""
            width={33}
            height={30}
          />
        ) : null}
        {useCustomCaret ? (
          <div
            className="ul-search__value"
            onClick={() => inputRef.current?.focus()}
          >
            {(value ?? "") ? (
              <span className="ul-search__query">{value}</span>
            ) : !inputFocused ? (
              <span className="ul-search__placeholder">{placeholder}</span>
            ) : null}
            {inputFocused ? (
              <span className="ul-search__caret" aria-hidden />
            ) : null}
            <input
              ref={inputRef}
              className="ul-search__input ul-search__input--ghost"
              type="search"
              value={value ?? ""}
              aria-label={placeholder}
              enterKeyHint="search"
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        ) : editable ? (
          <input
            className="ul-search__input"
            type="search"
            value={value ?? ""}
            placeholder={placeholder}
            aria-label={placeholder}
            enterKeyHint="search"
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={onKeyDown}
          />
        ) : (
          <span className="ul-search__placeholder">{label}</span>
        )}
        {trailing ? (
          <div className="ul-search__trailing">{trailing}</div>
        ) : null}
      </form>
    </div>
  );
}
