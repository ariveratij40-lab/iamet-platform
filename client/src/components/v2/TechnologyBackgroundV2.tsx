/** Decorative background: kept outside the reading and keyboard navigation flow. */
export default function TechnologyBackgroundV2() {
  return (
    <div
      aria-hidden="true"
      className="iamet-tech-background pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="iamet-tech-ambient absolute -right-40 top-0 h-[800px] w-[800px] rounded-full" />
      <svg
        className="absolute inset-0 h-full w-full text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="iamet-background-circuits"
            width="480"
            height="400"
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.055"
            >
              <path d="M0 74h90l38 38h104v64h80l46-46h122M0 290h66l42-42h96v66h120l40 40h116M264 0v42l42 42h80v100h94M36 400v-50l30-30v-86H0" />
              <circle cx="232" cy="112" r="4" />
              <circle cx="312" cy="176" r="4" />
              <circle cx="204" cy="314" r="4" />
              <circle cx="386" cy="84" r="4" />
            </g>
            <g fill="currentColor" opacity="0.08">
              <circle cx="90" cy="74" r="2" />
              <circle cx="108" cy="248" r="2" />
              <circle cx="364" cy="354" r="2" />
              <circle cx="66" cy="234" r="2" />
            </g>
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#iamet-background-circuits)"
        />
      </svg>
      <div className="iamet-tech-watermark absolute right-[-2%] top-[34%] select-none text-[clamp(7rem,21vw,23rem)] font-bold leading-none tracking-[-0.07em]">
        IAMET
      </div>
      <div className="iamet-tech-orbit absolute -left-48 top-[68%] h-[600px] w-[600px] rounded-full border border-blue-500/[0.05]">
        <div className="absolute inset-12 rounded-full border border-blue-500/[0.04]" />
        <span className="absolute left-1/2 top-0 h-2 w-2 rounded-full bg-blue-400/20 shadow-[0_0_14px_rgba(59,130,246,.15)]" />
      </div>
    </div>
  );
}
