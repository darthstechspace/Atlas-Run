-- Atlas Run V2 schema (uses gen_random_uuid, built-in on Supabase/Postgres 13+)

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  level int not null default 1,
  xp int not null default 0,
  gems int not null default 150,
  total_miles double precision not null default 0,
  streak_days int not null default 0,
  skill_path text,
  equipped jsonb not null default '{}'::jsonb,
  equipped_title text,
  unlocked_titles jsonb not null default '[]'::jsonb,
  safe_mode_enabled boolean not null default false,
  opened_chests int not null default 0,
  cosmetics jsonb not null default '[]'::jsonb,
  quests jsonb not null default '[]'::jsonb,
  badges jsonb not null default '[]'::jsonb,
  ghost_runs jsonb not null default '[]'::jsonb,
  collected_landmarks jsonb not null default '[]'::jsonb,
  personal_records jsonb not null default '{}'::jsonb,
  saved_routes jsonb not null default '[]'::jsonb,
  last_lat double precision,
  last_lng double precision,
  sync_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.unlocked_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id text,
  center_latitude double precision not null,
  center_longitude double precision not null,
  radius_meters double precision not null default 100,
  created_at timestamptz not null default now()
);

create index unlocked_areas_user_id_idx on public.unlocked_areas(user_id);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  distance_miles double precision not null,
  duration_sec int not null,
  polyline jsonb not null default '[]'::jsonb,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);

create index runs_user_id_idx on public.runs(user_id);
create index runs_started_at_idx on public.runs(started_at desc);

create table public.landmark_cache (
  place_id text primary key,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  category text not null default 'Historic',
  rarity text not null default 'Common',
  lore text,
  created_at timestamptz not null default now()
);

create index landmark_cache_geo_idx on public.landmark_cache(latitude, longitude);

create table public.user_landmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id text not null references public.landmark_cache(place_id),
  last_opened_at timestamptz,
  collected_at timestamptz not null default now(),
  unique(user_id, place_id)
);

create index user_landmarks_user_id_idx on public.user_landmarks(user_id);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index friendships_requester_idx on public.friendships(requester_id);
create index friendships_addressee_idx on public.friendships(addressee_id);

create table public.weekly_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  miles double precision not null default 0,
  zones_cleared int not null default 0,
  landmarks_found int not null default 0,
  primary key (user_id, week_start)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1),
    'explorer'
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'explorer' || substr(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, username)
  values (new.id, base_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Leaderboard RPC
create or replace function public.get_leaderboard(
  p_category text default 'distance',
  p_scope text default 'global',
  p_limit int default 50
)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  score numeric,
  rank bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_week_start date := date_trunc('week', now())::date;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  return query
  with friend_ids as (
    select case when f.requester_id = v_me then f.addressee_id else f.requester_id end as fid
    from friendships f
    where f.status = 'accepted'
      and (f.requester_id = v_me or f.addressee_id = v_me)
  ),
  scoped as (
    select p.id, p.username, p.avatar_url,
      case p_category
        when 'fog' then (select count(*)::numeric from unlocked_areas ua where ua.user_id = p.id)
        when 'landmarks' then (select count(*)::numeric from user_landmarks ul where ul.user_id = p.id)
        when 'level' then p.level::numeric
        else coalesce((select ws.miles from weekly_stats ws where ws.user_id = p.id and ws.week_start = v_week_start), 0)::numeric
      end as score
    from profiles p
    where p_scope = 'global'
       or p.id = v_me
       or p.id in (select fid from friend_ids)
  ),
  ranked as (
    select s.*, row_number() over (order by s.score desc, s.username asc) as rk
    from scoped s
  )
  select r.id, r.username, r.avatar_url, r.score, r.rk
  from ranked r
  order by r.rk
  limit p_limit;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.unlocked_areas enable row level security;
alter table public.runs enable row level security;
alter table public.landmark_cache enable row level security;
alter table public.user_landmarks enable row level security;
alter table public.friendships enable row level security;
alter table public.weekly_stats enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Unlocked areas
create policy "unlocked_areas_select_own" on public.unlocked_areas for select using (auth.uid() = user_id);
create policy "unlocked_areas_insert_own" on public.unlocked_areas for insert with check (auth.uid() = user_id);
create policy "unlocked_areas_delete_own" on public.unlocked_areas for delete using (auth.uid() = user_id);

-- Runs
create policy "runs_select_own" on public.runs for select using (auth.uid() = user_id);
create policy "runs_insert_own" on public.runs for insert with check (auth.uid() = user_id);

-- Landmark cache (read-only for clients)
create policy "landmark_cache_select" on public.landmark_cache for select using (true);

-- User landmarks
create policy "user_landmarks_select_own" on public.user_landmarks for select using (auth.uid() = user_id);
create policy "user_landmarks_insert_own" on public.user_landmarks for insert with check (auth.uid() = user_id);
create policy "user_landmarks_update_own" on public.user_landmarks for update using (auth.uid() = user_id);

-- Friendships
create policy "friendships_select" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_insert" on public.friendships for insert
  with check (auth.uid() = requester_id);
create policy "friendships_update" on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Weekly stats
create policy "weekly_stats_select" on public.weekly_stats for select using (true);
create policy "weekly_stats_insert_own" on public.weekly_stats for insert with check (auth.uid() = user_id);
create policy "weekly_stats_update_own" on public.weekly_stats for update using (auth.uid() = user_id);

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_upload_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_update_own" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
