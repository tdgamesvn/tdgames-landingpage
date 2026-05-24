"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import type { BlogPost } from "../_lib/types";

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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleTitle(v: string) {
    set("title", v);
    if (!initial) set("slug", slugify(v));
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "blog");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        set("cover_image", data.url);
        setMsg("Cover uploaded ✓");
      } else {
        setMsg("Upload failed");
      }
    } catch {
      setMsg("Upload error");
    } finally {
      setUploading(false);
    }
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
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-medium text-white/60">Cover Image</label>
          <div className="flex gap-2">
            <input
              value={form.cover_image}
              onChange={(e) => set("cover_image", e.target.value)}
              placeholder="https://cdn.tdgamestudio.com/…"
              className="flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadCover(f);
              }}
            />
          </div>
          {form.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.cover_image}
              alt="cover preview"
              className="mt-2 h-28 w-full rounded-lg object-cover"
            />
          )}
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
