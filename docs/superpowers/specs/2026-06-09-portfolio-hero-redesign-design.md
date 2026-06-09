# Portfolio Hero Redesign — Design Spec

_Created: 2026-06-09_

---

## Goal

Redesign the Portfolio page hero section to match the visual pattern used on Home/About pages (looping background video + dark vignette overlay on left), while adding a unique 5-project selector that lets visitors browse showcase projects directly from the hero.

## Current State

The Portfolio hero uses a complex 3D card board with polygon clipping and corner deformation (~500 lines). It swaps a static background image on card hover. There is no looping video background — inconsistent with other pages.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Interaction | Select card -> change video + text, click navigates to project | Rich preview before committing to a page visit |
| Auto-rotate | Yes, 6s interval, pause on hover, resume after 2s | Keeps hero alive without being annoying |
| Data source | New `portfolio.showcaseProjects` in site.json | Independent from `home.featuredProjects`, flexible |
| Transition | Crossfade 500ms (2 stacked video elements) | Matches Home hero pattern, smooth |
| Architecture | Separate component `portfolio-hero.tsx` | Reduces page.tsx length, clean separation |

---

## 1. Data Structure

### site.json addition

Add `portfolio.showcaseProjects` array to `src/content/site.json`:

```json
{
  "portfolio": {
    "showcaseProjects": [
      {
        "id": "1",
        "title": "Kayn Snow Moon",
        "subtitle": "League of Legends — Login Screen Animation",
        "slug": "kayn-snow-moon",
        "thumbnail": "https://cdn.tdgamestudio.com/landing/images/kayn-thumb.jpg",
        "heroVideo": "https://cdn.tdgamestudio.com/landing/video/kayn-hero.mp4"
      }
    ]
  }
}
```

**Fields per project:**
- `id` — unique string identifier
- `title` — project name displayed in hero text area
- `subtitle` — category/description line below title
- `slug` — route segment, links to `/portfolio/{slug}`
- `thumbnail` — small image for the selector card (~200x120 or similar 16:9)
- `heroVideo` — full background video URL (CDN, .mp4, loop-friendly)

**TypeScript type** added to `src/types/site-content.ts`:

```typescript
interface ShowcaseProject {
  id: string
  title: string
  subtitle: string
  slug: string
  thumbnail: string
  heroVideo: string
}
```

---

## 2. Component: `portfolio-hero.tsx`

**File:** `src/components/portfolio/portfolio-hero.tsx`

### Props

```typescript
interface PortfolioHeroProps {
  projects: ShowcaseProject[]
}
```

### Internal State

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `activeIndex` | `number` | `0` | Currently displayed project |
| `isTransitioning` | `boolean` | `false` | During crossfade animation |
| `isPaused` | `boolean` | `false` | Auto-rotate paused (user interaction) |

### Structure (top to bottom in DOM)

```
<section className="relative w-full h-screen overflow-hidden">
  <!-- 1. Video Background Layer -->
  <video A>  (current, opacity 1 -> 0 during transition)
  <video B>  (next, opacity 0 -> 1 during transition)

  <!-- 2. Vignette Overlay -->
  <div style="linear-gradient(100deg, ...)">

  <!-- 3. Content Container (z-10) -->
  <div className="relative z-10 flex flex-col h-full">

    <!-- 3a. Text Content (left side, vertically centered) -->
    <div className="flex-1 flex items-center pl-8 md:pl-16 lg:pl-24">
      <div className="max-w-lg">
        <p className="text-amber-400 uppercase tracking-wider">Our Projects</p>
        <h1>{project.title}</h1>         <!-- fade transition -->
        <p>{project.subtitle}</p>         <!-- fade transition -->
        <div className="flex gap-4">
          <Link href={`/portfolio/${slug}`}>View Project</Link>
          <Link href="/contact">Get In Touch</Link>
        </div>
      </div>
    </div>

    <!-- 3b. Project Selector (bottom center) -->
    <div className="flex justify-center gap-3 pb-8 md:pb-12">
      {projects.map((p, i) => (
        <button>
          <img src={p.thumbnail} />
          <div className="progress-bar" />   <!-- auto-rotate indicator -->
        </button>
      ))}
    </div>

  </div>
</section>
```

---

## 3. Visual Specifications

### Video Background
- Two `<video>` elements stacked absolutely, both `autoPlay muted loop playsInline`
- `className="absolute inset-0 w-full h-full object-cover"`
- Preload next video when auto-rotate timer is at ~4s (2s before switch)

### Vignette Overlay
Match the existing pattern from Home/About:
```css
background: linear-gradient(
  100deg,
  rgba(10, 10, 10, 0.82) 0%,
  rgba(10, 10, 10, 0.55) 28%,
  rgba(10, 10, 10, 0.18) 55%,
  transparent 78%
);
```

### Text Content (Left Side)
- "OUR PROJECTS" label: `text-amber-400 uppercase tracking-widest text-sm font-semibold`
- Project title: `text-4xl md:text-5xl lg:text-6xl font-bold text-white font-[family-name:var(--font-changa-one)]`
- Subtitle: `text-lg text-white/70 mt-2`
- CTA "View Project": amber outlined button (matching existing site style)
- CTA "Get In Touch": ghost/text button
- Text transitions: fade out 200ms -> fade in 300ms (staggered 50ms per element)

### Thumbnail Cards (Bottom Center)
- Size: `w-20 h-14 md:w-24 md:h-16` (roughly 16:9 ratio)
- Rounded: `rounded-lg`
- Active state: `border-2 border-amber-400 scale-105 opacity-100`
- Inactive state: `border-2 border-white/20 opacity-60 hover:opacity-80`
- Transition: `transition-all duration-300`
- Image: `object-cover` inside the card
- Below each card: thin progress bar (amber, animates left-to-right over 6s during auto-rotate)
- Progress bar only visible on the active card

---

## 4. Auto-Rotate Logic

```
On mount:
  Start interval (6000ms)
  -> increment activeIndex (wrap around)
  -> trigger crossfade

On card click:
  Clear interval
  Set isPaused = true
  Set activeIndex to clicked card
  Trigger crossfade

On mouse enter hero:
  Clear interval
  Set isPaused = true

On mouse leave hero:
  Wait 2000ms (debounce)
  If still not hovering:
    Set isPaused = false
    Restart interval
```

**Crossfade sequence:**
1. Set `isTransitioning = true`
2. Start loading next video (set src on inactive `<video>` element)
3. When `canplay` fires (or fallback 200ms timeout): animate opacity swap (500ms CSS transition)
4. Simultaneously fade out text (200ms) then fade in new text (300ms)
5. After 500ms: set `isTransitioning = false`, swap which video element is "active"

---

## 5. Integration

### portfolio/page.tsx changes
- Remove the existing hero section (the 3D card board, ~lines 1610-2140)
- Import and render `<PortfolioHero projects={showcaseProjects} />`
- Keep everything below the hero (project grid section, etc.) unchanged

### Type updates
- Add `ShowcaseProject` interface to `src/types/site-content.ts`
- Add `portfolio.showcaseProjects` to the `SiteContent` type

### site.json
- Add `portfolio.showcaseProjects` array with 5 real projects
- Use existing CDN video URLs where available, placeholder for others

---

## 6. Responsive Behavior

| Breakpoint | Hero Height | Text Size | Card Size | Cards Layout |
|-----------|-------------|-----------|-----------|--------------|
| Mobile (<640px) | `h-screen` | `text-3xl` | `w-16 h-11` | Horizontal scroll or 5 small |
| Tablet (640-1024px) | `h-screen` | `text-4xl` | `w-20 h-14` | Row of 5, centered |
| Desktop (>1024px) | `h-screen` | `text-5xl-6xl` | `w-24 h-16` | Row of 5, centered |

On mobile:
- Text padding reduced (`pl-6`)
- Cards may be slightly smaller but still tappable (min 44px touch target)
- Auto-rotate interval same (6s)

---

## 7. Performance Considerations

- Only 2 `<video>` elements in DOM at any time (not 5)
- Preload next video ~2s before auto-rotate switch
- Use `preload="metadata"` on inactive video, switch to `preload="auto"` when about to play
- Videos should be optimized: 720p-1080p, H.264, 2-4MB each for 10-15s loops
- Thumbnail images: small (200x120 or less), WebP preferred
- `will-change: opacity` on video elements during transition only (remove after)

---

## 8. Accessibility

- Thumbnail cards are `<button>` elements with `aria-label="View {project.title}"`
- Active card has `aria-current="true"`
- Videos have no audio (muted), no captions needed
- `prefers-reduced-motion`: disable auto-rotate, skip crossfade (instant switch)
- Keyboard: Tab through cards, Enter/Space to select
- Progress bar: `role="progressbar"` with `aria-valuenow`

---

## Out of Scope

- Admin UI for managing `showcaseProjects` (use site.json directly for now)
- Video upload pipeline (videos assumed to already be on CDN)
- Parallax or scroll-driven effects in the hero
- Sound/audio on videos
