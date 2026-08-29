-- =============================================================================
-- Campus Emerge — Docentes/tutores pueden gestionar anuncios visuales
-- Ejecutar en Supabase SQL Editor (después de 20260327000000_mailbox_rich_announcements.sql)
-- =============================================================================

create or replace function public.can_manage_announcements()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_compose_mailbox();
$$;

grant execute on function public.can_manage_announcements() to authenticated;

-- announcements
drop policy if exists "announcements_select_staff" on public.announcements;
create policy "announcements_select_staff" on public.announcements for select
  using (public.can_manage_announcements());

drop policy if exists "announcements_manage_staff" on public.announcements;
create policy "announcements_manage_staff" on public.announcements for all
  using (public.can_manage_announcements())
  with check (public.can_manage_announcements());

-- announcement_media
drop policy if exists "announcement_media_manage_staff" on public.announcement_media;
create policy "announcement_media_manage_staff" on public.announcement_media for all
  using (public.can_manage_announcements())
  with check (public.can_manage_announcements());

drop policy if exists "announcement_media_select_published" on public.announcement_media;
create policy "announcement_media_select_published" on public.announcement_media for select
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and (
          a.status = 'published'
          or public.can_manage_announcements()
        )
    )
  );

-- storage: announcement-media
drop policy if exists "announcement_media_staff_insert" on storage.objects;
create policy "announcement_media_staff_insert" on storage.objects for insert
  with check (bucket_id = 'announcement-media' and public.can_manage_announcements());

drop policy if exists "announcement_media_staff_update" on storage.objects;
create policy "announcement_media_staff_update" on storage.objects for update
  using (bucket_id = 'announcement-media' and public.can_manage_announcements());

drop policy if exists "announcement_media_staff_delete" on storage.objects;
create policy "announcement_media_staff_delete" on storage.objects for delete
  using (bucket_id = 'announcement-media' and public.can_manage_announcements());

-- vistas campus: staff docente/tutor ve borradores en panel
drop view if exists public.campus_announcements;
create or replace view public.campus_announcements as
select
  a.id,
  a.title,
  a.body,
  a.body_html,
  a.design_json,
  a.excerpt,
  a.background_color,
  a.accent_color,
  a.cover_image_path,
  a.layout_style,
  a.audience,
  a.course_id,
  a.is_pinned,
  a.published_at,
  a.expires_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'media_type', m.media_type,
          'storage_path', m.storage_path,
          'public_url', m.public_url,
          'title', m.title,
          'mime_type', m.mime_type,
          'sort_order', m.sort_order
        ) order by m.sort_order
      )
      from public.announcement_media m
      where m.announcement_id = a.id
    ),
    '[]'::jsonb
  ) as media
from public.announcements a
where
  (
    a.status = 'published'
    and (a.published_at is null or a.published_at <= now())
    and (a.expires_at is null or a.expires_at > now())
    and (
      a.audience = 'all'
      or (a.audience = 'students' and public.user_has_role_slug(auth.uid(), 'alumno'))
      or (a.audience = 'teachers' and (
        public.user_has_role_slug(auth.uid(), 'docente')
        or public.user_has_role_slug(auth.uid(), 'tutor')
      ))
      or (
        a.audience = 'course'
        and a.course_id is not null
        and (
          public.is_enrolled_or_completed(a.course_id)
          or public.is_course_teacher(a.course_id)
          or public.can_manage_announcements()
        )
      )
    )
  )
  or public.can_manage_announcements()
order by a.is_pinned desc, a.published_at desc nulls last;

grant select on public.campus_announcements to authenticated;
alter view if exists public.campus_announcements set (security_invoker = false);
