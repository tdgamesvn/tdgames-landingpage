"use client";

import { useCallback, useEffect, useState } from "react";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/leads";

const KEY_STORE = "tdg.crm.key";

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  contacted: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  quoted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  won: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  lost: "bg-white/5 text-white/40 border-white/10",
};

export default function CRMBoard() {
  const [crmKey, setCrmKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (key: string) => {
    const res = await fetch("/api/crm/leads", { headers: { "x-crm-key": key } });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load");
    setLeads(json.leads);
  }, []);

  // Session: auto-login từ localStorage, key sai/đã đổi thì xoá
  useEffect(() => {
    const saved = localStorage.getItem(KEY_STORE);
    if (!saved) return;
    setLoading(true);
    load(saved)
      .then(() => setCrmKey(saved))
      .catch(() => localStorage.removeItem(KEY_STORE))
      .finally(() => setLoading(false));
  }, [load]);

  async function signIn(key: string) {
    setLoading(true);
    setError("");
    try {
      await load(key);
      setCrmKey(key);
      localStorage.setItem(KEY_STORE, key);
    } catch {
      setError("Sai mật khẩu. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    setLoading(true);
    setError("");
    load(crmKey)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-crm-key": crmKey },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Update failed");
    setLeads((prev) => prev.map((l) => (l.id === id ? json.lead : l)));
  }

  async function remove(id: string) {
    if (!confirm("Xoá lead này?")) return;
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: "DELETE",
      headers: { "x-crm-key": crmKey },
    });
    if (!res.ok) return setError("Delete failed");
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  if (!crmKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (keyInput.trim()) void signIn(keyInput.trim());
          }}
          className="w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-black uppercase tracking-wide text-white">
            CRM — Leads
          </h1>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="CRM password"
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-amber-500/50"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!keyInput.trim() || loading}
            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-bold uppercase text-black hover:bg-amber-400 disabled:opacity-40"
          >
            {loading ? "Đang vào…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 py-8 text-white md:px-10">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-black uppercase tracking-wide">CRM — Leads</h1>
        <span className="text-sm text-white/40">{leads.length} total</span>
        <button
          onClick={refresh}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs uppercase text-white/70 hover:border-amber-500/40 hover:text-white"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem(KEY_STORE);
            setCrmKey("");
            setKeyInput("");
            setLeads([]);
          }}
          className="ml-auto text-xs text-white/30 hover:text-white/60"
        >
          Lock
        </button>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", ...LEAD_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
              filter === s
                ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                : "border-white/10 text-white/45 hover:text-white/80"
            }`}
          >
            {s}
            {s !== "all" ? ` ${leads.filter((l) => l.status === s).length}` : ""}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {shown.map((lead) => (
          <article
            key={lead.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 md:p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold">{lead.name}</span>
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-amber-300/90 hover:underline"
              >
                {lead.email}
              </a>
              <span className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/60">
                {lead.service}
              </span>
              {lead.budget ? (
                <span className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/60">
                  {lead.budget}
                </span>
              ) : null}
              <span className="ml-auto text-xs text-white/30">
                {new Date(lead.created_at).toLocaleString("vi-VN")}
              </span>
            </div>

            {lead.message ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {lead.message}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={lead.status}
                onChange={(e) => patch(lead.id, { status: e.target.value })}
                className={`rounded-md border px-2 py-1.5 text-xs uppercase tracking-wide outline-none ${STATUS_COLOR[lead.status]}`}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#12131c] text-white">
                    {s}
                  </option>
                ))}
              </select>

              <input
                defaultValue={lead.admin_notes ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (lead.admin_notes ?? ""))
                    patch(lead.id, { admin_notes: e.target.value });
                }}
                placeholder="Notes…"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-amber-500/40"
              />

              <button
                onClick={() => remove(lead.id)}
                className="text-xs text-white/25 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {!shown.length && !loading ? (
          <p className="py-16 text-center text-sm text-white/30">Chưa có lead nào.</p>
        ) : null}
      </div>
    </div>
  );
}
