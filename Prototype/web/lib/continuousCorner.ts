import { getSvgPath } from "figma-squircle";

/** Figma / iOS default continuous corner (Corner smoothing 60%). */
export const IOS_CORNER_SMOOTHING = 0.6;

/**
 * Paper radii stay as-is; only the curve becomes a squircle (Figma continuous corner).
 */
export function paperSquirclePath(
  width: number,
  height: number,
  cornerRadius: number,
  cornerSmoothing: number = IOS_CORNER_SMOOTHING,
): string {
  return getSvgPath({
    width,
    height,
    cornerRadius,
    cornerSmoothing,
    preserveSmoothing: true,
  });
}

export function paperSquircleClip(
  width: number,
  height: number,
  cornerRadius: number,
): string {
  return `path('${paperSquirclePath(width, height, cornerRadius)}')`;
}
