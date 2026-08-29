-- =============================================================================
-- Campus Emerge — Fase 5: auditoría, reportes y logs de actividad
-- Ejecutar en Supabase SQL Editor después de la Fase 4
-- =============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  course_id uuid references public.courses (id) on delete set null,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_audit_logs_course on public.audit_logs (course_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Función central de auditoría (solo triggers / security definer)
-- -----------------------------------------------------------------------------

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_course_id uuid default null,
  p_summary text default '',
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    course_id,
    summary,
    metadata
  )
  values (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_course_id,
    coalesce(p_summary, ''),
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers de auditoría
-- -----------------------------------------------------------------------------

create or replace function public.audit_courses_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_summary text;
begin
  if tg_op = 'INSERT' then
    perform public.log_audit_event(
      'created', 'course', new.id, new.id,
      'Curso creado: ' || new.title,
      jsonb_build_object('title', new.title, 'status', new.status)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      v_action := 'status_changed';
      v_summary := 'Curso "' || new.title || '" → ' || new.status::text;
    else
      v_action := 'updated';
      v_summary := 'Curso actualizado: ' || new.title;
    end if;
    perform public.log_audit_event(
      v_action, 'course', new.id, new.id, v_summary,
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'title', new.title
      )
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.log_audit_event(
      'deleted', 'course', old.id, old.id,
      'Curso eliminado: ' || old.title,
      jsonb_build_object('title', old.title)
    );
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists audit_courses on public.courses;
create trigger audit_courses
  after insert or update or delete on public.courses
  for each row execute function public.audit_courses_changes();

create or replace function public.audit_enrollments_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_course_title text;
  v_summary text;
begin
  select p.full_name into v_student_name from public.profiles p where p.id = coalesce(new.student_id, old.student_id);
  select c.title into v_course_title from public.courses c where c.id = coalesce(new.course_id, old.course_id);

  if tg_op = 'INSERT' then
    v_summary := 'Inscripción: ' || coalesce(v_student_name, 'alumno') || ' en ' || coalesce(v_course_title, 'curso');
    perform public.log_audit_event(
      'created', 'enrollment', new.id, new.course_id, v_summary,
      jsonb_build_object('student_id', new.student_id, 'status', new.status)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status or old.progress_percent is distinct from new.progress_percent then
      v_summary := 'Inscripción actualizada: ' || coalesce(v_student_name, 'alumno')
        || ' (' || new.progress_percent || '%)';
      perform public.log_audit_event(
        'updated', 'enrollment', new.id, new.course_id, v_summary,
        jsonb_build_object(
          'old_status', old.status,
          'new_status', new.status,
          'old_progress', old.progress_percent,
          'new_progress', new.progress_percent
        )
      );
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists audit_enrollments on public.enrollments;
create trigger audit_enrollments
  after insert or update on public.enrollments
  for each row execute function public.audit_enrollments_changes();

create or replace function public.audit_student_grades_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_course_title text;
  v_student_name text;
  v_assessment_title text;
  v_summary text;
begin
  select a.course_id, a.title into v_course_id, v_assessment_title
  from public.assessments a
  where a.id = coalesce(new.assessment_id, old.assessment_id);

  select p.full_name into v_student_name
  from public.profiles p
  where p.id = coalesce(new.student_id, old.student_id);

  select c.title into v_course_title from public.courses c where c.id = v_course_id;

  if tg_op = 'INSERT' then
    v_summary := 'Nota cargada: ' || coalesce(v_student_name, 'alumno')
      || ' en ' || coalesce(v_assessment_title, 'evaluación');
    perform public.log_audit_event(
      'created', 'grade', new.id, v_course_id, v_summary,
      jsonb_build_object('score', new.score, 'student_id', new.student_id)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    if old.score is distinct from new.score then
      v_summary := 'Nota actualizada: ' || coalesce(v_student_name, 'alumno')
        || ' (' || coalesce(new.score::text, '—') || ')';
      perform public.log_audit_event(
        'updated', 'grade', new.id, v_course_id, v_summary,
        jsonb_build_object('old_score', old.score, 'new_score', new.score)
      );
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists audit_student_grades on public.student_grades;
create trigger audit_student_grades
  after insert or update on public.student_grades
  for each row execute function public.audit_student_grades_changes();

create or replace function public.audit_announcements_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_summary text;
begin
  if tg_op = 'INSERT' then
    v_action := case when new.status = 'published' then 'published' else 'created' end;
    v_summary := 'Anuncio: ' || new.title;
    perform public.log_audit_event(
      v_action, 'announcement', new.id, new.course_id, v_summary,
      jsonb_build_object('audience', new.audience, 'status', new.status)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status and new.status = 'published' then
      v_action := 'published';
      v_summary := 'Anuncio publicado: ' || new.title;
    elsif old.status is distinct from new.status then
      v_action := 'status_changed';
      v_summary := 'Anuncio "' || new.title || '" → ' || new.status::text;
    else
      v_action := 'updated';
      v_summary := 'Anuncio actualizado: ' || new.title;
    end if;
    perform public.log_audit_event(
      v_action, 'announcement', new.id, new.course_id, v_summary,
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.log_audit_event(
      'deleted', 'announcement', old.id, old.course_id,
      'Anuncio eliminado: ' || old.title,
      jsonb_build_object('title', old.title)
    );
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists audit_announcements on public.announcements;
create trigger audit_announcements
  after insert or update or delete on public.announcements
  for each row execute function public.audit_announcements_changes();

create or replace function public.audit_attendance_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_student_name text;
  v_session_title text;
begin
  select cs.course_id, cs.title into v_course_id, v_session_title
  from public.course_sessions cs
  where cs.id = coalesce(new.session_id, old.session_id);

  select p.full_name into v_student_name
  from public.profiles p
  where p.id = coalesce(new.student_id, old.student_id);

  if tg_op = 'INSERT' then
    perform public.log_audit_event(
      'created', 'attendance', new.id, v_course_id,
      'Asistencia: ' || coalesce(v_student_name, 'alumno') || ' → ' || new.status::text,
      jsonb_build_object('session', v_session_title, 'status', new.status)
    );
    return new;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    perform public.log_audit_event(
      'updated', 'attendance', new.id, v_course_id,
      'Asistencia actualizada: ' || coalesce(v_student_name, 'alumno') || ' → ' || new.status::text,
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
    return new;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_attendance on public.attendance_records;
create trigger audit_attendance
  after insert or update on public.attendance_records
  for each row execute function public.audit_attendance_changes();

-- -----------------------------------------------------------------------------
-- Vistas de reportes y auditoría
-- -----------------------------------------------------------------------------

create or replace view public.admin_activity_log as
select
  al.id,
  al.action,
  al.entity_type,
  al.entity_id,
  al.course_id,
  al.summary,
  al.metadata,
  al.created_at,
  al.actor_id,
  p.full_name as actor_name,
  p.email as actor_email,
  c.title as course_title
from public.audit_logs al
left join public.profiles p on p.id = al.actor_id
left join public.courses c on c.id = al.course_id
order by al.created_at desc;

create or replace view public.campus_report_summary as
select
  (select count(*)::int from public.courses where status = 'published') as published_courses,
  (select count(*)::int from public.enrollments where status = 'active') as active_enrollments,
  (select count(*)::int from public.enrollments where status = 'completed') as completed_enrollments,
  (
    select coalesce(round(avg(e.progress_percent), 0), 0)::int
    from public.enrollments e
    where e.status in ('active', 'completed')
  ) as avg_progress_percent,
  (select count(distinct e.student_id)::int from public.enrollments e) as unique_students,
  (
    select count(*)::int
    from public.audit_logs
    where created_at >= now() - interval '30 days'
  ) as activity_last_30_days,
  (
    select coalesce(
      round(
        count(*) filter (where ar.status in ('present', 'late'))::numeric
        / nullif(count(*)::numeric, 0) * 100,
        1
      ),
      0
    )
    from public.attendance_records ar
  ) as attendance_rate_percent,
  (
    select coalesce(round(avg(sg.score), 1), 0)
    from public.student_grades sg
    where sg.score is not null
  ) as avg_grade;

create or replace view public.course_performance_report as
select
  c.id as course_id,
  c.title as course_title,
  c.category,
  c.status,
  coalesce(active_enr.cnt, 0)::int as active_enrollments,
  coalesce(completed_enr.cnt, 0)::int as completed_enrollments,
  coalesce(round(avg_prog.avg_progress, 0), 0)::int as avg_progress_percent,
  coalesce(attendance.attendance_rate, 0)::numeric(5, 1) as attendance_rate_percent,
  coalesce(grades.avg_score, 0)::numeric(6, 1) as avg_grade
from public.courses c
left join lateral (
  select count(*) as cnt
  from public.enrollments e
  where e.course_id = c.id and e.status = 'active'
) active_enr on true
left join lateral (
  select count(*) as cnt
  from public.enrollments e
  where e.course_id = c.id and e.status = 'completed'
) completed_enr on true
left join lateral (
  select avg(e.progress_percent) as avg_progress
  from public.enrollments e
  where e.course_id = c.id
) avg_prog on true
left join lateral (
  select
    case
      when count(*) = 0 then 0
      else round(
        count(*) filter (where ar.status in ('present', 'late'))::numeric
        / count(*)::numeric * 100,
        1
      )
    end as attendance_rate
  from public.course_sessions cs
  join public.attendance_records ar on ar.session_id = cs.id
  where cs.course_id = c.id
) attendance on true
left join lateral (
  select avg(sg.score) as avg_score
  from public.assessments a
  join public.student_grades sg on sg.assessment_id = a.id
  where a.course_id = c.id and sg.score is not null
) grades on true
order by c.title;

create or replace view public.enrollment_report as
select
  e.id,
  e.enrolled_at,
  e.completed_at,
  e.status,
  e.progress_percent,
  p.id as student_id,
  p.full_name as student_name,
  p.email as student_email,
  c.id as course_id,
  c.title as course_title,
  c.category as course_category
from public.enrollments e
join public.profiles p on p.id = e.student_id
join public.courses c on c.id = e.course_id
order by e.enrolled_at desc;

grant select on public.admin_activity_log to authenticated;
grant select on public.campus_report_summary to authenticated;
grant select on public.course_performance_report to authenticated;
grant select on public.enrollment_report to authenticated;

alter view public.admin_activity_log set (security_invoker = false);
alter view public.campus_report_summary set (security_invoker = false);
alter view public.course_performance_report set (security_invoker = false);
alter view public.enrollment_report set (security_invoker = false);

-- -----------------------------------------------------------------------------
-- RLS: solo staff puede leer logs; inserción solo vía triggers
-- -----------------------------------------------------------------------------

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_staff" on public.audit_logs;
create policy "audit_logs_select_staff"
  on public.audit_logs for select
  using (public.can_manage_academics());

grant select on public.audit_logs to authenticated;
