-- Landmarks leaderboard: count profile collected_landmarks (source of truth) and user_landmarks rows.
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
        when 'landmarks' then greatest(
          (select count(*)::numeric from user_landmarks ul where ul.user_id = p.id),
          coalesce(jsonb_array_length(p.collected_landmarks), 0)::numeric
        )
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
