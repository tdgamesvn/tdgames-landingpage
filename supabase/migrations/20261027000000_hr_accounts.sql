-- Tài khoản & phân quyền cho /hr: hr_users, phiên đăng nhập, token mời/đặt lại mật khẩu,
-- ghi đè quyền theo vai. Chỉ service role đọc/ghi (RLS bật, không policy).
-- Vai: boss (toàn quyền, không ghi đè), hr, leader, accountant.

CREATE TABLE IF NOT EXISTS public.hr_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE, -- lưu lower-case
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('boss', 'hr', 'leader', 'accountant')),
  password_hash text,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.hr_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.hr_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_sessions_user_idx ON public.hr_sessions (user_id);

CREATE TABLE IF NOT EXISTS public.hr_user_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.hr_users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('invite', 'reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_role_permissions (
  role text NOT NULL CHECK (role IN ('hr', 'leader', 'accountant')),
  permission text NOT NULL,
  allowed boolean NOT NULL,
  PRIMARY KEY (role, permission)
);

ALTER TABLE public.hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_role_permissions ENABLE ROW LEVEL SECURITY;

-- Leader phụ trách job
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS leader_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL;

-- Kết quả offer
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS offer_status text CHECK (offer_status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN IF NOT EXISTS offer_status_at timestamptz;

-- Tác giả comment
ALTER TABLE public.application_comments
  ADD COLUMN IF NOT EXISTS author_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL;

-- Mail: thêm loại 'offer', CC, người gửi
ALTER TABLE public.candidate_emails DROP CONSTRAINT IF EXISTS candidate_emails_kind_check;
ALTER TABLE public.candidate_emails ADD CONSTRAINT candidate_emails_kind_check CHECK (kind IN (
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer'
));
ALTER TABLE public.candidate_emails
  ADD COLUMN IF NOT EXISTS cc_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sent_by_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL;

-- Push subscription gắn với tài khoản
ALTER TABLE public.hr_push_subscriptions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.hr_users(id) ON DELETE CASCADE;
