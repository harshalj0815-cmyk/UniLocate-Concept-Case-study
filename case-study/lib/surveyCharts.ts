import type { SurveySlice } from "@/components/IsometricSurveyChart";

/** Bright mid-tones (case-study friendly; not neon, not washed out). */
const P = {
  blue: { c: "#4BA3E8", t: "#FFFFFF" },
  coral: { c: "#F07167", t: "#FFFFFF" },
  peach: { c: "#F2A65A", t: "#1B1B1B" },
  mint: { c: "#3DBE8B", t: "#FFFFFF" },
  lilac: { c: "#9B7EDE", t: "#FFFFFF" },
} as const;

/**
 * Tallies from “Finding Your Way on Campus” among respondents who said yes
 * they had difficulty (n=31). Frequency chart matches the provided isometric
 * HTML. Other charts tallied from the same survey export.
 */
export const SURVEY_FREQUENCY = {
  title: "How many times has this happened to you?",
  data: [
    { k: "Once", n: 1, ...P.blue },
    { k: "2 to 3 times", n: 19, ...P.coral },
    { k: "4 or more times", n: 11, ...P.peach },
  ] satisfies SurveySlice[],
};

export const SURVEY_TIME_TO_FIND = {
  title: "How long did it take you to reach there?",
  data: [
    { k: "Less than 5 minutes", n: 3, ...P.blue },
    { k: "5 to 10 minutes", n: 15, ...P.coral },
    { k: "10 to 20 minutes", n: 9, ...P.peach },
    { k: "More than 20 minutes", n: 3, ...P.mint },
    { k: "I never found it", n: 1, ...P.lilac },
  ] satisfies SurveySlice[],
};

export const SURVEY_COMFORT = {
  title: "How long before you could get around on your own?",
  data: [
    { k: "Within the first week", n: 10, ...P.blue },
    { k: "1 to 2 weeks", n: 8, ...P.coral },
    { k: "3 to 4 weeks", n: 3, ...P.peach },
    { k: "More than a month", n: 2, ...P.mint },
    { k: "I still need help sometimes", n: 8, ...P.lilac },
  ] satisfies SurveySlice[],
};

/** 1–5 stress scale from the survey (no “1” responses in this yes-set). */
export const SURVEY_STRESS = {
  title: "How stressful was this situation for you?",
  data: [
    { k: "2", n: 4, ...P.blue },
    { k: "3", n: 14, ...P.coral },
    { k: "4", n: 8, ...P.peach },
    { k: "5", n: 5, ...P.lilac },
  ] satisfies SurveySlice[],
};
