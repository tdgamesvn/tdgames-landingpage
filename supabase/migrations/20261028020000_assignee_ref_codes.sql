-- Người phụ trách hồ sơ + mã ref của tài khoản /hr (sếp duyệt 2026-10-28).
-- ref_codes: mã giới thiệu đã chuẩn hoá (src/lib/hr-ref-codes.ts); phần tử đầu = mã chính.
-- Mỗi mã chỉ thuộc 1 tài khoản — kiểm ở API /api/hr/users (409).
alter table public.hr_users
  add column if not exists ref_codes text[] not null default '{}';

-- Người phụ trách: nhận mọi thông báo của hồ sơ. Xoá tài khoản → hồ sơ về "chưa giao".
alter table public.applications
  add column if not exists assignee_user_id uuid references public.hr_users(id) on delete set null;

create index if not exists applications_assignee_user_id_idx on public.applications (assignee_user_id);
