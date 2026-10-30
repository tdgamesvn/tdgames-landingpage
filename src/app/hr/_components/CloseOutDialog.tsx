"use client";

/**
 * Hộp thoại "Báo đã tuyển đủ" cho 1 job: chọn ứng viên đang mở → (tuỳ chọn) gửi mail "Vị trí đã tuyển đủ"
 * → chuyển sang "Lưu hồ sơ". Mở từ JobsView (nút "Đã tuyển đủ") hoặc gợi ý khi offer "Đã nhận".
 * Server: GET/POST /api/hr/jobs/[id]/close-out.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, Send, X } from "lucide-react";
import { hrFetch, useHrSession } from "./HrSession";
import { KIND_LABEL } from "@/lib/hr-email";
import { TALENT_POOL_STATUS } from "@/lib/hr-close-out";
import { formatInterviewTime } from "@/lib/interview-schedule";

type Candidate = { id: string; name: string; status: string; created_at: string; has_email: boolean };
type Info = {
  job: { id: string; title: string };
  candidates: Candidate[];
  preview: { subject: string; text: string };
  mode: "test" | "live";
  test_to: string;
};
type Result = { id: string; name: string; mailed: boolean; moved: boolean; error?: string };

/** Số ứng viên đang mở của job (để hiện gợi ý); lỗi / không có quyền → 0. */
export async function countOpenCandidates(jobId: string, excludeId?: string): Promise<number> {
  const q = excludeId ? `?exclude=${encodeURIComponent(excludeId)}` : "";
  const res = await hrFetch(`/api/hr/jobs/${jobId}/close-out${q}`).catch(() => null);
  if (!res?.ok) return 0;
  const j = (await res.json().catch(() => ({}))) as Partial<Info>;
  return j.candidates?.length ?? 0;
}

export default function CloseOutDialog({
  jobId,
  excludeId,
  statusLabel,
  onClose,
  onMoved,
}: {
  jobId: string;
  /** Bỏ khỏi danh sách (ứng viên vừa nhận offer). */
  excludeId?: string;
  statusLabel: (key: string) => string;
  onClose: () => void;
  /** Hồ sơ đã chuyển sang Lưu hồ sơ — cập nhật danh sách tại chỗ. */
  onMoved: (ids: string[], status: string) => void;
}) {
  const { can } = useHrSession();
  const canMail = can("emails.send");
  const [info, setInfo] = useState<Info | null>(null);
  const [loadError, setLoadError] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sendMail, setSendMail] = useState(canMail);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);

  useEffect(() => {
    let alive = true;
    const q = excludeId ? `?exclude=${encodeURIComponent(excludeId)}` : "";
    hrFetch(`/api/hr/jobs/${jobId}/close-out${q}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
        return j as Info;
      })
      .then((j) => {
        if (!alive) return;
        setInfo(j);
        setPicked(new Set(j.candidates.map((c) => c.id)));
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : "Không tải được danh sách"));
    return () => {
      alive = false;
    };
  }, [jobId, excludeId]);

  // Esc chỉ đóng hộp thoại này (bắt ở pha capture để hồ sơ phía sau không đóng theo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (!running) onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, running]);

  const chosen = useMemo(() => (info?.candidates ?? []).filter((c) => picked.has(c.id)), [info, picked]);
  const mailing = sendMail && canMail;
  const mailCount = mailing ? chosen.filter((c) => c.has_email).length : 0;
  const all = info ? info.candidates.length > 0 && chosen.length === info.candidates.length : false;

  function toggle(id: string) {
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function run() {
    if (!info || chosen.length === 0) return;
    const ask = mailing
      ? `Gửi mail “${KIND_LABEL.position_filled}” tới ${mailCount} ứng viên${info.mode === "live" ? " (GỬI THẬT)" : ""} và chuyển ${chosen.length} hồ sơ sang Lưu hồ sơ?`
      : `Chuyển ${chosen.length} hồ sơ sang Lưu hồ sơ (không gửi mail)?`;
    if (!confirm(ask)) return;
    setRunning(true);
    setRunError("");
    try {
      const res = await hrFetch(`/api/hr/jobs/${jobId}/close-out`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ application_ids: chosen.map((c) => c.id), send_mail: mailing }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      const r = (j.results ?? []) as Result[];
      setResults(r);
      const moved = r.filter((x) => x.moved).map((x) => x.id);
      if (moved.length) onMoved(moved, TALENT_POOL_STATUS);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Không thực hiện được");
    } finally {
      setRunning(false);
    }
  }

  const runLabel = mailing
    ? `Gửi ${mailCount} mail & chuyển sang Lưu hồ sơ`
    : `Chuyển ${chosen.length} hồ sơ sang Lưu hồ sơ`;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => !running && onClose()}>
      <div
        role="dialog"
        aria-label="Báo đã tuyển đủ"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 hr-sheet p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Báo đã tuyển đủ</h3>
            <p className="mt-1 text-xs text-white/50">
              {info ? <>Job <span className="font-semibold text-white/70">{info.job.title}</span> — ứng viên đang mở</> : "Đang tải…"}
            </p>
          </div>
          <button onClick={onClose} disabled={running} className="text-white/40 hover:text-white/70" aria-label="Đóng">
            <X className="hr-ico" />
          </button>
        </div>

        {loadError && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{loadError}</div>
        )}

        {info && !results && (
          <>
            {info.candidates.length === 0 ? (
              <p className="text-[13px] text-white/60">Job này không còn ứng viên nào đang mở.</p>
            ) : (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={all}
                    onChange={() => setPicked(all ? new Set() : new Set(info.candidates.map((c) => c.id)))}
                  />
                  Chọn tất cả ({chosen.length}/{info.candidates.length})
                </label>
                <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2">
                  {info.candidates.map((c) => (
                    <li key={c.id}>
                      <label className="flex items-center gap-2 text-[13px] text-white/80">
                        <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
                        <span className="font-semibold">{c.name || "(chưa có tên)"}</span>
                        <span className="text-[12px] text-white/50">
                          {statusLabel(c.status)} · nộp {formatInterviewTime(c.created_at)}
                        </span>
                        {!c.has_email && <span className="text-[12px] text-amber-300">· không có email</span>}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canMail && info.candidates.length > 0 && (
              <label className="flex items-center gap-2 text-[13px] text-white/80">
                <input type="checkbox" checked={sendMail} onChange={(e) => setSendMail(e.target.checked)} />
                Gửi mail “{KIND_LABEL.position_filled}”
              </label>
            )}

            {mailing && info.candidates.length > 0 && (
              <>
                {info.mode === "live" ? (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">
                    <CircleAlert className="hr-ico" /> Mail sẽ gửi thật tới {mailCount} ứng viên
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                    Chế độ thử — mail về {info.test_to}
                  </div>
                )}
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[12px] font-semibold text-white/70">{info.preview.subject}</p>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-[12px] text-white/60">{info.preview.text}</pre>
                  <p className="mt-2 text-[11px] text-white/40">
                    Xem trước (tên ứng viên = “bạn”; mỗi mail dùng tên + chữ ký người support của hồ sơ). Sửa mẫu ở tab Mẫu mail.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {results && (
          <ul className="space-y-1 text-[13px]">
            {results.map((r) => (
              <li key={r.id} className={r.moved ? "text-white/80" : "text-red-300"}>
                {r.moved ? <CircleCheck className="hr-ico" /> : <CircleAlert className="hr-ico" />}
                <span className="font-semibold">{r.name || "(chưa có tên)"}</span>
                <span className="text-white/50">
                  {" "}· {r.mailed ? "đã gửi mail" : "không gửi mail"} · {r.moved ? "đã chuyển Lưu hồ sơ" : "chưa chuyển"}
                </span>
                {r.error && <span className="block pl-5 text-[12px] text-amber-300">{r.error}</span>}
              </li>
            ))}
          </ul>
        )}

        {runError && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{runError}</div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={running} className="hr-secondary-btn">
            {results ? "Đóng" : "Huỷ"}
          </button>
          {info && !results && info.candidates.length > 0 && (
            <button
              onClick={() => void run()}
              disabled={running || chosen.length === 0}
              className="hr-primary-btn inline-flex items-center gap-1.5 px-5 py-2"
            >
              <Send className="hr-ico" />
              {running ? "Đang xử lý…" : runLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
