/** Orange guidance glyph — maps campus-router step icons to a single sign */

type Props = {
  icon?: string;
};

export default function NavManeuverSign({ icon = "walk" }: Props) {
  const kind = icon || "walk";
  return (
    <svg
      className="mf__nav-sign-svg"
      viewBox="0 0 56 56"
      width={56}
      height={56}
      aria-hidden
    >
      <rect width="56" height="56" rx="8" fill="#FF614F" />
      {kind === "left" ? (
        <path
          fill="#fff"
          d="M27.5 14.5v4h9.75c.69 0 1.25.56 1.25 1.25V42a1.25 1.25 0 1 1-2.5 0V21.25H27.5v4.1a1 1 0 0 1-1.62.78l-7.6-5.35a1 1 0 0 1 0-1.66l7.6-5.35a1 1 0 0 1 1.62.78Z"
        />
      ) : kind === "right" ? (
        <path
          fill="#fff"
          d="M28.5 14.5v4H18.75a1.25 1.25 0 0 0-1.25 1.25V42a1.25 1.25 0 1 0 2.5 0V21.25H28.5v4.1a1 1 0 0 0 1.62.78l7.6-5.35a1 1 0 0 0 0-1.66l-7.6-5.35a1 1 0 0 0-1.62.78Z"
        />
      ) : kind === "back" ? (
        <path
          fill="#fff"
          d="M28 12.5a1.25 1.25 0 0 1 1.25 1.25V30.5h4.1a1 1 0 0 1 .78 1.62l-5.35 7.6a1 1 0 0 1-1.66 0l-5.35-7.6a1 1 0 0 1 .78-1.62h4.1V13.75A1.25 1.25 0 0 1 28 12.5Z"
        />
      ) : kind === "arrive" ? (
        <path
          fill="#fff"
          d="M28 14c-5.5 0-10 4.2-10 9.4 0 6.2 8.2 15.2 9.4 16.5a.9.9 0 0 0 1.2 0C29.8 38.6 38 29.6 38 23.4 38 18.2 33.5 14 28 14Zm0 12.8a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8Z"
        />
      ) : kind === "stairs" || kind === "stair" ? (
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M16 38h8v-6h6v-6h6v-6h8v-4H34v6h-6v6h-6v6h-6v4Z"
        />
      ) : kind === "lift" || kind === "elevator" ? (
        <>
          <rect x="20" y="14" width="16" height="28" rx="2" stroke="#fff" strokeWidth="2.5" fill="none" />
          <path fill="#fff" d="M28 18.5 31.5 23h-7L28 18.5Zm0 19L24.5 33h7L28 37.5Z" />
        </>
      ) : (
        /* walk / head / default — straight ahead */
        <path
          fill="#fff"
          d="M28 12.5a1.25 1.25 0 0 1 1.25 1.25V30.5h4.1a1 1 0 0 1 .78 1.62l-5.35 7.6a1 1 0 0 1-1.66 0l-5.35-7.6a1 1 0 0 1 .78-1.62h4.1V13.75A1.25 1.25 0 0 1 28 12.5Z"
          transform="rotate(180 28 28)"
        />
      )}
    </svg>
  );
}
