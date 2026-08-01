-- Ảnh sinh bằng AI vẫn là media_assets row bình thường (source_type 'external',
-- host trên R2). ai_prompt not null = ảnh AI → truy vết được nguồn gốc.
ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS ai_prompt text;
