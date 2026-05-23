export type Project = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
  category: string;
  createdAt: string;
};

export type ProjectsResponse = {
  projects: Project[];
  total?: number;
};

export type MediaKind = "image" | "video" | "gif" | "other";
export type MediaSource = "local_public" | "external";
export type MediaStatus = "active" | "archived";

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  source_type: MediaSource;
  original_url: string;
  current_url: string;
  r2_key?: string | null;
  r2_url?: string | null;
  status: MediaStatus;
  used_by?: string[];
  created_at: string;
  updated_at: string;
};

export type AdminTab = "projects" | "content" | "media" | "create" | "bulk";

export type ProjectSlot = {
  source: "cover" | "module";
  moduleId?: string;
  moduleVariant?: string;
  srcIndex?: number;
  url: string;
  kind: "image" | "video" | "vimeo" | "other";
};

export type ProjectContent = {
  slug: string;
  filePath: string;
  coverImage: string | null;
  modules: ProjectSlot[];
};

export type SlotPreset = {
  id: string;
  label: string;
  description: string;
  aspect: string;
  recommendedSize: string;
  format: string;
  maxBytes: number;
  maxBytesLabel: string;
  acceptedTypes: string[];
  /** Group used for sorting/separator in the slot picker. */
  group?: "image" | "video" | "icon" | "other";
  /** One-line optimization tip shown under the hint card. */
  tip?: string;
};
