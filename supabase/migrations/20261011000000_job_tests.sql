-- Bài test theo job + bài làm của ứng viên.
-- job_tests: đề test (file R2 hoặc link) gắn với job.
-- test_submissions: bài làm của từng ứng viên — ứng viên tự nộp qua /test/<token>
--   hoặc HR lưu hộ (submitted_by = 'hr').
-- applications.test_token: token công khai cho trang /test/<token>, tạo lười khi HR
--   bấm "Copy link test".

CREATE TABLE public.job_tests (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id      uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN ('file', 'link')),
  title       text        NOT NULL DEFAULT '',
  url         text        NOT NULL,
  r2_key      text,
  file_name   text,
  file_size   bigint,
  note        text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_tests_job_id_idx ON public.job_tests (job_id, sort_order, created_at);
ALTER TABLE public.job_tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.test_submissions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  uuid        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  kind            text        NOT NULL CHECK (kind IN ('file', 'link')),
  url             text        NOT NULL,
  r2_key          text,
  file_name       text,
  file_size       bigint,
  note            text,
  submitted_by    text        NOT NULL DEFAULT 'candidate' CHECK (submitted_by IN ('candidate', 'hr')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX test_submissions_app_idx ON public.test_submissions (application_id, created_at);
ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS test_token text UNIQUE;
