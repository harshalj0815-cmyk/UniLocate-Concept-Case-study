/** Paper Map-Success “Present” sticker — peeled corner + check */
export default function PresentSticker({ className = "" }: { className?: string }) {
  return (
    <div className={`mf__present ${className}`.trim()} aria-hidden>
      <svg
        className="mf__present-body"
        viewBox="0 0 176 32"
        width={176}
        height={32}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 0v32h164c6.084-3.569 8.744-6.173 12-12V0H0Z"
          fill="#237C06"
        />
        <path
          d="M0 0v32h164c6.084-3.569 8.744-6.173 12-12V0H0Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </svg>
      <svg
        className="mf__present-check"
        viewBox="0 0 12 12"
        width={12}
        height={12}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11 0.5v10a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5Z"
          fill="#FFFFFF"
          opacity={0.2}
          transform="translate(0.5 0.5)"
        />
        <path
          d="M8.854 4.146a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L5 7.293l3.146-3.147a.5.5 0 0 1 .708 0ZM12 1v10a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1Zm-1 10V1H1v10h10Z"
          fill="#FFFFFF"
        />
      </svg>
      <span className="mf__present-label">Present</span>
      <svg
        className="mf__present-peel"
        viewBox="0 0 12 13.18"
        width={12}
        height={13.18}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 13.183C2.047 7.979 2.348 5.366 0 1.183 4.501-.247 7.133-.536 12 1.183 8.43 6.801 5.94 9.568 0 13.183Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
