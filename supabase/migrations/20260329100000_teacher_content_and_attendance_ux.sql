-- Restaura mutación de contenido para staff académico y docentes asignados.
-- Permite corregir asistencia a quien puede trackear el curso.
-- Alumnos solo ven clases publicadas (RLS alineado con la UI).

create or replace function public.can_mutate_course_content(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_academics()
    or public.is_course_teacher(p_course_id)
    or public.has_role('superadmin');
$$;

-- =============================================================================
-- Módulos
-- =============================================================================
drop policy if exists "modules_mutate_superadmin" on public.modules;
drop policy if exists "modules_manage_staff" on public.modules;
drop policy if exists "modules_manage_teacher" on public.modules;

create policy "modules_manage_staff" on public.modules for all
  using (public.can_manage_academics() or public.has_role('superadmin'))
  with check (public.can_manage_academics() or public.has_role('superadmin'));

create policy "modules_manage_teacher" on public.modules for all
  using (public.is_course_teacher(course_id))
  with check (public.is_course_teacher(course_id));

-- =============================================================================
-- Clases: select estricto para alumnos + mutate staff/docente
-- =============================================================================
drop policy if exists "lessons_mutate_superadmin" on public.lessons;
drop policy if exists "lessons_manage_staff" on public.lessons;
drop policy if exists "lessons_manage_teacher" on public.lessons;
drop policy if exists "lessons_select_access" on public.lessons;

create policy "lessons_select_access" on public.lessons for select using (
  exists (
    select 1
    from public.modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id
      and (
        public.can_manage_academics()
        or public.has_role('superadmin')
        or public.is_course_teacher(c.id)
        or (
          c.status = 'published'
          and lessons.is_published
          and public.is_enrolled_in_course(c.id)
        )
      )
  )
);

create policy "lessons_manage_staff" on public.lessons for all
  using (
    exists (
      select 1 from public.modules m
      where m.id = module_id
        and (public.can_manage_academics() or public.has_role('superadmin'))
    )
  )
  with check (
    exists (
      select 1 from public.modules m
      where m.id = module_id
        and (public.can_manage_academics() or public.has_role('superadmin'))
    )
  );

create policy "lessons_manage_teacher" on public.lessons for all
  using (
    exists (
      select 1 from public.modules m
      where m.id = module_id and public.is_course_teacher(m.course_id)
    )
  )
  with check (
    exists (
      select 1 from public.modules m
      where m.id = module_id and public.is_course_teacher(m.course_id)
    )
  );

-- =============================================================================
-- Materiales
-- =============================================================================
drop policy if exists "lesson_materials_mutate_superadmin" on public.lesson_materials;
drop policy if exists "lesson_materials_manage_staff" on public.lesson_materials;
drop policy if exists "lesson_materials_manage_teacher" on public.lesson_materials;

create policy "lesson_materials_manage_staff" on public.lesson_materials for all
  using (public.can_manage_academics() or public.has_role('superadmin'))
  with check (public.can_manage_academics() or public.has_role('superadmin'));

create policy "lesson_materials_manage_teacher" on public.lesson_materials for all
  using (
    exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = lesson_id and public.is_course_teacher(m.course_id)
    )
  )
  with check (
    exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = lesson_id and public.is_course_teacher(m.course_id)
    )
  );

-- =============================================================================
-- Asistencia: quien trackea puede corregir; borrar sigue solo superadmin
-- =============================================================================
drop policy if exists "attendance_update_superadmin" on public.attendance_records;
drop policy if exists "attendance_update_track" on public.attendance_records;

create policy "attendance_update_track" on public.attendance_records for update
  using (
    exists (
      select 1 from public.course_sessions cs
      where cs.id = session_id and public.can_track_course(cs.course_id)
    )
  )
  with check (
    exists (
      select 1 from public.course_sessions cs
      where cs.id = session_id and public.can_track_course(cs.course_id)
    )
  );
