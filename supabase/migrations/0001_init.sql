-- LAST FREE DAY — schema per BRIEF §10.
-- One game instance, one groom, one admin. No multi-tenancy, no accounts
-- table — simplicity over flexibility, on purpose.

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists game_state (
  id            int primary key default 1 check (id = 1),
  status        text not null default 'idle' check (status in ('idle','running','paused','finished')),
  started_at    timestamptz,
  finished_at   timestamptz,
  skips_left    int not null default 2,
  groom_photo   text,
  bride_photo   text,
  bride_name    text,
  access_code   text not null default 'MALTA26'
);

create table if not exists tiles (
  id                 int primary key,
  position           int not null unique check (position between 0 and 15),
  category           text not null check (category in ('SPORT','LUDZIE','EKIPA','WSTYD','MALTA')),
  title              text not null,
  description        text not null,
  difficulty         int not null default 1 check (difficulty between 1 and 3),
  location           text,
  requires_proof     boolean not null default true,
  requires_approval  boolean not null default true,
  voiceover_url      text,
  video_url          text,
  updated_at         timestamptz not null default now()
);

create table if not exists tile_states (
  tile_id       int primary key references tiles(id) on delete cascade,
  state         text not null default 'locked' check (state in ('locked','active','pending','done','rejected')),
  opened_at     timestamptz,
  completed_at  timestamptz,
  reject_reason text
);

create table if not exists submissions (
  id            uuid primary key default gen_random_uuid(),
  tile_id       int references tiles(id) on delete cascade,
  media_url     text not null,
  media_type    text not null check (media_type in ('image','video')),
  created_at    timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at   timestamptz
);

create table if not exists minigames (
  key           text primary key check (key in ('drink-runner','pokusa')),
  slot          int not null unique check (slot in (1,2)),
  title         text not null,
  unlock_at     int not null,
  beaten        boolean not null default false,
  best_score    int not null default 0,
  attempts      int not null default 0,
  beaten_at     timestamptz,
  best_time_ms  int
);

create table if not exists minigame_attempts (
  id            uuid primary key default gen_random_uuid(),
  game_key      text references minigames(key) on delete cascade,
  score         int not null,
  won           boolean not null default false,
  duration_ms   int,
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in (
                  'tile_opened','proof_sent','approved','rejected','bingo',
                  'arena_unlocked','minigame_failed','minigame_won','game_finished',
                  -- game_paused/game_resumed aren't in BRIEF §10's literal list, but
                  -- events is the only realtime-safe, anon-readable channel to signal
                  -- PAUZA GRY (BRIEF §8.1) to the groom's device without adding
                  -- game_state (which carries access_code) to the realtime publication.
                  'game_paused','game_resumed'
                )),
  tile_id       int,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists events_created_at_idx on events (created_at desc);
create index if not exists submissions_status_idx on submissions (status);
create index if not exists submissions_tile_id_idx on submissions (tile_id);

-- ---------------------------------------------------------------------
-- Public view — same as game_state but WITHOUT access_code (BRIEF §10)
-- ---------------------------------------------------------------------

create or replace view game_state_public as
  select id, status, started_at, finished_at, skips_left, groom_photo, bride_photo, bride_name
  from game_state;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table game_state enable row level security;
alter table tiles enable row level security;
alter table tile_states enable row level security;
alter table submissions enable row level security;
alter table minigames enable row level security;
alter table minigame_attempts enable row level security;
alter table events enable row level security;

-- anon: read-only, and never the raw game_state (it holds access_code).
-- All writes happen via Server Actions on the service_role key — never
-- from the client (BRIEF §10 "Zapis stanu gry... nigdy z klienta").

drop policy if exists "tiles are publicly readable" on tiles;
create policy "tiles are publicly readable" on tiles
  for select to anon, authenticated using (true);

drop policy if exists "tile_states are publicly readable" on tile_states;
create policy "tile_states are publicly readable" on tile_states
  for select to anon, authenticated using (true);

drop policy if exists "minigames are publicly readable" on minigames;
create policy "minigames are publicly readable" on minigames
  for select to anon, authenticated using (true);

drop policy if exists "events are publicly readable" on events;
create policy "events are publicly readable" on events
  for select to anon, authenticated using (true);

drop policy if exists "approved submissions are publicly readable" on submissions;
create policy "approved submissions are publicly readable" on submissions
  for select to anon, authenticated using (status = 'approved');

-- The one Supabase Auth account is the admin (BRIEF §8 — single account,
-- gated by src/middleware.ts) — it needs to see PENDING submissions too,
-- both for the initial dashboard load and, more importantly, so its
-- Realtime subscription (browser client, still under RLS even though the
-- writes themselves go through service_role) actually receives new-proof
-- events for the "nie może ci umknąć" alert in BRIEF §8.1. Policies are
-- OR'd, so this only widens `authenticated`, not `anon`.
drop policy if exists "authenticated can read all submissions" on submissions;
create policy "authenticated can read all submissions" on submissions
  for select to authenticated using (true);

-- game_state itself: no anon/authenticated policy at all → RLS default-
-- denies every row. Only the public view (owned by the migration role,
-- queried with the caller's privileges revoked via security_invoker off
-- by default in Postgres <15 semantics) and service_role can read it.
grant select on game_state_public to anon, authenticated;
revoke all on game_state from anon, authenticated;

-- ---------------------------------------------------------------------
-- Realtime — /board and /live subscribe to these
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tile_states'
  ) then
    alter publication supabase_realtime add table tile_states;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table submissions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'minigames'
  ) then
    alter publication supabase_realtime add table minigames;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
  values ('proofs', 'proofs', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('faces', 'faces', true)
  on conflict (id) do nothing;

-- Public read for both buckets; all writes go through the service_role
-- key inside Server Actions, so no client-facing insert/update policy
-- is needed (and none is granted).
drop policy if exists "proofs are publicly readable" on storage.objects;
create policy "proofs are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'proofs');

drop policy if exists "faces are publicly readable" on storage.objects;
create policy "faces are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'faces');
