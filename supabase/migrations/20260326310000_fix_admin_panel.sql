-- =============================================================================
-- Campus Emerge — Hotfix: permisos admin panel
-- Ejecutar en Supabase SQL Editor si el panel admin falla al cargar datos
-- =============================================================================

-- GRANT base: RLS filtra filas, pero authenticated necesita privilegio de tabla
grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

grant select on public.roles to authenticated;

grant select on public.user_roles to authenticated;

-- Fase 1 académico
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.course_assignments to authenticated;

-- Fase 2 contenido
grant select, insert, update, delete on public.lesson_materials to authenticated;
grant select, insert, delete on public.lesson_completions to authenticated;

-- Fase 3 asistencia y notas
grant select, insert, update, delete on public.course_sessions to authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.student_grades to authenticated;

grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update on public.notifications to authenticated;

-- Fase 5 auditoría y reportes
grant select on public.audit_logs to authenticated;

alter view if exists public.admin_activity_log set (security_invoker = false);
alter view if exists public.campus_report_summary set (security_invoker = false);
alter view if exists public.course_performance_report set (security_invoker = false);
alter view if exists public.enrollment_report set (security_invoker = false);

-- Fase 6 pagos, certificados y videoconferencia
grant select, insert on public.course_payments to authenticated;
grant select on public.certificates to authenticated;

alter view if exists public.admin_certificates set (security_invoker = false);
alter view if exists public.admin_payments set (security_invoker = false);
alter view if exists public.my_certificates set (security_invoker = false);
alter view if exists public.my_payment_history set (security_invoker = false);
alter view if exists public.upcoming_live_sessions set (security_invoker = false);

-- Coordinadores también deben listar roles de alumnos
drop policy if exists "user_roles_select_academics" on public.user_roles;
create policy "user_roles_select_academics"
  on public.user_roles for select
  using (public.can_manage_academics() or auth.uid() = user_id);

-- Vistas admin: ejecutar con permisos del dueño para evitar bloqueos RLS en conteos
alter view if exists public.admin_course_stats set (security_invoker = false);
alter view if exists public.recent_enrollments set (security_invoker = false);
alter view if exists public.course_session_stats set (security_invoker = false);
