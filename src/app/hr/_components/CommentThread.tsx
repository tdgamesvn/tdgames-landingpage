"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import type { ApplicationComment } from "@/app/admin/_lib/types";
import { hrFetch, useHrSession } from "./HrSession";
import { ROLE_LABEL, type HrRole } from "@/lib/hr-permissions";
import {
  avatarColorIndex,
  filterMembers,
  formatDateTimeVi,
  keptMentionIds,
  relativeTimeVi,
  splitMentions,
  type MentionMember,
} from "@/lib/hr-comment-mentions";

// Bảng màu dịu, chữ trắng đọc được cả nền sáng lẫn tối.
const AVATAR_COLORS = ["#b45309", "#0f766e", "#4f46e5", "#be185d", "#15803d", "#7c3aed", "#0369a1", "#a16207"];

function Avatar({ name, seed }: { name: string; seed: string }) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-[12px] font-semibold text-white"
      style={{ backgroundColor: AVATAR_COLORS[avatarColorIndex(seed || name, AVATAR_COLORS.length)] }}
    >
      {initial}
    </span>
  );
}

function roleLabel(role: string | null | undefined): string | null {
  return role && role in ROLE_LABEL ? ROLE_LABEL[role as HrRole] : null;
}

/** Nội dung comment: giữ xuống dòng, `@Tên` được tag tô cam (React text node, không HTML thô). */
function CommentBody({ content, names }: { content: string; names: string[] }) {
  const parts = useMemo(() => splitMentions(content, names), [content, names]);
  return (
    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--hr-ink)]">
      {parts.map((p, i) =>
        p.mention ? (
          <span key={i} className="font-semibold text-[var(--hr-orange-ink)]">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

const MAX_COMPOSER_PX = 6 * 20 + 8;

export default function CommentThread({ appId, listMaxH = "max-h-60" }: { appId: string; listMaxH?: string }) {
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [members, setMembers] = useState<MentionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  // Popup @: vị trí ký tự @ trong nội dung + chữ đã gõ sau @.
  const [pop, setPop] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const [, setTick] = useState(0);
  const { me, can } = useHrSession();
  const canComment = can("apps.comment");
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_PX)}px`;
  }, [content]);

  // Làm mới nhãn "5 phút trước" mỗi phút.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const fetchComments = useCallback(async () => {
    if (!canComment) return;
    try {
      const res = await hrFetch(`/api/hr/applications/${appId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [appId, canComment]);

  const fetchMembers = useCallback(async () => {
    if (!canComment) return;
    try {
      const res = await hrFetch(`/api/hr/applications/${appId}/mentionable`);
      if (res.ok) setMembers(((await res.json()).members ?? []) as MentionMember[]);
    } catch {
      // không có danh sách → vẫn viết comment được, chỉ không tag
    }
  }, [appId, canComment]);

  // Qua microtask — không setState đồng bộ trong effect.
  useEffect(() => {
    void Promise.resolve().then(fetchComments);
    void Promise.resolve().then(fetchMembers);
  }, [fetchComments, fetchMembers]);

  // Chỉ cuộn khung danh sách comment — scrollIntoView cuộn cả mọi khung cha
  // (trên mobile modal cuộn chung 1 khung → mở ra bị nhảy xuống giữa).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [comments.length]);

  // id → tên, để tô màu @Tên trong comment (thành viên, mình, và người từng bình luận).
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of comments) if (c.author_user_id) m.set(c.author_user_id, c.author_name);
    for (const x of members) m.set(x.id, x.display_name);
    if (me?.user.id) m.set(me.user.id, me.user.displayName);
    return m;
  }, [comments, members, me]);

  const matches = useMemo(() => (pop ? filterMembers(members, pop.query) : []), [pop, members]);

  function detectMention(value: string, caret: number) {
    const before = value.slice(0, caret);
    const m = /(^|\s)@([^\s@]*)$/.exec(before);
    if (!m) {
      setPop(null);
      return;
    }
    setPop({ start: caret - m[2].length - 1, query: m[2] });
    setActive(0);
  }

  function insertMember(member: MentionMember) {
    const el = contentRef.current;
    if (!pop || !el) return;
    const caret = el.selectionStart ?? content.length;
    const text = `@${member.display_name} `;
    const next = content.slice(0, pop.start) + text + content.slice(caret);
    setContent(next);
    setTagged((prev) => (prev.includes(member.id) ? prev : [...prev, member.id]));
    setPop(null);
    const pos = pop.start + text.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  async function submit() {
    const trimContent = content.trim();
    if (!trimContent || sending) return;

    setSending(true);
    setError(null);
    try {
      const mentions = keptMentionIds(trimContent, tagged, members);
      const res = await hrFetch(`/api/hr/applications/${appId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: trimContent, ...(mentions.length ? { mentions } : {}) }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [
          ...prev,
          { ...data.comment, author_role: data.comment?.author_role ?? me?.role ?? null, mentions: data.comment?.mentions ?? mentions },
        ]);
        setContent("");
        setTagged([]);
        setPop(null);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "Không gửi được bình luận");
      }
    } catch {
      setError("Không kết nối được máy chủ");
    } finally {
      setSending(false);
    }
  }

  if (!canComment) return null;

  const myName = me?.user.displayName ?? "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <h4 className="hr-section-title">
        Bình luận <span className="font-normal text-[var(--hr-ink-2)]">{comments.length}</span>
      </h4>

      <div ref={listRef} className={`${listMaxH} min-h-0 space-y-4 overflow-y-auto pr-1`}>
        {loading && <p className="text-[13px] text-[var(--hr-ink-2)]">Đang tải…</p>}
        {!loading && comments.length === 0 && (
          <p className="text-[13px] text-[var(--hr-ink-2)]">Chưa có bình luận. Viết nhận xét đầu tiên cho team.</p>
        )}
        {comments.map((c) => {
          const names = (c.mentions ?? []).map((id) => nameById.get(id)).filter((n): n is string => !!n);
          const role = roleLabel(c.author_role);
          return (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.author_name} seed={c.author_user_id ?? c.author_name} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[13px] font-semibold text-[var(--hr-ink)]">{c.author_name}</span>
                  {role && <span className="text-[11px] text-[var(--hr-ink-2)]">{role}</span>}
                  <span className="text-[11px] text-[var(--hr-ink-2)]" title={formatDateTimeVi(c.created_at)}>
                    {relativeTimeVi(c.created_at)}
                  </span>
                </div>
                <CommentBody content={c.content} names={names} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Ô viết bình luận */}
      <div className="border-t border-[var(--hr-hair)] pt-3">
        <div className="relative flex items-start gap-2.5">
          {myName && <Avatar name={myName} seed={me?.user.id ?? myName} />}
          <div className="relative min-w-0 flex-1">
            {pop && matches.length > 0 && (
              <ul
                role="listbox"
                aria-label="Nhắc thành viên"
                className="absolute bottom-full left-0 z-20 mb-1.5 max-h-48 w-full max-w-[280px] overflow-y-auto rounded-xl bg-[var(--hr-raised)] p-1 shadow-[var(--hr-surface-shadow)] ring-1 ring-[var(--hr-hair)]"
              >
                {matches.map((m, i) => (
                  <li key={m.id} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      // mousedown để textarea không mất focus trước khi chèn
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMember(m);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${
                        i === active ? "bg-[var(--hr-fill-2)]" : ""
                      }`}
                    >
                      <Avatar name={m.display_name} seed={m.id} />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--hr-ink)]">{m.display_name}</span>
                      <span className="text-[11px] text-[var(--hr-ink-2)]">{m.roleLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-2xl bg-[var(--hr-raised)] p-2 ring-1 ring-[var(--hr-hair)] focus-within:ring-[var(--hr-orange)]">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
                }}
                onClick={(e) => detectMention(content, e.currentTarget.selectionStart ?? content.length)}
                onBlur={() => setPop(null)}
                onKeyDown={(e) => {
                  if (pop && matches.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => (a + 1) % matches.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => (a - 1 + matches.length) % matches.length);
                      return;
                    }
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      insertMember(matches[Math.min(active, matches.length - 1)]);
                      return;
                    }
                  }
                  if (pop && e.key === "Escape") {
                    e.preventDefault();
                    setPop(null);
                    return;
                  }
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                placeholder="Viết bình luận… gõ @ để nhắc ai đó"
                rows={1}
                aria-label="Viết bình luận"
                className="block w-full resize-none bg-transparent px-1 py-0.5 text-[13px] leading-5 text-[var(--hr-ink)] placeholder:text-[var(--hr-ink-3)] focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="px-1 text-[11px] text-[var(--hr-ink-3)]">Ctrl/⌘ + Enter để gửi</span>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={sending || !content.trim()}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--hr-orange)] px-3 py-1 text-[12px] font-semibold text-[var(--hr-on-orange)] transition-opacity disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  {sending ? "Đang gửi…" : "Gửi"}
                </button>
              </div>
            </div>
            {error && <p className="mt-1.5 px-1 text-[12px] text-[var(--hr-danger-ink)]">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
