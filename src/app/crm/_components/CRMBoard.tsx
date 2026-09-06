"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LEAD_STATUSES,
  WAITLIST_SOURCE,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

const KEY_STORE = "tdg.crm.key";

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  quoted: "Đã báo giá",
  won: "Chốt",
  lost: "Trượt",
};

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  contacted: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  quoted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  won: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  lost: "bg-white/5 text-white/40 border-white/10",
};

/** Vạch dọc đầu dòng — quét trạng thái bằng màu, không phải bằng chữ. */
const STATUS_BAR: Record<LeadStatus, string> = {
  new: "border-l-amber-400",
  contacted: "border-l-sky-400",
  quoted: "border-l-violet-400",
  won: "border-l-emerald-400",
  lost: "border-l-white/15",
};

const AVATAR_COLOR: Record<LeadStatus, string> = {
  new: "bg-amber-500/20 text-amber-200",
  contacted: "bg-sky-500/20 text-sky-200",
  quoted: "bg-violet-500/20 text-violet-200",
  won: "bg-emerald-500/20 text-emerald-200",
  lost: "bg-white/5 text-white/30",
};

/** Chiều rộng cột — header và row dùng chung để luôn thẳng hàng. */
const COL = {
  name: "flex min-w-0 flex-1 items-center gap-2.5 md:flex-none md:w-52",
  email: "hidden w-56 shrink-0 truncate md:block",
  service: "hidden w-32 shrink-0 truncate lg:block",
  budget: "hidden w-24 shrink-0 truncate xl:block",
  msg: "hidden min-w-0 flex-1 truncate md:block",
  status: "hidden w-24 shrink-0 sm:block",
  time: "w-16 shrink-0 text-right",
};

type SortKey = "time" | "name" | "status";

/** "3 giờ" / "5 ngày" — quét nhanh hơn timestamp đầy đủ. */
function ago(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)} phút`;
  if (mins < 1440) return `${Math.floor(mins / 60)} giờ`;
  const days = Math.floor(mins / 1440);
  if (days < 30) return `${days} ngày`;
  return `${Math.floor(days / 30)} tháng`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

/**
 * Gợi ý email trả lời bằng AI (cùng backend cliproxyapi với AI eval bên /hr).
 * ponytail: draft KHÔNG lưu DB — sinh xong copy là xong, không cần cột mới.
 * Muốn lưu lịch sử draft thì thêm cột `ai_reply` sau.
 */
function ReplyDraft({ lead, crmKey }: { lead: Lead; crmKey: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/reply`, {
        method: "POST",
        headers: { "x-crm-key": crmKey },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI lỗi");
      setSubject(json.subject);
      setBody(json.body);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI lỗi");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Gợi ý trả lời
        </span>
        <button
          onClick={generate}
          disabled={busy}
          className="ml-auto rounded-md border border-amber-500/40 px-3 py-1 text-xs text-amber-300 hover:bg-amber-500/15 disabled:opacity-40"
        >
          {busy ? "Đang viết…" : body ? "Viết lại" : "✨ Soạn bằng AI"}
        </button>
      </div>

      {err ? <p className="mt-3 text-xs text-red-400">{err}</p> : null}

      {body ? (
        <div className="mt-3 space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 outline-none focus:border-amber-500/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/80 outline-none focus:border-amber-500/40"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-amber-500/40 hover:text-white"
            >
              {copied ? "Đã copy ✓" : "Copy nội dung"}
            </button>
            <a
              href={`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-amber-500/40 hover:text-white"
            >
              Mở mail đã điền sẵn
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CRMBoard() {
  const [crmKey, setCrmKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all" | "waitlist">("all");
  const [service, setService] = useState("all");
  const [onlyTodo, setOnlyTodo] = useState(false);
  const [sort, setSort] = useState<SortKey>("time");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

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
    setSelectedId(null);
  }

  function sortBy(key: SortKey) {
    if (sort === key) return setAsc((v) => !v);
    setSort(key);
    setAsc(key !== "time"); // tên/trạng thái mặc định A→Z, thời gian mặc định mới nhất
  }

  // Waitlist là email chờ tool mở, chưa phải khách hỏi báo giá → không trộn vào
  // pipeline. Chip "all" và các chip status chỉ đếm lead thật.
  const waitlist = useMemo(
    () => leads.filter((l) => l.source === WAITLIST_SOURCE),
    [leads],
  );
  const pipeline = useMemo(
    () => leads.filter((l) => l.source !== WAITLIST_SOURCE),
    [leads],
  );

  const services = useMemo(
    () => [...new Set(pipeline.map((l) => l.service).filter(Boolean))].sort(),
    [pipeline],
  );

  const shown = useMemo(() => {
    let base =
      filter === "waitlist"
        ? waitlist
        : filter === "all"
          ? pipeline
          : pipeline.filter((l) => l.status === filter);

    if (service !== "all") base = base.filter((l) => l.service === service);
    if (onlyTodo)
      base = base.filter((l) => l.status === "new" && !l.admin_notes);

    const term = q.trim().toLowerCase();
    if (term)
      base = base.filter((l) =>
        `${l.name} ${l.email} ${l.service} ${l.message} ${l.admin_notes ?? ""}`
          .toLowerCase()
          .includes(term),
      );

    const dir = asc ? 1 : -1;
    return [...base].sort((a, b) => {
      if (sort === "name") return dir * a.name.localeCompare(b.name, "vi");
      if (sort === "status")
        return (
          dir *
          (LEAD_STATUSES.indexOf(a.status) - LEAD_STATUSES.indexOf(b.status))
        );
      return dir * (+new Date(a.created_at) - +new Date(b.created_at));
    });
  }, [filter, service, onlyTodo, q, sort, asc, pipeline, waitlist]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const todo = pipeline.filter((l) => l.status === "new" && !l.admin_notes);
  const filtered =
    filter !== "all" || service !== "all" || onlyTodo || q.trim() !== "";

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

  // ponytail: hàm trả JSX, không phải component — tránh remount mỗi lần render.
  const sortHead = (k: SortKey, label: string) => (
    <button
      onClick={() => sortBy(k)}
      className={`text-left uppercase tracking-wider hover:text-white/70 ${
        sort === k ? "text-amber-300/80" : ""
      }`}
    >
      {label}
      <span className="ml-1 opacity-60">
        {sort === k ? (asc ? "↑" : "↓") : ""}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
        {/* Hàng 1: nhận diện + hành động */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 md:px-8">
          <h1 className="text-lg font-black uppercase tracking-wide">CRM</h1>
          <span className="text-sm text-white/40">{pipeline.length} leads</span>
          {todo.length > 0 ? (
            <button
              onClick={() => {
                setOnlyTodo((v) => !v);
                setFilter("all");
              }}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${
                onlyTodo
                  ? "border-amber-400 bg-amber-500/25 text-amber-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300/80 hover:bg-amber-500/20"
              }`}
            >
              {todo.length} chưa xử lý
            </button>
          ) : null}

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, email, nội dung…"
            className="ml-auto w-full max-w-xs rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none placeholder:text-white/25 focus:border-amber-500/40"
          />
          <button
            onClick={refresh}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs uppercase text-white/70 hover:border-amber-500/40 hover:text-white"
          >
            {loading ? "…" : "Tải lại"}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(KEY_STORE);
              setCrmKey("");
              setKeyInput("");
              setLeads([]);
              setSelectedId(null);
            }}
            className="text-xs text-white/30 hover:text-white/60"
          >
            Khoá
          </button>
        </div>

        {/* Hàng 2: bộ lọc */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3 md:px-8">
          {(["all", ...LEAD_STATUSES, "waitlist"] as const).map((s) => {
            const count =
              s === "all"
                ? pipeline.length
                : s === "waitlist"
                  ? waitlist.length
                  : pipeline.filter((l) => l.status === s).length;
            const label =
              s === "all"
                ? "Tất cả"
                : s === "waitlist"
                  ? "Chờ tool"
                  : STATUS_LABEL[s];
            return (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  setOnlyTodo(false);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  filter === s && !onlyTodo
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                    : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/80"
                }`}
              >
                {label}{" "}
                <span className="tabular-nums opacity-55">{count}</span>
              </button>
            );
          })}

          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={`ml-2 rounded-full border bg-transparent px-3 py-1 text-xs outline-none ${
              service === "all"
                ? "border-white/10 text-white/45"
                : "border-amber-500/50 bg-amber-500/15 text-amber-300"
            }`}
          >
            <option value="all" className="bg-[#12131c]">
              Mọi dịch vụ
            </option>
            {services.map((s) => (
              <option key={s} value={s} className="bg-[#12131c]">
                {s}
              </option>
            ))}
          </select>

          {filtered ? (
            <button
              onClick={() => {
                setFilter("all");
                setService("all");
                setOnlyTodo(false);
                setQ("");
              }}
              className="ml-1 text-xs text-white/35 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Xoá lọc ({shown.length})
            </button>
          ) : null}
        </div>

        {/* Hàng 3: tiêu đề cột — click để sắp xếp */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] bg-white/[0.02] px-5 py-2 text-[10px] font-semibold text-white/30 md:px-8">
          <span className="w-0.5 shrink-0" />
          <span className={COL.name}>
            <span className="w-7 shrink-0" />
            {sortHead("name", "Khách hàng")}
          </span>
          <span className={`${COL.email} uppercase tracking-wider`}>Email</span>
          <span className={`${COL.service} uppercase tracking-wider`}>
            Dịch vụ
          </span>
          <span className={`${COL.budget} uppercase tracking-wider`}>
            Ngân sách
          </span>
          <span className={`${COL.msg} uppercase tracking-wider`}>
            Nội dung / Ghi chú
          </span>
          <span className={COL.status}>
            {sortHead("status", "Trạng thái")}
          </span>
          <span className={COL.time}>
            {sortHead("time", "Gửi lúc")}
          </span>
        </div>
      </header>

      {error ? (
        <p className="mx-5 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 md:mx-8">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-white/[0.06]">
        {shown.map((lead) => {
          const isTodo = lead.status === "new" && !lead.admin_notes;
          return (
            <li key={lead.id}>
              <button
                onClick={() => setSelectedId(lead.id)}
                className={`flex w-full items-center gap-3 border-l-2 py-2.5 pl-4 pr-5 text-left transition hover:bg-white/[0.05] md:pl-7 md:pr-8 ${
                  STATUS_BAR[lead.status]
                } ${selectedId === lead.id ? "bg-white/[0.07]" : ""}`}
              >
                <span className={COL.name}>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${AVATAR_COLOR[lead.status]}`}
                  >
                    {initials(lead.name)}
                  </span>
                  <span
                    className={`truncate text-sm ${isTodo ? "font-semibold text-white" : "text-white/75"}`}
                  >
                    {lead.name}
                  </span>
                </span>
                <span className={`${COL.email} text-sm text-white/40`}>
                  {lead.email}
                </span>
                <span className={`${COL.service} text-xs text-white/45`}>
                  {lead.service}
                </span>
                <span className={`${COL.budget} text-xs text-white/35`}>
                  {lead.budget ?? "—"}
                </span>
                <span className={`${COL.msg} text-sm text-white/30`}>
                  {lead.admin_notes ? (
                    <span className="text-amber-300/70">
                      ✎ {lead.admin_notes}
                    </span>
                  ) : (
                    lead.message.replace(/\s+/g, " ")
                  )}
                </span>
                <span className={COL.status}>
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[10px] ${STATUS_COLOR[lead.status]}`}
                  >
                    {STATUS_LABEL[lead.status]}
                  </span>
                </span>
                <span
                  className={`${COL.time} text-xs tabular-nums text-white/25`}
                >
                  {ago(lead.created_at)}
                </span>
              </button>
            </li>
          );
        })}
        {!shown.length && !loading ? (
          <li className="py-20 text-center text-sm text-white/30">
            {filtered ? "Không có lead nào khớp bộ lọc." : "Chưa có lead nào."}
          </li>
        ) : null}
      </ul>

      {selected ? (
        <>
          <div
            onClick={() => setSelectedId(null)}
            className="fixed inset-0 z-30 bg-black/50"
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-start gap-3 border-b border-white/10 px-6 py-5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLOR[selected.status]}`}
              >
                {initials(selected.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold">{selected.name}</h2>
                <a
                  href={`mailto:${selected.email}`}
                  className="text-sm text-amber-300/90 hover:underline"
                >
                  {selected.email}
                </a>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/50 hover:text-white"
              >
                Esc
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-white/10 px-6 py-4 text-xs">
              <span className="rounded border border-white/10 px-2 py-0.5 text-white/60">
                {selected.service}
              </span>
              {selected.budget ? (
                <span className="rounded border border-white/10 px-2 py-0.5 text-white/60">
                  {selected.budget}
                </span>
              ) : null}
              <span className="rounded border border-white/10 px-2 py-0.5 text-white/35">
                {selected.source}
              </span>
              <span className="ml-auto text-white/30">
                {new Date(selected.created_at).toLocaleString("vi-VN")}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                {selected.message || (
                  <span className="text-white/25">Không có nội dung.</span>
                )}
              </p>
              {/* key=id → đổi lead là draft reset, không cần effect */}
              <ReplyDraft key={selected.id} lead={selected} crmKey={crmKey} />
            </div>

            <div className="space-y-3 border-t border-white/10 px-6 py-5">
              <div className="flex items-center gap-1.5">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch(selected.id, { status: s })}
                    className={`rounded-md border px-2.5 py-1.5 text-[11px] ${
                      selected.status === s
                        ? STATUS_COLOR[s]
                        : "border-white/10 text-white/35 hover:text-white/70"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              <textarea
                key={selected.id}
                defaultValue={selected.admin_notes ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (selected.admin_notes ?? ""))
                    patch(selected.id, { admin_notes: e.target.value });
                }}
                rows={3}
                placeholder="Ghi chú nội bộ… (lưu khi click ra ngoài)"
                className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/25 focus:border-amber-500/40"
              />

              <div className="flex items-center gap-3">
                <a
                  href={`mailto:${selected.email}`}
                  className="rounded-md bg-amber-500 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-amber-400"
                >
                  Trả lời
                </a>
                <button
                  onClick={() => remove(selected.id)}
                  className="ml-auto text-xs text-white/25 hover:text-red-400"
                >
                  Xoá
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
