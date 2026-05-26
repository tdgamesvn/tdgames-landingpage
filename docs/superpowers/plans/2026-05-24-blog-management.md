# Blog Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded blog posts with a Supabase-backed system and add Admin tab "8. Blog" for full CRUD with markdown editing and R2 cover image upload.

**Architecture:** `blog_posts` Supabase table stores markdown content. Public API routes serve published posts; admin API (x-admin-key) serves all posts. `/blog` page fetches from API; `/blog/[slug]` renders markdown via `marked`. Admin tab has list + form views with live markdown preview.

**Tech Stack:** Next.js 16 App Router, Supabase (service role), TypeScript, `marked` (markdown→HTML), Tailwind v4, existing `/api/admin/upload` for R2 image upload.

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/20260524180000_blog_posts_schema.sql` | Create |
| `src/app/admin/_lib/types.ts` | Modify — add `BlogPost`, `"blog"` to `AdminTab` |
| `src/app/api/blog/route.ts` | Create — GET public published posts |
| `src/app/api/blog/[slug]/route.ts` | Create — GET single post + increment views |
| `src/app/api/admin/blog/route.ts` | Create — GET all + POST |
| `src/app/api/admin/blog/[id]/route.ts` | Create — PATCH + DELETE |
| `src/app/admin/_components/BlogTab.tsx` | Create — list + form views |
| `src/app/admin/page.tsx` | Modify — import BlogTab, add tab "8. Blog" |
| `src/app/blog/page.tsx` | Modify — fetch from /api/blog instead of hardcode |
| `src/app/blog/[slug]/page.tsx` | Modify — fetch from API + render markdown |

---

## Task 1: Install `marked` and create DB migration

**Files:**
- Create: `supabase/migrations/20260524180000_blog_posts_schema.sql`

- [ ] **Step 1: Install marked**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage
npm install marked
npm install --save-dev @types/marked
```

Expected: `marked` appears in `package.json` dependencies.

- [ ] **Step 2: Apply DB migration via Supabase MCP**

Use `apply_migration` tool with name `blog_posts_schema` and this SQL:

```sql
CREATE TABLE public.blog_posts (
  id           uuid        DEFAULT gen_random_uuid() NOT NULL,
  slug         text        NOT NULL,
  title        text        NOT NULL,
  excerpt      text        NOT NULL DEFAULT '',
  tag          text        NOT NULL DEFAULT 'Blog',
  cover_image  text        NOT NULL DEFAULT '',
  content_md   text        NOT NULL DEFAULT '',
  published    boolean     NOT NULL DEFAULT false,
  views        integer     NOT NULL DEFAULT 0,
  author       text        NOT NULL DEFAULT 'TD Games',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_slug_key UNIQUE (slug)
);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_posts_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_public_read" ON public.blog_posts
  FOR SELECT USING (published = true);

CREATE INDEX blog_posts_published_idx ON public.blog_posts (published);
CREATE INDEX blog_posts_created_at_idx ON public.blog_posts (created_at DESC);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);
```

- [ ] **Step 3: Verify table exists**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'blog_posts';
```
Expected: 1 row.

- [ ] **Step 4: Save migration file locally**

Create `supabase/migrations/20260524180000_blog_posts_schema.sql` with the SQL above.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260524180000_blog_posts_schema.sql package.json package-lock.json
git commit -m "feat(blog): add blog_posts table + install marked"
```

---

## Task 2: Types

**Files:**
- Modify: `src/app/admin/_lib/types.ts`

- [ ] **Step 1: Add `BlogPost` type and update `AdminTab`**

In `src/app/admin/_lib/types.ts`, add after the `Application` type block:

```typescript
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image: string;
  content_md: string;
  published: boolean;
  views: number;
  author: string;
  created_at: string;
  updated_at: string;
};
```

Change the `AdminTab` union to include `"blog"`:

```typescript
export type AdminTab = "projects" | "content" | "media" | "create" | "bulk" | "team" | "careers" | "blog";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

---

## Task 3: Public API — `GET /api/blog` and `GET /api/blog/[slug]`

**Files:**
- Create: `src/app/api/blog/route.ts`
- Create: `src/app/api/blog/[slug]/route.ts`

- [ ] **Step 1: Create `src/app/api/blog/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, tag, cover_image, published, views, author, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data, total: data.length });
}
```

- [ ] **Step 2: Create `src/app/api/blog/[slug]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Increment views (fire-and-forget)
  void supabase
    .from("blog_posts")
    .update({ views: data.views + 1 })
    .eq("id", data.id);

  return NextResponse.json({ post: data });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/blog/
git commit -m "feat(blog): public API routes GET /api/blog and /api/blog/[slug]"
```

---

## Task 4: Admin API

**Files:**
- Create: `src/app/api/admin/blog/route.ts`
- Create: `src/app/api/admin/blog/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/admin/blog/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data, total: data.length });
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, title } = body;
  if (!slug || !title) {
    return NextResponse.json({ error: "Missing required fields: slug, title" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/admin/blog/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/blog/
git commit -m "feat(blog): admin API routes GET/POST /api/admin/blog, PATCH/DELETE /[id]"
```

---

## Task 5: BlogTab admin component

**Files:**
- Create: `src/app/admin/_components/BlogTab.tsx`

- [ ] **Step 1: Create `src/app/admin/_components/BlogTab.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import type { BlogPost } from "../_lib/types";

type Props = { adminKey: string };
type View = "list" | "form";

const BLANK: Omit<BlogPost, "id" | "created_at" | "updated_at" | "views"> = {
  slug: "",
  title: "",
  excerpt: "",
  tag: "Blog",
  cover_image: "",
  content_md: "",
  published: false,
  author: "TD Games",
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function BlogTab({ adminKey }: Props) {
  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

  useEffect(() => { void loadPosts(); }, []); // eslint-disable-line

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const d = await res.json();
      setPosts(d.posts ?? []);
    } catch {
      setMsg("❌ Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditPost(null);
    setView("form");
  }

  function openEdit(post: BlogPost) {
    setEditPost(post);
    setView("form");
  }

  async function togglePublished(post: BlogPost) {
    try {
      await fetch(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ published: !post.published }),
      });
      void loadPosts();
    } catch {
      setMsg("❌ Toggle failed");
    }
  }

  async function deletePost(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      await fetch(`/api/admin/blog/${post.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      void loadPosts();
    } catch {
      setMsg("❌ Delete failed");
    }
  }

  if (view === "form") {
    return (
      <BlogForm
        adminKey={adminKey}
        editPost={editPost}
        onDone={() => { setView("list"); void loadPosts(); }}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blog Posts ({posts.length})</h2>
        <button
          onClick={openCreate}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          + New Post
        </button>
      </div>

      {msg && <p className="text-sm text-white/70">{msg}</p>}

      {loading ? (
        <p className="py-4 text-sm text-white/50">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          {posts.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-white/50">
              No posts yet. Click &quot;+ New Post&quot; to create one.
            </p>
          )}
          {posts.map((post, i) => (
            <div
              key={post.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < posts.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{post.title}</span>
                  <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#f59e0b]">
                    {post.tag}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      post.published
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-white/15 bg-white/5 text-white/40"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/40">
                  {new Date(post.created_at).toLocaleDateString()} · {post.views} views · {post.author}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => void togglePublished(post)}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => openEdit(post)}
                  className="rounded-md border border-indigo-500/30 bg-indigo-600/30 px-3 py-1.5 text-xs hover:bg-indigo-600/50"
                >
                  Edit
                </button>
                <button
                  onClick={() => void deletePost(post)}
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BlogForm ───────────────────────────────────────────────────────────────────

type FormProps = {
  adminKey: string;
  editPost: BlogPost | null;
  onDone: () => void;
  onCancel: () => void;
};

function BlogForm({ adminKey, editPost, onDone, onCancel }: FormProps) {
  const [form, setForm] = useState<Omit<BlogPost, "id" | "created_at" | "updated_at" | "views">>(
    editPost
      ? {
          slug: editPost.slug,
          title: editPost.title,
          excerpt: editPost.excerpt,
          tag: editPost.tag,
          cover_image: editPost.cover_image,
          content_md: editPost.content_md,
          published: editPost.published,
          author: editPost.author,
        }
      : { ...BLANK }
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");

  function setF(key: keyof typeof form, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const d = await res.json();
      setF("cover_image", d.url);
    } catch (e) {
      setMsg(`❌ Upload failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const payload = { ...form, slug: form.slug || toSlug(form.title) };
    try {
      let res: Response;
      if (editPost) {
        res = await fetch(`/api/admin/blog/${editPost.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "content-type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error((await res.json()).error);
      onDone();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Save failed"}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400";
  const labelCls = "text-[10px] font-bold uppercase tracking-wider text-white/50";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-sm text-white/50 hover:text-white">← Back</button>
        <h2 className="text-lg font-semibold">{editPost ? "Edit Post" : "New Post"}</h2>
      </div>

      {msg && <p className="text-sm text-white/70">{msg}</p>}

      <div className="grid grid-cols-2 gap-4">
        {/* Title */}
        <div className="col-span-2">
          <label className={labelCls}>Title *</label>
          <input
            value={form.title}
            onChange={(e) => {
              setF("title", e.target.value);
              if (!editPost) setF("slug", toSlug(e.target.value));
            }}
            className={inputCls}
            placeholder="How to create a game character"
          />
        </div>

        {/* Slug */}
        <div>
          <label className={labelCls}>Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => setF("slug", e.target.value)}
            className={`${inputCls} font-mono`}
            placeholder="how-to-create-a-game-character"
          />
        </div>

        {/* Tag */}
        <div>
          <label className={labelCls}>Tag</label>
          <input
            value={form.tag}
            onChange={(e) => setF("tag", e.target.value)}
            className={inputCls}
            placeholder="Blog / Pipeline / VFX / 2D Art"
          />
        </div>

        {/* Author */}
        <div>
          <label className={labelCls}>Author</label>
          <input
            value={form.author}
            onChange={(e) => setF("author", e.target.value)}
            className={inputCls}
            placeholder="TD Games"
          />
        </div>

        {/* Published */}
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setF("published", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-white/80">Published (visible on /blog)</span>
          </label>
        </div>

        {/* Excerpt */}
        <div className="col-span-2">
          <label className={labelCls}>Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setF("excerpt", e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Short summary shown in the blog listing card"
          />
        </div>

        {/* Cover Image */}
        <div className="col-span-2">
          <label className={labelCls}>Cover Image</label>
          <div className="mt-1 flex gap-2">
            <input
              value={form.cover_image}
              onChange={(e) => setF("cover_image", e.target.value)}
              className={`${inputCls} mt-0 flex-1 font-mono`}
              placeholder="https://cdn.tdgamestudio.com/..."
            />
            <label className="flex shrink-0 cursor-pointer items-center rounded-md border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5">
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
            </label>
          </div>
          {form.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.cover_image} alt="cover preview" className="mt-2 h-24 rounded-md object-cover" />
          )}
        </div>

        {/* Content Markdown */}
        <div className="col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className={labelCls}>Content (Markdown)</label>
            <div className="flex gap-1">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPreviewTab(t)}
                  className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                    previewTab === t
                      ? "bg-indigo-600 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {previewTab === "write" ? (
            <textarea
              value={form.content_md}
              onChange={(e) => setF("content_md", e.target.value)}
              rows={20}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none"
              placeholder={`# Heading\n\nParagraph text here.\n\n## Sub-heading\n\n- List item\n- Another item\n\n**Bold**, *italic*, [link](https://...)`}
            />
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none rounded-md border border-white/15 bg-white/[0.02] px-6 py-4 text-white/80 min-h-[400px]"
              // marked() is synchronous when used without async option
              dangerouslySetInnerHTML={{ __html: marked.parse(form.content_md || "*No content yet*") as string }}
            />
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => void save()}
          disabled={saving || !form.title}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
        >
          {saving ? "Saving…" : editPost ? "Save Changes" : "Create Post"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-white/15 px-5 py-2 text-sm text-white/70 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/_components/BlogTab.tsx
git commit -m "feat(blog): add BlogTab admin component with list + markdown editor"
```

---

## Task 6: Wire BlogTab into admin/page.tsx

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add import**

After the `CareersTab` import line, add:
```typescript
import { BlogTab } from "./_components/BlogTab";
```

- [ ] **Step 2: Add tab entry**

After the `"careers"` tab entry in `TABS`, add:
```typescript
{
  id: "blog",
  label: "8. Blog",
  description: "Quản lý bài viết blog — tạo, sửa, publish, xóa",
},
```

- [ ] **Step 3: Add render**

After `{tab === "careers" ? <CareersTab adminKey={adminKey} /> : null}`, add:
```typescript
{tab === "blog" ? <BlogTab adminKey={adminKey} /> : null}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/app/admin/_lib/types.ts
git commit -m "feat(blog): wire BlogTab into admin — tab '8. Blog'"
```

---

## Task 7: Update `/blog/page.tsx` — fetch from API

**Files:**
- Modify: `src/app/blog/page.tsx`

- [ ] **Step 1: Replace hardcoded ALL_POSTS with API fetch**

Replace the entire file content with:

```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AccentHighlight } from "@/components/accent-highlight";

const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

type Post = {
  id: string;
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image: string;
  views: number;
  author: string;
  created_at: string;
};

const PER_PAGE = 10;

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/blog", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.tag)));
    return ["All", ...unique.sort()];
  }, [posts]);

  const filtered = useMemo(
    () => (activeTag === "All" ? posts : posts.filter((p) => p.tag === activeTag)),
    [posts, activeTag],
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function changeTag(tag: string) {
    setActiveTag(tag);
    setPage(1);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB").replace(/\//g, ".");
  }

  return (
    <>
      <SiteHeader />
      <main className={`min-h-screen bg-[#0a0a0a] text-white ${nunitoSans.className}`}>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pb-12 pt-28 md:pt-36 lg:pt-40">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden" aria-hidden>
            <span
              className="block font-black uppercase leading-none tracking-tighter text-white/[0.04]"
              style={{ fontFamily: "var(--font-rajdhani)", fontSize: "clamp(100px, 20vw, 280px)" }}
            >
              ARTICLES
            </span>
          </div>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.15) 0%, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto px-4" style={{ width: "min(var(--layout-width,85%),1280px)" }}>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.4)]">
                // Journal
              </span>
              <div className="h-px w-16 shrink-0 bg-gradient-to-r from-[#ff8c3a]/60 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/70">
                {loading ? "…" : `${posts.length} Articles`}
              </span>
            </div>
            <h1
              className="text-4xl font-black uppercase leading-[1.05] tracking-tight md:text-5xl lg:text-[64px]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              TD Games <AccentHighlight>Blog</AccentHighlight>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60 md:text-[15px]">
              Insights on 2D art, animation, VFX, and game production — from the team at TD Games.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b]/20 to-transparent blur-sm" />
        </section>

        {/* ── Filter + Grid ── */}
        <section className="py-12 md:py-16">
          <div className="mx-auto px-4" style={{ width: "min(var(--layout-width,85%),1280px)" }}>
            <div className="mb-8">
              <p className="mb-3 text-sm text-white/55">Choose the articles you are interested in</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => changeTag(tag)}
                    className={`rounded-full border px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTag === tag
                        ? "border-[#f59e0b] bg-[#f59e0b] text-black"
                        : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-[180px] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <p className="py-16 text-center text-sm text-white/50">No articles found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {paginated.map((post) => (
                  <article
                    key={post.slug}
                    className="group flex min-h-[160px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:border-[#f59e0b]/30 hover:bg-white/[0.05] sm:min-h-[180px]"
                  >
                    <Link href={`/blog/${post.slug}`} className="relative w-[160px] shrink-0 overflow-hidden sm:w-[190px] md:w-[210px]">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 160px, 210px"
                        />
                      ) : (
                        <div className="h-full w-full bg-white/5" />
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]/80">{post.tag}</span>
                        <h2
                          className="mt-1.5 text-base font-bold leading-snug text-white transition-colors group-hover:text-[#f59e0b] md:text-lg"
                          style={{ fontFamily: "var(--font-rajdhani)" }}
                        >
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">{post.excerpt}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
                        <span>{formatDate(post.created_at)}</span>
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                      page === n ? "border-[#f59e0b] bg-[#f59e0b] text-black" : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/blog/page.tsx
git commit -m "feat(blog): /blog page now fetches from /api/blog (replaces hardcode)"
```

---

## Task 8: Update `/blog/[slug]/page.tsx` — render markdown

**Files:**
- Modify: `src/app/blog/[slug]/page.tsx`

- [ ] **Step 1: Replace file content**

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Nunito_Sans } from "next/font/google";
import { marked } from "marked";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;

  // Increment views (fire-and-forget)
  void supabase
    .from("blog_posts")
    .update({ views: data.views + 1 })
    .eq("id", data.id);

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: `${post.title} — TD Games Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const contentHtml = marked.parse(post.content_md || "") as string;

  return (
    <>
      <SiteHeader />
      <main className={`min-h-screen bg-[#090a10] text-white ${nunitoSans.className}`}>

        {/* Cover image hero */}
        {post.cover_image && (
          <div className="relative h-[40vh] w-full overflow-hidden pt-16">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-[#090a10]/40 to-transparent" />
          </div>
        )}

        <article
          className="mx-auto px-4 pb-24 pt-12"
          style={{ width: "min(var(--layout-width, 85%), 720px)" }}
        >
          {/* Tag + meta */}
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff9f1a]">{post.tag}</p>

          <h1
            className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/40">
            <span>{new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>by {post.author}</span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views.toLocaleString()} views
            </span>
          </div>

          <div className="mt-2 h-px w-full bg-gradient-to-r from-[#f59e0b]/30 to-transparent" />

          {/* Markdown body */}
          <div
            className="prose-blog mt-8"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <Link
            href="/blog"
            className="mt-12 inline-flex text-sm font-bold uppercase tracking-wider text-[#f59e0b] hover:underline"
          >
            ← Back to blog
          </Link>
        </article>

        <SiteFooter />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Add prose styles to `src/app/globals.css`**

Add at the end of `src/app/globals.css`:

```css
/* Blog markdown prose styles */
.prose-blog {
  color: rgba(255,255,255,0.75);
  line-height: 1.75;
  font-size: 1rem;
}
.prose-blog h1, .prose-blog h2, .prose-blog h3, .prose-blog h4 {
  color: #fff;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.2;
  font-family: var(--font-rajdhani);
  text-transform: uppercase;
  letter-spacing: -0.01em;
}
.prose-blog h1 { font-size: 2rem; }
.prose-blog h2 { font-size: 1.5rem; }
.prose-blog h3 { font-size: 1.25rem; }
.prose-blog p { margin: 1rem 0; }
.prose-blog ul, .prose-blog ol { margin: 1rem 0; padding-left: 1.5rem; }
.prose-blog li { margin: 0.4rem 0; }
.prose-blog ul li { list-style: disc; }
.prose-blog ol li { list-style: decimal; }
.prose-blog strong { color: #fff; font-weight: 700; }
.prose-blog em { font-style: italic; }
.prose-blog a { color: #f59e0b; text-decoration: underline; }
.prose-blog a:hover { color: #ffb366; }
.prose-blog blockquote {
  border-left: 3px solid #f59e0b;
  padding-left: 1rem;
  color: rgba(255,255,255,0.55);
  margin: 1.5rem 0;
  font-style: italic;
}
.prose-blog code {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 0.2em 0.4em;
  font-size: 0.85em;
  font-family: monospace;
}
.prose-blog pre {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
.prose-blog pre code { background: none; padding: 0; }
.prose-blog img {
  max-width: 100%;
  border-radius: 8px;
  margin: 1.5rem 0;
}
.prose-blog hr {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin: 2rem 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/blog/[slug]/page.tsx src/app/globals.css
git commit -m "feat(blog): /blog/[slug] renders markdown from DB with prose styles"
```

---

## Task 9: Build, deploy, update memory

- [ ] **Step 1: Run production build**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage
npm run build 2>&1 | tail -20
```
Expected: build succeeds, 0 TypeScript errors.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Deploy to VPS**

```bash
tailscale ssh root@vps6core "cd /opt/tdgames-landingpage && git pull && npm run build 2>&1 | tail -10 && pm2 restart tdgames-landingpage"
```

- [ ] **Step 4: Verify production**

```bash
curl -s https://www.tdgamestudio.com/api/blog | head -c 200
```
Expected: `{"posts":[],"total":0}` (empty until first post created via admin).

- [ ] **Step 5: Update TASKS.md and LOG.md**

In `.agent/meta/TASKS.md`, add to Done:
```
- [x] Blog feature — blog_posts DB table, /api/blog, /api/admin/blog CRUD, BlogTab admin, /blog fetches from API, /blog/[slug] renders markdown
```

In `.agent/meta/LOG.md`, prepend new session entry.

---

## Self-Review

- [x] **DB schema** → Task 1 covers all columns from spec
- [x] **Public API** → Task 3: GET /api/blog, GET /api/blog/[slug] with views increment
- [x] **Admin API** → Task 4: GET+POST /api/admin/blog, PATCH+DELETE /api/admin/blog/[id]
- [x] **BlogTab** → Task 5: list view + form view with markdown editor + live preview + R2 upload
- [x] **admin/page.tsx wired** → Task 6
- [x] **BlogPost type + AdminTab union** → Task 2
- [x] **/blog listing fetches from API** → Task 7
- [x] **/blog/[slug] renders markdown** → Task 8 with prose-blog CSS
- [x] **No placeholders** → all steps have actual code
- [x] **Type consistency** → `BlogPost` defined in Task 2, used consistently in Tasks 5, 7, 8
