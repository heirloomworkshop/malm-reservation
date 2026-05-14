-- 다이닝 맑음 예약 시스템 스키마 (최신)

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity_min integer not null,
  capacity_max integer not null
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  date date not null,
  time text not null,
  guests integer not null,
  room_id uuid references rooms(id) on delete set null,
  menu_type text not null check (menu_type in ('점심-한정식', '점심-코스', '저녁-한정식', '저녁-코스')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  menu_requests text,
  allergies text,
  created_at timestamptz not null default now()
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

-- 공간 기본 데이터
insert into rooms (name, capacity_min, capacity_max) values
  ('룸', 2, 20),
  ('홀', 2, 50)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- 기존 DB 마이그레이션 (이미 스키마를 실행한 경우 아래 실행)
-- ────────────────────────────────────────────────────────────
-- alter table reservations add column if not exists menu_requests text;
-- alter table reservations add column if not exists allergies text;
-- alter table reservations drop column if exists memo;
-- alter table reservations drop constraint if exists reservations_menu_type_check;
-- alter table reservations add constraint reservations_menu_type_check
--   check (menu_type in ('점심-한정식', '점심-코스', '저녁-한정식', '저녁-코스'));
-- create table if not exists blocked_dates (
--   id uuid primary key default gen_random_uuid(),
--   date date not null unique,
--   reason text,
--   created_at timestamptz not null default now()
-- );
-- -- 룸 A/B/C/D → 룸/홀 교체
-- delete from rooms;
-- insert into rooms (name, capacity_min, capacity_max) values ('룸', 2, 20), ('홀', 2, 50);
