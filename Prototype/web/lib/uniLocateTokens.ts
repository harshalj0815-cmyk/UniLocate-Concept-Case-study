/**
 * UniLocate shared design tokens — reuse on every screen.
 * Values locked from Paper SearchCollege-FirstTime + Figma.
 */

export const UL = {
  screen: { w: 402, h: 874 },

  /** App / search control width (Paper) */
  control: { w: 360, h: 48, radius: 16 },

  /** CTA dashed inset (Paper Dashlines) */
  ctaDash: {
    inset: 3,
    radius: 12,
    stroke: "#76C6FF",
    strokeWidth: 2,
    dasharray: "8 4.5",
    border: "#005490",
  },

  /** Primary CTA fill — Paper radial (default) */
  ctaGradient:
    "radial-gradient(ellipse 93.75% 73.02% at 50% 0%, #32A9FF 0%, #008AEC 100%)",

  /** Primary CTA press — solid fill */
  ctaPressFill: "#35ABFF",

  /** Screen wash — Paper SearchCollege artboard */
  screenGradient:
    "radial-gradient(ellipse 125.39% 50.305% at 50% 46.45%, #EEF8FF 0%, #C9E8FF 56.52%, #79BDEF 100%)",

  /** Results wash — Paper CollegeResults-FirstTime (3RR-0) */
  resultsGradient:
    "radial-gradient(ellipse 427.73% 112.96% at 50% 100%, #EEF8FF 0%, #C9E8FF 56.52%, #79BDEF 100%)",

  search: {
    fill: "#FFFFFF",
    stroke: "#EAEAEA",
    placeholder: "#9C9C9C",
    paddingLeft: 8,
    paddingRight: 12,
    gap: 10,
  },

  /**
   * Figma effect system — Drop shadow
   * x: 0 · y: 1 · blur: 2 · spread: 0 · #000 @ 15%
   */
  shadow: {
    x: 0,
    y: 1,
    blur: 2,
    spread: 0,
    color: "rgba(0, 0, 0, 0.15)",
  },

  /** Magnifying-glass in search fields — Paper Search.svg intrinsic 33×30 */
  iconSearch: 33,

  /** App mark tile (visible blue square inside Icon.svg) */
  iconApp: 80,

  /** Full Icon.svg asset including shadow padding */
  iconAppAsset: 110,

  type: {
    title: { size: 26, weight: 700, color: "#2C2C2C", tracking: "-0.02em" },
    control: { size: 16, weight: 500, tracking: "-0.02em" },
  },
} as const;

export const UL_ASSETS = {
  searchIcon: "/icons/Search.svg",
  clearIcon: "/icons/Cross.svg",
  appIcon: "/logo/Icon.svg",
  backgroundMap: "/images/Background.png",
  /** Keyboard — Screen Images/Keyboard.svg (402×332); v=2 clears black edge layers */
  iosKeyboard: "/images/Keyboard.svg?v=2",
  careLeft: "/icons/CareLeft.svg",
  googleIcon: "/icons/Google.svg",
  appleIcon: "/icons/Apple.svg",
  mailIcon: "/icons/Mail.svg",
  filterIcon: "/icons/Filter.svg",
  kebabIcon: "/icons/Kebab.svg",
  plusIcon: "/icons/Plus.svg",
  minusIcon: "/icons/Minus.svg",
  mapPinIcon: "/icons/MapPin.svg",
  signupDoor: "/images/signup-door.png",
  signupBadge: "/images/signup-badge.png",
  signupHangingIcon: "/images/signup-hanging-icon.png",
  mapGround: "/maps/ground-floor-map.html?embed=1",
} as const;
