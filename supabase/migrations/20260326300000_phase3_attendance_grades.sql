-- =============================================================================
-- Campus Emerge — Fase 3: asistencia y calificaciones
-- Ejecutar en Supabase SQL Editor después de la migración Fase 2
-- =============================================================================

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
exception when duplicate_object then null;
end $$;

create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  title text not null,
  session_date date not null,
  start_time time,
  end_time time,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.attendance_status not null default 'absent',
  notes text not null default '',
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  title text not null,
  description text not null default '',
  max_score numeric(6, 2) not null default 100 check (max_score > 0),
  weight_percent smallint not null default 100 check (weight_percent between 1 and 100),
  due_date date,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_grades (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  score numeric(6, 2) check (score is null or score >= 0),
  feedback text not null default '',
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

create index if not exists idx_course_sessions_course on public.course_sessions (course_id, session_date desc);
create index if not exists idx_attendance_session on public.attendance_records (session_id);
create index if not exists idx_attendance_student on public.attendance_records (student_id);
create index if not exists idx_assessments_course on public.assessments (course_id);
create index if not exists idx_student_grades_student on public.student_grades (student_id);

drop trigger if exists course_sessions_set_updated_at on public.course_sessions;
create trigger course_sessions_set_updated_at
  before update on public.course_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

create or replace function public.can_track_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_manage_academics() or public.is_course_teacher(p_course_id);
$$;

create or replace function public.is_enrolled_or_completed(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id
      and e.student_id = auth.uid()
      and e.status in ('active', 'completed')
  );
$$;

-- -----------------------------------------------------------------------------
-- Vistas
-- -----------------------------------------------------------------------------

create or replace view public.course_session_stats as
select
  cs.id,
  cs.course_id,
  cs.module_id,
  cs.title,
  cs.session_date,
  cs.start_time,
  cs.end_time,
  cs.notes,
  coalesce(ac.total, 0)::int as total_marked,
  coalesce(ac.present_count, 0)::int as present_count,
  coalesce(ac.absent_count, 0)::int as absent_count
from public.course_sessions cs
left join lateral (
  select
    count(*) as total,
    count(*) filter (where ar.status in ('present', 'late')) as present_count,
    count(*) filter (where ar.status = 'absent') as absent_count
  from public.attendance_records ar
  where ar.session_id = cs.id
) ac on true
order by cs.session_date desc, cs.start_time nulls last;

create or replace view public.my_attendance as
select
  ar.id,
  ar.status,
  ar.notes,
  ar.marked_at,
  cs.id as session_id,
  cs.title as session_title,
  cs.session_date,
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug
from public.attendance_records ar
join public.course_sessions cs on cs.id = ar.session_id
join public.courses c on c.id = cs.course_id
where ar.student_id = auth.uid()
order by cs.session_date desc;

create or replace view public.my_attendance_summary as
select
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug,
  count(ar.id)::int as total_sessions,
  count(ar.id) filter (where ar.status in ('present', 'late'))::int as attended_sessions,
  case
    when count(ar.id) = 0 then 0
    else round(
      (count(ar.id) filter (where ar.status in ('present', 'late'))::numeric / count(ar.id)::numeric) * 100
    )::int
  end as attendance_percent
from public.enrollments e
join public.courses c on c.id = e.course_id
left join public.course_sessions cs on cs.course_id = c.id
left join public.attendance_records ar on ar.session_id = cs.id and ar.student_id = e.student_id
where e.student_id = auth.uid() and e.status in ('active', 'completed')
group by c.id, c.title, c.slug
order by c.title;

create or replace view public.my_grades as
select
  sg.id,
  sg.score,
  sg.feedback,
  sg.graded_at,
  a.id as assessment_id,
  a.title as assessment_title,
  a.max_score,
  a.weight_percent,
  a.due_date,
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug,
  case
    when sg.score is null then null
    else round((sg.score / a.max_score) * 100)::int
  end as score_percent
from public.student_grades sg
join public.assessments a on a.id = sg.assessment_id
join public.courses c on c.id = a.course_id
where sg.student_id = auth.uid()
  and a.is_published = true
order by sg.graded_at desc;

create or replace view public.my_course_averages as
select
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug,
  count(sg.id) filter (where sg.score is not null)::int as graded_count,
  case
    when count(sg.id) filter (where sg.score is not null) = 0 then null
    else round(avg((sg.score / a.max_score) * 100) filter (where sg.score is not null))::int
  end as average_percent
from public.enrollments e
join public.courses c on c.id = e.course_id
left join public.assessments a on a.course_id = c.id and a.is_published = true
left join public.student_grades sg on sg.assessment_id = a.id and sg.student_id = e.student_id
where e.student_id = auth.uid() and e.status in ('active', 'completed')
group by c.id, c.title, c.slug
order by c.title;

grant select on public.course_session_stats to authenticated;
grant select on public.my_attendance to authenticated;
grant select on public.my_attendance_summary to authenticated;
grant select on public.my_grades to authenticated;
grant select on public.my_course_averages to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.course_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.assessments enable row level security;
alter table public.student_grades enable row level security;

create policy "sessions_select_track" on public.course_sessions for select
  using (public.can_track_course(course_id) or public.is_enrolled_or_completed(course_id));

create policy "sessions_manage_track" on public.course_sessions for all
  using (public.can_track_course(course_id))
  with check (public.can_track_course(course_id));

create policy "attendance_select_own" on public.attendance_records for select
  using (student_id = auth.uid());

create policy "attendance_select_track" on public.attendance_records for select
  using (
    exists (
      select 1 from public.course_sessions cs
      where cs.id = session_id and public.can_track_course(cs.course_id)
    )
  );

create policy "attendance_manage_track" on public.attendance_records for all
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

create policy "assessments_select_published" on public.assessments for select
  using (is_published and public.is_enrolled_or_completed(course_id));

create policy "assessments_select_track" on public.assessments for select
  using (public.can_track_course(course_id));

create policy "assessments_manage_track" on public.assessments for all
  using (public.can_track_course(course_id))
  with check (public.can_track_course(course_id));

create policy "grades_select_own" on public.student_grades for select
  using (
    student_id = auth.uid()
    and exists (
      select 1 from public.assessments a
      where a.id = assessment_id and a.is_published = true
    )
  );

create policy "grades_select_track" on public.student_grades for select
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id and public.can_track_course(a.course_id)
    )
  );

create policy "grades_manage_track" on public.student_grades for all
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id and public.can_track_course(a.course_id)
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id and public.can_track_course(a.course_id)
    )
  );

-- -----------------------------------------------------------------------------
-- Datos de ejemplo
-- -----------------------------------------------------------------------------

insert into public.course_sessions (course_id, title, session_date, start_time, notes)
select c.id, s.title, s.session_date::date, s.start_time::time, s.notes
from public.courses c
cross join (values
  ('Encuentro 1 — Bienvenida e introducción', (current_date - interval '14 days')::text, '10:00', 'Primera sesión sincrónica del programa.'),
  ('Encuentro 2 — Liderazgo en acción', (current_date - interval '7 days')::text, '10:00', 'Trabajo en equipos y reflexión grupal.'),
  ('Encuentro 3 — Comunicación y confianza', current_date::text, '10:00', 'Práctica de conversaciones formativas.')
) as s(title, session_date, start_time, notes)
where c.slug = 'liderazgo-sanmartiniano'
  and not exists (select 1 from public.course_sessions existing where existing.course_id = c.id);

insert into public.assessments (course_id, title, description, max_score, weight_percent, due_date, is_published)
select c.id, a.title, a.description, a.max_score, a.weight_percent, a.due_date::date, true
from public.courses c
cross join (values
  ('Reflexión personal — Módulo 1', 'Entrega escrita sobre liderazgo y propósito.', 100, 30, (current_date + interval '7 days')::text),
  ('Actividad grupal — Comunicación', 'Trabajo en equipo sobre conversaciones efectivas.', 100, 40, (current_date + interval '21 days')::text),
  ('Evaluación integradora', 'Síntesis final del programa.', 100, 30, (current_date + interval '45 days')::text)
) as a(title, description, max_score, weight_percent, due_date)
where c.slug = 'liderazgo-sanmartiniano'
  and not exists (select 1 from public.assessments existing where existing.course_id = c.id);

grant select, insert, update, delete on public.course_sessions to authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.student_grades to authenticated;
