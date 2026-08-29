-- =============================================================================
-- Campus Emerge — Fase 2: contenido, progreso y storage
-- Ejecutar en Supabase SQL Editor después de la migración Fase 1
-- =============================================================================

alter table public.lessons
  add column if not exists content_html text not null default '';

-- -----------------------------------------------------------------------------
-- Materiales adjuntos y progreso por clase
-- -----------------------------------------------------------------------------

create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  storage_path text not null,
  mime_type text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create index if not exists idx_lesson_materials_lesson on public.lesson_materials (lesson_id, sort_order);
create index if not exists idx_lesson_completions_student on public.lesson_completions (student_id);
create index if not exists idx_lesson_completions_lesson on public.lesson_completions (lesson_id);

-- -----------------------------------------------------------------------------
-- Sincronizar progreso de inscripción según clases completadas
-- -----------------------------------------------------------------------------

create or replace function public.sync_enrollment_progress(p_student_id uuid, p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_done int;
  v_percent smallint;
begin
  select count(*)::int into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course_id and l.is_published = true;

  if v_total = 0 then
    return;
  end if;

  select count(*)::int into v_done
  from public.lesson_completions lc
  join public.lessons l on l.id = lc.lesson_id
  join public.modules m on m.id = l.module_id
  where lc.student_id = p_student_id
    and m.course_id = p_course_id
    and l.is_published = true;

  v_percent := least(100, round((v_done::numeric / v_total::numeric) * 100))::smallint;

  update public.enrollments
  set
    progress_percent = v_percent,
    status = case when v_percent = 100 then 'completed'::public.enrollment_status else status end,
    completed_at = case when v_percent = 100 then coalesce(completed_at, now()) else null end
  where student_id = p_student_id and course_id = p_course_id;
end;
$$;

create or replace function public.handle_lesson_completion_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_course_id uuid;
begin
  if tg_op = 'DELETE' then
    select m.course_id into v_course_id
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = old.lesson_id;
    v_student_id := old.student_id;
  else
    select m.course_id into v_course_id
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = new.lesson_id;
    v_student_id := new.student_id;
  end if;

  if v_student_id is not null and v_course_id is not null then
    perform public.sync_enrollment_progress(v_student_id, v_course_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists lesson_completions_sync_progress on public.lesson_completions;
create trigger lesson_completions_sync_progress
  after insert or delete on public.lesson_completions
  for each row execute function public.handle_lesson_completion_change();

-- -----------------------------------------------------------------------------
-- Vistas útiles
-- -----------------------------------------------------------------------------

create or replace view public.my_lesson_completions as
select lc.lesson_id, lc.completed_at, m.course_id
from public.lesson_completions lc
join public.lessons l on l.id = lc.lesson_id
join public.modules m on m.id = l.module_id
where lc.student_id = auth.uid();

grant select on public.my_lesson_completions to authenticated;

-- -----------------------------------------------------------------------------
-- RLS: materiales y completions
-- -----------------------------------------------------------------------------

alter table public.lesson_materials enable row level security;
alter table public.lesson_completions enable row level security;

create policy "lesson_materials_select_access" on public.lesson_materials for select using (
  exists (
    select 1 from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_id and (
      (c.status = 'published' and l.is_published) or public.can_manage_academics()
      or public.is_course_teacher(c.id) or public.is_enrolled_in_course(c.id)
    )
  )
);

create policy "lesson_materials_manage_staff" on public.lesson_materials for all
  using (public.can_manage_academics()) with check (public.can_manage_academics());

create policy "lesson_materials_manage_teacher" on public.lesson_materials for all using (
  exists (
    select 1 from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = lesson_id and public.is_course_teacher(m.course_id)
  )
) with check (
  exists (
    select 1 from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = lesson_id and public.is_course_teacher(m.course_id)
  )
);

create policy "lesson_completions_select_own" on public.lesson_completions for select
  using (student_id = auth.uid());

create policy "lesson_completions_select_staff" on public.lesson_completions for select
  using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = lesson_id and (
        public.can_manage_academics() or public.is_course_teacher(m.course_id)
      )
    )
  );

create policy "lesson_completions_manage_own" on public.lesson_completions for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = lesson_id and public.is_enrolled_in_course(m.course_id)
    )
  );

create policy "lesson_completions_delete_own" on public.lesson_completions for delete
  using (student_id = auth.uid());

-- Docentes pueden gestionar módulos y clases de sus cursos
create policy "modules_manage_teacher" on public.modules for all using (
  public.is_course_teacher(course_id)
) with check (public.is_course_teacher(course_id));

create policy "lessons_manage_teacher" on public.lessons for all using (
  exists (
    select 1 from public.modules m
    where m.id = module_id and public.is_course_teacher(m.course_id)
  )
) with check (
  exists (
    select 1 from public.modules m
    where m.id = module_id and public.is_course_teacher(m.course_id)
  )
);

-- -----------------------------------------------------------------------------
-- Storage: políticas para buckets de contenido
-- Path esperado: {course_id}/{lesson_id}/{filename}
-- -----------------------------------------------------------------------------

create or replace function public.storage_course_id_from_path(path text)
returns uuid
language sql
immutable
as $$
  select nullif((string_to_array(path, '/'))[1], '')::uuid;
$$;

drop policy if exists "public_assets_select" on storage.objects;
create policy "public_assets_select" on storage.objects for select
  using (bucket_id = 'public-assets');

drop policy if exists "public_assets_insert_staff" on storage.objects;
create policy "public_assets_insert_staff" on storage.objects for insert
  with check (bucket_id = 'public-assets' and public.can_manage_academics());

drop policy if exists "public_assets_update_staff" on storage.objects;
create policy "public_assets_update_staff" on storage.objects for update
  using (bucket_id = 'public-assets' and public.can_manage_academics());

drop policy if exists "public_assets_delete_staff" on storage.objects;
create policy "public_assets_delete_staff" on storage.objects for delete
  using (bucket_id = 'public-assets' and public.can_manage_academics());

drop policy if exists "course_content_select" on storage.objects;
create policy "course_content_select" on storage.objects for select
  using (
    bucket_id in ('course-materials', 'course-recordings')
    and (
      public.can_manage_academics()
      or public.is_course_teacher(public.storage_course_id_from_path(name))
      or public.is_enrolled_in_course(public.storage_course_id_from_path(name))
    )
  );

drop policy if exists "course_content_insert" on storage.objects;
create policy "course_content_insert" on storage.objects for insert
  with check (
    bucket_id in ('course-materials', 'course-recordings')
    and (
      public.can_manage_academics()
      or public.is_course_teacher(public.storage_course_id_from_path(name))
    )
  );

drop policy if exists "course_content_update" on storage.objects;
create policy "course_content_update" on storage.objects for update
  using (
    bucket_id in ('course-materials', 'course-recordings')
    and (
      public.can_manage_academics()
      or public.is_course_teacher(public.storage_course_id_from_path(name))
    )
  );

drop policy if exists "course_content_delete" on storage.objects;
create policy "course_content_delete" on storage.objects for delete
  using (
    bucket_id in ('course-materials', 'course-recordings')
    and (
      public.can_manage_academics()
      or public.is_course_teacher(public.storage_course_id_from_path(name))
    )
  );

-- -----------------------------------------------------------------------------
-- Datos de ejemplo: clases para Liderazgo Sanmartiniano
-- -----------------------------------------------------------------------------

insert into public.lessons (module_id, title, description, content_type, video_url, duration_minutes, sort_order, is_published, content_html)
select m.id, l.title, l.description, l.content_type, l.video_url, l.duration_minutes, l.sort_order, true, l.content_html
from public.courses c
join public.modules m on m.course_id = c.id
cross join lateral (
  values
    ('Bienvenida al programa', 'Presentación del recorrido formativo.', 'video', null, 8, 1,
     '<p>Bienvenido al programa de Liderazgo Sanmartiniano. En esta clase introductoria conocerás la estructura del curso y los objetivos de aprendizaje.</p>'),
    ('¿Qué significa liderar?', 'Reflexión sobre el liderazgo desde la mirada sanmartiniana.', 'video', null, 18, 2,
     '<p>Exploramos qué implica liderar desde la ética, el propósito y el servicio a los demás.</p>'),
    ('Actividad de reflexión', 'Ejercicio personal de autoevaluación.', 'activity', null, null, 3,
     '<p>Reflexioná sobre una situación reciente en la que hayas ejercido liderazgo. ¿Qué funcionó? ¿Qué mejorarías?</p>')
) as l(title, description, content_type, video_url, duration_minutes, sort_order, content_html)
where c.slug = 'liderazgo-sanmartiniano'
  and m.sort_order = 1
  and not exists (select 1 from public.lessons existing where existing.module_id = m.id);

insert into public.lessons (module_id, title, description, content_type, video_url, duration_minutes, sort_order, is_published, content_html)
select m.id, l.title, l.description, l.content_type, l.video_url, l.duration_minutes, l.sort_order, true, l.content_html
from public.courses c
join public.modules m on m.course_id = c.id
cross join lateral (
  values
    ('La confianza como base del liderazgo', 'Cómo construir confianza en equipos.', 'video', null, 16, 1,
     '<p>La confianza es el cimiento sobre el cual se construyen los equipos de alto rendimiento.</p>'),
    ('Conversaciones que construyen equipos', 'El rol de la comunicación en el liderazgo.', 'video', null, 24, 2,
     '<p>Los equipos se construyen en las conversaciones. Cada pedido, compromiso y declaración puede fortalecer o debilitar la confianza.</p>'),
    ('Coordinación y compromiso', 'Actividad práctica de coordinación.', 'activity', null, null, 3,
     '<p>Diseñá una conversación orientada a resultados con tu equipo para la próxima semana.</p>')
) as l(title, description, content_type, video_url, duration_minutes, sort_order, content_html)
where c.slug = 'liderazgo-sanmartiniano'
  and m.sort_order = 3
  and not exists (select 1 from public.lessons existing where existing.module_id = m.id and existing.sort_order = 2);

grant select, insert, update, delete on public.lesson_materials to authenticated;
grant select, insert, delete on public.lesson_completions to authenticated;
