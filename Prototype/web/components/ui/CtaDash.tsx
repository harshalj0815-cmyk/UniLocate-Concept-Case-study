import { paperSquirclePath } from "@/lib/continuousCorner";
import { UL } from "@/lib/uniLocateTokens";

const { control, ctaDash } = UL;
const innerW = control.w - ctaDash.inset * 2;
const innerH = control.h - ctaDash.inset * 2;

const OUTER_PATH = paperSquirclePath(control.w, control.h, control.radius);
const DASH_PATH = paperSquirclePath(innerW, innerH, ctaDash.radius);

/** Border + dash only — fill comes from `.ul-cta` CSS (Paper radial). */
export default function CtaDash() {
  return (
    <svg
      className="ul-cta__dash"
      viewBox={`0 0 ${control.w} ${control.h}`}
      width="100%"
      height="100%"
      aria-hidden
    >
      <path
        d={OUTER_PATH}
        fill="none"
        stroke={ctaDash.border}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={DASH_PATH}
        transform={`translate(${ctaDash.inset} ${ctaDash.inset})`}
        fill="none"
        stroke={ctaDash.stroke}
        strokeWidth={ctaDash.strokeWidth}
        strokeDasharray={ctaDash.dasharray}
        strokeLinecap="butt"
      />
    </svg>
  );
}
