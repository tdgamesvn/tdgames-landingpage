"use client";

/**
 * Tab Mẫu mail → "Thư mời nhận việc": sửa mẫu công ty (OfferLetterDefaults, app_settings) + xem trước
 * PDF với dữ liệu mẫu. Dùng chung nhóm trường với hộp thoại soạn thư (OfferLetterFields).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RotateCcw, Save, Undo2 } from "lucide-react";
import { hrFetch } from "./HrSession";
import { OfferLetterFields, PdfPreviewPane, fetchPdfBlob, offerSurface, openPdfInNewTab, useIsWide, usePdfPreview } from "./OfferLetterFields";
import { addWorkingDays, buildOfferLetterData, vnDateString, type OfferLetterDefaults } from "@/lib/offer-letter";

type Loaded = { defaults: OfferLetterDefaults; saved: boolean; builtin: OfferLetterDefaults };

const PREVIEW_URL = "/api/hr/offer-letter-defaults/preview";
const SAMPLE_AMOUNTS = [500_000, 200_000, 660_000, 300_000];

/** Thư mẫu cho xem trước: "Nguyễn Văn A", lương ví dụ, bắt đầu sau 5 ngày làm việc. */
function sampleLetter(d: OfferLetterDefaults) {
  const today = new Date();
  const built = buildOfferLetterData(d, { candidateName: "Nguyễn Văn A", jobTitle: "2D Game Artist", today });
  return {
    ...built,
    startDate: addWorkingDays(vnDateString(today), 5),
    baseSalary: 8_000_000,
    allowances: built.allowances.map((a, i) => ({ ...a, amount: SAMPLE_AMOUNTS[i] ?? null })),
  };
}

export default function OfferLetterDefaultsPanel({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [value, setValue] = useState<OfferLetterDefaults | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await hrFetch("/api/hr/offer-letter-defaults");
      const j = (await res.json().catch(() => ({}))) as Loaded & { error?: string };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setLoaded(j);
      setValue(j.defaults);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được mẫu thư mời");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const dirty = !!loaded && !!value && JSON.stringify(value) !== JSON.stringify(loaded.defaults);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const sample = useMemo(() => (value ? sampleLetter(value) : null), [value]);
  // Màn hẹp: khung xem trước ẩn → chỉ tạo PDF khi bấm "Xem trước".
  const wide = useIsWide();
  const preview = usePdfPreview(PREVIEW_URL, wide ? sample : null);
  const openSample = () => {
    if (sample) void openPdfInNewTab(() => fetchPdfBlob(PREVIEW_URL, sample)).then((err) => err && setNotice({ kind: "error", text: err }));
  };

  async function put(body: OfferLetterDefaults, okText: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await hrFetch("/api/hr/offer-letter-defaults", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { defaults?: OfferLetterDefaults; error?: string };
      if (!res.ok || !j.defaults) {
        setNotice({ kind: "error", text: j.error ?? `HTTP ${res.status}` });
        return;
      }
      setLoaded((l) => (l ? { ...l, defaults: j.defaults!, saved: true } : l));
      setValue(j.defaults);
      setNotice({ kind: "ok", text: okText });
    } catch {
      setNotice({ kind: "error", text: "Không kết nối được máy chủ" });
    } finally {
      setBusy(false);
    }
  }

  function resetDefault() {
    if (!loaded) return;
    if (!confirm("Đưa mẫu thư mời nhận việc về mặc định ban đầu? Nội dung đã sửa sẽ mất.")) return;
    void put(loaded.builtin, "Đã về mẫu mặc định");
  }

  if (loadError) return <p className="text-[13px] text-[var(--hr-danger-ink)]">{loadError}</p>;
  if (!loaded || !value) return <p className="py-16 text-center text-sm text-[var(--hr-ink-3)]">Đang tải mẫu thư mời…</p>;

  const status = notice?.text ?? (dirty ? "Có thay đổi chưa lưu" : loaded.saved ? "Mẫu công ty đã lưu" : "Đang dùng mẫu mặc định");
  const isBuiltin = JSON.stringify(loaded.defaults) === JSON.stringify(loaded.builtin);

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-190px)] lg:min-h-[560px] lg:grid-cols-2">
      <section className={`${offerSurface} flex min-h-[520px] flex-col overflow-hidden`} aria-label="Sửa mẫu thư mời">
        <div className="border-b border-[var(--hr-hair)] px-5 py-3">
          <p className="text-[15px] font-semibold text-[var(--hr-ink)]">Mẫu công ty</p>
          <p className="text-[12.5px] text-[var(--hr-ink-2)]">
            Áp dụng cho thư mời mới. Thư đã lưu của từng ứng viên không đổi; mọi trường vẫn sửa được trong từng thư.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <OfferLetterFields mode="defaults" value={value} onChange={setValue} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hr-hair)] px-5 py-3">
          <p
            role="status"
            className={`min-w-0 flex-1 truncate text-[12.5px] ${
              notice?.kind === "error" ? "text-[var(--hr-danger-ink)]" : notice || dirty ? "text-[var(--hr-orange-ink)]" : "text-[var(--hr-ink-2)]"
            }`}
            title={status}
          >
            {status}
          </p>
          <div className="flex items-center gap-1.5">
            {!isBuiltin && (
              <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy} onClick={resetDefault} title="Dùng lại nội dung chép từ thư mời gốc">
                <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Về mặc định
              </button>
            )}
            {dirty && (
              <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy} onClick={() => setValue(loaded.defaults)}>
                <Undo2 className="mr-1 inline h-3.5 w-3.5" /> Huỷ
              </button>
            )}
            <button type="button" className="hr-primary-btn hr-primary-btn--sm" disabled={busy || !dirty} onClick={() => void put(value, "Đã lưu mẫu thư mời")}>
              <Save className="mr-1 inline h-3.5 w-3.5" /> {busy ? "Đang lưu…" : "Lưu mẫu"}
            </button>
          </div>
        </div>
      </section>

      <div className="hidden min-h-[560px] flex-col gap-2 lg:flex">
        <PdfPreviewPane preview={preview} className="min-h-[520px] flex-1" onOpen={openSample} />
        <p className="px-1 text-[12px] text-[var(--hr-ink-2)]">Dữ liệu mẫu: Nguyễn Văn A, lương ví dụ. Thư thật điền theo hồ sơ trong khối Offer.</p>
      </div>
      <div className="lg:hidden">
        <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={!sample} onClick={openSample}>
          <FileText className="mr-1 inline h-3.5 w-3.5" /> Xem trước PDF (dữ liệu mẫu)
        </button>
      </div>
    </div>
  );
}
