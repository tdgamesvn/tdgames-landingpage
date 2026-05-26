# Blog Content Rewrite — Design Spec

_Date: 2026-05-24_
_Status: Approved_

---

## Overview

Rewrite toàn bộ `blog.posts[]` trong `src/content/site.json` từ generic placeholder content thành nội dung thật của TD Games Studio.

**Goals:**
- **SEO & Inbound** — rank cho keywords: "2D game art outsourcing", "animation outsourcing vietnam", "game art styles"
- **Portfolio Credibility** — client ghé thăm thấy studio chuyên nghiệp, có kiến thức sâu
- **Showcase Real Work** — kể câu chuyện behind-the-scenes của dự án thật

---

## Approach

**Approach B: 4 Expertise + 4 Project Spotlight**

- **4 bài Expertise/SEO:** Rewrite từ bài cũ, giữ slug, nâng cấp với TD Games examples và internal links
- **4 bài Project Spotlight:** Nội dung mới, slug mới, dùng ảnh R2 thật từ portfolio projects

Total: 8 posts (trim từ 10 bài cũ — bỏ 2 bài 3D không liên quan: `high-poly-and-low-poly-modeling` và `rendering-in-3d-animation`).

---

## Content Architecture

### 4 Expertise Posts

| # | Slug | Title | Date | Tag | Views |
|---|------|-------|------|-----|-------|
| 1 | `how-to-create-a-game-character` | 2D Character Design: From Brief to Final Animation | 15.03.2024 | Blog | 1,842 | `unsplash/photo-1542751371-adc38448a05e` (keep existing) |
| 2 | `animation-outsourcing-guide` | Animation Outsourcing: A Practical Guide from a Vietnam Studio | 08.06.2024 | Blog | 2,104 | `unsplash/photo-1611532736597-de2d4265fba3` (keep existing) |
| 3 | `complete-guide-game-art-outsourcing` | Complete 2025 Guide to Game Art Outsourcing | 12.09.2024 | Blog | 2,876 | `unsplash/photo-1593508512255-86ab42a8e620` (keep existing) |
| 4 | `different-game-art-styles` | 2D Art Styles in Games: Pixel, Hand-Drawn & Spine-Based Explained | 20.11.2024 | Blog | 1,567 | `unsplash/photo-1550745165-9bc0b252726f` (keep existing) |

### 4 Project Spotlight Posts

| # | Slug | Title | Date | Tag | Views | Image (R2) |
|---|------|-------|------|-----|-------|------------|
| 5 | `summoner-era-hero-login-animation` | Behind the Scenes: 12 Hero Login Animations for Summoner Era | 14.01.2025 | Case Study | 934 | `cdn.tdgamestudio.com/landing/images/summonerDetail.png` |
| 6 | `reaper-lady-spine-combat` | Spine 2D Combat Animation: Reaper & Lady for Project OverDrive | 28.02.2025 | Case Study | 712 | `cdn.tdgamestudio.com/landing/behance/52c6beca311ad4e9.png` |
| 7 | `axie-infinity-origins-animation` | Animating for a Web3 Giant: Our Work on Axie Infinity Origins | 10.04.2025 | Case Study | 1,203 | `cdn.tdgamestudio.com/landing/behance/b173c85213385cf6.png` |
| 8 | `boss-animation-the-twins` | Boss Animation Breakdown: 10 Bosses for The Twins | 18.05.2025 | Case Study | 589 | `cdn.tdgamestudio.com/landing/behance/70daeb02ca1bc2dc.png` |

---

## Post Content Outlines

### [1] 2D Character Design: From Brief to Final Animation
**Excerpt:** Designing a 2D game character that reads clearly at small sizes and animates cleanly in Spine requires thinking about art and engineering simultaneously.

**Body (4 paragraphs):**
1. Silhouette first — 2D characters need instant readability at icon size (vs 3D where camera angle compensates). Describe the silhouette test: thumb size, solid black shape.
2. Color theory for mobile screens — limited palette (3–4 colors), saturation/contrast for small screen visibility. TD Games example: hero vs NPC color hierarchy.
3. Spine rigging constraints — design must anticipate joint placement, layering order, deformation zones. "Art that ignores the rig becomes expensive to animate."
4. TD Games brief-to-delivery process: reference gather → sketch pass → style approval → clean art → Spine rig → animation test → delivery. Internal link: `/portfolio/summoner-era`

---

### [2] Animation Outsourcing: A Practical Guide from a Vietnam Studio
**Excerpt:** Vietnam has become one of the most competitive hubs for game animation outsourcing — here's what actually makes a partnership succeed, from the studio side.

**Body (4 paragraphs):**
1. Why Vietnam? Cost efficiency + strong art school tradition + timezone alignment with EU (morning overlap) and overlap with US west coast. English proficiency in game studios.
2. The documentation problem — most outsourcing failures trace back to an incomplete brief. Checklist: style guide, reference reel, naming conventions, frame rate, Spine version, export spec.
3. Communication rhythm: weekly async reviews via Frame.io or similar, milestone-based approval (not just end-of-project). "Waiting until delivery to give feedback wastes everyone's time."
4. TD Games trial batch approach: always start with 2–3 assets before full production. Both teams calibrate before committing. Internal link: `/contact`

---

### [3] Complete 2025 Guide to Game Art Outsourcing
**Excerpt:** Game art outsourcing in 2025 is faster, more global, and more tool-assisted than ever — and the studios that use it well have a systematic approach.

**Body (4 paragraphs):**
1. The 2025 landscape: remote tools have matured, AI assists concept iteration, quality bars have risen globally. No longer a cost-cutting tactic — a strategic capability.
2. Evaluating a partner: portfolio breadth vs depth, revision process transparency, experience with your art style. "A studio that excels at dark fantasy AAA may not fit a colorful mobile RPG." Pay for a trial.
3. Pricing models: per-asset (discrete deliverables), hourly (fluid scope), retainer (sustained volume). Warning signs of low bids.
4. AI in the pipeline: TD Games uses AI for concept iteration and texture variations — amplifies artists, doesn't replace them. Clients get more options faster without losing artistic judgment. Internal link: `/services`

---

### [4] 2D Art Styles in Games: Pixel, Hand-Drawn & Spine-Based Explained
**Excerpt:** Choosing your 2D art style is one of the most consequential decisions in game development — and one of the most frequently made without enough information.

**Body (4 paragraphs):**
1. Pixel art: constraints are the medium. Modern pixel art (high-res "HD-2D") vs classic retro. Scaling limitations, nostalgia premium, audience expectation.
2. Hand-drawn frame-by-frame: highest quality, highest cost. Best for hero characters and cinematics. Tools: TVPaint, Clip Studio. When is it worth it?
3. Spine-based 2D: the professional mobile standard. Lower asset cost than frame-by-frame, smooth animation at small file size, easy to rig and re-skin. TD Games primary specialty.
4. Choosing by budget + platform: mobile → Spine; premium indie → hand-drawn accents; retro appeal → pixel. Mix-and-match strategies. Internal link: `/services/2d-animation`

---

### [5] Behind the Scenes: 12 Hero Login Animations for Summoner Era
**Excerpt:** Summoner Era needed 12 distinct hero login packages — each with light and dark theme variants — delivered in three weeks. Here's how we approached it.

**Image:** `https://cdn.tdgamestudio.com/landing/images/summonerDetail.png`

**Body (4 paragraphs):**
1. The brief: 12 heroes, 2 color themes each (light/dark), looping animation for login screen, VFX integrated with key art. 3-week timeline.
2. Pipeline: Spine 2D for character motion → After Effects for VFX compositing and glow/particle layers. Each hero had distinct personality translated into idle loop.
3. Challenge — consistency across 12 characters while keeping each feel unique. Established motion language rules: timing curves, VFX intensity scale, theme color variance.
4. Result: 30+ VFX assets delivered, all loops seamless, both themes cohesive. Summoner Era shipped login screen on schedule. Behance showcase: 199K+ gallery views. Internal link: `/portfolio/summoner-era`

---

### [6] Spine 2D Combat Animation: Reaper & Lady for Project OverDrive
**Excerpt:** Shadow Fight–style mobile combat demands instant readability and punchy timing. Here's how we built Reaper & Lady's complete animation set in Spine 2D.

**Image:** `https://cdn.tdgamestudio.com/landing/behance/52c6beca311ad4e9.png`

**Body (4 paragraphs):**
1. The constraints: mobile small screen, fast combat, Shadow Fight–style silhouette priority. "If the attack read isn't clear in the first 3 frames, it doesn't work on mobile."
2. Reaper character: dark, aggressive kit — heavy anticipation on attacks, dramatic follow-through. Boss-scale motion applied to playable character to increase perceived threat.
3. Lady character: contrast to Reaper — faster, lighter, more aerial. Different timing curve library. Same Spine rig approach but different personality blueprint.
4. 141 Behance appreciations, 2.7K views. Published May 2018 — one of the studio's early signature pieces. Internal link: `/portfolio/reaper-lady-project-overdrive`

---

### [7] Animating for a Web3 Giant: Our Work on Axie Infinity Origins
**Excerpt:** Axie Infinity Origins brought unique challenges: a beloved IP with passionate fans, a large Axie roster with distinct body types, and Sky Mavis production standards.

**Image:** `https://cdn.tdgamestudio.com/landing/behance/b173c85213385cf6.png`

**Body (4 paragraphs):**
1. Context: Axie Infinity Origins — Sky Mavis reboot of the flagship Web3 game. High audience expectations from an established IP with millions of players.
2. Technical challenge: Spine 2D rigs for the Axie body type system — multiple base types with different proportions, all needing consistent motion language. Photoshop used for texture and pose prep.
3. Production scale: large roster of Axies with attack/idle loops. Consistency protocol: shared timing references, frame-rate discipline, attack-read testing at final resolution.
4. Published Sep 2022. 1.1K Behance appreciations, 12.2K views, 47 comments — highest-engagement project in the portfolio. Internal link: `/portfolio/axie-infinity-origins`

---

### [8] Boss Animation Breakdown: 10 Bosses for The Twins
**Excerpt:** Boss characters demand more than standard combat animation — they need to feel dangerous, distinct, and readable under pressure. Here's how we approached 10 bosses in Spine 2D.

**Image:** `https://cdn.tdgamestudio.com/landing/behance/70daeb02ca1bc2dc.png`

**Body (4 paragraphs):**
1. The Twins — Legend of Shadow Ninja Monster Hunter: 10 boss reels, each needing its own personality while fitting the game's dark action tone. Scope: lead animation on Boss Samurai, mentoring on remaining 9.
2. Boss animation philosophy: anticipation longer than normal enemies, attacks that telegraph but still feel fast. The paradox of boss timing — readable AND dangerous.
3. Boss Samurai breakdown: weight-based idle, 3-phase attack sequence (draw → strike → recovery), death animation with theatrical flourish. Spine 2D cloth simulation for robe.
4. Mentoring pass: consistent quality across 10 animators requires a shared reference document. We built an animation bible for the set — timing charts, weight guidelines, silhouette rules. Internal link: `/portfolio/boss-animation`

---

## Implementation Details

### File to Edit
`src/content/site.json` → `blog.posts[]` array

### Changes
- Replace entire `blog.posts[]` array
- 8 posts total (was 10)
- All new slugs for Spotlight posts
- Dates spread Mar 2024 → May 2025
- Tags: `"Blog"` for Expertise, `"Case Study"` for Spotlight
- Images: Unsplash for Expertise, R2 CDN for Spotlight

### No code changes required
- Blog page reads from `site.json` dynamically
- No new routes (Spotlight posts use existing `/blog/[slug]` route)
- No schema changes

### Success Criteria
- [ ] 8 posts in `blog.posts[]` with unique slugs, correct dates, real content
- [ ] 4 Spotlight posts use R2 CDN images (no Unsplash)
- [ ] Each post body has 4 substantive paragraphs with TD Games references
- [ ] Internal links present in each post body
- [ ] `npm run build` passes with no errors
- [ ] Blog page renders correctly at `/blog`
