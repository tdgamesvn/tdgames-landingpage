# Spine Admin Upload Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin có tab "Spine" để upload file .json/.atlas/.png lên R2 CDN, quản lý thư viện Spine characters, và site tự đọc character từ DB thay vì hardcode URL.

**Architecture:** Supabase table `spine_characters` lưu metadata (slug, URLs, animation name). Admin tab gọi `/api/admin/spine/upload` để upload từng file lên R2 vào path `landing/spine/{slug}/`, rồi CRUD qua `/api/admin/spine`. Public endpoint `/api/spine` trả về active characters để `home-page-lower.tsx` fetch và render `SpineCharacter`.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL), Cloudflare R2 (`uploadToR2` từ `src/lib/r2.ts`), `@esotericsoftware/spine-player@~4.2`.

---

## File Map

| File | Action | Mục đích |
|------|--------|---------|
| Supabase migration | Create | Tạo bảng `spine_characters` |
| `src/app/api/admin/spine/upload/route.ts` | Create | Upload 1 file (.json/.skel/.atlas/.png) lên R2 |
| `src/app/api/admin/spine/route.ts` | Create | GET list + POST tạo character |
| `src/app/api/admin/spine/[id]/route.ts` | Create | PATCH cập nhật + DELETE xóa |
| `src/app/api/spine/route.ts` | Create | PUBLIC GET active characters |
| `src/app/admin/_lib/types.ts` | Modify | Thêm `SpineCharacter` type và `"spine"` vào `AdminTab` |
| `src/app/admin/_lib/api.ts` | Modify | Thêm helper functions cho Spine API |
| `src/app/admin/_components/SpineTab.tsx` | Create | UI tab quản lý Spine characters |
| `src/app/admin/page.tsx` | Modify | Thêm tab "10. Spine" |
| `src/components/home-page-lower.tsx` | Modify | Fetch từ `/api/spine` thay vì URL hardcode |

---

## Task 1: DB migration — tạo bảng `spine_characters`

**Files:**
- Supabase migration (dùng MCP tool `mcp__supabase__apply_migration`)

- [ ] **Step 1.1: Apply migration**

Dùng tool `mcp__supabase__apply_migration` với:
- name: `create_spine_characters`
- query:
```sql
CREATE TABLE IF NOT EXISTS spine_characters (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  json_url    text,
  atlas_url   text,
  animation   text        NOT NULL DEFAULT 'idle',
  skin        text,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spine_characters_active_idx ON spine_characters(active);
CREATE INDEX IF NOT EXISTS spine_characters_slug_idx ON spine_characters(slug);

ALTER TABLE spine_characters ENABLE ROW LEVEL SECURITY;

-- Service role bypass (admin API dùng service role key)
CREATE POLICY "service_role_all" ON spine_characters
  FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 1.2: Verify**

Chạy SQL để confirm:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'spine_characters' ORDER BY ordinal_position;
```
Expected: 10 rows (id, name, slug, json_url, atlas_url, animation, skin, active, created_at, updated_at)

- [ ] **Step 1.3: Commit**
```bash
git add -A
git commit -m "feat: add spine_characters DB migration"
```

---

## Task 2: Upload API — `/api/admin/spine/upload`

**Files:**
- Create: `src/app/api/admin/spine/upload/route.ts`

- [ ] **Step 2.1: Tạo file**

```typescript
// src/app/api/admin/spine/upload/route.ts
import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB (atlas + texture có thể lớn)

const ALLOWED_EXTENSIONS: Record<string, string> = {
  ".json": "application/json",
  ".skel": "application/octet-stream",
  ".atlas": "text/plain",
  ".png":  "image/png",
  ".webp": "image/webp",
};

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function sanitize(s: string) {
  return s.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

function getExtension(filename: string): string {
  const m = filename.match(/(\.[^.]+)$/);
  return m ? m[1].toLowerCase() : "";
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const slug = formData.get("slug");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const ext = getExtension(file.name);
  const contentType = ALLOWED_EXTENSIONS[ext];
  if (!contentType) {
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Allowed: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const safeSlug = sanitize(slug.trim());
  const safeFilename = sanitize(file.name);
  const key = `landing/spine/${safeSlug}/${safeFilename}`;

  const bytes = await file.arrayBuffer();
  const body = Buffer.from(bytes);

  const uploaded = await uploadToR2({ key, body, contentType });

  return NextResponse.json({ key: uploaded.key, url: uploaded.url, size: file.size });
}
```

- [ ] **Step 2.2: Build check**
```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -20
```
Expected: không có error liên quan đến file mới.

- [ ] **Step 2.3: Commit**
```bash
git add src/app/api/admin/spine/upload/route.ts
git commit -m "feat: spine upload API — accepts .json/.skel/.atlas/.png → R2"
```

---

## Task 3: CRUD API — `/api/admin/spine` và `/api/admin/spine/[id]`

**Files:**
- Create: `src/app/api/admin/spine/route.ts`
- Create: `src/app/api/admin/spine/[id]/route.ts`

- [ ] **Step 3.1: Tạo `route.ts` (GET list + POST create)**

```typescript
// src/app/api/admin/spine/route.ts
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
    .from("spine_characters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ characters: data ?? [] });
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, slug } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("spine_characters")
    .insert([{
      name:      body.name,
      slug:      body.slug,
      json_url:  body.json_url  ?? null,
      atlas_url: body.atlas_url ?? null,
      animation: body.animation ?? "idle",
      skin:      body.skin      ?? null,
      active:    body.active    ?? true,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ character: data }, { status: 201 });
}
```

- [ ] **Step 3.2: Tạo `[id]/route.ts` (PATCH update + DELETE)**

```typescript
// src/app/api/admin/spine/[id]/route.ts
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
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Chỉ cho phép update các field hợp lệ
  const allowed = ["name", "slug", "json_url", "atlas_url", "animation", "skin", "active"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("spine_characters")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ character: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("spine_characters")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3.3: Build check**
```bash
npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled" | head -20
```
Expected: không có TypeScript error.

- [ ] **Step 3.4: Commit**
```bash
git add src/app/api/admin/spine/
git commit -m "feat: spine CRUD admin API (GET/POST/PATCH/DELETE)"
```

---

## Task 4: Public API — `/api/spine`

**Files:**
- Create: `src/app/api/spine/route.ts`

- [ ] **Step 4.1: Tạo file**

```typescript
// src/app/api/spine/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("spine_characters")
    .select("id, name, slug, json_url, atlas_url, animation, skin")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ characters: data ?? [] });
}
```

- [ ] **Step 4.2: Commit**
```bash
git add src/app/api/spine/route.ts
git commit -m "feat: public /api/spine endpoint — returns active characters"
```

---

## Task 5: Types + API helpers

**Files:**
- Modify: `src/app/admin/_lib/types.ts`
- Modify: `src/app/admin/_lib/api.ts`

- [ ] **Step 5.1: Thêm `SpineCharacter` type và `"spine"` vào `AdminTab`**

Mở `src/app/admin/_lib/types.ts`, thêm vào cuối file:

```typescript
// Thêm "spine" vào AdminTab union (sửa dòng hiện có):
export type AdminTab = "projects" | "content" | "media" | "create" | "bulk" | "team" | "careers" | "blog" | "footer" | "spine";

// Thêm type mới:
export type SpineCharacter = {
  id: string;
  name: string;
  slug: string;
  json_url: string | null;
  atlas_url: string | null;
  animation: string;
  skin: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 5.2: Thêm helpers vào `api.ts`**

Mở `src/app/admin/_lib/api.ts`, append vào cuối:

```typescript
// ─────────────────────────────────────────────────────── Spine Characters API

export async function fetchSpineCharacters(adminKey: string): Promise<SpineCharacter[]> {
  const res = await fetch("/api/admin/spine", {
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  const data = await jsonOrThrow<{ characters: SpineCharacter[] }>(res);
  return data.characters ?? [];
}

export async function createSpineCharacter(args: {
  adminKey: string;
  payload: Omit<SpineCharacter, "id" | "created_at" | "updated_at">;
}): Promise<SpineCharacter> {
  const res = await fetch("/api/admin/spine", {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-key": args.adminKey },
    body: JSON.stringify(args.payload),
  });
  const data = await jsonOrThrow<{ character: SpineCharacter }>(res);
  return data.character;
}

export async function patchSpineCharacter(args: {
  adminKey: string;
  id: string;
  patch: Partial<Omit<SpineCharacter, "id" | "created_at" | "updated_at">>;
}): Promise<SpineCharacter> {
  const res = await fetch(`/api/admin/spine/${args.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", "x-admin-key": args.adminKey },
    body: JSON.stringify(args.patch),
  });
  const data = await jsonOrThrow<{ character: SpineCharacter }>(res);
  return data.character;
}

export async function deleteSpineCharacter(args: {
  adminKey: string;
  id: string;
}): Promise<void> {
  const res = await fetch(`/api/admin/spine/${args.id}`, {
    method: "DELETE",
    headers: { "x-admin-key": args.adminKey },
  });
  await jsonOrThrow<{ ok: boolean }>(res);
}

export async function uploadSpineFile(args: {
  adminKey: string;
  file: File;
  slug: string;
}): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append("file", args.file);
  form.append("slug", args.slug);
  const res = await fetch("/api/admin/spine/upload", {
    method: "POST",
    headers: { "x-admin-key": args.adminKey },
    body: form,
  });
  return jsonOrThrow<{ url: string; key: string }>(res);
}
```

Thêm import `SpineCharacter` vào đầu `api.ts`:
```typescript
import type { MediaAsset, MediaKind, Project, ProjectContent, SpineCharacter } from "./types";
```

- [ ] **Step 5.3: Build check**
```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

- [ ] **Step 5.4: Commit**
```bash
git add src/app/admin/_lib/types.ts src/app/admin/_lib/api.ts
git commit -m "feat: spine types + admin API helpers"
```

---

## Task 6: SpineTab UI component

**Files:**
- Create: `src/app/admin/_components/SpineTab.tsx`

- [ ] **Step 6.1: Tạo file**

```tsx
// src/app/admin/_components/SpineTab.tsx
"use client";

import { useEffect, useState } from "react";
import {
  fetchSpineCharacters,
  createSpineCharacter,
  patchSpineCharacter,
  deleteSpineCharacter,
  uploadSpineFile,
} from "../_lib/api";
import type { SpineCharacter } from "../_lib/types";

type Props = { adminKey: string };

type FormState = {
  name: string;
  slug: string;
  animation: string;
  skin: string;
  active: boolean;
  json_url: string;
  atlas_url: string;
};

const BLANK: FormState = {
  name: "",
  slug: "",
  animation: "idle",
  skin: "",
  active: true,
  json_url: "",
  atlas_url: "",
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function FileDropZone({
  label,
  accept,
  file,
  onPick,
  uploading,
}: {
  label: string;
  accept: string;
  file: File | null;
  onPick: (f: File) => void;
  uploading: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
      <div
        className={
          "mt-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center text-xs transition-colors " +
          (file
            ? "border-amber-500/60 bg-amber-500/5 text-amber-300"
            : "border-white/20 bg-white/[0.03] text-white/40 hover:border-white/40 hover:bg-white/[0.06]")
        }
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
          disabled={uploading}
        />
        {uploading ? (
          <span>Đang upload…</span>
        ) : file ? (
          <span>✓ {file.name} ({(file.size / 1024).toFixed(0)} KB) — bấm để đổi</span>
        ) : (
          <span>Bấm để chọn {label}</span>
        )}
      </div>
    </label>
  );
}

export function SpineTab({ adminKey }: Props) {
  const [characters, setCharacters] = useState<SpineCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Modal state
  const [editId, setEditId] = useState<string | null>(null); // null = closed, "__new__" = new
  const [form, setForm] = useState<FormState>(BLANK);

  // File upload state
  const [jsonFile, setJsonFile]   = useState<File | null>(null);
  const [atlasFile, setAtlasFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);

  // ── load ────────────────────────────────────────────────────────────────────
  useEffect(() => { void load(); }, []); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSpineCharacters(adminKey);
      setCharacters(data);
    } catch (e) {
      setMsg(`❌ Không tải được danh sách: ${e instanceof Error ? e.message : "lỗi"}`);
    } finally {
      setLoading(false);
    }
  }

  // ── open / close modal ──────────────────────────────────────────────────────
  function openNew() {
    setEditId("__new__");
    setForm(BLANK);
    setJsonFile(null);
    setAtlasFile(null);
    setMsg("");
  }

  function openEdit(c: SpineCharacter) {
    setEditId(c.id);
    setForm({
      name:      c.name,
      slug:      c.slug,
      animation: c.animation,
      skin:      c.skin ?? "",
      active:    c.active,
      json_url:  c.json_url  ?? "",
      atlas_url: c.atlas_url ?? "",
    });
    setJsonFile(null);
    setAtlasFile(null);
    setMsg("");
  }

  function closeModal() {
    setEditId(null);
    setForm(BLANK);
    setJsonFile(null);
    setAtlasFile(null);
    setMsg("");
  }

  // ── save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setMsg("⚠️ Cần nhập Name và Slug");
      return;
    }

    setUploading(true);
    setMsg("");
    let jsonUrl  = form.json_url;
    let atlasUrl = form.atlas_url;

    try {
      if (jsonFile) {
        const r = await uploadSpineFile({ adminKey, file: jsonFile, slug: form.slug });
        jsonUrl = r.url;
      }
      if (atlasFile) {
        const r = await uploadSpineFile({ adminKey, file: atlasFile, slug: form.slug });
        atlasUrl = r.url;
      }
    } catch (e) {
      setMsg(`❌ Upload thất bại: ${e instanceof Error ? e.message : "lỗi"}`);
      setUploading(false);
      return;
    }
    setUploading(false);
    setSaving(true);

    try {
      const payload = {
        name:      form.name.trim(),
        slug:      form.slug.trim(),
        animation: form.animation.trim() || "idle",
        skin:      form.skin.trim() || null,
        active:    form.active,
        json_url:  jsonUrl  || null,
        atlas_url: atlasUrl || null,
      };

      if (editId === "__new__") {
        const created = await createSpineCharacter({ adminKey, payload });
        setCharacters((prev) => [created, ...prev]);
      } else if (editId) {
        const updated = await patchSpineCharacter({ adminKey, id: editId, patch: payload });
        setCharacters((prev) => prev.map((c) => (c.id === editId ? updated : c)));
      }
      setMsg("✅ Đã lưu!");
      closeModal();
    } catch (e) {
      setMsg(`❌ Lưu thất bại: ${e instanceof Error ? e.message : "lỗi"}`);
    } finally {
      setSaving(false);
    }
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Xóa character này? Hành động không thể hoàn tác.")) return;
    try {
      await deleteSpineCharacter({ adminKey, id });
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setMsg(`❌ Xóa thất bại: ${e instanceof Error ? e.message : "lỗi"}`);
    }
  }

  // ── toggle active ───────────────────────────────────────────────────────────
  async function toggleActive(c: SpineCharacter) {
    try {
      const updated = await patchSpineCharacter({ adminKey, id: c.id, patch: { active: !c.active } });
      setCharacters((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "lỗi"}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Spine Characters</h2>
          <p className="mt-0.5 text-xs text-white/50">
            Upload file .json/.skel + .atlas + texture PNG → R2 CDN.{" "}
            Site đọc character theo <code className="font-mono">slug</code>.
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-amber-400"
        >
          + Thêm character
        </button>
      </div>

      {msg && !editId && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
          {msg}
        </div>
      )}

      {/* Character list */}
      {loading ? (
        <p className="text-sm text-white/40">Đang tải…</p>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center text-sm text-white/40">
          Chưa có Spine character nào. Bấm "+ Thêm character" để bắt đầu.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <div
              key={c.id}
              className="relative rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
            >
              {/* active badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{c.name}</p>
                  <p className="truncate text-xs text-amber-400 font-mono">{c.slug}</p>
                </div>
                <button
                  onClick={() => toggleActive(c)}
                  className={
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition " +
                    (c.active
                      ? "bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300"
                      : "bg-white/10 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-300")
                  }
                  title={c.active ? "Bấm để tắt" : "Bấm để bật"}
                >
                  {c.active ? "Active" : "Inactive"}
                </button>
              </div>

              {/* URLs */}
              <div className="space-y-1 text-[11px]">
                <div className="flex gap-1.5">
                  <span className={c.json_url ? "text-emerald-400" : "text-white/20"}>
                    {c.json_url ? "✓" : "✗"}
                  </span>
                  <span className="text-white/50 truncate">.json/.skel</span>
                </div>
                <div className="flex gap-1.5">
                  <span className={c.atlas_url ? "text-emerald-400" : "text-white/20"}>
                    {c.atlas_url ? "✓" : "✗"}
                  </span>
                  <span className="text-white/50 truncate">.atlas</span>
                </div>
              </div>

              <div className="text-[11px] text-white/40">
                Animation: <span className="text-white/70 font-mono">{c.animation}</span>
                {c.skin ? <> · Skin: <span className="text-white/70 font-mono">{c.skin}</span></> : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                <button
                  onClick={() => openEdit(c)}
                  className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  Sửa / Re-upload
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-400/10"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editId === "__new__" ? "Thêm Spine character mới" : `Sửa: ${form.name}`}
            </h3>

            {/* Name */}
            <label className="block space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">Tên hiển thị</span>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editId === "__new__" ? toSlug(name) : f.slug,
                  }));
                }}
                placeholder="Careers Hero"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500 focus:outline-none"
              />
            </label>

            {/* Slug */}
            <label className="block space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Slug{" "}
                <span className="text-white/30 normal-case tracking-normal">
                  (dùng trong code: <code className="font-mono">slug === "careers-hero"</code>)
                </span>
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                placeholder="careers-hero"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm text-amber-300 placeholder-white/30 focus:border-amber-500 focus:outline-none"
              />
            </label>

            {/* Upload .json / .skel */}
            <FileDropZone
              label=".json hoặc .skel (skeleton data)"
              accept=".json,.skel"
              file={jsonFile}
              onPick={setJsonFile}
              uploading={uploading}
            />
            {!jsonFile && form.json_url && (
              <p className="text-[11px] text-emerald-400 -mt-2">
                ✓ Đã có: <span className="font-mono text-white/60 break-all">{form.json_url}</span>
              </p>
            )}

            {/* Upload .atlas */}
            <FileDropZone
              label=".atlas (texture atlas)"
              accept=".atlas"
              file={atlasFile}
              onPick={setAtlasFile}
              uploading={uploading}
            />
            {!atlasFile && form.atlas_url && (
              <p className="text-[11px] text-emerald-400 -mt-2">
                ✓ Đã có: <span className="font-mono text-white/60 break-all">{form.atlas_url}</span>
              </p>
            )}

            <p className="rounded-lg bg-blue-500/10 px-3 py-2 text-[11px] text-blue-300">
              💡 Texture PNG (.png) sẽ được đọc tự động bởi Spine runtime từ cùng thư mục với .atlas.<br />
              Upload PNG lên cùng slug-folder qua tab <strong>3. Media Library</strong> sau khi lưu character này.
            </p>

            {/* Animation name */}
            <label className="block space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Tên animation mặc định
              </span>
              <input
                value={form.animation}
                onChange={(e) => setForm((f) => ({ ...f, animation: e.target.value }))}
                placeholder="idle"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/30 focus:border-amber-500 focus:outline-none"
              />
            </label>

            {/* Skin */}
            <label className="block space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Skin <span className="text-white/30 normal-case tracking-normal">(để trống nếu không có)</span>
              </span>
              <input
                value={form.skin}
                onChange={(e) => setForm((f) => ({ ...f, skin: e.target.value }))}
                placeholder="default"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/30 focus:border-amber-500 focus:outline-none"
              />
            </label>

            {/* Active toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={
                  "relative h-5 w-9 rounded-full transition-colors " +
                  (form.active ? "bg-emerald-500" : "bg-white/20")
                }
              >
                <span
                  className={
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform " +
                    (form.active ? "translate-x-4" : "translate-x-0.5")
                  }
                />
              </div>
              <span className="text-xs text-white/60">Active (hiển thị trên site)</span>
            </label>

            {msg && <p className="text-xs text-amber-400">{msg}</p>}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
              >
                {uploading ? "Đang upload…" : saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6.2: Build check**
```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

- [ ] **Step 6.3: Commit**
```bash
git add src/app/admin/_components/SpineTab.tsx
git commit -m "feat: SpineTab admin UI — list, create, edit, delete Spine characters"
```

---

## Task 7: Wiring vào Admin page

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 7.1: Import SpineTab**

Thêm dòng import vào đầu `page.tsx` (cùng với các import tab khác):
```typescript
import { SpineTab } from "./_components/SpineTab";
```

- [ ] **Step 7.2: Thêm tab vào TABS array**

Thêm vào cuối mảng `TABS` (sau `footer`):
```typescript
{
  id: "spine",
  label: "10. Spine",
  description: "Upload và quản lý Spine 4.2 characters — .json/.atlas/.png → R2 CDN",
},
```

- [ ] **Step 7.3: Render SpineTab trong `<main>`**

Thêm vào cuối block render (sau `{tab === "footer" ? ...}`):
```tsx
{tab === "spine" ? <SpineTab adminKey={adminKey} /> : null}
```

- [ ] **Step 7.4: Build check**
```bash
npm run build 2>&1 | grep -E "error TS|Type error|Error" | head -20
```
Expected: build thành công.

- [ ] **Step 7.5: Commit**
```bash
git add src/app/admin/page.tsx
git commit -m "feat: add Spine tab (tab 10) to admin page"
```

---

## Task 8: Site tự đọc Spine character từ DB

**Files:**
- Modify: `src/components/home-page-lower.tsx`

- [ ] **Step 8.1: Thêm state + fetch vào `HomePageLower`**

Trong component `HomePageLower`, thêm vào sau `const [activeMarqueeFilter, ...]`:

```typescript
// Spine character cho Careers section
const [careersChar, setCareersChar] = useState<{
  json_url: string | null;
  atlas_url: string | null;
  animation: string;
  skin: string | null;
} | null>(null);

useEffect(() => {
  fetch("/api/spine", { cache: "no-store" })
    .then((r) => r.json())
    .then((data: { characters?: Array<{
      slug: string;
      json_url: string | null;
      atlas_url: string | null;
      animation: string;
      skin: string | null;
    }> }) => {
      const found = (data.characters ?? []).find((c) => c.slug === "careers-hero");
      if (found) setCareersChar(found);
    })
    .catch(() => { /* giữ null — SpineCharacter sẽ không render */ });
}, []);
```

- [ ] **Step 8.2: Thay `SpineCharacter` placeholder bằng dynamic render**

Tìm đoạn có `// TODO: thay URL dưới bằng đường dẫn CDN thật`, thay bằng:

```tsx
{careersChar?.json_url && careersChar?.atlas_url ? (
  <SpineCharacter
    jsonUrl={careersChar.json_url}
    atlasUrl={careersChar.atlas_url}
    animation={careersChar.animation}
    skin={careersChar.skin ?? undefined}
    className="h-full w-full"
  />
) : (
  // Fallback khi chưa có Spine character trong DB
  <div className="flex h-full w-full items-center justify-center text-white/20 text-sm">
    No character configured
  </div>
)}
```

- [ ] **Step 8.3: Build check**
```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

- [ ] **Step 8.4: Commit**
```bash
git add src/components/home-page-lower.tsx
git commit -m "feat: careers section reads Spine character from /api/spine by slug"
```

---

## Task 9: Upload texture PNG

Texture PNG không upload qua SpineTab (vì Spine runtime đọc PNG theo đúng tên trong file .atlas). Cần đảm bảo PNG được upload vào **đúng path** trên R2.

- [ ] **Step 9.1: Cập nhật upload API để nhận PNG cho spine**

Mở `src/app/api/admin/spine/upload/route.ts`. 

File này đã nhận `.png` — **không cần thay đổi**. Chỉ cần đảm bảo admin upload PNG đúng slug để path là `landing/spine/{slug}/{texture.png}`.

Hướng dẫn cho admin:
- Vào SpineTab → sau khi tạo character → bấm "Sửa / Re-upload"
- Trong `FileDropZone` texture sẽ được thêm sau (hoặc dùng Media Library tab 3)

- [ ] **Step 9.2: Thêm TextureUpload zone vào SpineTab modal**

Trong `SpineTab.tsx`, thêm state texture files:
```typescript
const [textureFiles, setTextureFiles] = useState<File[]>([]);
```

Thêm sau FileDropZone của .atlas:
```tsx
{/* Upload texture PNG(s) */}
<div className="space-y-1">
  <span className="text-xs text-white/50 uppercase tracking-wider">
    Texture PNG(s){" "}
    <span className="text-white/30 normal-case tracking-normal">
      (tên phải khớp với tên trong .atlas)
    </span>
  </span>
  <label className={
    "flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-3 py-3 text-center text-xs transition-colors " +
    (textureFiles.length
      ? "border-amber-500/60 bg-amber-500/5 text-amber-300"
      : "border-white/20 bg-white/[0.03] text-white/40 hover:border-white/40")
  }>
    <input
      type="file"
      accept=".png,.webp"
      multiple
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length) setTextureFiles(files);
      }}
      disabled={uploading}
    />
    {textureFiles.length
      ? `✓ ${textureFiles.map(f => f.name).join(", ")}`
      : "Bấm để chọn texture PNG (có thể chọn nhiều)"}
  </label>
</div>
```

Trong `handleSave`, sau khi upload atlasFile, thêm upload texture:
```typescript
for (const tex of textureFiles) {
  await uploadSpineFile({ adminKey, file: tex, slug: form.slug });
}
```

Reset trong `closeModal`:
```typescript
setTextureFiles([]);
```

- [ ] **Step 9.3: Build check + final commit**
```bash
npm run build 2>&1 | grep -E "error TS|Type error|Error" | head -20
git add -A
git commit -m "feat: texture PNG upload in SpineTab modal"
```

---

## Manual Testing Checklist

Sau khi implement xong, test theo thứ tự:

- [ ] Mở `/admin` → đăng nhập → thấy tab "10. Spine"
- [ ] Bấm "+ Thêm character" → modal hiện ra
- [ ] Nhập Name "Careers Hero" → Slug tự điền "careers-hero"
- [ ] Upload file .json → thấy tên file ✓
- [ ] Upload file .atlas → thấy tên file ✓
- [ ] Upload texture .png → thấy tên file ✓
- [ ] Nhập animation "idle" → bấm Lưu
- [ ] Thấy character mới trong danh sách với ✓ .json và ✓ .atlas
- [ ] Mở tab mới → `/` → cuộn xuống Careers section → character render (không có nền trắng)
- [ ] Physics animation chạy đúng
- [ ] Bấm "Inactive" badge → character tắt active → reload trang → Careers section hiện fallback
- [ ] Bấm lại → active → character hiện lại
