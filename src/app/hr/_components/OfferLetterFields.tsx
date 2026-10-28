"use client";

/**
 * Nhóm trường của "Thư mời nhận việc" — dùng chung cho hộp thoại soạn thư từng ứng viên
 * (`mode="letter"`, OfferLetterData) và tab Mẫu mail → mẫu công ty (`mode="defaults"`, OfferLetterDefaults).
 * Kèm hook xem trước PDF (POST → blob) và khung xem trước. Màu theo token --hr-* (Sáng/Tối).
 */

import { useEffect, useRef, useState } from "react";
import { ChevronRight, ExternalLink, Plus, RefreshCw, X } from "lucide-react";
import { hrFetch } from "./HrSession";
import {
  formatVnd,
  offerTotal,
  type OfferLetterData,
  type OfferLetterDefaults,
  type ScheduleItem,
} from "@/lib/offer-letter";

// ── Style dùng chung ──

export const offerSurface = "rounded-2xl bg-[var(--hr-raised)] shadow-[var(--hr-surface-shadow)] ring-1 ring-[var(--hr-hair)]";
const inputBase =
  "rounded-lg bg-[var(--hr-fill)] px-3 py-2 text-[14px] text-[var(--hr-ink)] ring-1 ring-[var(--hr-hair)] placeholder:text-[var(--hr-ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--hr-orange)]";
const inputCls = `w-full ${inputBase}`;
const labelCls = "mb-1 block text-[12px] text-[var(--hr-ink-2)]";
const iconBtn =
  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--hr-ink-3)] hover:bg-[var(--hr-fill)] hover:text-[var(--hr-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hr-orange)]";
const addBtn =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-[var(--hr-orange-ink)] hover:bg-[var(--hr-fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hr-orange)]";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-xl bg-[var(--hr-fill)]/40 p-4 ring-1 ring-[var(--hr-hair)]">
      <legend className="px-1 text-[13px] font-semibold text-[var(--hr-ink)]">{title}</legend>
      {children}
    </fieldset>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows,
  max = 500,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  max?: number;
  type?: "text" | "date" | "time";
  hint?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {rows ? (
        <textarea className={`${inputCls} resize-y leading-6 [field-sizing:content]`} rows={rows} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={inputCls} type={type} maxLength={type === "text" ? max : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="mt-1 block text-[12px] text-[var(--hr-ink-3)]">{hint}</span>}
    </label>
  );
}

/** Ô tiền: gõ số, tự hiện dấu chấm ngăn cách; giá trị lưu là number (trống → null). */
export function MoneyInput({
  value,
  onChange,
  label,
  className = "",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  className?: string;
}) {
  const shown = value === null ? "" : value.toLocaleString("vi-VN");
  return (
    <div className={`relative ${className}`}>
      <input
        aria-label={label}
        inputMode="numeric"
        className={`${inputCls} pr-12 text-right tabular-nums`}
        value={shown}
        placeholder="—"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
          onChange(digits ? Number(digits) : null);
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--hr-ink-3)]">VND</span>
    </div>
  );
}

function StringList({ label, items, onChange, addLabel }: { label: string; items: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <textarea
              aria-label={`${label} ${i + 1}`}
              rows={1}
              maxLength={500}
              className={`${inputCls} min-h-[38px] min-w-0 flex-1 resize-y [field-sizing:content]`}
              value={it}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button type="button" className={iconBtn} aria-label={`Xoá ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < 30 && (
        <button type="button" className={`${addBtn} mt-1.5`} onClick={() => onChange([...items, ""])}>
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </button>
      )}
    </div>
  );
}

function ScheduleList({ items, onChange }: { items: ScheduleItem[]; onChange: (v: ScheduleItem[]) => void }) {
  const set = (i: number, patch: Partial<ScheduleItem>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div>
      <span className={labelCls}>Lịch trình ngày đầu (giờ – việc)</span>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <input aria-label={`Giờ dòng ${i + 1}`} className={`${inputBase} w-28 shrink-0 sm:w-32`} maxLength={500} value={it.time} placeholder="8:45 – 9:00" onChange={(e) => set(i, { time: e.target.value })} />
            <input aria-label={`Việc dòng ${i + 1}`} className={`${inputCls} min-w-0 flex-1`} maxLength={500} value={it.task} onChange={(e) => set(i, { task: e.target.value })} />
            <button type="button" className={iconBtn} aria-label={`Xoá lịch trình dòng ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < 30 && (
        <button type="button" className={`${addBtn} mt-1.5`} onClick={() => onChange([...items, { time: "", task: "" }])}>
          <Plus className="h-3.5 w-3.5" /> Thêm dòng
        </button>
      )}
    </div>
  );
}

// ── Nhóm trường ──

/** Trường có ở cả thư lẫn mẫu công ty (cùng tên, cùng kiểu). */
type SharedKey = Exclude<keyof OfferLetterDefaults, "allowanceNames">;

type Props =
  | { mode: "letter"; value: OfferLetterData; onChange: (v: OfferLetterData) => void; expectedSalary?: string | null }
  | { mode: "defaults"; value: OfferLetterDefaults; onChange: (v: OfferLetterDefaults) => void };

export function OfferLetterFields(props: Props) {
  const v = props.value;
  function set<K extends SharedKey>(k: K, val: OfferLetterDefaults[K]) {
    if (props.mode === "letter") props.onChange({ ...props.value, [k]: val });
    else props.onChange({ ...props.value, [k]: val });
  }
  const letter = props.mode === "letter" ? props : null;
  const L = letter?.value;
  const setL = (patch: Partial<OfferLetterData>) => letter?.onChange({ ...letter.value, ...patch });

  return (
    <div className="space-y-4">
      {L && (
        <Group title="Ứng viên & vị trí">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Tên ứng viên" value={L.candidateName} onChange={(x) => setL({ candidateName: x })} />
            <TextField label="Chức danh" value={L.jobTitle} onChange={(x) => setL({ jobTitle: x })} />
          </div>
        </Group>
      )}

      <Group title="Thời gian & địa điểm">
        <div className="grid gap-3 sm:grid-cols-2">
          {L && <TextField label="Ngày bắt đầu làm việc" type="date" value={L.startDate} onChange={(x) => setL({ startDate: x })} />}
          <TextField
            label={L ? "Giờ bắt đầu ngày đầu" : "Giờ bắt đầu ngày đầu (mặc định)"}
            type="time"
            value={v.startTime}
            onChange={(x) => set("startTime", x)}
          />
        </div>
        <TextField label="Thời gian làm việc" value={v.workingHours} onChange={(x) => set("workingHours", x)} />
        <TextField label="Địa điểm làm việc" value={v.location} onChange={(x) => set("location", x)} />
      </Group>

      <Group title="Lương">
        {L && letter ? (
          <>
            <div>
              <span className={labelCls}>Lương cơ bản</span>
              <MoneyInput label="Lương cơ bản" value={L.baseSalary} onChange={(x) => setL({ baseSalary: x })} />
              {letter.expectedSalary && (
                <span className="mt-1 block text-[12px] text-[var(--hr-ink-3)]">
                  Ứng viên mong muốn: <span className="text-[var(--hr-ink-2)]">{letter.expectedSalary}</span> (tham khảo)
                </span>
              )}
            </div>
            <div>
              <span className={labelCls}>Phụ cấp (để trống số tiền = không ghi vào thư)</span>
              <ul className="space-y-1.5">
                {L.allowances.map((a, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <input
                      aria-label={`Tên phụ cấp ${i + 1}`}
                      className={`${inputCls} min-w-0 flex-1`}
                      maxLength={500}
                      value={a.name}
                      placeholder="Tên phụ cấp"
                      onChange={(e) => setL({ allowances: L.allowances.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                    />
                    <MoneyInput
                      label={`Số tiền phụ cấp ${a.name || i + 1}`}
                      className="w-40 shrink-0 sm:w-48"
                      value={a.amount}
                      onChange={(amount) => setL({ allowances: L.allowances.map((x, j) => (j === i ? { ...x, amount } : x)) })}
                    />
                    <button
                      type="button"
                      className={iconBtn}
                      aria-label={`Xoá phụ cấp ${a.name || i + 1}`}
                      onClick={() => setL({ allowances: L.allowances.filter((_, j) => j !== i) })}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {L.allowances.length < 30 && (
                <button type="button" className={`${addBtn} mt-1.5`} onClick={() => setL({ allowances: [...L.allowances, { name: "", amount: null }] })}>
                  <Plus className="h-3.5 w-3.5" /> Thêm phụ cấp
                </button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--hr-segment-bg)] px-3 py-2">
              <span className="text-[13px] font-semibold text-[var(--hr-ink)]">Tổng lương gross</span>
              <span className="text-[15px] font-semibold tabular-nums text-[var(--hr-orange-ink)]" data-testid="offer-total">
                {formatVnd(offerTotal(L))}
              </span>
            </div>
          </>
        ) : (
          props.mode === "defaults" && (
            <StringList
              label="Phụ cấp mặc định (tên)"
              items={props.value.allowanceNames}
              onChange={(x) => props.onChange({ ...props.value, allowanceNames: x })}
              addLabel="Thêm phụ cấp"
            />
          )
        )}
        <TextField label="Ghi chú thử việc" value={v.probationNote} onChange={(x) => set("probationNote", x)} />
      </Group>

      <Group title="Thiết bị">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Máy tính làm việc" value={v.computer} onChange={(x) => set("computer", x)} />
          <TextField label="Điện thoại" value={v.phone} onChange={(x) => set("phone", x)} />
        </div>
      </Group>

      <Group title="Phúc lợi">
        <TextField label="Trợ cấp gửi xe" value={v.parkingAllowance} onChange={(x) => set("parkingAllowance", x)} />
        <StringList label="Phúc lợi khác" items={v.otherBenefits} onChange={(x) => set("otherBenefits", x)} addLabel="Thêm phúc lợi" />
      </Group>

      <Group title="Chuẩn bị ngày đầu đi làm">
        <TextField label="Email công việc" rows={2} value={v.workEmail} onChange={(x) => set("workEmail", x)} />
        <StringList label="Giấy tờ cần chuẩn bị" items={v.documents} onChange={(x) => set("documents", x)} addLabel="Thêm giấy tờ" />
        <TextField label="Ghi chú giấy tờ (hạn nộp)" value={v.documentsNote} onChange={(x) => set("documentsNote", x)} />
        <ScheduleList items={v.schedule} onChange={(x) => set("schedule", x)} />
      </Group>

      {L && (
        <Group title="Xác nhận offer">
          <TextField
            label="Hạn xác nhận"
            type="date"
            value={L.confirmBy}
            onChange={(x) => setL({ confirmBy: x })}
            hint="Ghi trong mail offer. Để trống = ngày gửi + 3 ngày làm việc."
          />
        </Group>
      )}

      <details className="group rounded-xl ring-1 ring-[var(--hr-hair)]">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-3 text-[13px] font-semibold text-[var(--hr-ink)]">
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" /> Tuỳ chỉnh khác (đoạn mở đầu, đoạn kết, người ký)
        </summary>
        <div className="space-y-3 px-4 pb-4">
          <TextField label="Đoạn mở đầu" rows={4} max={2000} value={v.intro} onChange={(x) => set("intro", x)} />
          <TextField label="Đoạn kết" rows={4} max={2000} value={v.closing} onChange={(x) => set("closing", x)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Chức vụ người ký" value={v.signerTitle} onChange={(x) => set("signerTitle", x)} />
            <TextField label="Tên người ký" value={v.signerName} onChange={(x) => set("signerName", x)} />
          </div>
        </div>
      </details>
    </div>
  );
}

// ── Xem trước PDF ──

/** POST JSON → PDF blob; lỗi server (JSON `{error}`) → throw với câu tiếng Việt. */
export async function fetchPdfBlob(url: string, body: unknown, signal?: AbortSignal): Promise<Blob> {
  const res = await hrFetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `HTTP ${res.status}`);
  }
  return res.blob();
}

/** Mở PDF ở tab mới. Mở tab trước (đồng bộ với cú bấm) để không bị chặn popup. */
export async function openPdfInNewTab(getBlob: () => Promise<Blob>): Promise<string | null> {
  const w = window.open("", "_blank");
  try {
    const url = URL.createObjectURL(await getBlob());
    if (w) w.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return null;
  } catch (e) {
    w?.close();
    return e instanceof Error ? e.message : "Không tạo được PDF";
  }
}

/** Tải PDF về máy với tên file cho trước. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Xem trước tự làm mới ~800ms sau khi ngừng sửa. `body` null = chưa có dữ liệu. */
export function usePdfPreview(url: string, body: unknown | null) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);
  const key = body === null ? null : JSON.stringify(body);
  const srcRef = useRef<string | null>(null);

  useEffect(() => {
    if (key === null) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const blob = await fetchPdfBlob(url, JSON.parse(key), ctrl.signal);
        const next = URL.createObjectURL(blob);
        if (srcRef.current) URL.revokeObjectURL(srcRef.current);
        srcRef.current = next;
        setSrc(next);
        setError(null);
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Không tạo được PDF");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 800);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [url, key, nonce]);

  useEffect(
    () => () => {
      if (srcRef.current) URL.revokeObjectURL(srcRef.current);
    },
    [],
  );

  return { src, error, loading, refresh: () => setNonce((n) => n + 1) };
}

/** Khung xem trước PDF: iframe trên màn rộng; màn hẹp chỉ hiện nút mở PDF ở tab mới. */
export function PdfPreviewPane({
  preview,
  onOpen,
  className = "",
}: {
  preview: ReturnType<typeof usePdfPreview>;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <section className={`${offerSurface} flex flex-col overflow-hidden ${className}`} aria-label="Xem trước PDF">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--hr-hair)] px-4 py-2.5">
        <p className="text-[13px] font-semibold text-[var(--hr-ink)]">
          Xem trước PDF
          {preview.loading && <span className="ml-2 font-normal text-[var(--hr-ink-3)]">Đang cập nhật…</span>}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={preview.refresh} title="Tạo lại bản xem trước">
            <RefreshCw className="mr-1 inline h-3.5 w-3.5" /> Làm mới
          </button>
          <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={onOpen} title="Mở PDF ở tab mới">
            <ExternalLink className="mr-1 inline h-3.5 w-3.5" /> Mở
          </button>
        </div>
      </div>
      {preview.error && <p className="border-b border-[var(--hr-hair)] px-4 py-2 text-[12.5px] text-[var(--hr-danger-ink)]">{preview.error}</p>}
      <div className="relative min-h-0 flex-1 bg-[#525659]">
        {preview.src ? (
          <iframe title="Xem trước thư mời nhận việc" src={`${preview.src}#toolbar=0&navpanes=0&view=FitH`} className="h-full w-full" />
        ) : (
          <p className="grid h-full place-items-center text-[13px] text-white/60">{preview.error ? "" : "Đang tạo bản xem trước…"}</p>
        )}
      </div>
    </section>
  );
}
