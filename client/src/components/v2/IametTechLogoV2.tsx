import { useId } from "react";
import { iametDevopsCycle, iametDevopsCore } from "@shared/iamet-brand";

/** Approved solid DevOps identity. Keep the original IAMET lettering paths. */
export default function IametTechLogoV2({
  className = "",
  symbolOnly = false,
}: {
  className?: string;
  symbolOnly?: boolean;
}) {
  const maskId = `iamet-core-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={symbolOnly ? "0 0 140 140" : "0 0 520 146"}
      role="img"
      aria-label="IAMET — Integración tecnológica"
      className={`iamet-brand-logo w-full ${className}`}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="140"
          height="140"
        >
          <rect width="140" height="140" fill="white" />
          <rect x="57" y="42" width="26" height="56" fill="black" />
        </mask>
      </defs>
      <g
        className="iamet-logo-symbol"
        fill="none"
        stroke="var(--iamet-symbol-color, #2166FF)"
        strokeWidth="8"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      >
        <path
          pathLength="1"
          className="iamet-logo-frame"
          d={iametDevopsCycle}
          mask={`url(#${maskId})`}
        />
        <path pathLength="1" className="iamet-logo-core" d={iametDevopsCore} />
      </g>
      <g
        className="iamet-logo-glint"
        aria-hidden="true"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="bevel"
      >
        <path pathLength="1" d={iametDevopsCycle} mask={`url(#${maskId})`} />
        <path pathLength="1" d={iametDevopsCore} />
      </g>
      <g
        className="iamet-logo-wordmark"
        transform="translate(174 38)"
        display={symbolOnly ? "none" : undefined}
      >
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
