-- =============================================================================
-- Asistencia: motivo en justificadas + solo superadmin edita/borra registros
-- =============================================================================

-- Justificado exige motivo (notes)
alter table public.attendance_records
  drop constraint if exists attendance_excused_needs_notes;

alter table public.attendance_records
  add constraint attendance_excused_needs_notes
  check (status <> 'excused'::public.attendance_status or length(trim(notes)) > 0);

-- RLS: insert staff del curso; update/delete solo superadmin
drop policy if exists "attendance_manage_track" on public.attendance_records;

drop policy if exists "attendance_insert_track" on public.attendance_records;
create policy "attendance_insert_track" on public.attendance_records for insert
  with check (
    exists (
      select 1 from public.course_sessions cs
      where cs.id = session_id and public.can_track_course(cs.course_id)
    )
  );

drop policy if exists "attendance_update_superadmin" on public.attendance_records;
create policy "attendance_update_superadmin" on public.attendance_records for update
  using (public.has_role('superadmin'))
  with check (public.has_role('superadmin'));

drop policy if exists "attendance_delete_superadmin" on public.attendance_records;
create policy "attendance_delete_superadmin" on public.attendance_records for delete
  using (public.has_role('superadmin'));

-- Sesiones: crear staff; borrar solo superadmin (cascade borra asistencia)
drop policy if exists "sessions_manage_track" on public.course_sessions;

drop policy if exists "sessions_insert_track" on public.course_sessions;
create policy "sessions_insert_track" on public.course_sessions for insert
  with check (public.can_track_course(course_id));

drop policy if exists "sessions_update_track" on public.course_sessions;
create policy "sessions_update_track" on public.course_sessions for update
  using (public.can_track_course(course_id))
  with check (public.can_track_course(course_id));

drop policy if exists "sessions_delete_superadmin" on public.course_sessions;
create policy "sessions_delete_superadmin" on public.course_sessions for delete
  using (public.has_role('superadmin'));

-- Historial por alumno dentro de un curso (staff)
drop view if exists public.course_student_attendance cascade;
create view public.course_student_attendance as
select
  e.course_id,
  e.student_id,
  p.full_name,
  p.email,
  p.avatar_url,
  count(cs.id)::int as total_sessions,
  count(ar.id)::int as marked_sessions,
  count(ar.id) filter (where ar.status in ('present', 'late'))::int as present_count,
  count(ar.id) filter (where ar.status = 'absent')::int as absent_count,
  count(ar.id) filter (where ar.status = 'late')::int as late_count,
  count(ar.id) filter (where ar.status = 'excused')::int as excused_count,
  case
    when count(ar.id) = 0 then 0
    else round(
      (count(ar.id) filter (where ar.status in ('present', 'late'))::numeric
        / count(ar.id)::numeric) * 100
    )::int
  end as attendance_percent
from public.enrollments e
join public.profiles p on p.id = e.student_id
left join public.course_sessions cs on cs.course_id = e.course_id
left join public.attendance_records ar
  on ar.session_id = cs.id and ar.student_id = e.student_id
where e.status = 'active'
  and public.can_track_course(e.course_id)
group by e.course_id, e.student_id, p.full_name, p.email, p.avatar_url;

grant select on public.course_student_attendance to authenticated;

-- Detalle de registros de un alumno en un curso (staff)
drop view if exists public.course_student_attendance_detail cascade;
create view public.course_student_attendance_detail as
select
  ar.id,
  ar.status,
  ar.notes,
  ar.marked_at,
  ar.student_id,
  cs.id as session_id,
  cs.course_id,
  cs.title as session_title,
  cs.session_date,
  cs.start_time
from public.attendance_records ar
join public.course_sessions cs on cs.id = ar.session_id
where public.can_track_course(cs.course_id);

grant select on public.course_student_attendance_detail to authenticated;
