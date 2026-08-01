"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import type { BlogPost } from "../_lib/types";
import { ImagePicker } from "./ImagePicker";

/* ─── helpers ──────────────────────────────────────────────── */
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─── types ─────────────────────────────────────────────────── */
type BlogTopic = {
  id: string;
  topic: string;
  why: string | null;
  ask: string | null;
  source: string | null;
  keyword: string | null;
  intent: string | null;
  score: number | null;
  status: "new" | "picked" | "drafted" | "skipped";
  ceo_note: string | null;
  created_at: string;
};

type FormData = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image: string;
  content_md: string;
  published: boolean;
  author: string;
};

const EMPTY_FORM: FormData = {
  slug: "",
  title: "",
  excerpt: "",
  tag: "Blog",
  cover_image: "",
  content_md: "",
  published: false,
  author: "TD Games",
};

/* ─── component ─────────────────────────────────────────────── */
export function BlogTab({ adminKey }: { adminKey: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

  /* list -------------------------------------------------------- */
  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setEditPost(null);
    setView("form");
  }

  function openEdit(p: BlogPost) {
    setEditPost(p);
    setView("form");
  }

  async function togglePublish(p: BlogPost) {
    await fetch(`/api/admin/blog/${p.id}`, {
      method: "PATCH",
      headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    void loadPosts();
  }

  async function deletePost(p: BlogPost) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await fetch(`/api/admin/blog/${p.id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    void loadPosts();
  }

  if (view === "form") {
    return (
      <BlogForm
        adminKey={adminKey}
        initial={editPost}
        onSaved={() => {
          setView("list");
          void loadPosts();
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  /* list view --------------------------------------------------- */
  return (
    <div className="space-y-4">
      <RadarTopics
        adminKey={adminKey}
        onDrafted={(post) => {
          void loadPosts();
          setEditPost(post); // nhảy thẳng vào form để sếp sửa
          setView("form");
        }}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blog Posts</h2>
        <button
          onClick={openNew}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          + New Post
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-white/50">No posts yet. Create your first one!</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-white/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Tag</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Views</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium max-w-[260px] truncate" title={p.title}>
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-white/60">{p.tag}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        p.published
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white/60">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => togglePublish(p)}
                        className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                        title={p.published ? "Unpublish" : "Publish"}
                      >
                        {p.published ? "Unpublish" : "Publish"}
                      </button>
                      <a
                        href={`/api/admin/blog/preview?secret=${encodeURIComponent(adminKey)}&slug=${encodeURIComponent(p.slug)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                        title="Xem bài bằng giao diện thật của web"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePost(p)}
                        className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Radar topics ───────────────────────────────────────────── */
function RadarTopics({
  adminKey,
  onDrafted,
}: {
  adminKey: string;
  onDrafted: (post: BlogPost) => void;
}) {
  const [topics, setTopics] = useState<BlogTopic[]>([]);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  // Bộ câu hỏi phỏng vấn theo từng topic + câu trả lời của sếp.
  const [qs, setQs] = useState<Record<string, { q: string; why: string }[]>>({});
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  async function load() {
    try {
      const res = await fetch("/api/admin/blog/topics", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      /* radar chưa chạy lần nào — panel tự ẩn */
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Điểm cao lên trước — sếp đọc từ trên xuống là gặp bài đáng viết nhất.
  const pending = topics
    .filter((t) => t.status === "new" || t.status === "picked")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (pending.length === 0) return null;

  async function skip(t: BlogTopic) {
    setTopics((ts) => ts.filter((x) => x.id !== t.id));
    await fetch("/api/admin/blog/topics", {
      method: "PATCH",
      headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: "skipped" }),
    });
  }

  async function interview(t: BlogTopic) {
    setBusyId(t.id);
    setMsg("AI đang soạn câu hỏi phỏng vấn…");
    try {
      const res = await fetch("/api/admin/blog/topics/interview", {
        method: "POST",
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Không soạn được câu hỏi");
        return;
      }
      setQs((m) => ({ ...m, [t.id]: data.questions }));
      setAnswers((m) => ({ ...m, [t.id]: data.questions.map(() => "") }));
      setMsg("Trả lời được câu nào hay câu đó — bỏ trống cũng không sao.");
    } catch {
      setMsg("Lỗi mạng khi soạn câu hỏi");
    } finally {
      setBusyId(null);
    }
  }

  async function draft(t: BlogTopic) {
    const qa = qs[t.id];
    const filled = qa
      ? qa.map((x, i) => ({ q: x.q, a: (answers[t.id]?.[i] ?? "").trim() })).filter((x) => x.a)
      : null;
    const note = (notes[t.id] ?? "").trim();
    const total = filled?.length ? filled.map((x) => x.a).join(" ").length : note.length;

    if (total < 40) {
      setMsg("Kể ít nhất 40 ký tự trải nghiệm thật — không có chất liệu thì bài sẽ nhạt.");
      return;
    }
    setBusyId(t.id);
    setMsg("AI đang dựng bài, mất khoảng 1-2 phút…");
    try {
      const res = await fetch("/api/admin/blog/topics", {
        method: "POST",
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify(
          filled?.length ? { id: t.id, answers: filled } : { id: t.id, ceo_note: note },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Lỗi khi dựng bài");
        return;
      }
      setMsg("");
      onDrafted(data.post);
    } catch {
      setMsg("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-amber-300">
          📡 Chủ đề radar gợi ý ({pending.length})
        </span>
        <span className="ml-auto text-xs text-white/40">{open ? "Ẩn" : "Xem"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-amber-500/15 p-4">
          {msg && <p className="text-xs text-amber-300">{msg}</p>}
          {pending.map((t) => (
            <div key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-center gap-2">
                {t.intent && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      t.intent === "BOFU"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : t.intent === "MOFU"
                          ? "bg-sky-500/20 text-sky-300"
                          : "bg-white/10 text-white/50"
                    }`}
                    title="BOFU = khách gần mua, MOFU = đang cân nhắc, TOFU = mới biết tới"
                  >
                    {t.intent}
                  </span>
                )}
                {t.score != null && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {t.score}/10
                  </span>
                )}
                <p className="text-sm font-medium">{t.topic}</p>
              </div>
              {t.keyword && (
                <p className="mt-1 font-mono text-[11px] text-white/40">🔎 {t.keyword}</p>
              )}
              {t.why && <p className="mt-1 text-xs text-white/50">{t.why}</p>}
              {t.ask && (
                <p className="mt-2 text-xs text-amber-300/90">
                  <span className="font-semibold">Kể nghe:</span> {t.ask}
                </p>
              )}
              {qs[t.id] ? (
                <div className="mt-3 space-y-3 rounded-md border border-amber-500/20 bg-amber-500/[0.03] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/80">
                    AI phỏng vấn — trả lời được câu nào hay câu đó
                  </p>
                  {qs[t.id].map((item, qi) => (
                    <div key={qi}>
                      <p className="text-xs font-medium text-white/80">
                        {qi + 1}. {item.q}
                      </p>
                      {item.why && (
                        <p className="mt-0.5 text-[11px] italic text-white/35">{item.why}</p>
                      )}
                      <textarea
                        value={answers[t.id]?.[qi] ?? ""}
                        onChange={(e) =>
                          setAnswers((m) => {
                            const arr = [...(m[t.id] ?? [])];
                            arr[qi] = e.target.value;
                            return { ...m, [t.id]: arr };
                          })
                        }
                        rows={2}
                        placeholder="Con số, tên dự án, sự cố thật…"
                        className="mt-1 w-full resize-y rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={notes[t.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                  rows={3}
                  placeholder="Kể tự do, hoặc bấm “AI phỏng vấn” để được hỏi từng câu một"
                  className="mt-2 w-full resize-y rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
                />
              )}
              <div className="mt-2 flex items-center gap-2">
                {!qs[t.id] && (
                  <button
                    onClick={() => interview(t)}
                    disabled={busyId !== null}
                    className="rounded-md border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
                    title="AI hỏi 6 câu để moi chất liệu thật, rồi mới viết"
                  >
                    {busyId === t.id ? "Đang soạn câu hỏi…" : "AI phỏng vấn"}
                  </button>
                )}
                <button
                  onClick={() => draft(t)}
                  disabled={busyId !== null}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium hover:bg-amber-500 disabled:opacity-40"
                >
                  {busyId === t.id ? "Đang dựng…" : "Dựng bản nháp"}
                </button>
                <button
                  onClick={() => skip(t)}
                  disabled={busyId !== null}
                  className="rounded border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-40"
                >
                  Bỏ qua
                </button>
                {t.source && (
                  <a
                    href={t.source}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-xs text-white/40 hover:text-white"
                  >
                    tin gốc ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Form ───────────────────────────────────────────────────── */
function BlogForm({
  adminKey,
  initial,
  onSaved,
  onCancel,
}: {
  adminKey: string;
  initial: BlogPost | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    initial
      ? {
          slug: initial.slug,
          title: initial.title,
          excerpt: initial.excerpt,
          tag: initial.tag,
          cover_image: initial.cover_image,
          content_md: initial.content_md,
          published: initial.published,
          author: initial.author,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleTitle(v: string) {
    set("title", v);
    if (!initial) set("slug", slugify(v));
  }

  async function save() {
    if (!form.slug || !form.title) {
      setMsg("slug and title are required");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const url = initial ? `/api/admin/blog/${initial.id}` : "/api/admin/blog";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const e = await res.json();
        setMsg(e.error ?? "Error");
        return;
      }
      onSaved();
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = form.content_md ? (marked(form.content_md) as string) : "";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-sm text-white/50 hover:text-white">
          ← Back
        </button>
        <h2 className="text-lg font-semibold">{initial ? "Edit Post" : "New Post"}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Title */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-medium text-white/60">Title *</label>
          <input
            value={form.title}
            onChange={(e) => handleTitle(e.target.value)}
            placeholder="Post title…"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="url-safe-slug"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Tag */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Tag</label>
          <input
            value={form.tag}
            onChange={(e) => set("tag", e.target.value)}
            placeholder="Blog / Pipeline / VFX / 2D Art…"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Author */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Author</label>
          <input
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Published */}
        <div className="flex items-center gap-3 self-end pb-2">
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="h-4 w-4 rounded accent-indigo-500"
          />
          <label htmlFor="published" className="text-sm text-white/70">
            Published (visible on /blog)
          </label>
        </div>

        {/* Excerpt */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-medium text-white/60">Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            placeholder="Short summary shown in listing cards…"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Cover image */}
        <div className="md:col-span-2">
          <ImagePicker
            adminKey={adminKey}
            label="Cover Image"
            value={form.cover_image}
            onChange={(url) => set("cover_image", url)}
          />
        </div>
      </div>

      {/* Content with write/preview tabs */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 border-b border-white/10 pb-2">
          <label className="mr-auto text-xs font-medium text-white/60">Content (Markdown)</label>
          <button
            onClick={() => setPreviewTab("write")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              previewTab === "write" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Write
          </button>
          <button
            onClick={() => setPreviewTab("preview")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              previewTab === "preview" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Preview
          </button>
        </div>

        {previewTab === "write" ? (
          <textarea
            value={form.content_md}
            onChange={(e) => set("content_md", e.target.value)}
            rows={20}
            placeholder={`# Heading\n\nWrite your post in **Markdown**…\n\n## Section\n\nParagraph text here.\n\n- List item\n- Another item\n\n> Blockquote`}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm leading-relaxed resize-y focus:outline-none focus:border-indigo-400"
          />
        ) : (
          <div
            className="prose-blog min-h-[400px] rounded-md border border-white/10 bg-white/[0.02] px-6 py-4"
            dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-white/30 text-sm'>Nothing to preview yet…</p>" }}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
        >
          {saving ? "Saving…" : initial ? "Save Changes" : "Create Post"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-white/15 px-5 py-2 text-sm hover:bg-white/10"
        >
          Cancel
        </button>
        {msg && <p className="text-xs text-white/60">{msg}</p>}
      </div>
    </div>
  );
}
