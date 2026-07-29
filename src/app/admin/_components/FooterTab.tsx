"use client";

import { useEffect, useState } from "react";

type FooterConfig = {
  description1: string;
  description2: string;
  socials: {
    linkedin: string;
    facebook: string;
    instagram: string;
    behance: string;
    artstation: string;
  };
  contacts: {
    address: string;
    discord: string;
    email: string;
  };
};

const DEFAULT: FooterConfig = {
  description1: "",
  description2: "",
  socials: { linkedin: "", facebook: "", instagram: "", behance: "", artstation: "" },
  contacts: { address: "", discord: "", email: "" },
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#f59e0b]/60 focus:outline-none transition-colors";
const labelCls = "block text-[10px] font-black uppercase tracking-[0.18em] text-white/50 mb-1.5";
const sectionTitle = "text-xs font-black uppercase tracking-[0.18em] text-[#f59e0b] mb-4 mt-6 first:mt-0";

export function FooterTab({ adminKey }: { adminKey: string }) {
  const [cfg, setCfg] = useState<FooterConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/footer", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d) => {
        if (d.footer) setCfg({ ...DEFAULT, ...d.footer, socials: { ...DEFAULT.socials, ...d.footer.socials }, contacts: { ...DEFAULT.contacts, ...d.footer.contacts } });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminKey]);

  function setSocial(key: keyof FooterConfig["socials"], val: string) {
    setCfg((c) => ({ ...c, socials: { ...c.socials, [key]: val } }));
  }
  function setContact(key: keyof FooterConfig["contacts"], val: string) {
    setCfg((c) => ({ ...c, contacts: { ...c.contacts, [key]: val } }));
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ footer: cfg }),
      });
      const d = await r.json();
      if (d.ok) setToast({ msg: "Footer đã lưu ✓", ok: true });
      else setToast({ msg: d.error ?? "Lỗi khi lưu", ok: false });
    } catch {
      setToast({ msg: "Network error", ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-white/40 text-sm">
        Đang tải…
      </div>
    );

  return (
    <div className="max-w-2xl space-y-2">
      {toast && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-bold ${
            toast.ok ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Description */}
      <div className={sectionTitle}>Mô tả công ty</div>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Đoạn 1</label>
          <textarea
            rows={3}
            className={inputCls}
            value={cfg.description1}
            onChange={(e) => setCfg((c) => ({ ...c, description1: e.target.value }))}
            placeholder="Founded in 2023…"
          />
        </div>
        <div>
          <label className={labelCls}>Đoạn 2</label>
          <textarea
            rows={3}
            className={inputCls}
            value={cfg.description2}
            onChange={(e) => setCfg((c) => ({ ...c, description2: e.target.value }))}
            placeholder="We believe…"
          />
        </div>
      </div>

      {/* Socials */}
      <div className={sectionTitle}>Social links</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(
          [
            { key: "linkedin" as const, label: "LinkedIn URL" },
            { key: "facebook" as const, label: "Facebook URL" },
            { key: "instagram" as const, label: "Instagram URL" },
            { key: "behance" as const, label: "Behance URL" },
            { key: "artstation" as const, label: "ArtStation URL" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <input
              type="url"
              className={inputCls}
              value={cfg.socials[key]}
              onChange={(e) => setSocial(key, e.target.value)}
              placeholder={`https://…`}
            />
          </div>
        ))}
      </div>

      {/* Contacts */}
      <div className={sectionTitle}>Contacts</div>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Địa chỉ</label>
          <input
            type="text"
            className={inputCls}
            value={cfg.contacts.address}
            onChange={(e) => setContact("address", e.target.value)}
            placeholder="505 Minh Khai, Hanoi, Vietnam"
          />
        </div>
        <div>
          <label className={labelCls}>Discord invite URL</label>
          <input
            type="url"
            className={inputCls}
            value={cfg.contacts.discord}
            onChange={(e) => setContact("discord", e.target.value)}
            placeholder="https://discord.gg/…"
          />
        </div>
        <div>
          <label className={labelCls}>Email liên hệ</label>
          <input
            type="email"
            className={inputCls}
            value={cfg.contacts.email}
            onChange={(e) => setContact("email", e.target.value)}
            placeholder="contact@tdgames.vn"
          />
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
          style={{ backgroundColor: "#f59e0b" }}
        >
          {saving ? "Đang lưu…" : "Lưu footer"}
        </button>
      </div>
    </div>
  );
}
