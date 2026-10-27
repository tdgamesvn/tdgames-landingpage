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
  label?: string | null;
  used_by?: string[];
  created_at: string;
  updated_at: string;
};

export type AdminTab = "projects" | "content" | "media" | "create" | "bulk" | "team" | "careers" | "blog" | "footer" | "spine" | "page-slots" | "showreel" | "settings";

export type SpineCharacter = {
  id: string;
  name: string;
  slug: string;
  json_url: string | null;
  atlas_url: string | null;
  animations: string[];
  skin: string | null;
  active: boolean;
  scale: number;
  offset_x: number;
  offset_y: number;
  premultiplied_alpha: boolean;
  mix_duration: number;
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
/** Key trong bảng application_statuses (HR tự thêm/bớt). "new" và "rejected" luôn tồn tại (is_system). */
export type ApplicationStatus = string;

export type StatusKind = "open" | "won" | "lost";

export type StatusDef = {
  key: string;
  label: string;
  color: string;
  position: number;
  kind: StatusKind;
  remind_days: number | null;
  is_system: boolean;
};

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
  /** Tài khoản Leader phụ trách job (hr_users.id). */
  leader_user_id?: string | null;
};

/** Đề test của job (file R2 hoặc link ngoài). */
export type JobTest = {
  id: string;
  job_id: string;
  kind: "file" | "link";
  title: string;
  url: string;
  r2_key: string | null;
  file_name: string | null;
  file_size: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
};

/** Bài làm test của ứng viên — ứng viên tự nộp hoặc HR lưu hộ. */
export type TestSubmission = {
  id: string;
  application_id: string;
  kind: "file" | "link";
  url: string;
  r2_key: string | null;
  file_name: string | null;
  file_size: number | null;
  note: string | null;
  submitted_by: "candidate" | "hr";
  created_at: string;
};

export type AiEvaluation = {
  score: number;
  verdict: "strong_yes" | "yes" | "maybe" | "no";
  strengths: string[];
  concerns: string[];
  /** Nhận xét sơ bộ từ ≤4 ảnh portfolio (evaluate từ 2026-10-20). */
  portfolio_note?: string;
  portfolio_links?: { url: string; status: string; images_seen: number; videos_found: number; reason?: string }[];
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
  source: string | null;
  message: string | null;
  available_hours_per_week: string | null;
  status: ApplicationStatus;
  ai_score: number | null;
  ai_evaluation: AiEvaluation | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  referred_by: string | null;
  /** HR nhập — AI đọc khi chấm. */
  mbti_type: string | null;
  mbti_url: string | null;
  test_review: TestReview | null;
  /** Kết quả offer; null = chưa ghi. */
  offer_status?: "pending" | "accepted" | "declined" | null;
  created_at: string;
  jobs?: { title: string; slug: string };
  /** /api/hr/applications join sẵn để card biết có bài nộp chờ Leader chấm. */
  test_submissions?: { count: number }[];
  /** Chỉ phần lịch của các vòng PV — /api/hr/applications join sẵn để card hiện lịch. */
  interview_sessions?: Pick<InterviewSession, "id" | "round" | "title" | "scheduled_at" | "mode" | "meet_url">[];
};

/** Leader chấm bài test — một bản duy nhất, chấm lại thì ghi đè. */
export type TestReview = {
  verdict: "pass" | "consider" | "fail";
  score: number; // 1-10
  comment: string;
  reviewer: string;
  reviewed_at: string;
};

export type ApplicationComment = {
  id: string;
  application_id: string;
  author_name: string;
  author_user_id?: string | null;
  /** Vai của người viết (server join hr_users); null với comment cũ. */
  author_role?: string | null;
  /** id hr_users được @tag. */
  mentions?: string[];
  content: string;
  created_at: string;
};

// ── Phỏng vấn ────────────────────────────────────────────────────────────────

export type InterviewQuestion = {
  q: string;
  why: string;
  green_flag: string;
  red_flag: string;
};

export type InterviewQuestionGroup = {
  topic: string;
  questions: InterviewQuestion[];
};

export type InterviewQuestions = {
  generated_at: string;
  model: string;
  groups: InterviewQuestionGroup[];
};

export type InterviewEvaluation = {
  analyzed_at: string;
  model: string;
  score: number;
  verdict: "strong_yes" | "yes" | "maybe" | "no";
  fit_confirmed: boolean;
  confidence: "high" | "medium" | "low";
  summary: string;
  score_delta_reason: string;
  evidence: string[];
  red_flags: string[];
  follow_ups: string[];
  transcript_source: string;
  /** Điểm chấm hồ sơ trước PV — để so lệch trước/sau. */
  prior_score: number | null;
};

export type InterviewSession = {
  id: string;
  application_id: string;
  round: number;
  title: string | null;
  questions: InterviewQuestions | null;
  audio_url: string | null;
  audio_key: string | null;
  audio_bytes: number | null;
  transcript: string | null;
  transcript_source: string | null;
  evaluation: InterviewEvaluation | null;
  score: number | null;
  /** Lịch PV — online bắt buộc có meet_url (Google Meet). */
  scheduled_at: string | null;
  mode: "offline" | "online" | null;
  meet_url: string | null;
  reminded_at: string | null;
  /** Phân tích chạy nền: null = rảnh/xong, "running", "failed" (lý do ở analysis_error). */
  analysis_status?: "running" | "failed" | null;
  analysis_error?: string | null;
  analysis_started_at?: string | null;
  created_at: string;
  updated_at: string;
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

/** Mail HR đã gửi cho ứng viên (bảng candidate_emails). */
export type CandidateEmail = {
  id: string;
  application_id: string;
  interview_id: string | null;
  kind: import("@/lib/hr-email").CandidateEmailKind;
  to_email: string;
  sent_to: string;
  cc_emails?: string[] | null;
  test_mode: boolean;
  subject: string;
  body_text: string;
  body_html: string;
  resend_id: string | null;
  sent_by: string | null;
  created_at: string;
};
