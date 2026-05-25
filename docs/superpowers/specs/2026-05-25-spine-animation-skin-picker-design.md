# Spine Animation & Skin Picker — Design Spec

_Ngày: 2026-05-25_

## Goal

Thay thế text input thủ công cho Animation/Skin trong Admin Spine tab bằng:
1. **Skin picker**: dropdown chọn 1 skin từ danh sách thực trong file Spine
2. **Animation picker**: multi-select chọn nhiều animations, xếp thứ tự, chạy nối tiếp và loop
3. **Nguồn dữ liệu**: parse client-side từ file `.json` khi user chọn file → không cần round-trip server

---

## Scope

**In scope:**
- Parse Spine JSON client-side khi user chọn file `.json`
- Skin dropdown (single select)
- Animations multi-select + reorder (up/down buttons)
- DB migration: `animation TEXT` → `animations JSONB`
- SpineCharacter component hỗ trợ `animations: string[]` chạy sequence loop
- Fallback: nếu chưa có file JSON (edit character cũ), giữ text input thủ công

**Out of scope:**
- Parse `.skel` binary (không khả thi client-side)
- Preview animation trong admin modal
- Drag-and-drop reorder (dùng up/down buttons thay thế — đủ dùng)

---

## Architecture

### 1. DB Migration

```sql
-- Thêm cột mới animations JSONB
ALTER TABLE spine_characters
  ADD COLUMN animations jsonb NOT NULL DEFAULT '["idle"]';

-- Migrate data từ animation cũ
UPDATE spine_characters
  SET animations = jsonb_build_array(animation);

-- Xoá cột cũ
ALTER TABLE spine_characters DROP COLUMN animation;
```

**Kết quả:** Column `animation TEXT` → `animations JSONB` (array of strings).  
Row hiện tại: `animation = "breathe"` → `animations = ["breathe"]`.

### 2. Type thay đổi

**`src/app/admin/_lib/types.ts`** — SpineCharacter type:
```typescript
// Trước:
animation: string;
// Sau:
animations: string[];
```

### 3. API Routes

**`src/app/api/spine/route.ts`** — public GET:
- SELECT thêm `animations`, bỏ `animation`

**`src/app/api/admin/spine/[id]/route.ts`** — admin PATCH/GET:
- PATCHABLE: bỏ `"animation"`, thêm `"animations"`
- SELECT thêm `animations`, bỏ `animation`

### 4. SpineCharacter Component

**`src/components/spine-character.tsx`**:

```typescript
// Props thêm:
animations?: string[];  // ưu tiên hơn animation nếu có

// Logic trong useEffect:
// Nếu animations.length === 1: setAnimation(0, name, true) — loop đơn
// Nếu animations.length > 1: chạy sequence, loop lại từ đầu khi hết
```

Cụ thể, sau khi SpinePlayer load xong (success callback):
```typescript
success: (player) => {
  const state = player.animationState;
  if (anims.length === 1) {
    state.setAnimation(0, anims[0], true);
  } else {
    state.setAnimation(0, anims[0], false);
    for (let i = 1; i < anims.length; i++) {
      state.addAnimation(0, anims[i], false, 0);
    }
    // Listener để loop lại khi chạy hết sequence
    state.addListener({
      complete: (entry) => {
        if (entry.trackIndex === 0 && entry.animation?.name === anims[anims.length - 1]) {
          state.setAnimation(0, anims[0], false);
          for (let i = 1; i < anims.length; i++) {
            state.addAnimation(0, anims[i], false, 0);
          }
        }
      },
    });
  }
}
```

**Backwards compat:** giữ prop `animation?: string` nhưng nếu `animations` được truyền thì ưu tiên.

### 5. Admin UI — SpineTab

**Parse JSON client-side:**
```typescript
// Khi user chọn file .json:
const text = await file.text();
const data = JSON.parse(text);
// Extract skins:
const skins: string[] = (data.skins ?? []).map((s: {name:string}) => s.name);
// Extract animations:
const animationNames: string[] = Object.keys(data.animations ?? {});
```

**State mới:**
```typescript
// Parsed from file:
parsedSkins: string[]       // list of available skins from JSON
parsedAnimations: string[]  // list of available animations from JSON
selectedAnimations: string[] // ordered list user has selected (form state)
```

**UI cho Skin:**
- Nếu `parsedSkins.length > 0`: `<select>` dropdown
- Nếu không có parse data (edit character cũ): `<input type="text">` như cũ

**UI cho Animations:**
- Nếu `parsedAnimations.length > 0`:
  - Phần **Available**: checkbox list, tick để thêm vào Selected
  - Phần **Selected** (ordered): list hiển thị tên + nút ↑ ↓ + nút ✕
- Nếu không có parse data: `<input type="text">` như cũ (giá trị = `animations[0]`)

**FormState thay đổi:**
```typescript
// Trước:
animation: string;
// Sau:
animations: string[];  // mảng ordered
```

---

## Data Flow

```
User chọn .json file
  → FileReader.text() parse JSON
  → extract skins[] + animations[]
  → state: parsedSkins, parsedAnimations
  → UI: dropdown skin + checkbox list animations

User tick animations + xếp thứ tự
  → state: form.animations = ["idle", "walk"]

User save
  → PATCH /api/admin/spine/[id] { animations: ["idle", "walk"], skin: "basic", ... }
  → DB: animations = '["idle","walk"]'

Frontend render SpineCharacter
  → /api/spine trả về animations: ["idle", "walk"]
  → SpineCharacter: chạy idle → walk → idle → walk (loop)
```

---

## Files thay đổi

| File | Action | Chi tiết |
|------|--------|---------|
| Supabase migration | CREATE | `animation → animations JSONB` |
| `src/app/admin/_lib/types.ts` | MODIFY | `animation: string` → `animations: string[]` |
| `src/app/api/spine/route.ts` | MODIFY | SELECT `animations` thay `animation` |
| `src/app/api/admin/spine/[id]/route.ts` | MODIFY | PATCHABLE + SELECT dùng `animations` |
| `src/components/spine-character.tsx` | MODIFY | Support `animations: string[]`, sequence loop |
| `src/components/home-page-lower.tsx` | MODIFY | Pass `animations` thay `animation` |
| `src/app/admin/_components/SpineTab.tsx` | MODIFY | Parse JSON client-side, skin dropdown, animation multi-select |

---

## Edge Cases

- **Edit character cũ chưa có JSON file**: parsedSkins/parsedAnimations rỗng → fallback text input, lưu `animations: [textValue]`
- **animations rỗng**: fallback `["idle"]` khi save
- **JSON parse lỗi** (file không phải Spine JSON): bắt lỗi, toast warning, fallback text input
- **Sequence có 1 animation**: loop đơn như cũ (không cần listener)
- **Skin = ""**: không truyền skin prop vào SpinePlayer (dùng skin default)
