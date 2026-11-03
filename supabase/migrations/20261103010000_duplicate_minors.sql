-- Ứng viên trùng — sửa nốt (2026-11-03). Không DROP: PG17 cho đổi công thức cột sinh tại chỗ.

-- Khớp normalizeEmail (JS trim bỏ cả tab/NBSP).
alter table public.applications alter column email_norm set expression as (
  nullif(lower(regexp_replace(email, '^[\s ]+|[\s ]+$', '', 'g')), '')
);

-- Khớp normalizePhone: 84/840 + 9 số → 0…; 9 số bắt đầu 2/3/5/7/8/9 (VN thiếu 0) → 0…; < 9 số → null.
alter table public.applications alter column phone_norm set expression as (
  case
    when length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) < 9 then null
    when regexp_replace(phone, '\D', '', 'g') ~ '^840?\d{9}$'
      then '0' || right(regexp_replace(phone, '\D', '', 'g'), 9)
    when regexp_replace(phone, '\D', '', 'g') ~ '^[235789]\d{8}$'
      then '0' || regexp_replace(phone, '\D', '', 'g')
    else regexp_replace(phone, '\D', '', 'g')
  end
);

-- HR đổi status của đơn auto_rejected (mở lại…) → thành hồ sơ HR xử lý ("returning"),
-- để lần reject tay sau đó được tính làm mốc 6 tháng.
create or replace function public.applications_touch_status_changed_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.status_changed_at := now();
  if old.duplicate_kind = 'auto_rejected' then
    new.duplicate_kind := 'returning';
  end if;
  return new;
end $$;
