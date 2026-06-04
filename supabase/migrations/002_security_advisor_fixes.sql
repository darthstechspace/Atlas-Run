-- Security advisor fixes (Atlas Run V2)

-- 1. Immutable search_path on trigger helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Restrict SECURITY DEFINER functions from anonymous/public execute
revoke all on function public.get_leaderboard(text, text, int) from public;
revoke all on function public.get_leaderboard(text, text, int) from anon;
grant execute on function public.get_leaderboard(text, text, int) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- 3. Avatars bucket: allow read of own files only (public URLs still work for the public bucket)
drop policy if exists "avatars_public_read" on storage.objects;

create policy "avatars_select_own" on storage.objects
  for select
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
