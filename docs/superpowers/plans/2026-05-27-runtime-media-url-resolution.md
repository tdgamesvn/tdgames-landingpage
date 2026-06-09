# Runtime Media URL Resolution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế hardcoded URLs trong source files bằng DB lookup theo `label`, để thay media trong Admin → có hiệu lực ngay mà không cần bulk replace hay rebuild.

**Architecture:** Thêm cột `label` (unique, nullable) vào `media_assets`. Một helper `resolveMediaUrl(label, fallback)` query DB server-side. Các page component gọi helper này thay vì đọc URL từ `site.json`. Admin UI cho phép gán label cho bất kỳ asset nào.

**Tech Stack:** Supabase (Postgres), Next.js 15 App Router (Server Components, `dynamic = 'force-dynamic'`), TypeScript.

---

## File Map

| File | Hành động | Mục đích |
|------|-----------|----------|
| `supabase/migrations/YYYYMMDD_add_media_label.sql` | Tạo mới | Migration: thêm cột `label` |
| `src/lib/resolve-media.ts` | Tạo mới | Helper: `resolveMediaUrl(label, fallback?)` |
| `src/app/about/page.tsx` | Sửa | Dùng `resolveMediaUrl('about-hero')` thay URL từ site.json |
| `src/app/api/admin/media/route.ts` | Sửa | PATCH cho phép update `label` field |
| `src/app/admin/_components/MediaTab.tsx` | Sửa | Hiển thị + edit label trên asset card |
| `src/app/admin/_lib/types.ts` | Sửa | Thêm `label?: string` vào `MediaAsset` type |
| `src/app/admin/_lib/api.ts` | Sửa | `patchMedia` truyền `label` field |

---

## Task 1: DB Migration — thêm cột `label`

**Files:**
- Tạo: `supabase/migrations/20260527000000_add_media_label.sql`

- [ ] **Bước 1: Tạo file migration**

```sql
-- supabase/migrations/20260527000000_add_media_label.sql
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS label text UNIQUE;

COMMENT ON COLUMN public.media_assets.label IS
  'Slug định danh ngắn gọn dùng để resolve URL tại runtime, ví dụ "about-hero", "home-hero-1"';
```

- [ ] **Bước 2: Apply migration qua Supabase MCP**

Chạy SQL trên qua `mcp__supabase__apply_migration` với name `add_media_label`.

- [ ] **Bước 3: Verify**

Chạy SQL: `SELECT column_name FROM information_schema.columns WHERE table_name='media_assets' AND column_name='label';`

Expected: 1 row trả về với `label`.

- [ ] **Bước 4: Commit**

```bash
git add supabase/migrations/20260527000000_add_media_label.sql
git commit -m "feat(db): add label column to media_assets for runtime URL resolution"
```

---

## Task 2: Helper `resolveMediaUrl`

**Files:**
- Tạo: `src/lib/resolve-media.ts`

- [ ] **Bước 1: Tạo file**

```typescript
// src/lib/resolve-media.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Resolve một media URL từ label trong DB.
 * Dùng trong Server Components thay vì hardcode URL.
 *
 * @param label  - slug định danh asset, ví dụ "about-hero"
 * @param fallback - URL fallback nếu không tìm thấy label trong DB
 */
export async function resolveMediaUrl(
  label: string,
  fallback = "",
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("media_assets")
      .select("current_url")
      .eq("label", label)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.current_url || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Resolve nhiều label cùng lúc (1 query).
 * Trả về map: label → current_url.
 */
export async function resolveMediaUrls(
  labels: string[],
  fallbacks: Record<string, string> = {},
): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("media_assets")
      .select("label, current_url")
      .in("label", labels);
    if (error || !data) return fallbacks;
    const result: Record<string, string> = { ...fallbacks };
    for (const row of data) {
      if (row.label) result[row.label] = row.current_url;
    }
    return result;
  } catch {
    return fallbacks;
  }
}
```

- [ ] **Bước 2: Kiểm tra TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors liên quan đến file này.

- [ ] **Bước 3: Commit**

```bash
git add src/lib/resolve-media.ts
git commit -m "feat(lib): add resolveMediaUrl helper for runtime DB URL resolution"
```

---

## Task 3: Update About page dùng `resolveMediaUrl`

**Files:**
- Sửa: `src/app/about/page.tsx`

**Context:** Page đã có `export const dynamic = "force-dynamic"` — không cần thêm. Chỉ cần thay URL hardcode bằng DB lookup.

- [ ] **Bước 1: Sửa hàm `getAbout`**

Trong `src/app/about/page.tsx`, thay toàn bộ hàm `getAbout`:

```typescript
import { resolveMediaUrl } from "@/lib/resolve-media";

async function getAbout(): Promise<AboutData> {
  const filePath = path.join(process.cwd(), "src", "content", "site.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const siteAbout = data.about ?? {
    heroImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80",
    workspace: [],
  };

  // Resolve heroImage từ DB nếu có label "about-hero", fallback về site.json
  const heroImage = await resolveMediaUrl("about-hero", siteAbout.heroImage);

  return { ...siteAbout, heroImage };
}
```

- [ ] **Bước 2: Build để verify không lỗi**

```bash
npm run build 2>&1 | tail -10
```

Expected: build thành công, route `/about` hiện là `ƒ (Dynamic)`.

- [ ] **Bước 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat(about): resolve heroImage from DB label 'about-hero' at runtime"
```

---

## Task 4: API — cho phép PATCH `label`

**Files:**
- Sửa: `src/app/api/admin/media/route.ts`

- [ ] **Bước 1: Thêm `label` vào PATCH handler**

Trong `src/app/api/admin/media/route.ts`, tìm block `PATCH` — thêm vào phần updates:

```typescript
// Thêm ngay sau dòng "if (typeof body.status === 'string') ..."
if (typeof body.label === "string") updates.label = body.label || null;
// body.label = "" → xóa label (set null); body.label = "about-hero" → đặt label
```

- [ ] **Bước 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Bước 3: Commit**

```bash
git add src/app/api/admin/media/route.ts
git commit -m "feat(api): allow PATCH label field on media_assets"
```

---

## Task 5: Admin types + api.ts — truyền `label`

**Files:**
- Sửa: `src/app/admin/_lib/types.ts`
- Sửa: `src/app/admin/_lib/api.ts`

- [ ] **Bước 1: Thêm `label` vào `MediaAsset` type**

Trong `src/app/admin/_lib/types.ts`, tìm `MediaAsset` interface/type, thêm:

```typescript
label?: string | null;
```

- [ ] **Bước 2: Thêm `label` vào `patchMedia` (hoặc tạo nếu chưa có)**

Trong `src/app/admin/_lib/api.ts`, tìm hàm PATCH media (hoặc tạo mới):

```typescript
export async function patchMediaAsset(args: {
  adminKey: string;
  id: string;
  updates: { label?: string | null; current_url?: string; status?: string };
}): Promise<MediaAsset> {
  const res = await fetch(`/api/admin/media`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-admin-key": args.adminKey,
    },
    body: JSON.stringify({ id: args.id, ...args.updates }),
  });
  const data = await jsonOrThrow<{ item: MediaAsset }>(res);
  return data.item;
}
```

- [ ] **Bước 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Bước 4: Commit**

```bash
git add src/app/admin/_lib/types.ts src/app/admin/_lib/api.ts
git commit -m "feat(admin): add label field to MediaAsset type and patchMediaAsset helper"
```

---

## Task 6: Admin UI — hiển thị + set label trên asset card

**Files:**
- Sửa: `src/app/admin/_components/MediaTab.tsx`

**UX:** Mỗi asset card hiện label hiện tại (nếu có). Bấm vào label → input inline → Enter để save. Label màu amber nếu đã set, màu trắng/mờ nếu chưa.

- [ ] **Bước 1: Thêm state + hàm save label**

Trong `MediaTab`, thêm state và handler:

```typescript
const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
const [labelDraft, setLabelDraft] = useState("");

async function handleSaveLabel(assetId: string) {
  const trimmed = labelDraft.trim();
  try {
    const updated = await patchMediaAsset({
      adminKey,
      id: assetId,
      updates: { label: trimmed || null },
    });
    setMedia((prev) => prev.map((m) => (m.id === assetId ? { ...m, label: updated.label } : m)));
  } catch (e) {
    console.error("Label save failed", e);
  } finally {
    setEditingLabelId(null);
  }
}
```

- [ ] **Bước 2: Thêm label UI vào từng asset card**

Trong phần render của asset card (tìm chỗ render URL/status), thêm sau phần URL:

```tsx
{/* Label */}
<div className="mt-1">
  {editingLabelId === item.id ? (
    <input
      autoFocus
      value={labelDraft}
      onChange={(e) => setLabelDraft(e.target.value)}
      onBlur={() => handleSaveLabel(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSaveLabel(item.id);
        if (e.key === "Escape") setEditingLabelId(null);
      }}
      placeholder="label (vd: about-hero)"
      className="w-full rounded border border-amber-400/40 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-amber-300 outline-none"
    />
  ) : (
    <button
      onClick={() => {
        setEditingLabelId(item.id);
        setLabelDraft(item.label ?? "");
      }}
      className={`text-[10px] ${item.label ? "text-amber-400" : "text-white/30 hover:text-white/60"}`}
      title="Click để đặt label"
    >
      {item.label ? `🏷 ${item.label}` : "+ label"}
    </button>
  )}
</div>
```

- [ ] **Bước 3: Import `patchMediaAsset`**

Thêm vào import từ `../_lib/api`:

```typescript
import { fetchMedia, uploadFile, patchMediaAsset } from "../_lib/api";
```

- [ ] **Bước 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build sạch.

- [ ] **Bước 5: Commit**

```bash
git add src/app/admin/_components/MediaTab.tsx
git commit -m "feat(admin): inline label editor on media asset cards"
git push origin main
```

---

## Task 7: Gán label "about-hero" cho asset và verify

**Đây là bước thực hiện thủ công (không code).**

- [ ] **Bước 1:** Vào Admin → Media Library → tìm asset là video About hero (tìm bằng keyword "final_loop" hoặc URL của video)
- [ ] **Bước 2:** Bấm "+ label" → gõ `about-hero` → Enter
- [ ] **Bước 3:** Vào https://www.tdgamestudio.com/about → xác nhận hero là video

**Không cần bulk replace, không cần rebuild.**

---

## Self-Review

**Spec coverage:**
- ✅ DB: thêm `label` column unique nullable
- ✅ Helper: `resolveMediaUrl` + `resolveMediaUrls` với fallback
- ✅ About page: dùng DB label thay hardcode
- ✅ API: PATCH `label`
- ✅ Admin UI: inline label editor per asset card
- ✅ Verify end-to-end

**Placeholders:** Không có — tất cả code đều đầy đủ.

**Type consistency:** `MediaAsset.label?: string | null` nhất quán xuyên suốt tasks 5→6.

**Lưu ý quan trọng:**
- `about/page.tsx` đã có `dynamic = "force-dynamic"` → không cần thêm
- `resolveMediaUrl` có try/catch → nếu DB fail, site vẫn hoạt động bình thường với fallback từ `site.json`
- Sau Task 6, các trang khác (home hero, v.v.) cũng có thể dùng pattern tương tự bằng cách thêm label phù hợp
