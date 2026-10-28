-- Sếp duyệt thư mời nhận việc trước khi gửi mail offer.
-- draft → (gửi duyệt) pending → approved | changes_requested. Sếp tự lưu thư = approved.
-- Thư đã lưu trước migration này giữ 'draft' (phải được Sếp duyệt / Sếp lưu lại mới gửi mail offer được).

ALTER TABLE public.offer_letters
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'pending', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS submitted_by text,
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS reviewed_by_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;

-- Lọc nhanh hồ sơ có thư chờ Sếp duyệt (nhãn trên thẻ pipeline).
CREATE INDEX IF NOT EXISTS offer_letters_pending_idx ON public.offer_letters (approval_status) WHERE approval_status = 'pending';
