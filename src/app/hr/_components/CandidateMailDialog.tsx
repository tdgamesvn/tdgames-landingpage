"use client";

/**
 * Hộp thoại xác nhận gửi mail ứng viên. Mọi nơi trong /hr gọi `useCandidateMail().prompt(...)`
 * SAU KHI thao tác gốc (đổi status, lưu lịch PV) đã lưu xong — bấm "Không gửi" không hoàn tác gì.
 */

import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CandidateEmail } from "@/app/admin/_lib/types";
import { createPortal } from "react-dom";
import { CircleAlert, Mail, Send, X } from "lucide-react";
import { hrFetch, useHrSession } from "./HrSession";
import { KIND_LABEL, type CandidateEmailKind } from "@/lib/hr-email";
import type { PermissionKey } from "@/lib/hr-permissions";
import { formatInterviewTime } from "@/lib/interview-schedule";

export type MailPromptRequest = {
  appId: string;
  candidateName: string;
  kind: CandidateEmailKind;
  interviewId?: string | null;
  prevScheduledAt?: string | null;
};

type Draft = {
  mode: "test" | "live";
  test_to: string;
  to?: string;
  subject?: string;
  text?: string;
  last_sent_at?: string | null;
  error?: string;
  message?: string;
};

type Ctx = {
  prompt: (req: MailPromptRequest) => void;
  lastSentAt: number;
  /** Đang có hộp thoại mail mở — modal hồ sơ phía sau không xử lý phím Esc. */
  dialogOpen: boolean;
};

const CandidateMailContext = createContext<Ctx>({ prompt: () => {}, lastSentAt: 0, dialogOpen: false });

export function useCandidateMail() {
  return useContext(CandidateMailContext);
}

/** Quyền cần để gửi từng loại mail (khớp POST /api/hr/applications/[id]/emails). */
function canSendKind(can: (p: PermissionKey) => boolean, kind: CandidateEmailKind) {
  if (kind === "offer") return can("emails.send_offer");
  if (kind === "test_assignment") return can("emails.send") && can("apps.view_tests");
  return can("emails.send");
}

export function CandidateMailProvider({ children }: { children: React.ReactNode }) {
  const { can } = useHrSession();
  // Hàng đợi: nhiều thao tác liên tiếp (kéo A sang Test rồi B sang Rejected) không đè hộp thoại của nhau.
  const [queue, setQueue] = useState<(MailPromptRequest & { qid: number })[]>([]);
  const req = queue[0] ?? null;
  const enqueue = useCallback(
    (r: MailPromptRequest) => setQueue((q) => [...q, { ...r, qid: (q.at(-1)?.qid ?? 0) + 1 }]),
    [],
  );
  const dequeue = useCallback(() => setQueue((q) => q.slice(1)), []);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState(0);

  const prompt = useCallback(
    (r: MailPromptRequest) => {
      // Không có quyền gửi loại mail này → không hỏi (thao tác gốc vẫn đã lưu).
      if (!canSendKind(can, r.kind)) return;
      // Bài test: job chưa có đề thì chỉ báo nhỏ, không mở hộp thoại.
      if (r.kind === "test_assignment") {
        void (async () => {
          const d = await fetchDraft(r).catch(() => null);
          if (d?.error === "no_test") setNotice(d.message ?? "Job chưa có đề test — chưa gửi mail");
          else enqueue(r);
        })();
        return;
      }
      enqueue(r);
    },
    [can, enqueue],
  );

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const dialogOpen = req !== null;
  const value = useMemo(() => ({ prompt, lastSentAt, dialogOpen }), [prompt, lastSentAt, dialogOpen]);

  return (
    <CandidateMailContext.Provider value={value}>
      {children}
      {req && (
        <MailDialog
          key={req.qid}
          req={req}
          onClose={dequeue}
          onSent={() => {
            dequeue();
            setLastSentAt(Date.now());
          }}
        />
      )}
      {notice &&
        createPortal(
          <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-lg border border-white/15 hr-sheet px-4 py-2 text-xs text-white/80 shadow-xl">
            <CircleAlert className="hr-ico" /> {notice}
          </div>,
          document.body,
        )}
    </CandidateMailContext.Provider>
  );
}

async function fetchDraft(r: MailPromptRequest): Promise<Draft> {
  const q = new URLSearchParams({ kind: r.kind });
  if (r.interviewId) q.set("interview_id", r.interviewId);
  if (r.prevScheduledAt) q.set("prev_scheduled_at", r.prevScheduledAt);
  const res = await hrFetch(`/api/hr/applications/${r.appId}/emails/draft?${q}`);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
  return j as Draft;
}

function MailDialog({
  req,
  onClose,
  onSent,
}: {
  req: MailPromptRequest;
  onClose: () => void;
  onSent: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchDraft(req)
      .then((d) => {
        if (!alive) return;
        setDraft(d);
        if (d.error) setLoadError(d.message ?? d.error);
        setSubject(d.subject ?? "");
        setText(d.text ?? "");
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : "Không tải được bản nháp"));
    return () => {
      alive = false;
    };
  }, [req]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, sending]);

  async function send() {
    setSending(true);
    setSendError(null);
    try {
      const res = await hrFetch(`/api/hr/applications/${req.appId}/emails`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: req.kind,
          interview_id: req.interviewId ?? null,
          subject,
          text,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      if (j.warning) alert(j.warning);
      onSent();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Gửi thất bại");
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(draft && !loadError && subject.trim() && text.trim() && !sending);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => !sending && onClose()}>
      <div
        role="dialog"
        aria-label={`Gửi mail: ${KIND_LABEL[req.kind]}`}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 hr-sheet p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white"><Mail className="hr-ico" /> {KIND_LABEL[req.kind]}</h3>
            <p className="mt-1 text-xs text-white/50">
              Gửi mail cho <span className="font-semibold text-white/70">{req.candidateName}</span>?
            </p>
          </div>
          <button onClick={onClose} disabled={sending} className="text-white/40 hover:text-white/70" aria-label="Đóng">
            <X className="hr-ico" />
          </button>
        </div>

        {draft?.mode === "test" && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
            Chế độ test — mail sẽ gửi về {draft.test_to}, KHÔNG tới ứng viên.
          </div>
        )}

        {!draft && !loadError && <p className="text-xs text-white/40">Đang soạn bản nháp…</p>}
        {loadError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{loadError}</div>
        )}

        {draft && !loadError && (
          <>
            {draft.last_sent_at && (
              <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60">
                Đã gửi mail “{KIND_LABEL[req.kind]}” cho ứng viên này lúc {formatInterviewTime(draft.last_sent_at)}.
              </div>
            )}
            {draft.to && (
              <div className="text-xs text-white/50">
                Người nhận: <span className="font-semibold text-white/80">{draft.to}</span>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Tiêu đề</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Nội dung</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white focus:outline-none"
              />
            </div>
          </>
        )}

        {sendError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{sendError}</div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={sending} className="hr-secondary-btn">
            Không gửi
          </button>
          <button onClick={() => void send()} disabled={!canSend} className="hr-primary-btn inline-flex items-center gap-1.5 px-5 py-2">
            <Send className="hr-ico" />
            {sending ? "Đang gửi…" : "Gửi"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type ScheduledRound = { id: string; round: number; scheduled_at: string | null };

/** Mục "Mail ứng viên" trong hồ sơ: nút gửi tay + lịch sử mail đã gửi. */
export function CandidateMailSection({
  appId,
  candidateName,
  rounds,
}: {
  appId: string;
  candidateName: string;
  rounds: ScheduledRound[];
}) {
  const { prompt, lastSentAt } = useCandidateMail();
  const { can } = useHrSession();
  const canView = can("apps.view_emails");
  const canSend = can("emails.send");
  const [emails, setEmails] = useState<CandidateEmail[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    let alive = true;
    hrFetch(`/api/hr/applications/${appId}/emails`)
      .then((r) => r.json())
      .then((j) => alive && setEmails(j.emails ?? []))
      .catch(() => alive && setEmails([]));
    return () => {
      alive = false;
    };
  }, [appId, lastSentAt, canView]);

  const scheduled = rounds.filter((r) => r.scheduled_at).sort((a, b) => a.round - b.round);
  const pick = (kind: CandidateEmailKind, interviewId?: string) => {
    setMenuOpen(false);
    prompt({ appId, candidateName, kind, interviewId });
  };

  if (!canView && !canSend) return null;

  return (
    <section className="hr-group px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="hr-section-title">
          Mail ứng viên <span className="font-normal text-white/50">{emails?.length ?? ""}</span>
        </h4>
        {canSend && (
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="hr-secondary-btn" aria-haspopup="menu" aria-expanded={menuOpen}>
            <Mail className="hr-ico" />Gửi mail
          </button>
          {menuOpen && (
            <div role="menu" className="hr-menu right-0">
              {scheduled.length === 0 && (
                <button role="menuitem" disabled className="hr-menu-item opacity-40">Mời / đổi lịch PV (chưa có lịch)</button>
              )}
              {scheduled.map((r) => (
                <Fragment key={r.id}>
                  <button role="menuitem" onClick={() => pick("interview_invite", r.id)} className="hr-menu-item">
                    {KIND_LABEL.interview_invite} — vòng {r.round} ({formatInterviewTime(r.scheduled_at!)})
                  </button>
                  <button role="menuitem" onClick={() => pick("interview_reschedule", r.id)} className="hr-menu-item">
                    {KIND_LABEL.interview_reschedule} — vòng {r.round}
                  </button>
                </Fragment>
              ))}
              {can("apps.view_tests") && (
                <button role="menuitem" onClick={() => pick("test_assignment")} className="hr-menu-item">{KIND_LABEL.test_assignment}</button>
              )}
              <button role="menuitem" onClick={() => pick("rejection")} className="hr-menu-item">{KIND_LABEL.rejection}</button>
            </div>
          )}
        </div>
        )}
      </div>

      {canView && emails === null && <p className="text-[13px] text-white/50">Đang tải…</p>}
      {emails?.length === 0 && <p className="text-[13px] text-white/50">Chưa gửi mail nào.</p>}
      {emails && emails.length > 0 && (
        <ul className="space-y-1.5">
          {emails.map((e) => (
            <li key={e.id} className="text-[13px]">
              <button type="button" onClick={() => setOpenId(openId === e.id ? null : e.id)} className="w-full text-left">
                <span className="font-semibold text-white/80">{KIND_LABEL[e.kind]}</span>
                {e.test_mode && (
                  <span className="ml-1.5 rounded border border-amber-500/40 px-1 text-[10px] font-bold text-amber-300">TEST</span>
                )}
                <span className="block text-[12px] text-white/50">
                  {formatInterviewTime(e.created_at)}
                  {e.sent_to ? ` · tới ${e.sent_to}` : ""}
                  {e.sent_by ? ` · ${e.sent_by}` : ""}
                </span>
              </button>
              {openId === e.id && (
                <div className="mt-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <p className="text-[12px] font-semibold text-white/70">{e.subject}</p>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-[12px] text-white/60">{e.body_text}</pre>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
