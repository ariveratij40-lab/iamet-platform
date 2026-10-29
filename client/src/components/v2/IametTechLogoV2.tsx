/** Vector concept: each circuit trace can animate independently. */
export default function IametTechLogoV2() {
  return (
    <svg
      viewBox="0 0 540 150"
      role="img"
      aria-label="Propuesta de logo IAMET: circuito e integración tecnológica"
      className="w-full max-w-[540px] overflow-visible"
    >
      <g
        className="iamet-logo-traces"
        fill="none"
        stroke="#43d7f5"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path pathLength="1" d="M65 13 117 43v60l-52 30-52-30V43Z" />
        <path
          pathLength="1"
          d="M0 56h30l13-13h43M0 91h30l13 13h43M130 56h-24l-14 14H65M130 91h-24L92 77H65"
        />
        <path pathLength="1" d="M53 45h25M65 45v58M53 103h25" strokeWidth="7" />
      </g>
      <circle
        className="iamet-logo-signal"
        cx="130"
        cy="56"
        r="5"
        fill="#f7c948"
      />
      <circle cx="0" cy="91" r="4" fill="#43d7f5" />
      <text
        x="162"
        y="99"
        fill="#f0f7ff"
        fontFamily="Arial, sans-serif"
        fontSize="77"
        fontWeight="700"
        letterSpacing="4"
      >
        IAMET
      </text>
      <text
        x="166"
        y="128"
        fill="#72a8bd"
        fontFamily="monospace"
        fontSize="10"
        letterSpacing="4"
      >
        EVOLUCIÓN TECNOLÓGICA
      </text>
    </svg>
  );
}
