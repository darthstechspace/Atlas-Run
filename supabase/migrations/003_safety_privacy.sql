-- Atlas Run safety & privacy (003)

-- 1. Replace open profiles SELECT with owner-only full access
drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

-- 2. Public profile fields for username search (no location or movement history)
create or replace function public.search_profiles_by_username(p_username text)
returns table (id uuid, username text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username
  from public.profiles p
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

revoke all on function public.search_profiles_by_username(text) from public;
revoke all on function public.search_profiles_by_username(text) from anon;
grant execute on function public.search_profiles_by_username(text) to authenticated;

-- Public profile fields (no location or movement history) for search, leaderboards, pending requests
create or replace function public.get_public_profile_fields(p_user_ids uuid[])
returns table (
  id uuid,
  username text,
  level int,
  avatar_url text,
  equipped jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.level, p.avatar_url, p.equipped
  from public.profiles p
  where p.id = any(p_user_ids)
    and auth.uid() is not null;
$$;

revoke all on function public.get_public_profile_fields(uuid[]) from public;
revoke all on function public.get_public_profile_fields(uuid[]) from anon;
grant execute on function public.get_public_profile_fields(uuid[]) to authenticated;

-- 3. Friend-safe profile RPC with location obfuscation
create or replace function public.obfuscate_coords(
  p_lat double precision,
  p_lng double precision,
  p_user_id uuid
)
returns table (lat double precision, lng double precision)
language plpgsql
immutable
set search_path = public
as $$
declare
  grid_deg constant double precision := 0.0045;
  h bigint;
  offset_lat double precision;
  offset_lng double precision;
begin
  h := abs(hashtext(p_user_id::text));
  offset_lat := ((h % 1000)::double precision / 1000.0 - 0.5) * grid_deg * 0.4;
  offset_lng := (((h >> 10) % 1000)::double precision / 1000.0 - 0.5) * grid_deg * 0.4;
  lat := round(p_lat / grid_deg) * grid_deg + offset_lat;
  lng := round(p_lng / grid_deg) * grid_deg + offset_lng;
  return next;
end;
$$;

create or replace function public.get_friend_profiles(p_user_ids uuid[])
returns table (
  id uuid,
  username text,
  level int,
  avatar_url text,
  equipped jsonb,
  safe_mode_enabled boolean,
  public_lat double precision,
  public_lng double precision
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    p.id,
    p.username,
    p.level,
    p.avatar_url,
    p.equipped,
    p.safe_mode_enabled,
    case
      when p.safe_mode_enabled then o.lat
      else p.last_lat
    end as public_lat,
    case
      when p.safe_mode_enabled then o.lng
      else p.last_lng
    end as public_lng
  from public.profiles p
  cross join lateral public.obfuscate_coords(
    coalesce(p.last_lat, 0),
    coalesce(p.last_lng, 0),
    p.id
  ) o
  where p.id = any(p_user_ids)
    and (
      p.id = v_me
      or exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = v_me and f.addressee_id = p.id)
            or (f.addressee_id = v_me and f.requester_id = p.id)
          )
      )
    );
end;
$$;

revoke all on function public.get_friend_profiles(uuid[]) from public;
revoke all on function public.get_friend_profiles(uuid[]) from anon;
grant execute on function public.get_friend_profiles(uuid[]) to authenticated;

-- 4. Limit friend request spam (optional per plan)
create or replace function public.limit_friend_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.friendships
  where requester_id = new.requester_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 20 then
    raise exception 'Too many friend requests. Try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists friendships_rate_limit on public.friendships;
create trigger friendships_rate_limit
  before insert on public.friendships
  for each row execute procedure public.limit_friend_requests();
