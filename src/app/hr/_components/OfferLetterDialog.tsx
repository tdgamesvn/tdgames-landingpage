"use client";

/**
 * Hộp thoại "Soạn thư mời nhận việc" cho 1 hồ sơ: trái = form (OfferLetterFields), phải = xem trước PDF
 * (tự làm mới sau khi ngừng gõ). Lưu (PUT) · Tải PDF · Lưu & soạn mail offer.
 * Desktop: hộp thoại rộng ~1200px; điện thoại: toàn màn hình, xem trước mở ở tab mới.
 */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Mail, Save, Send, X } from "lucide-react";
import { hrFetch, useHrSession } from "./HrSession";
import { OfferLetterFields, PdfPreviewPane, downloadBlob, fetchPdfBlob, openPdfInNewTab, useIsWide, usePdfPreview } from "./OfferLetterFields";
import { offerFileName, type OfferLetterData } from "@/lib/offer-letter";
import { formatInterviewTime } from "@/lib/interview-schedule";

export type OfferLetterRequest = { appId: string; candidateName: string };

type Loaded = {
  data: OfferLetterData;
  saved: boolean;
  updated_by: string | null;
  updated_at: string | null;
  expected_salary?: string | null;
  approval?: ApprovalView;
};

type ApprovalView = {
  status: "draft" | "pending" | "approved" | "changes_requested";
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

/** Dải trạng thái duyệt ở đầu hộp thoại (null = thư chưa lưu → chưa có gì để hiện). */
function approvalBanner(a: ApprovalView | undefined, saved: boolean, isBoss: boolean): { tone: "ok" | "wait" | "warn"; text: string } | null {
  if (!saved || !a) return null;
  const at = (iso: string | null) => (iso ? `, ${formatInterviewTime(iso)}` : "");
  switch (a.status) {
    case "approved":
      return { tone: "ok", text: `✓ Sếp đã duyệt${a.reviewed_by ? ` (${a.reviewed_by})` : ""}${at(a.reviewed_at)}` };
    case "pending":
      return {
        tone: "wait",
        text: `⏳ Chờ Sếp duyệt${a.submitted_by ? ` (gửi bởi ${a.submitted_by}${at(a.submitted_at)})` : ""}${isBoss ? " — bấm Lưu để duyệt, hoặc dùng Duyệt / Yêu cầu sửa ở hồ sơ" : ""}`,
      };
    case "changes_requested":
      return { tone: "warn", text: `✏️ Sếp yêu cầu sửa: ${a.review_note ?? ""}` };
    default:
      return { tone: "warn", text: isBoss ? "Thư chưa duyệt — bấm Lưu để duyệt" : "Thư chưa gửi Sếp duyệt" };
  }
}

export default function OfferLetterDialog({
  req,
  onClose,
  onComposeMail,
}: {
  req: OfferLetterRequest;
  onClose: () => void;
  /** Sau "Lưu & soạn mail offer": đóng hộp thoại này, mở hộp thoại mail offer. */
  onComposeMail: () => void;
}) {
  const { me } = useHrSession();
  const isBoss = me?.role === "boss";
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [data, setData] = useState<OfferLetterData | null>(null);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "compose" | "submit" | "download">("");

  const previewUrl = `/api/hr/applications/${req.appId}/offer-letter/preview`;
  // Màn hẹp: khung xem trước ẩn → không tự tạo PDF; dùng nút "Xem trước".
  const wide = useIsWide();
  const preview = usePdfPreview(previewUrl, wide ? data : null);
  // savedJson = mốc so sánh (bản đã lưu, hoặc bản dựng từ mẫu lúc mở nếu chưa lưu lần nào).
  const dirty = !!data && savedJson !== null && JSON.stringify(data) !== savedJson;
  const neverSaved = !!loaded && !loaded.saved;
  const approval = loaded?.approval;
  const approvalStatus = loaded?.saved ? approval?.status : undefined;

  function edit(next: OfferLetterData) {
    setData(next);
    // Lỗi/thông báo cũ không còn đúng khi đã sửa tiếp.
    setNotice(null);
  }

  useEffect(() => {
    let alive = true;
    hrFetch(`/api/hr/applications/${req.appId}/offer-letter`)
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as Loaded & { error?: string };
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        if (!alive) return;
        setLoaded(j);
        setData(j.data);
        setSavedJson(JSON.stringify(j.data));
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : "Không tải được thư mời"));
    return () => {
      alive = false;
    };
  }, [req.appId]);

  const close = useCallback(() => {
    if (busy) return;
    if (dirty && !confirm("Thư mời có thay đổi chưa lưu. Đóng và bỏ thay đổi?")) return;
    onClose();
  }, [busy, dirty, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function save(): Promise<boolean> {
    if (!data) return false;
    // Người không phải Sếp sửa thư đã gửi duyệt / đã duyệt → trạng thái về draft, phải gửi duyệt lại.
    if (!isBoss && dirty && (approvalStatus === "pending" || approvalStatus === "approved")) {
      if (!confirm("Sửa thư sẽ phải gửi Sếp duyệt lại. Tiếp tục?")) return false;
    }
    setNotice(null);
    try {
      const res = await hrFetch(`/api/hr/applications/${req.appId}/offer-letter`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = (await res.json().catch(() => ({}))) as Loaded & { error?: string };
      if (!res.ok) {
        setNotice({ kind: "error", text: j.error ?? `HTTP ${res.status}` });
        return false;
      }
      setLoaded((l) => (l ? { ...l, saved: true, updated_by: j.updated_by, updated_at: j.updated_at, approval: j.approval ?? l.approval } : l));
      setData(j.data);
      setSavedJson(JSON.stringify(j.data));
      // Trạng thái chuyển sang "Lưu lần cuối: …" — đủ báo đã lưu.
      return true;
    } catch {
      setNotice({ kind: "error", text: "Không kết nối được máy chủ" });
      return false;
    }
  }

  async function onSave() {
    setBusy("save");
    await save();
    setBusy("");
  }

  async function onCompose() {
    setBusy("compose");
    const ok = (!dirty && !neverSaved) || (await save());
    setBusy("");
    if (ok) onComposeMail();
  }

  /** Người không phải Sếp: lưu (nếu cần) rồi gửi Sếp duyệt. */
  async function onSubmit() {
    setBusy("submit");
    const ok = (!dirty && !neverSaved) || (await save());
    if (!ok) {
      setBusy("");
      return;
    }
    try {
      const res = await hrFetch(`/api/hr/applications/${req.appId}/offer-letter/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const j = (await res.json().catch(() => ({}))) as { approval?: ApprovalView; error?: string };
      if (!res.ok) {
        setNotice({ kind: "error", text: j.error ?? `HTTP ${res.status}` });
        setBusy("");
        return;
      }
      setBusy("");
      onClose();
    } catch {
      setNotice({ kind: "error", text: "Không kết nối được máy chủ" });
      setBusy("");
    }
  }

  async function onDownload() {
    if (!data) return;
    setBusy("download");
    setNotice(null);
    try {
      downloadBlob(await fetchPdfBlob(previewUrl, data), offerFileName(data.candidateName));
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "Không tạo được PDF" });
    } finally {
      setBusy("");
    }
  }

  async function onOpenPdf() {
    if (!data) return;
    const err = await openPdfInNewTab(() => fetchPdfBlob(previewUrl, data));
    if (err) setNotice({ kind: "error", text: err });
  }

  const status = notice?.text
    ? notice.text
    : dirty
      ? "Có thay đổi chưa lưu"
      : neverSaved
        ? "Chưa lưu — thư đang dựng từ mẫu công ty"
        : loaded?.updated_at
        ? `Lưu lần cuối: ${loaded.updated_by ?? "—"}, ${formatInterviewTime(loaded.updated_at)}`
        : "";

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-stretch justify-center bg-[var(--hr-scrim)] backdrop-blur-sm sm:items-center sm:p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Thư mời nhận việc — ${req.candidateName}`}
        className="flex h-full w-full flex-col overflow-hidden bg-[var(--hr-canvas)] shadow-2xl sm:h-[92vh] sm:max-w-[1200px] sm:rounded-2xl sm:ring-1 sm:ring-[var(--hr-hair)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--hr-hair)] bg-[var(--hr-raised)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 text-[16px] font-semibold text-[var(--hr-ink)]">
              <FileText className="h-4 w-4 text-[var(--hr-orange-ink)]" /> Thư mời nhận việc
            </h3>
            <p className="truncate text-[12.5px] text-[var(--hr-ink-2)]">{req.candidateName}</p>
          </div>
          <button type="button" onClick={close} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--hr-ink-3)] hover:bg-[var(--hr-fill)] hover:text-[var(--hr-ink)]" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </header>

        {(() => {
          const b = approvalBanner(approval, !!loaded?.saved, isBoss);
          return b ? (
            <p
              role="status"
              data-testid="offer-approval-banner"
              className={`border-b border-[var(--hr-hair)] px-4 py-2 text-[12.5px] font-semibold sm:px-5 ${
                b.tone === "ok" ? "text-[var(--hr-ink)]" : "text-[var(--hr-orange-ink)]"
              }`}
            >
              {b.text}
            </p>
          ) : null;
        })()}

        {loadError ? (
          <p className="p-6 text-[13px] text-[var(--hr-danger-ink)]">{loadError}</p>
        ) : !data ? (
          <p className="p-6 text-center text-[13px] text-[var(--hr-ink-3)]">Đang tải thư mời…</p>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-2">
            <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
              <OfferLetterFields mode="letter" value={data} onChange={edit} expectedSalary={loaded?.expected_salary} />
            </div>
            {/* Màn hẹp: không nhúng PDF (Safari iOS chỉ hiện trang 1) — nút "Xem trước" ở chân mở tab mới. */}
            <div className="hidden min-h-0 lg:flex lg:flex-col">
              <PdfPreviewPane preview={preview} onOpen={() => void onOpenPdf()} className="min-h-0 flex-1 rounded-none border-l border-[var(--hr-hair)] shadow-none ring-0" />
            </div>
          </div>
        )}

        <footer className="flex flex-col gap-2 border-t border-[var(--hr-hair)] bg-[var(--hr-raised)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p
            role="status"
            className={`min-w-0 truncate text-[12.5px] ${notice?.kind === "error" ? "text-[var(--hr-danger-ink)]" : notice || dirty || neverSaved ? "text-[var(--hr-orange-ink)]" : "text-[var(--hr-ink-2)]"}`}
            title={status}
          >
            {status}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {/* hr-secondary-btn tự đặt display → ẩn bằng span bọc ngoài */}
            <span className="lg:hidden">
              <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={!data} onClick={() => void onOpenPdf()}>
                <FileText className="mr-1 inline h-3.5 w-3.5" /> Xem trước
              </button>
            </span>
            <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={!data || !!busy} onClick={() => void onDownload()}>
              <Download className="mr-1 inline h-3.5 w-3.5" /> {busy === "download" ? "Đang tạo…" : "Tải PDF"}
            </button>
            <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={!data || !!busy} onClick={() => void onSave()}>
              <Save className="mr-1 inline h-3.5 w-3.5" /> {busy === "save" ? "Đang lưu…" : "Lưu"}
            </button>
            {/* Sếp lưu = đã duyệt → soạn mail luôn. Người khác: chỉ khi thư đã duyệt và không sửa gì; còn lại gửi Sếp duyệt. */}
            {isBoss || (approvalStatus === "approved" && !dirty) ? (
              <button type="button" className="hr-primary-btn hr-primary-btn--sm" disabled={!data || !!busy} onClick={() => void onCompose()}>
                <Mail className="mr-1 inline h-3.5 w-3.5" /> {busy === "compose" ? "Đang lưu…" : "Lưu & soạn mail offer"}
              </button>
            ) : approvalStatus === "pending" && !dirty ? null : (
              <button type="button" className="hr-primary-btn hr-primary-btn--sm" disabled={!data || !!busy} onClick={() => void onSubmit()}>
                <Send className="mr-1 inline h-3.5 w-3.5" /> {busy === "submit" ? "Đang gửi…" : "Lưu & gửi Sếp duyệt"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
