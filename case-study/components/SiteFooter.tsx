"use client";

import { useEffect, useRef } from "react";

/**
 * Footer links. Leave a url empty to hide that button until it is ready.
 */
const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/harshaljadhav15/" },
  { label: "X", href: "https://x.com/Har5hal_" },
  { label: "Medium", href: "https://medium.com/@harshalj0815" },
];

const CTAS = [
  { label: "Contact me", href: "mailto:harshalj0815@gmail.com" },
  /* Portfolio not ready yet: add the url to show this button */
  { label: "Portfolio", href: "" },
];

export function SiteFooter() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    /* Some browsers block autoplay until the first interaction */
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) =>
      window.addEventListener(e, tryPlay, { once: true, passive: true }),
    );
    return () => events.forEach((e) => window.removeEventListener(e, tryPlay));
  }, []);

  const socials = SOCIALS.filter((s) => s.href);
  const ctas = CTAS.filter((c) => c.href);

  return (
    <footer className="ft">
      <video
        ref={videoRef}
        className="ft__video"
        poster="/footer-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/footer-loop.mp4" type="video/mp4" />
      </video>
      <div className="ft__shade" aria-hidden="true" />

      <div className="ft__card ft-sq">
        <h2>Thanks For Reading</h2>
        <ul className="ft__row">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                className="ft__chip ft-sq"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            </li>
          ))}
          {ctas.map((c) => {
            const external = !c.href.startsWith("mailto:");
            return (
              <li key={c.label}>
                <a
                  className="ft__cta ft-sq"
                  href={c.href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {c.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
