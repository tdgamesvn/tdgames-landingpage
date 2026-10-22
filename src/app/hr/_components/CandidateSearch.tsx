"use client";

import { useEffect, useState } from "react";

/**
 * Ô tìm ứng viên toàn DB: gõ là tìm nhanh (so chữ, không tốn token);
 * "🤖 Hỏi AI" cho câu mô tả mơ hồ — AI trả 3-5 người kèm trích dẫn căn cứ.
 */

type Hit = {
  id: string;
  full_name: string;
  job: string;
  status: string;
  created_at: string;
  why: string;
  quotes: string[];
};

export default function CandidateSearch({
  hrKey,
  statusLabel,
  statusColor,
  onOpen,
}: {
  hrKey: string;
  statusLabel: (key: string) => string;
  statusColor: (key: string) => string;
  onOpen: (applicationId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"quick" | "ai">("quick");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tìm nhanh khi gõ (debounce). Hỏi AI chỉ chạy khi bấm nút.
  useEffect(() => {
    if (mode !== "quick") return;
    const query = q.trim();
    const t = setTimeout(async () => {
      if (query.length < 2) { setHits(null); return; }
      try {
        const res = await fetch(`/api/hr/search?q=${encodeURIComponent(query)}`, { headers: { "x-hr-key": hrKey } });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setError(null);
        setHits(json.results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tìm kiếm");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, mode, hrKey]);

  async function askAi() {
    if (q.trim().length < 3 || busy) return;
    setMode("ai");
    setBusy(true);
    setError(null);
    setHits(null);
    try {
      const res = await fetch("/api/hr/search", {
        method: "POST",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify({ q: q.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setHits(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi hỏi AI");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setQ("");
    setHits(null);
    setError(null);
    setMode("quick");
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setMode("quick"); }}
          onKeyDown={(e) => { if (e.key === "Enter") void askAi(); if (e.key === "Escape") clear(); }}
          placeholder='🔎 Tìm ứng viên: tên, SĐT, kỹ năng, "lương cao"… — hoặc mô tả rồi bấm Hỏi AI (Enter)'
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
        />
        <button
          onClick={() => void askAi()}
          disabled={busy || q.trim().length < 3}
          title="AI đọc tóm tắt + dữ liệu team của mọi hồ sơ (~10-20s)"
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-40"
        >
          {busy ? "AI đang tìm…" : "🤖 Hỏi AI"}
        </button>
        {(q || hits) && (
          <button onClick={clear} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/50 hover:bg-white/5">✕</button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">❌ {error}</p>}

      {hits && (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03]">
          <p className="border-b border-white/10 px-3 py-1.5 text-[10px] text-white/40">
            {mode === "ai" ? "🤖 AI tìm" : "Tìm nhanh"} · {hits.length} kết quả
            {mode === "quick" && hits.length === 0 && " — thử mô tả bằng lời rồi bấm Hỏi AI"}
          </p>
          {hits.map((h) => (
            <div key={h.id} className="border-b border-white/5 px-3 py-2 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => onOpen(h.id)} className="text-sm font-semibold text-white hover:text-amber-300 hover:underline">
                  {h.full_name}
                </button>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusColor(h.status)}`}>{statusLabel(h.status)}</span>
                <span className="text-[10px] text-white/40">{h.job} · {new Date(h.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
              {h.why && <p className="mt-1 text-[11px] text-white/70">{h.why}</p>}
              {h.quotes.map((x, i) => (
                <p key={i} className="mt-0.5 text-[11px] italic text-white/45">“{x}”</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
