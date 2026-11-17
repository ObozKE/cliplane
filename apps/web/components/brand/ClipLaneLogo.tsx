import React from "react";

export interface ClipLaneLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark" | "default";
}

/**
 * ClipLane Precision Vector Icon
 * A dynamic cutting-frame speed lane mark with an forward play chevron.
 */
export function ClipLaneIcon({
  className = "w-8 h-8",
  idPrefix = "cl-icon",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const gradId = `${idPrefix}-grad`;
  const glowId = `${idPrefix}-glow`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Main High-Velocity Mint-to-Cyan Gradient */}
        <linearGradient id={gradId} x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15E49E" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>

        {/* Ambient Neon Backlight Glow */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#15E49E" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Obsidian Shield / Film Frame with Smooth Rounded Corners */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="#090D14"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
      />

      {/* Left Vertical Filmstrip Speed Lane */}
      <path
        d="M10 11C10 9.89543 10.8954 9 12 9H13C14.1046 9 15 9.89543 15 11V29C15 30.1046 14.1046 31 13 31H12C10.8954 31 10 30.1046 10 29V11Z"
        fill={`url(#${gradId})`}
        opacity="0.85"
      />

      {/* Center Dynamic Video Cut Chevron / Play Arrow */}
      <path
        d="M18.5 13.5C18.5 12.33 19.8 11.62 20.8 12.24L29.2 17.74C30.15 18.33 30.15 19.67 29.2 20.26L20.8 25.76C19.8 26.38 18.5 25.67 18.5 24.5V13.5Z"
        fill={`url(#${gradId})`}
        filter={`url(#${glowId})`}
      />

      {/* Top-Right Film Perf Notch (Clip Identity) */}
      <rect x="29" y="8" width="3" height="3" rx="1" fill="#FFFFFF" opacity="0.9" />
      <rect x="29" y="29" width="3" height="3" rx="1" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

/**
 * Full ClipLane Brand Logo
 * Combines the custom vector icon with clean, high-impact brand typography.
 */
export function ClipLaneLogo({
  className = "",
  iconOnly = false,
  size = "md",
  theme = "default",
}: ClipLaneLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const textColors = {
    default: "text-[var(--text-primary,black)]",
    light: "text-white",
    dark: "text-black",
  };

  if (iconOnly) {
    return <ClipLaneIcon className={iconSizes[size]} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <ClipLaneIcon className={iconSizes[size]} />
      <div className="flex items-baseline">
        <span
          className={`font-extrabold tracking-tight ${textSizes[size]} ${textColors[theme]} font-sans`}
        >
          Clip<span className="text-[#15E49E]">Lane</span>
        </span>
      </div>
    </div>
  );
}
