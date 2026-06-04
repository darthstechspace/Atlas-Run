-- Cross-device friends: atomic send + accept when reverse request exists

create or replace function public.send_friend_request(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_target_id uuid;
  v_target_username text;
  v_existing public.friendships%rowtype;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  select p.id, p.username
  into v_target_id, v_target_username
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;

  if v_target_id is null then
    return jsonb_build_object('ok', false, 'error', 'User not found');
  end if;

  if v_target_id = v_me then
    return jsonb_build_object('ok', false, 'error', 'Cannot add yourself');
  end if;

  select *
  into v_existing
  from public.friendships f
  where (f.requester_id = v_me and f.addressee_id = v_target_id)
     or (f.requester_id = v_target_id and f.addressee_id = v_me)
  limit 1;

  if found then
    if v_existing.status = 'accepted' then
      return jsonb_build_object('ok', false, 'error', 'Already friends');
    end if;
    if v_existing.status = 'pending' then
      if v_existing.requester_id = v_target_id then
        update public.friendships set status = 'accepted' where id = v_existing.id;
        return jsonb_build_object('ok', true, 'accepted', true, 'username', v_target_username);
      end if;
      return jsonb_build_object('ok', false, 'error', 'Friend request already sent');
    end if;
    if v_existing.status = 'declined' then
      delete from public.friendships where id = v_existing.id;
      insert into public.friendships (requester_id, addressee_id, status)
      values (v_me, v_target_id, 'pending');
      return jsonb_build_object('ok', true, 'username', v_target_username);
    end if;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_me, v_target_id, 'pending');

  return jsonb_build_object('ok', true, 'username', v_target_username);
end;
$$;

revoke all on function public.send_friend_request(text) from public;
revoke all on function public.send_friend_request(text) from anon;
grant execute on function public.send_friend_request(text) to authenticated;

-- Pending requests visible to both requester and addressee (for cross-device sync)
drop policy if exists "friendships_select" on public.friendships;
create policy "friendships_select" on public.friendships
  for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
