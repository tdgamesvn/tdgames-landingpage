export type ProjectTheme = {
  /** Primary accent (hex). */
  accent: string;
  /** Secondary accent (hex). */
  accentSoft: string;
  /** CSS background for the hero section. Defaults to a tasteful dark gradient. */
  heroBackground?: string;
  /** CSS background for the showcase section wrapper. */
  showcaseSectionBg?: string;
  /** CSS background for the showcase media frame (the rounded container). */
  showcasePanelBg?: string;
  /** Optional fill behind GIF grids (trio/duo cells). Defaults to showcasePanelBg. */
  showcaseMediaBg?: string;
  /** CSS background for the section-label divider band. */
  sectionLabelBg?: string;
};

export type WorkflowStep = {
  /** "01", "02", ... */
  n: string;
  /** Title, e.g. "Concept". */
  t: string;
  /** Subtitle, e.g. "Photoshop". */
  sub: string;
};

export type HeroTitleColor =
  | "accent"
  | "accentSoft"
  | "white"
  | "soft"
  | "muted"
  | "divider";

export type HeroTitleSpan = {
  text: string;
  color?: HeroTitleColor;
};

export type HeroTitle = {
  /** Big primary line of the hero title. */
  primary: readonly HeroTitleSpan[];
  /** Smaller subtitle line below the primary line. */
  subtitle?: readonly HeroTitleSpan[];
};

export type HeroFact = {
  value: string;
  label: string;
  icon: "calendar" | "users" | "cube" | string;
};

export type OverviewStat = {
  value: string;
  label: string;
};

export type Credit = { role: string; name: string };

export type ProjectMeta = {
  title: string;
  eyebrow: string;
  summary: string;
  showOverviewSection?: boolean;
  heroTitle: HeroTitle;
  heroFacts: readonly HeroFact[];
  deliverables: readonly string[];
  overview: { body: string; stats: readonly OverviewStat[] };
  behanceUrl: string;
  madeForLabel?: string;
  madeForUrl?: string;
  coverImage: string;
  /** Optional looping muted video for the hero; coverImage becomes its poster. */
  coverVideo?: string;
  /** CSS object-position for the hero media (default "top"). */
  coverPosition?: string;
  credits?: readonly Credit[];
  tools: readonly string[];
  fields: readonly string[];
  tags?: readonly string[];
  theme: ProjectTheme;
  workflow: readonly WorkflowStep[];
};

export type CutsceneItem = {
  src: string;
  poster: string;
  title: string;
  /** Small label above the title, e.g. character name. */
  kicker?: string;
};

export type SpineTier = {
  /** "stage1" | "stage3" | "awakened" … — key ổn định, dùng làm path trên CDN. */
  key: string;
  label: string;
  /** URL tới skeleton, KHÔNG có đuôi: `${base}.json` + `${base}.atlas`. */
  base: string;
  animations: readonly string[];
  /** Bậc cao nhất — sân khấu đổi glow mạnh hơn + badge. */
  highlight?: boolean;
};

export type SpineMonster = {
  id: string;
  name: string;
  /** Hạng hiển thị, vd "Mythic", "Architect". */
  rank: string;
  tiers: readonly SpineTier[];
  /** Ảnh nhỏ cho dãy chọn (nền trong suốt). */
  thumb?: string;
};

export type ShowcaseModule =
  | { id: string; variant: "banner"; src: string }
  | { id: string; variant: "full"; src: string }
  | { id: string; variant: "fullGif"; src: string }
  | { id: string; variant: "square"; src: string; maxWidth?: number }
  | { id: string; variant: "portrait"; src: string; maxWidth?: number }
  | { id: string; variant: "duo"; srcs: readonly [string, string] }
  | { id: string; variant: "trio"; srcs: readonly [string, string, string] }
  | {
      id: string;
      variant: "video";
      src: string;
      /** width/height, defaults to 16/9. */
      aspect?: number;
    }
  | {
      id: string;
      variant: "vimeo";
      embedSrc: string;
      /** width/height, defaults to 16/9. */
      aspectRatio?: number;
    }
  | { id: string; variant: "videoEmbed"; src: string; aspect: number }
  | { id: string; variant: "sectionLabel"; label: string }
  | {
      id: string;
      variant: "spineStage";
      /** Nhân vật Spine chạy trực tiếp, người xem chọn con / bậc / animation. */
      roster: readonly SpineMonster[];
      /** Ảnh nền sân khấu (sàn đấu trống). */
      background: string;
      /** Tâm sàn trong ảnh nền theo tỉ lệ chiều cao ảnh (0–1) — chân quái đặt vào đây. */
      groundY?: number;
      logo?: string;
      /** Tên hiển thị cho từng animation key, vd { breathe: "Idle" }. */
      animationLabels?: Readonly<Record<string, string>>;
    }
  | {
      id: string;
      variant: "cutsceneGrid";
      /** width/height of every clip, defaults to 16/9. */
      aspect?: number;
      /** First clip spans the full row as a featured piece. */
      featureFirst?: boolean;
      /** Desktop column count, defaults to 2. Use 3 for small character clips. */
      columns?: 2 | 3;
      items: readonly CutsceneItem[];
    }
  | {
      id: string;
      variant: "closing";
      text: string;
      /** Big = "lg", small = "sm" (default lg). */
      size?: "sm" | "lg";
      /** Optional hex override; defaults to theme.accent for lg, white/55 for sm. */
      color?: string;
      /** Optional second line rendered in theme.accent (lg only). */
      highlight?: string;
      /** Looping muted video behind the text (lg only) — turns it into a cinematic outro. */
      backgroundVideo?: string;
      backgroundPoster?: string;
      /** Optional CTA button under the text. */
      cta?: { label: string; href: string };
    }
  | {
      id: string;
      variant: "info";
      linkLabel: string;
      linkUrl: string;
      role: string;
      note: string;
    };

export type RelatedProject = {
  id: string;
  title: string;
  href: string;
  internal?: boolean;
  badge: string;
  image: string;
  appreciations: string;
  views: string;
};

export type CaseStudyProps = {
  meta: ProjectMeta;
  modules: readonly ShowcaseModule[];
  related: readonly RelatedProject[];
};
