"use client";

/**
 * Tab "Mẫu mail": sửa tiêu đề + nội dung 6 loại mail ứng viên, chèn biến `{ten_bien}`,
 * xem trước đúng giao diện mail thật. Lỗi server hiện nguyên văn.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Save, Undo2 } from "lucide-react";
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

const inputCls = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] text-white focus:outline-none";

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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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
    const el = bodyRef.current;
    const token = `{${name}}`;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    edit({ body: body.slice(0, start) + token + body.slice(end) });
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

  if (loadError) return <p className="text-[13px] text-red-400">{loadError}</p>;
  if (!data || !saved) return <p className="py-16 text-center text-sm text-white/30">Loading…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Mẫu mail ứng viên</h2>
      {notice && (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-[13px] ${
            notice.kind === "ok"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Chọn loại: select trên mobile, danh sách trên màn rộng */}
        <select
          className={`${inputCls} lg:hidden`}
          value={kind}
          onChange={(e) => pickKind(e.target.value as CandidateEmailKind)}
          aria-label="Loại mail"
        >
          {data.templates.map((t) => (
            <option key={t.kind} value={t.kind}>
              {t.label}
              {t.isDefault ? "" : " •"}
            </option>
          ))}
        </select>
        <div className="hr-group hidden h-fit flex-col overflow-hidden lg:flex">
          {data.templates.map((t) => (
            <button
              key={t.kind}
              type="button"
              aria-pressed={t.kind === kind}
              onClick={() => pickKind(t.kind)}
              className={`flex items-center justify-between gap-2 px-4 py-2.5 text-left text-[13px] ${
                t.kind === kind ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              <span>{t.label}</span>
              {!t.isDefault && <span className="text-[11px] text-amber-400">đã sửa</span>}
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] text-white/50" htmlFor="tpl-subject">Tiêu đề</label>
            <input
              id="tpl-subject"
              className={inputCls}
              value={subject}
              maxLength={200}
              onChange={(e) => edit({ subject: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-white/50" htmlFor="tpl-body">Nội dung</label>
            <textarea
              id="tpl-body"
              ref={bodyRef}
              rows={16}
              maxLength={10000}
              className={`${inputCls} font-mono text-[12.5px] leading-relaxed`}
              value={body}
              onChange={(e) => edit({ body: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <p className="text-[12px] text-white/50">Biến tự điền (bấm để chèn tại con trỏ)</p>
            <div className="flex flex-wrap gap-1.5">
              {data.vars[kind].map((v) => (
                <button
                  key={v}
                  type="button"
                  title={data.varHelp[v]}
                  onClick={() => insertVar(v)}
                  className="hr-secondary-btn hr-secondary-btn--sm font-mono"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="hr-primary-btn hr-primary-btn--sm" disabled={busy || !dirty} onClick={() => void save()}>
              <Save className="mr-1 inline h-3.5 w-3.5" /> Lưu
            </button>
            <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy || !dirty} onClick={() => setDraft(null)}>
              <Undo2 className="mr-1 inline h-3.5 w-3.5" /> Huỷ thay đổi
            </button>
            <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy || saved.isDefault} onClick={resetDefault}>
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Về mặc định
            </button>
            <span className="text-[12px] text-white/50">
              {saved.isDefault
                ? "Đang dùng mẫu mặc định"
                : `Sửa lần cuối: ${saved.updated_by ?? "—"}${saved.updated_at ? ` · ${formatInterviewTime(saved.updated_at)}` : ""}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-[12px] text-white/50">Xem trước (dữ liệu mẫu)</p>
            <p className="text-[13px] text-white">
              <span className="text-white/50">Tiêu đề: </span>
              {preview.subject}
            </p>
            <iframe
              title="Xem trước mail"
              sandbox=""
              srcDoc={html}
              className="h-[560px] w-full rounded-lg border border-white/15 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
