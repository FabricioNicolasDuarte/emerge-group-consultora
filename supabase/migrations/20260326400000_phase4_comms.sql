-- =============================================================================
-- Campus Emerge — Fase 4: anuncios y notificaciones
-- Ejecutar en Supabase SQL Editor después del hotfix de permisos
-- =============================================================================

do $$ begin
  create type public.announcement_audience as enum ('all', 'students', 'teachers', 'course');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.announcement_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  audience public.announcement_audience not null default 'all',
  course_id uuid references public.courses (id) on delete set null,
  status public.announcement_status not null default 'draft',
  is_pinned boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  notification_type text not null default 'info',
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_status on public.announcements (status, published_at desc);
create index if not exists idx_notifications_user on public.notifications (user_id, is_read, created_at desc);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Funciones de notificación automática
-- -----------------------------------------------------------------------------

create or replace function public.user_has_role_slug(p_user_id uuid, p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id and r.slug = p_slug
  );
$$;

create or replace function public.notify_announcement_recipients(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.announcements%rowtype;
  v_link text;
begin
  select * into v_row from public.announcements where id = p_announcement_id;
  if not found or v_row.status <> 'published' then
    return;
  end if;

  v_link := '/campus/student#avisos';

  if v_row.audience = 'course' and v_row.course_id is not null then
    insert into public.notifications (user_id, title, body, notification_type, link_url)
    select distinct target.user_id, v_row.title, left(v_row.body, 280), 'announcement', v_link
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
  select p.id, v_row.title, left(v_row.body, 280), 'announcement', v_link
  from public.profiles p
  where
    v_row.audience = 'all'
    or (v_row.audience = 'students' and public.user_has_role_slug(p.id, 'alumno'))
    or (
      v_row.audience = 'teachers'
      and (
        public.user_has_role_slug(p.id, 'docente')
        or public.user_has_role_slug(p.id, 'tutor')
      )
    );
end;
$$;

create or replace function public.set_announcement_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists announcements_set_published_at on public.announcements;
create trigger announcements_set_published_at
  before insert or update of status on public.announcements
  for each row execute function public.set_announcement_published_at();

create or replace function public.handle_announcement_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    perform public.notify_announcement_recipients(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists announcements_notify_on_publish on public.announcements;
create trigger announcements_notify_on_publish
  after insert or update of status on public.announcements
  for each row execute function public.handle_announcement_notify();

create or replace function public.handle_enrollment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_slug text;
begin
  select c.title, c.slug into v_title, v_slug
  from public.courses c
  where c.id = new.course_id;

  insert into public.notifications (user_id, title, body, notification_type, link_url)
  values (
    new.student_id,
    'Inscripción confirmada',
    'Quedaste inscripto en ' || coalesce(v_title, 'un curso'),
    'enrollment',
    '/campus/cursos/' || coalesce(v_slug, '')
  );

  return new;
end;
$$;

drop trigger if exists enrollments_notify_student on public.enrollments;
create trigger enrollments_notify_student
  after insert on public.enrollments
  for each row execute function public.handle_enrollment_notification();

create or replace function public.handle_grade_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment record;
begin
  if new.score is null then
    return new;
  end if;

  select a.title, a.is_published, c.slug as course_slug
  into v_assessment
  from public.assessments a
  join public.courses c on c.id = a.course_id
  where a.id = new.assessment_id;

  if not v_assessment.is_published then
    return new;
  end if;

  insert into public.notifications (user_id, title, body, notification_type, link_url)
  values (
    new.student_id,
    'Nueva calificación',
    'Se publicó tu nota en ' || v_assessment.title || ': ' || new.score,
    'grade',
    '/campus/student#notas'
  );

  return new;
end;
$$;

drop trigger if exists student_grades_notify on public.student_grades;
create trigger student_grades_notify
  after insert or update of score on public.student_grades
  for each row execute function public.handle_grade_notification();

-- -----------------------------------------------------------------------------
-- Vistas
-- -----------------------------------------------------------------------------

create or replace view public.campus_announcements as
select
  a.id,
  a.title,
  a.body,
  a.audience,
  a.course_id,
  a.is_pinned,
  a.published_at,
  a.expires_at,
  c.title as course_title,
  c.slug as course_slug
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
  a.is_pinned,
  a.published_at
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
  a.audience,
  a.course_id,
  a.status,
  a.is_pinned,
  a.published_at,
  a.expires_at,
  a.created_at,
  c.title as course_title
from public.announcements a
left join public.courses c on c.id = a.course_id
order by a.created_at desc;

create or replace view public.my_notifications as
select
  n.id,
  n.title,
  n.body,
  n.notification_type,
  n.link_url,
  n.is_read,
  n.created_at
from public.notifications n
where n.user_id = auth.uid()
order by n.created_at desc;

create or replace view public.my_unread_notifications as
select count(*)::int as unread_count
from public.notifications n
where n.user_id = auth.uid() and n.is_read = false;

grant select on public.campus_announcements to authenticated;
grant select on public.public_announcements to anon, authenticated;
grant select on public.admin_announcements to authenticated;
grant select on public.my_notifications to authenticated;
grant select on public.my_unread_notifications to authenticated;

alter view if exists public.public_announcements set (security_invoker = false);
alter view if exists public.admin_announcements set (security_invoker = false);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

create policy "announcements_select_published_public" on public.announcements for select
  using (
    status = 'published'
    and audience = 'all'
    and (published_at is null or published_at <= now())
    and (expires_at is null or expires_at > now())
  );

create policy "announcements_select_staff" on public.announcements for select
  using (public.can_manage_academics());

create policy "announcements_select_audience" on public.announcements for select
  using (
    status = 'published'
    and (
      (audience = 'students' and public.user_has_role_slug(auth.uid(), 'alumno'))
      or (
        audience = 'teachers'
        and (
          public.user_has_role_slug(auth.uid(), 'docente')
          or public.user_has_role_slug(auth.uid(), 'tutor')
        )
      )
      or (
        audience = 'course'
        and course_id is not null
        and (
          public.is_enrolled_or_completed(course_id)
          or public.is_course_teacher(course_id)
        )
      )
    )
  );

create policy "announcements_manage_staff" on public.announcements for all
  using (public.can_manage_academics())
  with check (public.can_manage_academics());

create policy "notifications_select_own" on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_insert_staff" on public.notifications for insert
  with check (public.can_manage_academics());

-- -----------------------------------------------------------------------------
-- Privilegios y datos de ejemplo
-- -----------------------------------------------------------------------------

grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update on public.notifications to authenticated;

insert into public.announcements (title, body, audience, status, is_pinned, published_at)
select v.title, v.body, v.audience::public.announcement_audience, v.status::public.announcement_status, v.is_pinned, now()
from (values
  (
    'Bienvenidos al Campus Emerge',
    'Ya podés explorar los programas de formación, acceder a tus cursos y seguir tu progreso desde tu panel personal.',
    'all',
    'published',
    true
  ),
  (
    'Nuevo encuentro de Liderazgo Sanmartiniano',
    'Recordá revisar la sección de asistencia para confirmar tu participación en el próximo encuentro sincrónico.',
    'students',
    'published',
    false
  )
) as v(title, body, audience, status, is_pinned)
where not exists (
  select 1 from public.announcements existing where existing.title = v.title
);
