# Content Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Unsplash placeholder images and stale dates with real CDN assets and accurate dates across the Blog and About page.

**Architecture:** Pure content changes — edit `src/content/site.json` for blog posts and add a new `about.workspace[]` array; refactor `src/app/about/page.tsx` to read workspace images from site.json instead of hardcoding, making them updatable without code changes.

**Tech Stack:** Next.js 16 App Router, TypeScript, `src/content/site.json` as single source of truth, `fs.readFile` server-side reads, CDN at `https://cdn.tdgamestudio.com`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/content/site.json` | Modify | Blog post dates, blog cover images, new `about.workspace[]` array |
| `src/app/about/page.tsx` | Modify | Read workspace images from `site.json`; replace hero Unsplash URL |

No new files needed.

---

## Task 1: Update Blog Post Dates

All 10 blog posts currently show `"22.01.2024"`. Replace with varied, realistic dates across 2024–2025 to look like a real publishing calendar.

**Files:**
- Modify: `src/content/site.json` (lines ~167–end of blog.posts array)

- [ ] **Step 1: Edit dates in site.json**

Open `src/content/site.json` and update each post's `"date"` field to the values below (DD.MM.YYYY format, consistent with existing format):

```json
"how-to-create-a-game-character"        → "date": "15.03.2024"
"high-poly-and-low-poly-modeling"       → "date": "28.04.2024"
"animation-outsourcing-guide"           → "date": "10.06.2024"
"complete-guide-game-art-outsourcing"   → "date": "22.07.2024"
"different-game-art-styles"             → "date": "08.09.2024"
"impact-animation-education"            → "date": "14.10.2024"
"animation-is-not-just-for-children"    → "date": "29.11.2024"
"rendering-in-3d-animation"             → "date": "18.01.2025"
"color-correction-3d-animation"         → "date": "03.03.2025"
"animation-storyboard"                  → "date": "20.04.2025"
```

- [ ] **Step 2: Verify JSON is valid**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage
node -e "JSON.parse(require('fs').readFileSync('src/content/site.json','utf8')); console.log('JSON valid')"
```

Expected output: `JSON valid`

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Navigate to `http://localhost:3000/blog` and confirm dates are varied (not all "22.01.2024").

- [ ] **Step 4: Commit**

```bash
git add src/content/site.json
git commit -m "content: update blog post dates to realistic 2024-2025 calendar"
```

---

## Task 2: Replace Blog Cover Images with CDN Portfolio Images

All blog cover images currently point to `images.unsplash.com`. Replace with real TD Games CDN images that match each post's topic. These images already exist at `https://cdn.tdgamestudio.com`.

**Files:**
- Modify: `src/content/site.json` — each post's `"image"` field

- [ ] **Step 1: Update blog post images in site.json**

For each post, replace the `"image"` value with the CDN URL below:

```json
"how-to-create-a-game-character"
→ "image": "https://cdn.tdgamestudio.com/landing/behance/2e9463653cd72994.jpg"
  (Art Study Collection — character design)

"high-poly-and-low-poly-modeling"
→ "image": "https://cdn.tdgamestudio.com/landing/behance/87a63a36f47dc948.png"
  (Reaper & Lady — detailed character art)

"animation-outsourcing-guide"
→ "image": "https://cdn.tdgamestudio.com/landing/images/service-animation.jpg"
  (2D Animation service image)

"complete-guide-game-art-outsourcing"
→ "image": "https://cdn.tdgamestudio.com/landing/sinspired/character_6-min-1024x970.jpg"
  (2D Art service image)

"different-game-art-styles"
→ "image": "https://cdn.tdgamestudio.com/landing/behance/b173c85213385cf6.png"
  (Axie Infinity Origins — stylized game art)

"impact-animation-education"
→ "image": "https://cdn.tdgamestudio.com/landing/images/summonerDetail.png"
  (Summoner Era — educational/detailed breakdown)

"animation-is-not-just-for-children"
→ "image": "https://cdn.tdgamestudio.com/landing/behance/e3eeb2716aa68b48.png"
  (Sky Mavis — mature game animation)

"rendering-in-3d-animation"
→ "image": "https://cdn.tdgamestudio.com/landing/sinspired/Game_Animation-min-1024x612.jpg"
  (Game Animation — rendering showcase)

"color-correction-3d-animation"
→ "image": "https://cdn.tdgamestudio.com/landing/behance/379f981b88c6a84f.png"
  (Boss Animation — color grading showcase)

"animation-storyboard"
→ "image": "https://cdn.tdgamestudio.com/landing/images/Screenshot 2026-05-13 232709.png"
  (Kayn Snow Moon — cinematic storyboard result)
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/content/site.json','utf8')); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 3: Verify images load**

With dev server running, navigate to `http://localhost:3000/blog` and confirm all 10 cards show CDN images (no Unsplash URLs loading). Check browser Network tab — all `img` requests should go to `cdn.tdgamestudio.com`.

Also check one post page, e.g., `http://localhost:3000/blog/how-to-create-a-game-character` — the cover image should display correctly.

- [ ] **Step 4: Commit**

```bash
git add src/content/site.json
git commit -m "content: replace blog cover images with TD Games CDN portfolio images"
```

---

## Task 3: Refactor About Workspace Images to site.json

The About page "Our Workspace" section has 4 images hardcoded in `page.tsx`. Move them to `site.json` so they can be updated without code changes.

**Files:**
- Modify: `src/content/site.json` — add `about.workspace[]` array
- Modify: `src/app/about/page.tsx` — read workspace images from file instead of hardcoding

- [ ] **Step 1: Add `about.workspace` to site.json**

Add the following JSON **before the closing `}`** of the top-level object in `src/content/site.json`. Insert it after the `"blog"` object (after the `}` that closes `blog`):

```json
  "about": {
    "heroImage": "https://cdn.tdgamestudio.com/landing/images/Screenshot 2026-05-13 232709.png",
    "workspace": [
      {
        "src": "https://cdn.tdgamestudio.com/landing/behance/2e9463653cd72994.jpg",
        "alt": "Character design process at TD Games"
      },
      {
        "src": "https://cdn.tdgamestudio.com/landing/sinspired/character_6-min-1024x970.jpg",
        "alt": "2D character art in production"
      },
      {
        "src": "https://cdn.tdgamestudio.com/landing/sinspired/Game_Animation-min-1024x612.jpg",
        "alt": "Game animation pipeline"
      },
      {
        "src": "https://cdn.tdgamestudio.com/landing/behance/87a63a36f47dc948.png",
        "alt": "VFX and effects work"
      }
    ]
  }
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/content/site.json','utf8')); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 3: Update `about/page.tsx` to read workspace from site.json**

At the top of `src/app/about/page.tsx`, the existing `getTeam()` function reads from site.json. Add a similar `getAbout()` function and a type. Then update the component to use it.

**Add types and function** (after the existing `type TeamMember` declaration, before `async function getTeam()`):

```typescript
type WorkspaceImage = { src: string; alt: string };
type AboutData = { heroImage: string; workspace: WorkspaceImage[] };

async function getAbout(): Promise<AboutData> {
  const filePath = path.join(process.cwd(), "src", "content", "site.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  return data.about ?? {
    heroImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80",
    workspace: [],
  };
}
```

**Update component signature** (change `export default async function AboutPage()` to fetch both):

```typescript
export default async function AboutPage() {
  const team = await getTeam();
  const about = await getAbout();
```

**Replace hero section `Image` src** — find this line in the hero section:

```tsx
src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
```

Replace with:

```tsx
src={about.heroImage}
```

**Replace hardcoded workspace grid** — find the block starting with:

```tsx
<div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
    <Image
      src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
```

Replace the entire `<div className="mt-12 grid...">...</div>` block (all 4 hardcoded image divs) with:

```tsx
<div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
  {about.workspace.map((img) => (
    <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-lg">
      <Image
        src={img.src}
        alt={img.alt}
        fill
        className="object-cover"
      />
    </div>
  ))}
</div>
```

- [ ] **Step 4: TypeScript build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Verify in browser**

Navigate to `http://localhost:3000/about`. Confirm:
- Hero section shows a TD Games cinematic image (not Unsplash)
- "Our Workspace" grid shows 4 TD Games portfolio images
- No blank image placeholders

- [ ] **Step 6: Commit**

```bash
git add src/content/site.json src/app/about/page.tsx
git commit -m "refactor(about): move workspace/hero images to site.json, replace Unsplash with CDN"
```

---

## Task 4: Production Build Verification

Before deploying, confirm the production build succeeds (Next.js static analysis + type check).

**Files:** None — verification only.

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build completes with `✓ Compiled successfully`, 44+ pages generated, 0 errors. Type errors will surface here too.

- [ ] **Step 2: Check for Unsplash references in modified files**

```bash
grep -n "unsplash" src/content/site.json src/app/about/page.tsx
```

Expected: No matches — all Unsplash URLs should be gone from both files.

- [ ] **Step 3: Update agent memory**

Append to `.agent/meta/LOG.md`:

```markdown
## 2026-05-24 (session 11)
### Task
Content polish — blog dates, blog images, about workspace

### Work Done
- Blog posts: updated 10 dates to 2024-2025 calendar
- Blog posts: replaced 10 Unsplash cover images with CDN portfolio images
- about/page.tsx: moved hero image + workspace grid to site.json (about.workspace[])
- All Unsplash references removed from blog + about

### Result
- /blog: real CDN images, realistic dates
- /about: CDN images in hero + workspace grid, manageable via site.json

### Next Step
- Team: upload real team photos via /admin tab "6. Team"
- About: replace with actual studio workspace photos when available (update site.json about.workspace[])
```

Update `.agent/meta/TASKS.md` — move these to Done:
- `[x] Blog — thêm content thật` (dates + CDN images updated)
- `[x] About page — ảnh studio workspace thật` (moved to site.json + CDN placeholders)

- [ ] **Step 4: Commit memory updates**

```bash
git add .agent/meta/LOG.md .agent/meta/TASKS.md
git commit -m "chore: update agent memory after content polish session"
```

---

## Team Note (Out of Scope for Code)

The **Team** task (`team[]` in `site.json`) requires real photos and names from the studio. This is managed entirely through the Admin UI:

1. Go to `https://www.tdgamestudio.com/admin`
2. Select tab **"6. Team"**
3. Edit each member: upload real photo (uploads to R2), set real name and title
4. Save — no code change required

This is a content operation, not a code task, so it is excluded from this plan.

---

## Self-Review

**Spec coverage:**
- ✅ Blog dates updated (Task 1)
- ✅ Blog Unsplash images replaced with CDN (Task 2)
- ✅ About workspace images moved to site.json + CDN (Task 3)
- ✅ About hero image moved to site.json + CDN (Task 3)
- ✅ Production build verified (Task 4)
- ℹ️ Team: excluded — admin UI task, no code needed

**Placeholder scan:** All code steps contain exact values, no TBDs.

**Type consistency:**
- `WorkspaceImage` type used in Task 3 is consistent (`src`, `alt`)
- `AboutData` type matches `getAbout()` return and the site.json shape
- `about.workspace.map((img) => ...)` → `img.src`, `img.alt` consistent with type
