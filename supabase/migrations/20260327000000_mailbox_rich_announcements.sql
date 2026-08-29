-- =============================================================================
-- Campus Emerge — Buzón interno + anuncios visuales con multimedia
-- Ejecutar en Supabase SQL Editor después de las migraciones anteriores
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Permisos de redacción
-- -----------------------------------------------------------------------------

create or replace function public.can_compose_mailbox()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_manage_academics()
    or public.user_has_role_slug(auth.uid(), 'docente')
    or public.user_has_role_slug(auth.uid(), 'tutor');
$$;

-- -----------------------------------------------------------------------------
-- 2. Buzón interno
-- -----------------------------------------------------------------------------

create table if not exists public.mailbox_threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  created_by uuid references public.profiles (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  thread_kind text not null default 'direct' check (thread_kind in ('direct', 'alert')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mailbox_participants (
  thread_id uuid not null references public.mailbox_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  participant_role text not null default 'member' check (participant_role in ('owner', 'member')),
  is_archived boolean not null default false,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.mailbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.mailbox_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body_html text not null default '',
  body_text text not null default '',
  message_type text not null default 'message' check (message_type in ('message', 'alert', 'reply')),
  created_at timestamptz not null default now()
);

create table if not exists public.mailbox_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.mailbox_messages (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_mailbox_threads_last on public.mailbox_threads (last_message_at desc);
create index if not exists idx_mailbox_participants_user on public.mailbox_participants (user_id, is_archived);
create index if not exists idx_mailbox_messages_thread on public.mailbox_messages (thread_id, created_at asc);

drop trigger if exists mailbox_threads_set_updated_at on public.mailbox_threads;
create trigger mailbox_threads_set_updated_at
  before update on public.mailbox_threads
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Anuncios visuales (extensión)
-- -----------------------------------------------------------------------------

alter table public.announcements
  add column if not exists body_html text not null default '',
  add column if not exists design_json jsonb,
  add column if not exists background_color text not null default '#ffffff',
  add column if not exists accent_color text not null default '#0D2C54',
  add column if not exists excerpt text not null default '',
  add column if not exists cover_image_path text,
  add column if not exists layout_style text not null default 'card';

create table if not exists public.announcement_media (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video', 'file')),
  storage_path text not null,
  public_url text,
  title text not null default '',
  mime_type text,
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcement_media_announcement
  on public.announcement_media (announcement_id, sort_order);

-- Bucket para medios de anuncios (público para lectura en landing/campus)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-media',
  'announcement-media',
  true,
  104857600,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 4. Funciones del buzón
-- -----------------------------------------------------------------------------

create or replace function public.is_mailbox_participant(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mailbox_participants mp
    where mp.thread_id = p_thread_id
      and mp.user_id = auth.uid()
  );
$$;

create or replace function public.mailbox_touch_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mailbox_threads
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists mailbox_messages_touch_thread on public.mailbox_messages;
create trigger mailbox_messages_touch_thread
  after insert on public.mailbox_messages
  for each row execute function public.mailbox_touch_thread();

create or replace function public.mailbox_send_message(
  p_recipient_id uuid,
  p_subject text,
  p_body_html text,
  p_body_text text,
  p_message_type text default 'message',
  p_course_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
  v_sender uuid := auth.uid();
begin
  if v_sender is null then
    raise exception 'No autenticado';
  end if;

  if not public.can_compose_mailbox() then
    raise exception 'No tenés permiso para enviar mensajes';
  end if;

  if p_recipient_id is null or p_recipient_id = v_sender then
    raise exception 'Destinatario inválido';
  end if;

  insert into public.mailbox_threads (subject, created_by, course_id, thread_kind)
  values (
    trim(p_subject),
    v_sender,
    p_course_id,
    case when p_message_type = 'alert' then 'alert' else 'direct' end
  )
  returning id into v_thread_id;

  insert into public.mailbox_participants (thread_id, user_id, participant_role)
  values
    (v_thread_id, v_sender, 'owner'),
    (v_thread_id, p_recipient_id, 'member');

  insert into public.mailbox_messages (thread_id, sender_id, body_html, body_text, message_type)
  values (v_thread_id, v_sender, coalesce(p_body_html, ''), coalesce(p_body_text, ''), coalesce(p_message_type, 'message'));

  return v_thread_id;
end;
$$;

create or replace function public.mailbox_reply(
  p_thread_id uuid,
  p_body_html text,
  p_body_text text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_message_id uuid;
begin
  if v_sender is null then
    raise exception 'No autenticado';
  end if;

  if not public.is_mailbox_participant(p_thread_id) then
    raise exception 'No tenés acceso a esta conversación';
  end if;

  insert into public.mailbox_messages (thread_id, sender_id, body_html, body_text, message_type)
  values (p_thread_id, v_sender, coalesce(p_body_html, ''), coalesce(p_body_text, ''), 'reply')
  returning id into v_message_id;

  return v_message_id;
end;
$$;

create or replace function public.mailbox_mark_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mailbox_participants
  set last_read_at = now()
  where thread_id = p_thread_id
    and user_id = auth.uid();
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Actualizar notificación de anuncios publicados
-- -----------------------------------------------------------------------------

create or replace function public.notify_announcement_recipients(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.announcements%rowtype;
  v_link text;
  v_excerpt text;
begin
  select * into v_row from public.announcements where id = p_announcement_id;
  if not found or v_row.status <> 'published' then
    return;
  end if;

  v_link := '/campus/anuncios/' || v_row.id::text;
  v_excerpt := left(coalesce(nullif(trim(v_row.excerpt), ''), nullif(trim(v_row.body), ''), 'Nuevo anuncio en el campus'), 280);

  if v_row.audience = 'course' and v_row.course_id is not null then
    insert into public.notifications (user_id, title, body, notification_type, link_url)
    select distinct target.user_id, v_row.title, v_excerpt, 'announcement', v_link
    from (
      select e.student_id as user_id
      from public.enrollments e
      where e.course_id = v_row.course_id and e.status in ('active', 'completed')
      union
      select ca.teacher_id as user_id
      from public.course_assignments ca
      where ca.course_id = v_row.course_id
    ) target;
    return;
  end if;

  insert into public.notifications (user_id, title, body, notification_type, link_url)
  select p.id, v_row.title, v_excerpt, 'announcement', v_link
  from public.profiles p
  where p.is_active = true
    and (
      v_row.audience = 'all'
      or (v_row.audience = 'students' and public.user_has_role_slug(p.id, 'alumno'))
      or (
        v_row.audience = 'teachers'
        and (
          public.user_has_role_slug(p.id, 'docente')
          or public.user_has_role_slug(p.id, 'tutor')
        )
      )
    );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Vistas
-- -----------------------------------------------------------------------------

drop view if exists public.campus_announcements;
drop view if exists public.public_announcements;
drop view if exists public.admin_announcements;

create or replace view public.campus_announcements as
select
  a.id,
  a.title,
  a.body,
  a.body_html,
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
  c.title as course_title,
  c.slug as course_slug,
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
left join public.courses c on c.id = a.course_id
where a.status = 'published'
  and (a.published_at is null or a.published_at <= now())
  and (a.expires_at is null or a.expires_at > now())
  and (
    a.audience = 'all'
    or (a.audience = 'students' and public.user_has_role_slug(auth.uid(), 'alumno'))
    or (
      a.audience = 'teachers'
      and (
        public.user_has_role_slug(auth.uid(), 'docente')
        or public.user_has_role_slug(auth.uid(), 'tutor')
        or public.can_manage_academics()
      )
    )
    or (
      a.audience = 'course'
      and a.course_id is not null
      and (
        public.can_manage_academics()
        or public.is_course_teacher(a.course_id)
        or public.is_enrolled_or_completed(a.course_id)
      )
    )
  )
order by a.is_pinned desc, a.published_at desc nulls last;

create or replace view public.public_announcements as
select
  a.id,
  a.title,
  a.body,
  a.body_html,
  a.excerpt,
  a.background_color,
  a.accent_color,
  a.cover_image_path,
  a.layout_style,
  a.is_pinned,
  a.published_at,
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
where a.status = 'published'
  and a.audience = 'all'
  and (a.published_at is null or a.published_at <= now())
  and (a.expires_at is null or a.expires_at > now())
order by a.is_pinned desc, a.published_at desc nulls last;

create or replace view public.admin_announcements as
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
  a.status,
  a.is_pinned,
  a.published_at,
  a.expires_at,
  a.created_at,
  a.updated_at,
  c.title as course_title,
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
left join public.courses c on c.id = a.course_id
order by a.created_at desc;

create or replace view public.my_mailbox_threads as
select
  t.id as thread_id,
  t.subject,
  t.thread_kind,
  t.course_id,
  t.last_message_at,
  t.created_at,
  mp.is_archived,
  mp.last_read_at,
  (
    select count(*)::int
    from public.mailbox_messages mm
    where mm.thread_id = t.id
      and mm.sender_id <> auth.uid()
      and (mp.last_read_at is null or mm.created_at > mp.last_read_at)
  ) as unread_count,
  (
    select mm.body_text
    from public.mailbox_messages mm
    where mm.thread_id = t.id
    order by mm.created_at desc
    limit 1
  ) as last_message_preview,
  (
    select p.full_name
    from public.mailbox_participants other_mp
    join public.profiles p on p.id = other_mp.user_id
    where other_mp.thread_id = t.id
      and other_mp.user_id <> auth.uid()
    order by other_mp.joined_at
    limit 1
  ) as other_participant_name
from public.mailbox_threads t
join public.mailbox_participants mp on mp.thread_id = t.id
where mp.user_id = auth.uid()
order by t.last_message_at desc;

create or replace view public.mailbox_thread_messages as
select
  mm.id,
  mm.thread_id,
  mm.sender_id,
  p.full_name as sender_name,
  p.email as sender_email,
  mm.body_html,
  mm.body_text,
  mm.message_type,
  mm.created_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', ma.id,
          'storage_path', ma.storage_path,
          'file_name', ma.file_name,
          'mime_type', ma.mime_type,
          'file_size', ma.file_size
        )
      )
      from public.mailbox_attachments ma
      where ma.message_id = mm.id
    ),
    '[]'::jsonb
  ) as attachments
from public.mailbox_messages mm
join public.profiles p on p.id = mm.sender_id
where public.is_mailbox_participant(mm.thread_id)
order by mm.created_at asc;

create or replace view public.my_mailbox_unread as
select coalesce(sum(unread_count), 0)::int as unread_count
from public.my_mailbox_threads
where not is_archived;

create or replace view public.mailbox_contacts as
select
  p.id,
  p.full_name,
  p.email,
  array_agg(distinct r.slug order by r.slug) as role_slugs
from public.profiles p
join public.user_roles ur on ur.user_id = p.id
join public.roles r on r.id = ur.role_id
where p.is_active = true
  and p.id <> auth.uid()
  and (
    public.can_manage_academics()
    or public.user_has_role_slug(auth.uid(), 'docente')
    or public.user_has_role_slug(auth.uid(), 'tutor')
  )
group by p.id, p.full_name, p.email
order by p.full_name;

grant select on public.campus_announcements to authenticated;
grant select on public.public_announcements to anon, authenticated;
grant select on public.admin_announcements to authenticated;
grant select on public.my_mailbox_threads to authenticated;
grant select on public.mailbox_thread_messages to authenticated;
grant select on public.my_mailbox_unread to authenticated;
grant select on public.mailbox_contacts to authenticated;

grant execute on function public.mailbox_send_message(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function public.mailbox_reply(uuid, text, text) to authenticated;
grant execute on function public.mailbox_mark_thread_read(uuid) to authenticated;

alter view if exists public.public_announcements set (security_invoker = false);
alter view if exists public.admin_announcements set (security_invoker = false);
alter view if exists public.mailbox_contacts set (security_invoker = false);

-- -----------------------------------------------------------------------------
-- 7. RLS buzón
-- -----------------------------------------------------------------------------

alter table public.mailbox_threads enable row level security;
alter table public.mailbox_participants enable row level security;
alter table public.mailbox_messages enable row level security;
alter table public.mailbox_attachments enable row level security;
alter table public.announcement_media enable row level security;

create policy "mailbox_threads_select_participant" on public.mailbox_threads for select
  using (public.is_mailbox_participant(id));

create policy "mailbox_threads_insert_compose" on public.mailbox_threads for insert
  with check (public.can_compose_mailbox());

create policy "mailbox_threads_update_participant" on public.mailbox_threads for update
  using (public.is_mailbox_participant(id));

create policy "mailbox_participants_select_own" on public.mailbox_participants for select
  using (user_id = auth.uid() or public.is_mailbox_participant(thread_id));

create policy "mailbox_participants_insert_compose" on public.mailbox_participants for insert
  with check (public.can_compose_mailbox() or user_id = auth.uid());

create policy "mailbox_participants_update_own" on public.mailbox_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "mailbox_messages_select_participant" on public.mailbox_messages for select
  using (public.is_mailbox_participant(thread_id));

create policy "mailbox_messages_insert_participant" on public.mailbox_messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_mailbox_participant(thread_id)
  );

create policy "mailbox_attachments_select_participant" on public.mailbox_attachments for select
  using (
    exists (
      select 1 from public.mailbox_messages mm
      where mm.id = message_id and public.is_mailbox_participant(mm.thread_id)
    )
  );

create policy "mailbox_attachments_insert_sender" on public.mailbox_attachments for insert
  with check (
    exists (
      select 1 from public.mailbox_messages mm
      where mm.id = message_id and mm.sender_id = auth.uid()
    )
  );

create policy "announcement_media_select_published" on public.announcement_media for select
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and (
          (a.status = 'published' and a.audience = 'all')
          or public.can_manage_academics()
        )
    )
  );

create policy "announcement_media_manage_staff" on public.announcement_media for all
  using (public.can_manage_academics())
  with check (public.can_manage_academics());

-- Notificaciones: permitir archivar (marcar leída ya existe)
create policy "notifications_delete_own" on public.notifications for delete
  using (user_id = auth.uid());

grant select, insert, update, delete on public.mailbox_threads to authenticated;
grant select, insert, update on public.mailbox_participants to authenticated;
grant select, insert on public.mailbox_messages to authenticated;
grant select, insert on public.mailbox_attachments to authenticated;
grant select, insert, update, delete on public.announcement_media to authenticated;
grant delete on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Storage policies — announcement-media
-- -----------------------------------------------------------------------------

create policy "announcement_media_public_read" on storage.objects for select
  using (bucket_id = 'announcement-media');

create policy "announcement_media_staff_insert" on storage.objects for insert
  with check (bucket_id = 'announcement-media' and public.can_manage_academics());

create policy "announcement_media_staff_update" on storage.objects for update
  using (bucket_id = 'announcement-media' and public.can_manage_academics());

create policy "announcement_media_staff_delete" on storage.objects for delete
  using (bucket_id = 'announcement-media' and public.can_manage_academics());

-- mailbox attachments bucket (privado)
insert into storage.buckets (id, name, public, file_size_limit)
values ('mailbox-attachments', 'mailbox-attachments', false, 52428800)
on conflict (id) do nothing;

create policy "mailbox_attachments_read" on storage.objects for select
  using (
    bucket_id = 'mailbox-attachments'
    and auth.role() = 'authenticated'
  );

create policy "mailbox_attachments_insert" on storage.objects for insert
  with check (
    bucket_id = 'mailbox-attachments'
    and public.can_compose_mailbox()
  );

create policy "mailbox_attachments_delete" on storage.objects for delete
  using (
    bucket_id = 'mailbox-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
