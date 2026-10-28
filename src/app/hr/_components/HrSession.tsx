"use client";

/**
 * Phiên đăng nhập /hr: cookie httpOnly do server đặt (tài khoản email + mật khẩu).
 * Mọi request /api/hr đi qua `hrFetch` (cookie cùng origin).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { HrRole, PermissionKey } from "@/lib/hr-permissions";

export type Me = {
  user: { id: string | null; email: string; displayName: string };
  role: HrRole;
  roleLabel: string;
  perms: string[];
};

/** Khoá localStorage của mật khẩu chung cũ (đã gỡ 2026-10-28) — xoá nếu máy còn lưu. */
const LEGACY_KEY_STORAGE = "tdg.hr.key";

function clearLegacyKey() {
  try {
    localStorage.removeItem(LEGACY_KEY_STORAGE);
  } catch {
    /* private mode */
  }
}

/** fetch cho /api/hr: cookie phiên tự đi theo. */
export function hrFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, credentials: "same-origin" });
}

type SessionApi = {
  me: Me | null;
  /** Đang hỏi server lần đầu — chưa biết đăng nhập hay chưa. */
  loading: boolean;
  /** Lần hỏi /me gần nhất lỗi mạng / 5xx (vd. 502 lúc deploy): giữ nguyên phiên cũ, hiện thông báo thử lại. */
  connError: string | null;
  can: (p: PermissionKey) => boolean;
  /** Hỏi lại /api/hr/auth/me (sau đăng nhập, hoặc khi API trả 401). */
  refresh: () => Promise<Me | null>;
  /** Đăng nhập email + mật khẩu; trả lỗi tiếng Việt hoặc null nếu thành công. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionApi | null>(null);

export function useHrSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useHrSession phải nằm trong HrSessionProvider");
  return ctx;
}

async function fetchMe(): Promise<Me | null> {
  const res = await hrFetch("/api/hr/auth/me");
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Me;
}

const CONN_ERROR = "Không kết nối được máy chủ (có thể đang cập nhật) — thử lại sau ít giây.";

export function HrSessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const meRef = useRef<Me | null>(null);

  /** Hỏi /me. `failed` = lỗi mạng/5xx → KHÔNG đổi phiên. */
  const load = useCallback(async (): Promise<{ me: Me | null; failed: boolean }> => {
    let next: Me | null;
    try {
      next = await fetchMe();
    } catch {
      setConnError(CONN_ERROR);
      return { me: meRef.current, failed: true };
    }
    setConnError(null);
    // Chỉ 401/403 mới là "chưa đăng nhập".
    meRef.current = next;
    setMe(next);
    return { me: next, failed: false };
  }, []);

  const refresh = useCallback(async () => (await load()).me, [load]);

  useEffect(() => {
    clearLegacyKey();
    let alive = true;
    // Qua microtask — không setState đồng bộ trong effect.
    void Promise.resolve()
      .then(refresh)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/hr/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      }).catch(() => null);
      if (!res) return "Không kết nối được máy chủ";
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        return typeof j.error === "string" ? j.error : "Email hoặc mật khẩu không đúng";
      }
      const r = await load();
      if (r.failed) return CONN_ERROR;
      return r.me ? null : "Đăng nhập không thành công, thử lại";
    },
    [load],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/hr/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => null);
    meRef.current = null;
    setMe(null);
  }, []);

  const value = useMemo<SessionApi>(() => {
    const perms = new Set(me?.perms ?? []);
    return {
      me,
      loading,
      connError,
      can: (p) => perms.has(p),
      refresh,
      signIn,
      signOut,
    };
  }, [me, loading, connError, refresh, signIn, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
