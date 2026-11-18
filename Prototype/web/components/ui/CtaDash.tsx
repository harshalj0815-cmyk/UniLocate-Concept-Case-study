import { paperSquirclePath } from "@/lib/continuousCorner";
import { UL } from "@/lib/uniLocateTokens";

const { control, ctaDash } = UL;

type Props = {
  width?: number;
  height?: number;
};

/** Border + dash only — fill comes from `.ul-cta` CSS (Paper radial). */
export default function CtaDash({
  width = control.w,
  height = control.h,
}: Props) {
  const innerW = width - ctaDash.inset * 2;
  const innerH = height - ctaDash.inset * 2;
  const outerPath = paperSquirclePath(width, height, control.radius);
  const dashPath = paperSquirclePath(innerW, innerH, ctaDash.radius);

  return (
    <svg
      className="ul-cta__dash"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      aria-hidden
    >
      <path
        d={outerPath}
        fill="none"
        stroke={ctaDash.border}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={dashPath}
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
