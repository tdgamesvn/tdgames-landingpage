"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

// Sáng / Tối / Theo máy cho /hr. Lưu lựa chọn ở localStorage, gắn data-hr-theme lên <html>
// (xem hr-theme.css) và gỡ khi rời trang để không ảnh hưởng site công khai.
export type HrThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "hr_theme";

const listeners = new Set<() => void>();

function readPref(): HrThemePref {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" || saved === "system" ? saved : "light";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useHrTheme() {
  // Mặc định Sáng (styleguide: khu làm việc nền sáng). Server render luôn "light"; client đọc localStorage sau hydrate (không lệch markup).
  const pref = useSyncExternalStore(subscribe, readPref, () => "light" as HrThemePref);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.hrTheme = pref === "system" ? (mq.matches ? "dark" : "light") : pref;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref]);

  useEffect(() => () => { delete document.documentElement.dataset.hrTheme; }, []);

  function choose(next: HrThemePref) {
    localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((cb) => cb());
  }

  return [pref, choose] as const;
}

const OPTIONS: { value: HrThemePref; label: string; icon: ReactNode }[] = [
  {
    value: "light",
    label: "Sáng",
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        <circle cx="10" cy="10" r="3.6" />
        <path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Tối",
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor" aria-hidden>
        <path d="M16.6 12.6A7 7 0 0 1 7.4 3.4a7 7 0 1 0 9.2 9.2Z" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "Theo máy",
    icon: (
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="2.5" y="3.5" width="15" height="10" rx="1.8" />
        <path d="M7 16.5h6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function ThemeToggle({ pref, onChange }: { pref: HrThemePref; onChange: (p: HrThemePref) => void }) {
  return (
    <div className="hr-segmented hr-segmented--icons" role="group" aria-label="Giao diện">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" aria-pressed={pref === o.value} title={o.label} onClick={() => onChange(o.value)}>
          {o.icon}
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
