"use client";

import { useEffect, useState } from "react";
import { IsometricSurveyChart } from "@/components/IsometricSurveyChart";
import {
  SURVEY_COMFORT,
  SURVEY_FREQUENCY,
  SURVEY_STRESS,
  SURVEY_TIME_TO_FIND,
} from "@/lib/surveyCharts";

const CHARTS = [
  SURVEY_FREQUENCY,
  SURVEY_TIME_TO_FIND,
  SURVEY_COMFORT,
  SURVEY_STRESS,
] as const;

export function SurveyChartsStack() {
  const [phone, setPhone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 780px)");
    const sync = () => {
      setPhone(mq.matches);
      if (!mq.matches) setExpanded(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const visible = phone && !expanded ? CHARTS.slice(0, 2) : CHARTS;

  return (
    <div className="iso-survey-wrap">
      <div className="iso-survey-stack">
        {visible.map((chart) => (
          <IsometricSurveyChart key={chart.title} {...chart} />
        ))}
      </div>
      {phone ? (
        <button
          type="button"
          className="iso-survey-more"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
