"use client";

import ThemeToggle, { type HrThemePref } from "./ThemeToggle";

/** Ô nhập dùng chung cho form đăng nhập / đặt mật khẩu. */
export const AUTH_INPUT =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none";

export const AUTH_LINK = "text-[13px] text-amber-400 hover:underline disabled:opacity-40";

/** Khung thẻ giữa màn hình (đăng nhập, quên mật khẩu, đặt mật khẩu) — cùng kiểu thẻ đăng nhập cũ. */
export default function HrAuthCard({
  subtitle = "TD Games Studio",
  theme,
  children,
}: {
  subtitle?: string;
  theme: readonly [HrThemePref, (p: HrThemePref) => void];
  children: React.ReactNode;
}) {
  return (
    <div className="hr-app relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle pref={theme[0]} onChange={theme[1]} />
      </div>
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <div className="text-center">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-white">HR Dashboard</h1>
          <p className="mt-1.5 text-[15px] text-white/50">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
