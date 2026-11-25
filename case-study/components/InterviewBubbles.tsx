"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Quotes auto-cycle over the crowd. Click the bubble or a character for the next quote.
 */
const SPEAKERS = [
  {
    head: 0.18,
    color: "#7B3FE4",
    quotes: [
      "There is also no sign showing that this classroom number is here.",
      "There's only one 3D model right at the entrance of our college.",
      "We tried to figure it out by looking at the map but that just confused us more.",
    ],
  },
  {
    head: 0.34,
    color: "#E0206A",
    quotes: [
      "I'll be moving from mechanical department to electronics and I won't even notice.",
      "I by mistakenly got into a commerce section.",
      "It was like a puzzle. We couldn't find the right corridors and the right wings.",
    ],
  },
  {
    head: 0.53,
    color: "#0E8F6B",
    quotes: [
      "It was difficult to find the classroom during my exam times.",
      "It was my first event and it was very difficult to find the auditorium.",
      "Finding classrooms of my friends in different wings and floors was difficult.",
    ],
  },
  {
    head: 0.71,
    color: "#E8A200",
    quotes: [
      "I was roaming here and there for at least 15 to 20 minutes.",
      "I reached about 5 to 10 minutes late there.",
      "After half an hour I found some students or seniors and they told me this is the lab.",
    ],
  },
  {
    head: 0.843,
    color: "#F26A0F",
    quotes: [
      "The campus is very huge. There are so many wings.",
      "Whenever I visited other colleges their structure is very much more confusing.",
      "If you're walking through the corridor, even its door won't be visible to you.",
    ],
  },
] as const;

/** Affinity clusters from Research/UniLocate- Clustered themes from Notes.md */
const AFFINITY = [
  {
    stayed: true,
    title:
      "Student can’t find a specific classroom because nothing at the college guides them there: no usable map and no signs along the way.",
  },
  {
    stayed: true,
    title:
      "Student can’t tell which department or wing they’re in, so they end up in the wrong place and don’t realise until later.",
  },
  {
    stayed: true,
    title:
      "Even students who knew the college struggle to find places beyond their regular class, sometimes their own class when it moves.",
  },
  {
    stayed: false,
    title:
      "People waste time searching for a place, and some arrive late or miss a lecture or event.",
  },
  {
    stayed: false,
    title:
      "Students were confused because of different architecture and huge campus size.",
  },
  {
    stayed: false,
    title:
      "Student find the campus hard to read: it’s large, and destinations can’t be seen from where they stand.",
  },
] as const;

const ALL_QUOTES = SPEAKERS.flatMap((s) => [...s.quotes]);
const INTERVAL = 3000;

type Turn = { speakerIndex: number; quoteIndex: number };

export function AffinityClusters() {
  /* Phone: only the first two notes until "Show more" (hidden via CSS, so no flash) */
  const [expanded, setExpanded] = useState(false);

  return (
    <figure
      className={`interview-bubbles interview-bubbles--affinity section-visual${
        expanded ? "" : " is-collapsed"
      }`}
    >
      <ol className="interview-bubbles__affinity" id="affinity-notes">
        {AFFINITY.map((item) => (
          <li
            key={item.title}
            className="interview-bubbles__affinity-item sticker"
          >
            <span
              className={`interview-bubbles__mark${item.stayed ? " is-kept" : " is-dropped"}`}
              aria-hidden="true"
            >
              {item.stayed ? "↑" : "↓"}
            </span>
            <span className="sr-only">
              {item.stayed ? "Stayed. " : "Did not stay. "}
            </span>
            <span className="interview-bubbles__affinity-title">
              {item.title}
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="interview-bubbles__more"
        aria-expanded={expanded}
        aria-controls="affinity-notes"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
      <figcaption className="sr-only">
        Affinity-map titles marked with an up arrow if they stayed in
        synthesis, or a down arrow if they did not.
      </figcaption>
    </figure>
  );
}

export function InterviewBubbles() {
  const stageRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const turnRef = useRef<Turn>({ speakerIndex: 0, quoteIndex: 0 });
  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const [turn, setTurn] = useState<Turn>({ speakerIndex: 0, quoteIndex: 0 });
  const [out, setOut] = useState(false);
  const [slotHeight, setSlotHeight] = useState<number | undefined>();
  const [tail, setTail] = useState("50%");
  const [borderColor, setBorderColor] = useState<string>(SPEAKERS[0].color);

  const speaker = SPEAKERS[turn.speakerIndex];
  const text = speaker.quotes[turn.quoteIndex];

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const applyTail = (speakerIndex: number) => {
    const stage = stageRef.current;
    const bubble = bubbleRef.current;
    const img = imgRef.current;
    const sData = SPEAKERS[speakerIndex];
    if (!stage || !bubble || !img || !sData) return;
    const bw = bubble.offsetWidth;
    const s = stage.getBoundingClientRect();
    const r = img.getBoundingClientRect();
    const c = r.left + r.width * sData.head - s.left;
    const x = Math.max(28, Math.min(bw - 28, c - (s.width - bw) / 2));
    setTail(`${x}px`);
    setBorderColor(sData.color);
  };

  const measureSlot = () => {
    const measure = measureRef.current;
    const bubble = bubbleRef.current;
    if (!measure || !bubble) return;
    let maxQuote = 0;
    ALL_QUOTES.forEach((q) => {
      measure.textContent = `“${q}”`;
      maxQuote = Math.max(maxQuote, measure.offsetHeight);
    });
    measure.textContent = "";
    const style = getComputedStyle(bubble);
    const padY =
      (parseFloat(style.paddingTop) || 0) +
      (parseFloat(style.paddingBottom) || 0);
    const borderY =
      (parseFloat(style.borderTopWidth) || 0) +
      (parseFloat(style.borderBottomWidth) || 0);
    setSlotHeight(Math.ceil(maxQuote + padY + borderY));
  };

  const randomTurn = (from: Turn): Turn => {
    let speakerIndex = from.speakerIndex;
    if (SPEAKERS.length > 1) {
      do {
        speakerIndex = Math.floor(Math.random() * SPEAKERS.length);
      } while (speakerIndex === from.speakerIndex);
    }
    const quotes = SPEAKERS[speakerIndex].quotes;
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    return { speakerIndex, quoteIndex };
  };

  const goNext = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const next = randomTurn(turnRef.current);
    setOut(true);
    window.setTimeout(() => {
      turnRef.current = next;
      setTurn(next);
      setOut(false);
      busyRef.current = false;
      requestAnimationFrame(() => applyTail(next.speakerIndex));
    }, 220);
  };

  const startTimer = () => {
    clearTimer();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;
    timerRef.current = window.setInterval(goNext, INTERVAL);
  };

  useEffect(() => {
    measureSlot();
    applyTail(0);
    startTimer();
    const onResize = () => {
      measureSlot();
      applyTail(turnRef.current.speakerIndex);
    };
    window.addEventListener("resize", onResize);
    void document.fonts?.ready?.then(() => {
      measureSlot();
      applyTail(turnRef.current.speakerIndex);
    });
    return () => {
      clearTimer();
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bubbleStyle = {
    ["--tail"]: tail,
    ["--bc"]: borderColor,
  } as CSSProperties;

  const quoteKey = `${turn.speakerIndex}-${turn.quoteIndex}`;

  return (
    <figure className="interview-bubbles section-visual">
      <div className="interview-bubbles__stage" ref={stageRef}>
        <div
          className="interview-bubbles__slot"
          style={slotHeight ? { height: slotHeight } : undefined}
        >
          <button
            type="button"
            className={`interview-bubbles__bubble${out ? " is-out" : ""}`}
            ref={bubbleRef}
            aria-live="polite"
            style={bubbleStyle}
            onClick={goNext}
            aria-label="Show next interview quote"
          >
            <p className="interview-bubbles__quote" key={quoteKey}>
              “{text}”
            </p>
          </button>
        </div>
        <p
          className="interview-bubbles__quote interview-bubbles__measure"
          ref={measureRef}
          aria-hidden="true"
        />
        <div className="interview-bubbles__group">
          <Image
            ref={imgRef}
            className="interview-bubbles__crowd"
            src="/interview-crowd.png"
            alt="Illustrated students from interview sessions"
            width={1000}
            height={480}
            draggable={false}
            sizes="(max-width: 920px) 100vw, 720px"
            onLoad={() => {
              measureSlot();
              applyTail(turnRef.current.speakerIndex);
            }}
          />
          <div className="interview-bubbles__hits">
            {SPEAKERS.map((s) => (
              <button
                key={s.color}
                type="button"
                className="interview-bubbles__hit"
                style={{ ["--head" as string]: `${s.head * 100}%` }}
                onClick={goNext}
                aria-label="Show next interview quote"
              />
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Interview quotes auto-cycle over illustrated students. Click the bubble
        or a student for the next quote.
      </figcaption>
    </figure>
  );
}
