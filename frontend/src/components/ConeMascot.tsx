import type { SVGProps } from "react";

type ConeMascotProps = {
  /** Rendered width in px. Height keeps the 4:5 ratio. */
  size?: number;
  /** Left arm waves. Turn off for static places like empty states. */
  waving?: boolean;
  /** Accessible label. Pass "" if the mascot is purely decorative. */
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox">;

const css = `
  .rg-cone-wave { transform-origin: 76px 178px; animation: rg-cone-wave 1.6s ease-in-out infinite; }
  @keyframes rg-cone-wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-14deg); } }
  @media (prefers-reduced-motion: reduce) { .rg-cone-wave { animation: none; } }
`;

export default function ConeMascot({
  size = 240,
  waving = true,
  title = "RoadGuard cone mascot",
  ...rest
}: ConeMascotProps) {
  const decorative = title === "";

  return (
    <svg
      viewBox="0 0 240 300"
      width={size}
      height={(size * 300) / 240}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      {...rest}
    >
      {!decorative && <title>{title}</title>}
      <style>{css}</style>

      {/* ground shadow */}
      <ellipse cx="120" cy="281" rx="88" ry="10" fill="#000" opacity="0.35" />

      {/* sparkles */}
      <g fill="#FFC629">
        <path
          transform="translate(200 72)"
          d="M0-11 Q1-1 11 0 Q1 1 0 11 Q-1 1 -11 0 Q-1-1 0-11Z"
        />
        <path
          transform="translate(38 62) scale(.6)"
          d="M0-11 Q1-1 11 0 Q1 1 0 11 Q-1 1 -11 0 Q-1-1 0-11Z"
        />
        <circle cx="214" cy="118" r="3" />
      </g>

      {/* base */}
      <rect x="42" y="248" width="156" height="28" rx="9" fill="#C2410C" />
      <rect x="42" y="248" width="156" height="9" rx="4.5" fill="#E8590C" />

      {/* cone body */}
      <path
        d="M103 38 C108 24 132 24 137 38 L184 252 L56 252 Z"
        fill="#FF7A1A"
      />

      {/* reflective stripes */}
      <g fill="#FFF7ED">
        <polygon points="91.9,88 148.1,88 154.7,118 85.3,118" />
        <polygon points="64.9,210 175.1,210 181.3,238 58.7,238" />
      </g>

      {/* side shading + highlight */}
      <path
        d="M136.3 35.5 L137 38 L184 252 L168 252 Z"
        fill="#C2410C"
        opacity="0.35"
      />
      <path
        d="M109 58 L98 108"
        stroke="#FFF"
        strokeOpacity="0.28"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* face */}
      <circle cx="104" cy="146" r="12" fill="#fff" />
      <circle cx="136" cy="146" r="12" fill="#fff" />
      <circle cx="106" cy="147" r="6" fill="#2B1200" />
      <circle cx="138" cy="147" r="6" fill="#2B1200" />
      <circle cx="108.5" cy="144.5" r="2" fill="#fff" />
      <circle cx="140.5" cy="144.5" r="2" fill="#fff" />
      <circle cx="90" cy="168" r="6" fill="#FF4D4D" opacity="0.35" />
      <circle cx="150" cy="168" r="6" fill="#FF4D4D" opacity="0.35" />
      <path d="M106 168 Q120 192 134 168 Z" fill="#5B1A06" />
      <ellipse cx="120" cy="175" rx="6" ry="3.5" fill="#FB7185" />

      {/* left arm (waves) */}
      <g className={waving ? "rg-cone-wave" : undefined}>
        <path
          d="M76 178 Q42 168 34 134"
          stroke="#F3F4F6"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="32" cy="124" r="12" fill="#F3F4F6" />
      </g>

      {/* right arm (resting) */}
      <path
        d="M164 178 Q198 186 194 214"
        stroke="#F3F4F6"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="194" cy="220" r="12" fill="#F3F4F6" />
    </svg>
  );
}
