// Types for src/content/site.json

export type MediaItem = {
  id: string;
  name: string;
  label: string;
  thumbnail: string;
  thumbnailIsVideo?: boolean;
  path: string;
  isBgVideo?: boolean;
  isIframe?: boolean;
};

export type FeaturedProject = {
  title: string;
  category: string;
  image: string;
  slug: string;
};

export type ServiceCard = {
  title: string;
  icon: "animation" | "art" | "vfx";
  href: string;
  statValue: string;
  statLabel: string;
  description: string;
  image: string;
};

export type BlogPost = {
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  tag: string;
  image: string;
  views: number;
  body: string[];
};

export type ShowcaseProject = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  thumbnail: string;
  heroVideo: string;
};

export type SiteContent = {
  hero: {
    media: MediaItem[];
  };
  home: {
    featuredProjects: FeaturedProject[];
  };
  services: {
    cards: ServiceCard[];
  };
  blog: {
    posts: BlogPost[];
  };
  portfolio: {
    showcaseProjects: ShowcaseProject[];
  };
};
