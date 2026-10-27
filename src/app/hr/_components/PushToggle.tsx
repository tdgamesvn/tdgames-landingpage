"use client";

/**
 * Nút chuông trên thanh công cụ /hr: bật/tắt thông báo đẩy nhắc lịch PV cho máy đang dùng.
 * iPhone/iPad chỉ nhận được khi /hr đã "Thêm vào MH chính" và mở từ icon đó (iOS 16.4+).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { hrFetch, useHrSession } from "./HrSession";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const SW_URL = "/hr-sw.js";
const SW_SCOPE = "/hr";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function b64ToBytes(b64: string) {
  const s = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(s);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function PushToggle() {
  const { me, can } = useHrSession();
  const [state, setState] = useState<State>("loading");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const api = useCallback(
    async (method: "GET" | "POST" | "DELETE", body?: unknown) => {
      const res = await hrFetch("/api/hr/push", {
        method,
        headers: { ...(body ? { "content-type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      return j;
    },
    [],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        if (alive) setState(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE }).catch(() => null);
      const sub = reg ? await reg.pushManager.getSubscription().catch(() => null) : null;
      if (!alive) return;
      if (Notification.permission === "denied") setState("denied");
      else setState(sub ? "on" : "off");
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await api("GET");
      if (!publicKey) throw new Error("Server chưa cấu hình khoá thông báo");
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      const json = sub.toJSON();
      await api("POST", { subscription: json, label: me?.user.displayName ?? null });
      setState("on");
      await api("POST", { action: "test", endpoint: json.endpoint });
      setMsg("Đã bật. Máy này vừa nhận 1 thông báo thử.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Bật thông báo thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api("DELETE", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Tắt thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) throw new Error("Máy này chưa bật thông báo");
      await api("POST", { action: "test", endpoint: sub.endpoint });
      setMsg("Đã gửi thông báo thử.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gửi thử thất bại");
    } finally {
      setBusy(false);
    }
  }

  // Không có quyền nhận nhắc lịch PV → ẩn chuông (server cũng chặn /api/hr/push).
  if (state === "loading" || !can("push.receive")) return null;
  const Icon = state === "on" ? BellRing : state === "denied" || state === "unsupported" ? BellOff : Bell;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Thông báo nhắc lịch PV trên máy này"
        aria-label="Thông báo nhắc lịch PV"
        aria-expanded={open}
        className="hr-toolbar-btn"
      >
        <Icon className="hr-ico-solo" style={state === "on" ? { color: "var(--hr-orange)" } : undefined} />
      </button>
      {open && (
        <div className="hr-menu right-0 w-72 space-y-2 p-3 text-[13px] leading-snug text-white/70">
          <p className="font-semibold text-white">Nhắc lịch PV trên máy này</p>
          {state === "on" && <p>Đang bật — nhận thông báo trước giờ PV ~60 phút.</p>}
          {state === "off" && <p>Bật để điện thoại/máy tính này báo trước mỗi buổi PV ~60 phút.</p>}
          {state === "denied" && <p>Trình duyệt đang chặn thông báo của trang này. Mở cài đặt trình duyệt → cho phép thông báo cho tdgamestudio.com rồi tải lại.</p>}
          {state === "ios-install" && (
            <p>
              Trên iPhone: mở trang này bằng <b>Safari</b> → nút <b>Chia sẻ</b> → <b>Thêm vào MH chính</b>. Mở app
              “TD HR” từ màn hình chính rồi bấm chuông để bật.
            </p>
          )}
          {state === "unsupported" && <p>Trình duyệt này không hỗ trợ thông báo đẩy. Dùng Chrome/Edge/Safari bản mới.</p>}
          {msg && <p className="text-white/90">{msg}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {state === "off" && (
              <button onClick={() => void enable()} disabled={busy} className="hr-primary-btn hr-primary-btn--sm">
                {busy ? "Đang bật…" : "Bật thông báo"}
              </button>
            )}
            {state === "on" && (
              <>
                <button onClick={() => void test()} disabled={busy} className="hr-secondary-btn">Gửi thử</button>
                <button onClick={() => void disable()} disabled={busy} className="hr-secondary-btn text-red-400">Tắt</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
