"use client";

import type { ReactNode } from "react";

const ACCENT = "var(--hero-btn-bg, #f59e0b)";

const accentUnderlineBar = {
  background:
    "linear-gradient(90deg, rgba(255,180,0,0) 0%, rgba(255,180,0,1) 18%, rgba(255,140,58,1) 82%, rgba(255,140,58,0) 100%)",
  boxShadow: "0 0 18px rgba(255,180,0,0.25)",
} as const;

export function AccentHighlight({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ color: ACCENT }}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-0 h-[3px] w-full rounded-full opacity-90"
        style={accentUnderlineBar}
      />
    </span>
  );
}
