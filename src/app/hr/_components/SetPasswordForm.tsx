"use client";

import { useEffect, useState } from "react";
import { useHrTheme } from "./ThemeToggle";
import { hrFetch } from "./HrSession";
import HrAuthCard, { AUTH_INPUT } from "./HrAuthCard";

const BAD_LINK = "Link không còn hiệu lực. Nhờ Sếp gửi lại lời mời hoặc dùng Quên mật khẩu.";
const MIN_LEN = 8;
const MAX_LEN = 200;

type Check = { state: "checking" } | { state: "invalid" } | { state: "valid"; email: string; purpose: string };

/** Trang đặt mật khẩu từ link mời (7 ngày) / quên mật khẩu (1 giờ). Thành công → server đặt cookie → về /hr. */
export default function SetPasswordForm({ token }: { token: string }) {
  const theme = useHrTheme();
  const [check, setCheck] = useState<Check>(token ? { state: "checking" } : { state: "invalid" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let alive = true;
    // Qua microtask — không setState đồng bộ trong effect.
    void Promise.resolve()
      .then(() => hrFetch(`/api/hr/auth/set-password?token=${encodeURIComponent(token)}`))
      .then((r) => r.json())
      .then((j: { valid?: boolean; email?: string; purpose?: string }) => {
        if (!alive) return;
        setCheck(j.valid ? { state: "valid", email: j.email ?? "", purpose: j.purpose ?? "" } : { state: "invalid" });
      })
      .catch(() => alive && setCheck({ state: "invalid" }));
    return () => {
      alive = false;
    };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < MIN_LEN) return setError(`Mật khẩu tối thiểu ${MIN_LEN} ký tự`);
    if (password.length > MAX_LEN) return setError(`Mật khẩu tối đa ${MAX_LEN} ký tự`);
    if (password !== confirm) return setError("Hai lần nhập mật khẩu không khớp");
    setError("");
    setBusy(true);
    try {
      const res = await hrFetch("/api/hr/auth/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        // Cookie phiên đã được đặt — vào thẳng bàn làm việc (replace: không quay lại trang có token).
        window.location.replace("/hr");
        return;
      }
      if (typeof j.error === "string" && j.error.startsWith("Link không còn hiệu lực")) {
        setCheck({ state: "invalid" });
      } else {
        setError(typeof j.error === "string" ? j.error : "Không đặt được mật khẩu, thử lại sau");
      }
    } catch {
      setError("Không kết nối được máy chủ");
    } finally {
      setBusy(false);
    }
  }

  if (check.state === "checking") {
    return (
      <HrAuthCard theme={theme} subtitle="Đặt mật khẩu">
        <p className="text-center text-[14px] text-white/50">Đang kiểm tra link…</p>
      </HrAuthCard>
    );
  }

  if (check.state === "invalid") {
    return (
      <HrAuthCard theme={theme} subtitle="Đặt mật khẩu">
        <div className="space-y-4">
          <p role="alert" className="text-[14px] leading-relaxed text-white/80">{BAD_LINK}</p>
          <a href="/hr" className="hr-primary-btn block w-full py-2.5 text-center">
            Về trang đăng nhập
          </a>
        </div>
      </HrAuthCard>
    );
  }

  const isReset = check.purpose === "reset";
  return (
    <HrAuthCard theme={theme} subtitle={isReset ? "Đặt lại mật khẩu" : "Tạo mật khẩu cho tài khoản"}>
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <p className="text-[13px] text-white/60">
          Tài khoản: <span className="font-semibold text-white/85">{check.email}</span>
        </p>
        {/* Ô username ẩn để trình quản lý mật khẩu lưu đúng email. */}
        <input type="email" value={check.email} autoComplete="username" readOnly hidden />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`Mật khẩu mới (tối thiểu ${MIN_LEN} ký tự)`}
          aria-label="Mật khẩu mới"
          autoComplete="new-password"
          autoFocus
          className={AUTH_INPUT}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          aria-label="Nhập lại mật khẩu"
          autoComplete="new-password"
          className={AUTH_INPUT}
        />
        {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
        <button type="submit" disabled={busy || !password || !confirm} className="hr-primary-btn w-full py-2.5">
          {busy ? "Đang lưu…" : isReset ? "Đặt lại mật khẩu" : "Tạo mật khẩu & đăng nhập"}
        </button>
      </form>
    </HrAuthCard>
  );
}
