"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

// ===== Brand / App Logo =====
export function AppLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="appLogoG" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.72 0.16 175)" />
          <stop offset="0.5" stopColor="oklch(0.7 0.16 60)" />
          <stop offset="1" stopColor="oklch(0.7 0.2 330)" />
        </linearGradient>
        <linearGradient id="appLogoG2" x1="24" y1="14" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.95" />
          <stop offset="1" stopColor="white" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="13" fill="url(#appLogoG)" />
      <rect x="4" y="4" width="40" height="40" rx="13" fill="white" fillOpacity="0.08" />
      <circle cx="24" cy="24" r="11" stroke="url(#appLogoG2)" strokeWidth="2" strokeOpacity="0.5" />
      <circle cx="24" cy="24" r="7" stroke="url(#appLogoG2)" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="2.5" fill="url(#appLogoG2)" />
      <path d="M24 6 L24 10 M24 38 L24 42 M6 24 L10 24 M38 24 L42 24" stroke="url(#appLogoG2)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ===== Navigation / Module icons =====
export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function PomodoroIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="14" r="8" />
      <path d="M12 14l4-3" />
      <path d="M9 3h6M12 3v3" />
      <path d="M20 6l1.5-1.5" />
    </svg>
  );
}

export function SchulteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

export function MeditationIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M4 14c0-2 2-3 8-3s8 1 8 3" />
      <path d="M9 9c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
    </svg>
  );
}

export function BreathingIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      <path d="M3 17c2-4 4-4 6 0s4 4 6 0 4-4 6 0" opacity="0.5" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

// ===== UI icons =====
export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.21.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 0 1 6 0c2.29-1.53 3.3-1.21 3.3-1.21.65 1.66.24 2.88.12 3.18.77.83 1.23 1.88 1.23 3.17 0 4.54-2.81 5.53-5.49 5.83.43.36.81 1.08.81 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.83.56A12.01 12.01 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.4-.2-.7-.4-1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" />
      <circle cx="17.5" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function VolumeOffIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M22 9l-6 6M16 9l6 6" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" opacity="0.6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function StatsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 4-5" />
    </svg>
  );
}

export function FireIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.5 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-3 .5 3-1 4-1 4s.5-3-1-5c-1 2-2 2-2 2s.5-3-1-5Z" />
      <path d="M9 17a3 3 0 0 0 6 0c0-1-1-2-2-2" opacity="0.5" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
    </svg>
  );
}

export function SkipIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5l9 7-9 7V5Z" />
      <path d="M19 5v14" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20C4 11 11 4 20 4c0 9-7 16-16 16Z" />
      <path d="M4 20C8 16 12 12 16 8" />
    </svg>
  );
}

export function WindIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h9a2.5 2.5 0 1 1-2.5 2.5" />
    </svg>
  );
}

export function RainIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 14a4 4 0 0 1 .5-7.97A5.5 5.5 0 0 1 18 7.5a3.5 3.5 0 0 1 0 7H7Z" />
      <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
    </svg>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    </svg>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function FocusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" strokeOpacity="0.4" />
    </svg>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M17 17h4v-4" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 21h6M12 14v7" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  );
}

export function CameraOffIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v9M3 8v9a2 2 0 0 0 2 2h12" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function StreamIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  );
}

export function NightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      <circle cx="17" cy="6" r="0.5" fill="currentColor" />
      <circle cx="14" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function BirdIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12c2-4 5-6 9-6 3 0 5 1 7 3-2 1-4 1-6 1-2 0-4 1-5 3-1-1-3-1-5-1Z" />
      <circle cx="16" cy="8" r="0.8" fill="currentColor" />
      <path d="M3 12c1 2 2 3 3 3" opacity="0.5" />
    </svg>
  );
}

export function CafeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 2v3M11 2v3M14 2v3" opacity="0.6" />
    </svg>
  );
}

export function BowlIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <path d="M12 11V5" opacity="0.6" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <path d="M8 5c0-1 1-2 4-2s4 1 4 2" opacity="0.5" />
    </svg>
  );
}

export function ChimeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v3" opacity="0.6" />
      <path d="M7 6h10l-2 8a3 3 0 0 1-6 0L7 6Z" />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ThunderIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 14a4 4 0 0 1 .5-7.97A5.5 5.5 0 0 1 18 7.5a3.5 3.5 0 0 1 0 7H7Z" opacity="0.5" />
      <path d="M13 11l-3 5h3l-2 4 4-6h-3l1-3Z" fill="currentColor" />
    </svg>
  );
}

export function WhaleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 14c0-3 3-5 7-5 5 0 8 2 10 5-2 2-5 3-8 3-2 0-4-1-5-2-1 1-2 2-4 2Z" />
      <path d="M20 14c1-2 2-3 2-5M4 16c-1 1-1 2-1 3" opacity="0.5" />
      <circle cx="8" cy="13" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function CrystalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2L7 8l5 14 5-14-5-6Z" />
      <path d="M7 8h10M12 2v20" opacity="0.5" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function HarpIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4v16M9 4v16M13 4v16M17 4v16" opacity="0.7" />
      <path d="M4 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4Z" opacity="0.3" />
    </svg>
  );
}

export function FluteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12h18" />
      <circle cx="7" cy="12" r="1.2" fill="currentColor" />
      <circle cx="11" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <path d="M3 10v4M21 10v4" opacity="0.6" />
    </svg>
  );
}

export function StringsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3v18M10 3v18M14 3v18M18 3v18" />
      <path d="M4 6h16M4 18h16" opacity="0.5" />
    </svg>
  );
}

export function PadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="9" cy="15" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function FaceMeshIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" />
      <circle cx="12" cy="14" r="0.8" fill="currentColor" />
      <circle cx="9" cy="15" r="0.6" fill="currentColor" opacity="0.6" />
      <circle cx="15" cy="15" r="0.6" fill="currentColor" opacity="0.6" />
      <path d="M12 3v6M3 12h6M15 12h6M12 15v6" opacity="0.3" />
    </svg>
  );
}
