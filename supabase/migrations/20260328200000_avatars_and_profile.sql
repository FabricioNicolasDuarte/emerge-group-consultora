-- Avatares públicos + vista my_profile con ficha completa

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_all" on storage.objects;
create policy "avatars_select_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop view if exists public.my_profile;

create or replace view public.my_profile
with (security_invoker = true)
as
select
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.phone,
  p.city,
  p.job_role,
  p.occupation,
  p.audience,
  p.challenge,
  p.is_active,
  coalesce(
    array_agg(r.slug order by r.hierarchy desc) filter (where r.slug is not null),
    array[]::text[]
  ) as role_slugs,
  coalesce(
    array_agg(r.name order by r.hierarchy desc) filter (where r.slug is not null),
    array[]::text[]
  ) as role_names
from public.profiles p
left join public.user_roles ur on ur.user_id = p.id
left join public.roles r on r.id = ur.role_id
where p.id = auth.uid()
group by p.id;

grant select on public.my_profile to authenticated;
