-- Fix: al borrar un curso, el trigger de auditoría intentaba insertar audit_logs
-- con course_id = id ya eliminado → viola audit_logs_course_id_fkey.
-- Guardamos el id del curso solo en metadata y dejamos course_id en null.

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
    -- course_id debe ser null: el curso ya no existe (AFTER DELETE)
    perform public.log_audit_event(
      'deleted',
      'course',
      old.id,
      null,
      'Curso eliminado: ' || old.title,
      jsonb_build_object('title', old.title, 'deleted_course_id', old.id)
    );
    return old;
  end if;
  return null;
end;
$$;
