-- ── leads (quote requests từ form public) ────────────────────────────────────
CREATE TABLE public.leads (
  id          uuid        DEFAULT gen_random_uuid() NOT NULL,
  name        text        NOT NULL,
  email       text        NOT NULL,
  service     text        NOT NULL,
  budget      text,
  message     text        NOT NULL DEFAULT '',
  source      text        NOT NULL DEFAULT 'contact-form',
  status      text        NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_status_check
    CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost'))
);

CREATE OR REPLACE FUNCTION public.set_leads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_leads_updated_at();

-- RLS on, không policy public → chỉ service role (server) đọc/ghi được.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX leads_status_idx ON public.leads (status);
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
