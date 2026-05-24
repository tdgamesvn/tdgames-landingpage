-- ── blog_posts table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  excerpt     text NOT NULL DEFAULT '',
  tag         text NOT NULL DEFAULT 'Blog',
  cover_image text NOT NULL DEFAULT '',
  content_md  text NOT NULL DEFAULT '',
  published   boolean NOT NULL DEFAULT false,
  views       integer NOT NULL DEFAULT 0,
  author      text NOT NULL DEFAULT 'TD Games',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── updated_at trigger ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public: read published posts only
CREATE POLICY "public_read_published"
  ON blog_posts FOR SELECT
  USING (published = true);

-- ── indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_created_idx
  ON blog_posts (published, created_at DESC);
