-- ── jobs ──────────────────────────────────────────────────────────────────────
CREATE TABLE public.jobs (
  id               uuid        DEFAULT gen_random_uuid() NOT NULL,
  title            text        NOT NULL,
  slug             text        NOT NULL,
  description      text        NOT NULL DEFAULT '',
  type             text        NOT NULL,
  location         text        NOT NULL DEFAULT 'Remote',
  level            text        NOT NULL DEFAULT '',
  salary           text        NOT NULL DEFAULT '',
  rate_per_hour    text,
  categories       text[]      NOT NULL DEFAULT '{}',
  image_url        text        NOT NULL DEFAULT '',
  summary          text        NOT NULL DEFAULT '',
  responsibilities text[]      NOT NULL DEFAULT '{}',
  requirements     text[]      NOT NULL DEFAULT '{}',
  nice_to_have     text[]      NOT NULL DEFAULT '{}',
  skills           text[]      NOT NULL DEFAULT '{}',
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_slug_key UNIQUE (slug),
  CONSTRAINT jobs_type_check CHECK (type IN ('fulltime', 'parttime', 'remote', 'freelancer'))
);

-- ── applications ──────────────────────────────────────────────────────────────
CREATE TABLE public.applications (
  id               uuid        DEFAULT gen_random_uuid() NOT NULL,
  job_id           uuid        NOT NULL,
  full_name        text        NOT NULL,
  email            text        NOT NULL,
  phone            text,
  work_type        text        NOT NULL,
  years_experience integer,
  cv_url           text,
  portfolio_url    text,
  linkedin_url     text,
  website_url      text,
  expected_salary  text,
  available_from   text,
  rate_per_hour    text,
  status           text        NOT NULL DEFAULT 'new',
  admin_notes      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT applications_status_check CHECK (status IN ('new', 'reviewing', 'interview', 'offer', 'rejected'))
);

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_jobs_updated_at();

CREATE OR REPLACE FUNCTION public.set_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_applications_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Public can read active jobs
CREATE POLICY "jobs_public_read" ON public.jobs
  FOR SELECT USING (is_active = true);

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX jobs_is_active_idx ON public.jobs (is_active);
CREATE INDEX applications_job_id_idx ON public.applications (job_id);
CREATE INDEX applications_status_idx ON public.applications (status);
CREATE INDEX applications_created_at_idx ON public.applications (created_at DESC);
