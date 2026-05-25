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

export type AdminTab = "projects" | "content" | "media" | "create" | "bulk" | "team" | "careers" | "blog" | "footer" | "spine";

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

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image: string;
  content_md: string;
  published: boolean;
  views: number;
  author: string;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  name: string;
  title: string;
  photo: string;
};

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

export type JobType = "fulltime" | "parttime" | "remote" | "freelancer";
export type ApplicationStatus = "new" | "reviewing" | "interview" | "offer" | "rejected";

export type Job = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: JobType;
  location: string;
  level: string;
  salary: string;
  rate_per_hour: string | null;
  categories: string[];
  image_url: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  skills: string[];
  is_active: boolean;
  created_at: string;
};

export type Application = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  work_type: string;
  years_experience: number | null;
  cv_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  expected_salary: string | null;
  available_from: string | null;
  rate_per_hour: string | null;
  status: ApplicationStatus;
  admin_notes: string | null;
  created_at: string;
  jobs?: { title: string; slug: string };
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
