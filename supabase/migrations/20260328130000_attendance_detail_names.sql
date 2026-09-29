-- Enrich attendance detail with student name for flat lists
drop view if exists public.course_student_attendance_detail;

create view public.course_student_attendance_detail as
select
  ar.id,
  ar.status,
  ar.notes,
  ar.marked_at,
  ar.student_id,
  p.full_name,
  p.email,
  p.avatar_url,
  cs.id as session_id,
  cs.course_id,
  cs.title as session_title,
  cs.session_date,
  cs.start_time
from public.attendance_records ar
join public.course_sessions cs on cs.id = ar.session_id
join public.profiles p on p.id = ar.student_id
where public.can_track_course(cs.course_id);

grant select on public.course_student_attendance_detail to authenticated;
