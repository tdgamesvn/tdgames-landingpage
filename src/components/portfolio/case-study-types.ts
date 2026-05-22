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
  credits?: readonly Credit[];
  tools: readonly string[];
  fields: readonly string[];
  tags?: readonly string[];
  theme: ProjectTheme;
  workflow: readonly WorkflowStep[];
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
      variant: "closing";
      text: string;
      /** Big = "lg", small = "sm" (default lg). */
      size?: "sm" | "lg";
      /** Optional hex override; defaults to theme.accent for lg, white/55 for sm. */
      color?: string;
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
