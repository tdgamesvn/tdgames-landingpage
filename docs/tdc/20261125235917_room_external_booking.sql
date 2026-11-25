-- Đặt phòng họp từ hệ thống ngoài (TD Games /hr — tdgamestudio.com/hr).
-- TDG gọi 4 RPC room_ext_* qua REST bằng anon key + mật mã riêng (TDC chỉ lưu băm SHA-256 ở
-- room_external_clients). RPC chỉ đụng các booking có external_source của chính bên gọi.
-- Thiết kế: repo TDG docs/superpowers/specs/2026-11-25-hr-tdc-room-booking-design.md

alter table public.room_bookings
  add column if not exists external_source text,
  add column if not exists external_ref    text;

-- 1 lịch bên ngoài (vd 1 buổi PV bên TDG) chỉ giữ tối đa 1 booking đang hiệu lực
create unique index if not exists room_bookings_external_uq
  on public.room_bookings (external_source, external_ref) where status = 'booked';

create table if not exists public.room_external_clients (
  source        text primary key check (source ~ '^[a-z0-9_]{2,20}$'),
  key_hash      text not null,                 -- sha256 hex của mật mã
  booker_prefix text not null,                 -- vd 'TD Games HR'
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.room_external_clients enable row level security;  -- không policy ⇒ chỉ RPC đọc
revoke all on table public.room_external_clients from anon, authenticated;

-- Kiểm mật mã → trả bên gọi
create or replace function public.room_ext_auth(p_key text)
returns public.room_external_clients
language plpgsql stable security definer set search_path = '' as $$
declare c public.room_external_clients;
begin
  if p_key is null or length(p_key) < 32 then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  select * into c from public.room_external_clients
   where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') and active;
  if not found then raise exception 'unauthorized' using errcode = '28000'; end if;
  return c;
end $$;

-- Phòng đang dùng + trống/bận theo khung giờ; booking của chính p_ref không tính bận
create or replace function public.room_ext_rooms(p_key text, p_start timestamptz, p_end timestamptz,
                                                 p_ref text default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c public.room_external_clients := public.room_ext_auth(p_key);
begin
  if p_start is null or p_end is null or p_end <= p_start or p_end - p_start > interval '24 hours' then
    raise exception 'bad_time' using errcode = '22023';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', r.id, 'name', r.name, 'location', r.location, 'capacity', r.capacity,
             'free', not exists (
               select 1 from public.room_bookings b
                where b.room_id = r.id and b.status = 'booked'
                  and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start, p_end, '[)')
                  and not (coalesce(b.external_source, '') = c.source
                           and coalesce(b.external_ref, '') = coalesce(p_ref, '-'))))
           order by r.sort, r.name)
      from public.room_rooms r where r.active), '[]'::jsonb);
end $$;

-- Đặt mới hoặc sửa đúng booking cũ của p_ref. Trùng giờ ⇒ 'room_busy', booking cũ giữ nguyên.
create or replace function public.room_ext_upsert(p_key text, p_ref text, p_room uuid,
                                                  p_start timestamptz, p_end timestamptz,
                                                  p_title text, p_booker text default null)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  c public.room_external_clients := public.room_ext_auth(p_key);
  v_id uuid; v_room text; v_title text; v_booker text; v_try int := 0;
begin
  if p_ref is null or length(btrim(p_ref)) not between 1 and 100 then
    raise exception 'bad_ref' using errcode = '22023';
  end if;
  if p_start is null or p_end is null or p_end <= p_start or p_end - p_start > interval '24 hours'
     or p_start < now() - interval '5 minutes' then
    raise exception 'bad_time' using errcode = '22023';
  end if;
  select r.name into v_room from public.room_rooms r where r.id = p_room and r.active;
  if v_room is null then raise exception 'bad_room' using errcode = '22023'; end if;

  v_title  := left(coalesce(nullif(btrim(p_title), ''), 'Họp ' || c.booker_prefix), 200);
  v_booker := left(c.booker_prefix || coalesce(' – ' || nullif(btrim(p_booker), ''), ''), 100);

  loop
    begin
      v_id := null;
      update public.room_bookings
         set room_id = p_room, start_at = p_start, end_at = p_end, title = v_title, is_private = true
       where external_source = c.source and external_ref = p_ref and status = 'booked'
      returning id into v_id;
      if v_id is null then
        insert into public.room_bookings (room_id, title, note, start_at, end_at, is_private,
                                          booked_by, booker_name, external_source, external_ref)
        values (p_room, v_title, 'Đặt từ ' || c.booker_prefix || ' — sửa/huỷ bên đó', p_start, p_end, true,
                null, v_booker, c.source, p_ref)
        returning id into v_id;
      end if;
      exit;
    exception
      when exclusion_violation then
        raise exception 'room_busy' using errcode = 'P0001';
      when unique_violation then          -- 2 lệnh đồng thời cùng ref ⇒ thử lại nhánh update 1 lần
        v_try := v_try + 1;
        if v_try > 1 then raise; end if;
    end;
  end loop;

  return jsonb_build_object('booking_id', v_id, 'room_id', p_room, 'room_name', v_room,
                            'start_at', p_start, 'end_at', p_end);
end $$;

-- Trả phòng (gọi lặp vô hại)
create or replace function public.room_ext_cancel(p_key text, p_ref text)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare c public.room_external_clients := public.room_ext_auth(p_key); n int;
begin
  update public.room_bookings set status = 'cancelled'
   where external_source = c.source and external_ref = p_ref and status = 'booked';
  get diagnostics n = row_count;
  return jsonb_build_object('cancelled', n);
end $$;

-- Booking đang hiệu lực của p_ref (hoặc null)
create or replace function public.room_ext_get(p_key text, p_ref text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c public.room_external_clients := public.room_ext_auth(p_key);
begin
  return jsonb_build_object('booking', (
    select jsonb_build_object('booking_id', b.id, 'room_id', b.room_id, 'room_name', r.name,
                              'start_at', b.start_at, 'end_at', b.end_at)
      from public.room_bookings b join public.room_rooms r on r.id = b.room_id
     where b.external_source = c.source and b.external_ref = p_ref and b.status = 'booked'
     limit 1));
end $$;

revoke all on function public.room_ext_auth(text) from public, anon, authenticated;
revoke all on function public.room_ext_rooms(text, timestamptz, timestamptz, text) from public, authenticated;
revoke all on function public.room_ext_upsert(text, text, uuid, timestamptz, timestamptz, text, text) from public, authenticated;
revoke all on function public.room_ext_cancel(text, text) from public, authenticated;
revoke all on function public.room_ext_get(text, text) from public, authenticated;
grant execute on function public.room_ext_rooms(text, timestamptz, timestamptz, text) to anon;
grant execute on function public.room_ext_upsert(text, text, uuid, timestamptz, timestamptz, text, text) to anon;
grant execute on function public.room_ext_cancel(text, text) to anon;
grant execute on function public.room_ext_get(text, text) to anon;

notify pgrst, 'reload schema';
