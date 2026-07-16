import type { CSSProperties } from "react";

type IconProps = {
  className?: string;
  title?: string;
  style?: CSSProperties;
};

export function BallMark({ className, title = "Football", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <path
        fill="#f7faf7"
        d="M32 14l6.2 4.5-2.4 7.3H28.2l-2.4-7.3L32 14zm-12.8 9.4 4.5-6.2 7.3 2.4v7.6l-7.3 2.4-4.5-6.2zm25.6 0-4.5-6.2-7.3 2.4v7.6l7.3 2.4 4.5-6.2zM19.2 40.6l4.5 6.2 7.3-2.4v-7.6l-7.3-2.4-4.5 6.2zm25.6 0-4.5 6.2-7.3-2.4v-7.6l7.3-2.4 4.5 6.2zM32 50l-6.2-4.5 2.4-7.3h7.6l2.4 7.3L32 50z"
      />
    </svg>
  );
}

export function PitchIcon({ className, title = "Pitch", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="8"
        width="40"
        height="32"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 8v32M4 24h40M4 16h6v16H4M38 16h6v16h-6"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function MapPinIcon({ className, title = "Location", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21s7-5.3 7-11a7 7 0 10-14 0c0 5.7 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ClockIcon({ className, title = "Time", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
