import { WHEELS } from "@/lib/diagram";

/**
 * Schematic side view of a generic front-engined car, facing left. Drawn in
 * the 1000×440 viewBox used by hotspots.json. Pure SVG, no state, so it can be
 * used inside server and client components. Colors come from design tokens.
 */
export function CarDrawing() {
  const internal = {
    fill: "none",
    stroke: "var(--diagram-internal)",
    strokeWidth: 3,
    strokeDasharray: "7 5",
  } as const;

  return (
    <g aria-hidden="true">
      {/* Ground and shadow */}
      <line x1="10" y1="414" x2="990" y2="414" stroke="var(--diagram-line)" strokeWidth="2" />
      <ellipse cx="505" cy="414" rx="470" ry="10" fill="var(--diagram-line)" opacity="0.18" />

      {/* Underbody items, visible below the sills */}
      <path d="M330 312 C 360 360, 390 392, 430 392 L 930 386" {...internal} />
      <rect x="452" y="386" width="60" height="24" rx="8" {...internal} />
      <rect x="850" y="372" width="86" height="26" rx="10" {...internal} />
      <rect x="300" y="396" width="160" height="14" rx="4" {...internal} />
      <path d="M640 398 L 760 392" {...internal} />

      {/* Body shell */}
      <path
        d="M30 318 L30 262 Q30 214 78 200 L372 166 L486 92 L690 86 Q742 88 832 156 L950 170 Q976 174 976 214 L976 318 L856 318 A80 80 0 0 0 704 318 L306 318 A80 80 0 0 0 154 318 Z"
        fill="var(--diagram-body)"
        stroke="var(--diagram-line)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Windows */}
      <path
        d="M394 166 L486 102 L588 98 L588 166 Z"
        fill="var(--diagram-glass)"
        stroke="var(--diagram-line)"
        strokeWidth="2"
      />
      <path
        d="M602 166 L602 98 L684 96 Q730 98 798 160 L800 166 Z"
        fill="var(--diagram-glass)"
        stroke="var(--diagram-line)"
        strokeWidth="2"
      />

      {/* Door shut lines and handles */}
      <path
        d="M380 170 L380 312 M595 166 L595 312 M806 168 L812 312"
        stroke="var(--diagram-line)"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M548 190 h26 M766 190 h26"
        stroke="var(--diagram-line)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Lights */}
      <path
        d="M36 224 Q44 210 76 206 L84 226 Q56 232 36 232 Z"
        fill="var(--warn-bg)"
        stroke="var(--diagram-line)"
        strokeWidth="2"
      />
      <rect
        x="958"
        y="186"
        width="16"
        height="34"
        rx="4"
        fill="var(--danger-border)"
        opacity="0.7"
      />

      {/* Internals (faint, dashed): radiator, battery, engine, gearbox, fuel tank, steering wheel */}
      <rect x="72" y="208" width="30" height="82" rx="4" {...internal} />
      <rect x="112" y="182" width="58" height="30" rx="4" {...internal} />
      <rect x="196" y="194" width="134" height="110" rx="10" {...internal} />
      <rect x="352" y="246" width="78" height="76" rx="8" {...internal} />
      <rect x="590" y="312" width="100" height="38" rx="8" {...internal} />
      <ellipse cx="466" cy="214" rx="8" ry="26" transform="rotate(-24 466 214)" {...internal} />

      {/* Wheels */}
      {WHEELS.map((w) => (
        <g key={w.cx}>
          <circle
            cx={w.cx}
            cy={w.cy}
            r={w.r}
            fill="#23272e"
            stroke="var(--diagram-line)"
            strokeWidth="2"
          />
          <circle cx={w.cx} cy={w.cy} r={w.r - 22} fill="var(--diagram-internal)" />
          <circle
            cx={w.cx}
            cy={w.cy}
            r={w.r - 34}
            fill="none"
            stroke="#23272e"
            strokeWidth="3"
            opacity="0.5"
          />
          <circle cx={w.cx} cy={w.cy} r="7" fill="#23272e" />
        </g>
      ))}
    </g>
  );
}
