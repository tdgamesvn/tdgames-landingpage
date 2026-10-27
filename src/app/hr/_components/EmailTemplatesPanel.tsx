"use client";

/**
 * Tab "Mẫu mail": sửa tiêu đề + nội dung 6 loại mail ứng viên, chèn biến `{ten_bien}`,
 * xem trước đúng giao diện mail thật. Lỗi server hiện nguyên văn.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, RotateCcw, Save, Smartphone, Undo2 } from "lucide-react";
import { hrFetch } from "./HrSession";
import { textToHtml, CANDIDATE_EMAIL_KINDS, KIND_LABEL, type CandidateEmailKind } from "@/lib/hr-email";
import { SAMPLE_DRAFT_INPUT, renderTemplate, templateVars } from "@/lib/hr-email-templates";
import { formatInterviewTime } from "@/lib/interview-schedule";

type Tpl = {
  kind: CandidateEmailKind;
  label: string;
  subject: string;
  body: string;
  isDefault: boolean;
  updated_by: string | null;
  updated_at: string | null;
};
type Data = {
  templates: Tpl[];
  defaults: Record<CandidateEmailKind, { subject: string; body: string }>;
  vars: Record<CandidateEmailKind, string[]>;
  varHelp: Record<string, string>;
};

// Màu lấy thẳng từ token theme /hr (hr-theme.css) để chạy cả Sáng/Tối.
const surface = "rounded-2xl bg-[var(--hr-raised)] shadow-[var(--hr-surface-shadow)] ring-1 ring-[var(--hr-hair)]";
const fieldBase =
  "w-full bg-transparent text-[var(--hr-ink)] placeholder:text-[var(--hr-ink-3)] focus:outline-none";

async function readJson(res: Response) {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export default function EmailTemplatesPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState("");
  const [kind, setKind] = useState<CandidateEmailKind>(CANDIDATE_EMAIL_KINDS[0]);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const lastField = useRef<"subject" | "body">("body");

  const load = useCallback(async () => {
    try {
      const res = await hrFetch("/api/hr/email-templates");
      const j = await readJson(res);
      if (!res.ok) throw new Error(String(j.error ?? `HTTP ${res.status}`));
      setData(j as unknown as Data);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được mẫu mail");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const saved = data?.templates.find((t) => t.kind === kind) ?? null;
  // Sửa dở dang gắn với loại đang chọn; đổi loại thì bỏ (có hỏi nếu đang sửa dở).
  const subject = draft?.subject ?? saved?.subject ?? "";
  const body = draft?.body ?? saved?.body ?? "";
  const dirty = !!saved && !!draft && (draft.subject !== saved.subject || draft.body !== saved.body);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  function pickKind(k: CandidateEmailKind) {
    if (k === kind) return;
    if (dirty && !confirm("Bỏ thay đổi chưa lưu của mẫu này?")) return;
    setKind(k);
    setDraft(null);
    setNotice(null);
  }

  function edit(patch: Partial<{ subject: string; body: string }>) {
    setDraft({ subject, body, ...patch });
  }

  function insertVar(name: string) {
    const field = lastField.current;
    const el = field === "subject" ? subjectRef.current : bodyRef.current;
    const cur = field === "subject" ? subject : body;
    const max = field === "subject" ? 200 : 10000;
    const token = `{${name}}`;
    if (cur.length + token.length > max) {
      setNotice({ kind: "error", text: `Không chèn được: ${field === "subject" ? "tiêu đề" : "nội dung"} sẽ vượt ${max} ký tự` });
      return;
    }
    const start = el?.selectionStart ?? cur.length;
    const end = el?.selectionEnd ?? cur.length;
    const next = cur.slice(0, start) + token + cur.slice(end);
    if (next.length > max) {
      setNotice({ kind: "error", text: `Không chèn được: ${field === "subject" ? "tiêu đề" : "nội dung"} sẽ vượt ${max} ký tự` });
      return;
    }
    setNotice(null);
    edit(field === "subject" ? { subject: next } : { body: next });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function call(init: RequestInit, url: string, okText: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await hrFetch(url, init);
      const j = await readJson(res);
      if (!res.ok) {
        setNotice({ kind: "error", text: String(j.error ?? `HTTP ${res.status}`) });
        return;
      }
      await load();
      setDraft(null);
      setNotice({ kind: "ok", text: okText });
    } catch {
      setNotice({ kind: "error", text: "Không kết nối được máy chủ" });
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    call(
      { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, subject, body }) },
      "/api/hr/email-templates",
      "Đã lưu mẫu",
    );

  function resetDefault() {
    if (!confirm(`Đưa mẫu “${KIND_LABEL[kind]}” về mặc định? Nội dung đã sửa sẽ mất.`)) return;
    void call({ method: "DELETE" }, `/api/hr/email-templates?kind=${kind}`, "Đã về mẫu mặc định");
  }

  const preview = renderTemplate({ subject, body }, templateVars(SAMPLE_DRAFT_INPUT(kind)));
  const html = textToHtml(preview.text);

  if (loadError) return <p className="text-[13px] text-[var(--hr-danger-ink)]">{loadError}</p>;
  if (!data || !saved) return <p className="py-16 text-center text-sm text-white/30">Đang tải mẫu mail…</p>;

  const status = saved.isDefault
    ? "Đang dùng mẫu mặc định"
    : `Sửa lần cuối bởi ${saved.updated_by ?? "—"}${saved.updated_at ? `, ${formatInterviewTime(saved.updated_at)}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Chọn loại mail — nút gạt như thanh tab trên cùng; chấm cam = đã sửa khỏi mặc định */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight text-[var(--hr-ink)]">Mẫu mail ứng viên</h2>
        <div
          role="tablist"
          aria-label="Loại mail"
          className="-mx-1 flex max-w-full gap-1 overflow-x-auto rounded-full bg-[var(--hr-segment-bg)] p-1"
        >
          {data.templates.map((t) => {
            const on = t.kind === kind;
            return (
              <button
                key={t.kind}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => pickKind(t.kind)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hr-orange)] ${
                  on
                    ? "bg-[var(--hr-segment-on)] font-semibold text-[var(--hr-ink)] shadow-sm"
                    : "text-[var(--hr-ink-2)] hover:text-[var(--hr-ink)]"
                }`}
              >
                {t.label.replace(" (không phù hợp)", "")}
                {!t.isDefault && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hr-orange)]" title="Đã sửa khỏi mẫu mặc định" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:h-[calc(100vh-190px)] lg:min-h-[560px] lg:grid-cols-2">
        {/* ── Soạn ── */}
        <section className={`${surface} flex min-h-[520px] flex-col overflow-hidden`} aria-label="Soạn mẫu">
          <div className="border-b border-[var(--hr-hair)] px-5 pb-3 pt-4">
            <label htmlFor="tpl-subject" className="text-[12px] text-[var(--hr-ink-2)]">
              Tiêu đề
            </label>
            <input
              id="tpl-subject"
              ref={subjectRef}
              onFocus={() => (lastField.current = "subject")}
              className={`${fieldBase} mt-0.5 text-[16px] font-semibold`}
              value={subject}
              maxLength={200}
              onChange={(e) => edit({ subject: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--hr-hair)] bg-[var(--hr-fill)] px-5 py-2.5">
            <span className="mr-1 text-[12px] text-[var(--hr-ink-2)]">Chèn</span>
            {data.vars[kind].map((v) => (
              <button
                key={v}
                type="button"
                title={data.varHelp[v]}
                onMouseDown={(e) => e.preventDefault() /* giữ con trỏ ở ô đang soạn */}
                onClick={() => insertVar(v)}
                className="rounded-md bg-[var(--hr-raised)] px-2 py-0.5 text-[12px] text-[var(--hr-orange-ink)] ring-1 ring-[var(--hr-hair)] hover:ring-[var(--hr-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hr-orange)]"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>

          <label htmlFor="tpl-body" className="sr-only">
            Nội dung
          </label>
          <textarea
            id="tpl-body"
            ref={bodyRef}
            onFocus={() => (lastField.current = "body")}
            maxLength={10000}
            className={`${fieldBase} min-h-[320px] flex-1 resize-none px-5 py-4 text-[14px] leading-7`}
            value={body}
            onChange={(e) => edit({ body: e.target.value })}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hr-hair)] px-5 py-3">
            <p
              role="status"
              className={`min-w-0 flex-1 truncate text-[12.5px] ${
                notice?.kind === "error"
                  ? "text-[var(--hr-danger-ink)]"
                  : notice
                    ? "text-[var(--hr-orange-ink)]"
                    : dirty
                      ? "text-[var(--hr-orange-ink)]"
                      : "text-[var(--hr-ink-2)]"
              }`}
              title={notice?.text ?? status}
            >
              {notice?.text ?? (dirty ? "Có thay đổi chưa lưu" : status)}
            </p>
            <div className="flex items-center gap-1.5">
              {!saved.isDefault && (
                <button
                  type="button"
                  className="hr-secondary-btn hr-secondary-btn--sm"
                  disabled={busy}
                  onClick={resetDefault}
                  title="Xoá bản đã sửa, dùng lại mẫu mặc định"
                >
                  <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Về mặc định
                </button>
              )}
              {dirty && (
                <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy} onClick={() => setDraft(null)}>
                  <Undo2 className="mr-1 inline h-3.5 w-3.5" /> Huỷ
                </button>
              )}
              <button
                type="button"
                className="hr-primary-btn hr-primary-btn--sm"
                disabled={busy || !dirty}
                onClick={() => void save()}
              >
                <Save className="mr-1 inline h-3.5 w-3.5" /> {busy ? "Đang lưu…" : "Lưu mẫu"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Xem trước: dựng như một mail trong hộp thư, gạt xem trên máy tính / điện thoại ── */}
        <section className={`${surface} flex min-h-[560px] flex-col overflow-hidden`} aria-label="Xem trước">
          <div className="flex items-start gap-3 border-b border-[var(--hr-hair)] px-5 py-3.5">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--hr-orange)] text-[14px] font-bold text-[var(--hr-on-orange)]"
            >
              T
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--hr-ink)]">{preview.subject || "(chưa có tiêu đề)"}</p>
              <p className="truncate text-[12.5px] text-[var(--hr-ink-2)]">
                TD Games HR &lt;hr@tdgamestudio.com&gt; gửi Nguyễn Văn A
              </p>
            </div>
            <div
              role="radiogroup"
              aria-label="Kích thước xem trước"
              className="flex shrink-0 gap-0.5 rounded-full bg-[var(--hr-segment-bg)] p-0.5"
            >
              {(
                [
                  ["desktop", Monitor, "Máy tính"],
                  ["mobile", Smartphone, "Điện thoại"],
                ] as const
              ).map(([d, Icon, label]) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={device === d}
                  aria-label={label}
                  title={label}
                  onClick={() => setDevice(d)}
                  className={`grid h-7 w-8 place-items-center rounded-full ${
                    device === d ? "bg-[var(--hr-segment-on)] text-[var(--hr-ink)] shadow-sm" : "text-[var(--hr-ink-2)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 justify-center overflow-hidden bg-[#f4f4f5] p-0">
            <iframe
              title="Xem trước mail"
              sandbox=""
              srcDoc={html}
              className={`h-full min-h-[480px] bg-[#f4f4f5] transition-[width] duration-300 ${
                device === "mobile" ? "my-4 w-[375px] max-w-full rounded-[28px] ring-8 ring-[#1d1d1f]" : "w-full"
              }`}
            />
          </div>
          <p className="border-t border-[var(--hr-hair)] px-5 py-2 text-[12px] text-[var(--hr-ink-2)]">
            Dữ liệu mẫu. Khi gửi thật, biến được điền theo hồ sơ ứng viên và vẫn sửa được trong hộp thoại gửi mail.
          </p>
        </section>
      </div>
    </div>
  );
}
