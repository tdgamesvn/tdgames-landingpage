"use client";

import { useEffect, useState } from "react";

type Props = {
  adminKey: string;
  /** Called after admin_secret is saved so the parent can update its key state */
  onAdminKeyChange?: (newKey: string) => void;
};

type Setting = { key: string; value: string; updated_at: string };

function mask(v: string) {
  if (!v) return "—";
  if (v.length <= 4) return "••••";
  return v.slice(0, 3) + "•".repeat(Math.max(v.length - 4, 3)) + v.slice(-1);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const KEY_META: Record<string, { label: string; description: string }> = {
  admin_secret: {
    label: "Admin Dashboard Password",
    description:
      "Mật khẩu để truy cập /admin. Để trống = dùng ADMIN_SECRET env var. Đổi ở đây có hiệu lực ngay với mọi API route.",
  },
  hr_secret: {
    label: "HR Dashboard Password",
    description:
      "Mật khẩu để truy cập /hr. Để trống = dùng HR_SECRET env var (hoặc ADMIN_SECRET làm fallback).",
  },
};

export function SettingsTab({ adminKey, onAdminKeyChange }: Props) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ key: string; text: string; ok: boolean } | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const data = await res.json();
      setSettings(data.settings ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function save(key: string) {
    const value = drafts[key] ?? "";
    setSaving(key);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      // If admin_secret changed, notify parent to update its key state immediately
      if (key === "admin_secret") {
        onAdminKeyChange?.(value);
        const msg = value
          ? "✅ Admin password changed — using new key now."
          : "✅ Cleared — reverted to env var. Please re-login with your original password.";
        setMsg({ key, text: msg, ok: true });
      } else {
        setMsg({ key, text: "✅ Saved. New password active immediately.", ok: true });
      }

      setSettings((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s
        )
      );
      setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
    } catch (e) {
      setMsg({ key, text: `❌ ${e instanceof Error ? e.message : "Save failed"}`, ok: false });
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p className="py-8 text-sm text-white/40">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>
      <p className="text-sm text-white/50">
        Cấu hình ứng dụng. Thay đổi có hiệu lực ngay — không cần deploy lại.
      </p>

      {settings.map((s) => {
        const meta = KEY_META[s.key];
        const draft = drafts[s.key];
        const isDirty = draft !== undefined;
        const isRevealed = revealed[s.key];

        return (
          <div
            key={s.key}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {meta?.label ?? s.key}
                </h3>
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 font-mono">
                  {s.key}
                </code>
              </div>
              {meta?.description && (
                <p className="mt-1 text-xs text-white/50">{meta.description}</p>
              )}
            </div>

            {/* Current value */}
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-xs text-white/40 shrink-0">Current:</span>
              <span className="flex-1 font-mono text-xs text-white/70">
                {s.value ? (isRevealed ? s.value : mask(s.value)) : (
                  <span className="italic text-white/30">not set — using env var</span>
                )}
              </span>
              {s.value && (
                <button
                  onClick={() => setRevealed((r) => ({ ...r, [s.key]: !r[s.key] }))}
                  className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
                >
                  {isRevealed ? "hide" : "show"}
                </button>
              )}
              {s.updated_at && (
                <span className="text-[10px] text-white/30 shrink-0">
                  {timeAgo(s.updated_at)}
                </span>
              )}
            </div>

            {/* New value input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Set new value
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={draft ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
                  }
                  placeholder="Enter new password…"
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-500/50 focus:outline-none"
                />
                <button
                  onClick={() => void save(s.key)}
                  disabled={!isDirty || saving === s.key}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold hover:bg-amber-500 disabled:opacity-40 transition-colors"
                >
                  {saving === s.key ? "Saving…" : "Save"}
                </button>
              </div>

              {/* Clear button — reset to env var */}
              {s.value && (
                <button
                  onClick={() => {
                    setDrafts((d) => ({ ...d, [s.key]: "" }));
                    void save(s.key);
                  }}
                  disabled={saving === s.key}
                  className="text-[11px] text-white/35 hover:text-red-400 transition-colors"
                >
                  Clear (revert to env var)
                </button>
              )}
            </div>

            {msg?.key === s.key && (
              <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {msg.text}
              </p>
            )}
          </div>
        );
      })}

      {settings.length === 0 && (
        <p className="py-6 text-sm text-white/40">No settings found.</p>
      )}
    </div>
  );
}
