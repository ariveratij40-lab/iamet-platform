/** Approved Processor identity. Lettering is drawn as paths, not a font substitute. */
export default function IametTechLogoV2({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 520 146"
      role="img"
      aria-label="IAMET — Integración de soluciones tecnológicas"
      className={`iamet-brand-logo w-full ${className}`}
    >
      <g
        className="iamet-logo-symbol"
        fill="none"
        stroke="#1264E8"
        strokeWidth="8"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      >
        <path
          pathLength="1"
          className="iamet-logo-frame"
          d="M46 20H94L110 36V104L94 120H46L30 104V36Z"
        />
        <path
          pathLength="1"
          className="iamet-logo-connections"
          d="M30 45H12V30M30 70H6M30 95H12V110M110 45H128V30M110 70H134M110 95H128V110"
        />
        <path
          pathLength="1"
          className="iamet-logo-core"
          d="M55 43H85M70 43V97M55 97H85"
          stroke="currentColor"
          strokeWidth="10"
        />
      </g>
      <g className="iamet-logo-wordmark" transform="translate(174 38)">
        <g
          transform=""
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="bevel"
          strokeLinecap="square"
        >
          <path
            pathLength="1"
            data-letter="I"
            transform="translate(0 0)"
            d="M0 0H28M14 0V64M0 64H28"
          />
          <path
            pathLength="1"
            data-letter="A"
            transform="translate(46 0)"
            d="M0 64V18L18 0H34L50 18V64M0 38H50"
          />
          <path
            pathLength="1"
            data-letter="M"
            transform="translate(114 0)"
            d="M0 64V0H5L28 31L51 0H56V64"
          />
          <path
            pathLength="1"
            data-letter="E"
            transform="translate(188 0)"
            d="M44 0H0V64H44M0 32H35"
          />
          <path
            pathLength="1"
            data-letter="T"
            transform="translate(250 0)"
            d="M0 0H50M25 0V64"
          />
        </g>
      </g>
    </svg>
  );
}
