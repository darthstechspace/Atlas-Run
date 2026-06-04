-- Allow signed-in clients to upsert atlas catalog rows before user_landmarks FK insert.
create policy "landmark_cache_insert_authenticated"
  on public.landmark_cache
  for insert
  to authenticated
  with check (true);

create policy "landmark_cache_update_authenticated"
  on public.landmark_cache
  for update
  to authenticated
  using (true);
