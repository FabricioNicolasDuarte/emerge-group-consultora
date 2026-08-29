-- =============================================================================
-- Campus Emerge — Fase 1: núcleo académico
-- Ejecutar en Supabase SQL Editor después de la migración Fase 0
-- =============================================================================

do $$ begin
  create type public.course_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.enrollment_status as enum ('active', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.assignment_role as enum ('docente', 'tutor', 'coordinador');
exception when duplicate_object then null;
end $$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'General',
  status public.course_status not null default 'draft',
  cover_image_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  description text not null default '',
  content_type text not null default 'video',
  video_url text,
  duration_minutes smallint,
  sort_order smallint not null default 0,
  is_published boolean not null default false,
  visible_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.enrollment_status not null default 'active',
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (course_id, student_id)
);

create table if not exists public.course_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  role public.assignment_role not null default 'docente',
  assigned_at timestamptz not null default now(),
  unique (course_id, teacher_id)
);

create index if not exists idx_courses_status on public.courses (status);
create index if not exists idx_courses_slug on public.courses (slug);
create index if not exists idx_modules_course on public.modules (course_id, sort_order);
create index if not exists idx_enrollments_student on public.enrollments (student_id);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create or replace function public.is_course_teacher(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.course_assignments ca
    where ca.course_id = p_course_id and ca.teacher_id = auth.uid()
  );
$$;

create or replace function public.can_manage_academics()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['superadmin', 'admin', 'coordinador']);
$$;

create or replace function public.is_enrolled_in_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id and e.student_id = auth.uid() and e.status = 'active'
  );
$$;

create or replace view public.course_catalog as
select c.id, c.title, c.slug, c.description, c.category, c.cover_image_url, c.created_at,
  coalesce(mc.cnt, 0)::int as module_count
from public.courses c
left join lateral (select count(*) as cnt from public.modules m where m.course_id = c.id) mc on true
where c.status = 'published'
order by c.title;

create or replace view public.admin_course_stats as
select c.id, c.title, c.slug, c.description, c.category, c.status, c.created_at,
  coalesce(mc.cnt, 0)::int as module_count,
  coalesce(ec.cnt, 0)::int as enrollment_count
from public.courses c
left join lateral (select count(*) as cnt from public.modules m where m.course_id = c.id) mc on true
left join lateral (
  select count(*) as cnt from public.enrollments e where e.course_id = c.id and e.status = 'active'
) ec on true
order by c.created_at desc;

create or replace view public.my_enrollments as
select e.id as enrollment_id, e.progress_percent, e.status as enrollment_status, e.enrolled_at,
  c.id as course_id, c.title, c.slug, c.description, c.category, c.cover_image_url
from public.enrollments e
join public.courses c on c.id = e.course_id
where e.student_id = auth.uid() and e.status in ('active', 'completed')
order by e.enrolled_at desc;

create or replace view public.my_teaching_courses as
select ca.id as assignment_id, ca.role as assignment_role, ca.assigned_at,
  c.id as course_id, c.title, c.slug, c.description, c.category, c.status,
  coalesce(ec.cnt, 0)::int as enrollment_count
from public.course_assignments ca
join public.courses c on c.id = ca.course_id
left join lateral (
  select count(*) as cnt from public.enrollments e where e.course_id = c.id and e.status = 'active'
) ec on true
where ca.teacher_id = auth.uid()
order by ca.assigned_at desc;

create or replace view public.recent_enrollments as
select e.id, e.progress_percent, e.enrolled_at,
  p.id as student_id, p.full_name as student_name, p.email as student_email,
  c.id as course_id, c.title as course_title
from public.enrollments e
join public.profiles p on p.id = e.student_id
join public.courses c on c.id = e.course_id
where e.status = 'active'
order by e.enrolled_at desc
limit 50;

grant select on public.course_catalog to anon, authenticated;
grant select on public.my_enrollments to authenticated;
grant select on public.my_teaching_courses to authenticated;
grant select on public.admin_course_stats to authenticated;
grant select on public.recent_enrollments to authenticated;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.course_assignments to authenticated;

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.course_assignments enable row level security;

create policy "courses_select_published" on public.courses for select using (status = 'published');
create policy "courses_select_staff" on public.courses for select
  using (public.can_manage_academics() or public.is_course_teacher(id));
create policy "courses_select_enrolled" on public.courses for select using (public.is_enrolled_in_course(id));
create policy "courses_manage_staff" on public.courses for all
  using (public.can_manage_academics()) with check (public.can_manage_academics());

create policy "modules_select_access" on public.modules for select using (
  exists (select 1 from public.courses c where c.id = course_id and (
    c.status = 'published' or public.can_manage_academics() or public.is_course_teacher(c.id) or public.is_enrolled_in_course(c.id)
  ))
);
create policy "modules_manage_staff" on public.modules for all
  using (public.can_manage_academics()) with check (public.can_manage_academics());

create policy "lessons_select_access" on public.lessons for select using (
  exists (
    select 1 from public.modules m join public.courses c on c.id = m.course_id
    where m.id = module_id and (
      (c.status = 'published' and is_published) or public.can_manage_academics()
      or public.is_course_teacher(c.id) or public.is_enrolled_in_course(c.id)
    )
  )
);
create policy "lessons_manage_staff" on public.lessons for all
  using (public.can_manage_academics()) with check (public.can_manage_academics());

create policy "enrollments_select_own" on public.enrollments for select using (student_id = auth.uid());
create policy "enrollments_select_staff" on public.enrollments for select
  using (public.can_manage_academics() or public.is_course_teacher(course_id));
create policy "enrollments_manage_staff" on public.enrollments for all
  using (public.can_manage_academics()) with check (public.can_manage_academics());

create policy "assignments_select_own" on public.course_assignments for select using (teacher_id = auth.uid());
create policy "assignments_select_staff" on public.course_assignments for select using (public.can_manage_academics());
create policy "assignments_manage_staff" on public.course_assignments for all
  using (public.can_manage_academics()) with check (public.can_manage_academics());

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('public-assets', 'public-assets', true, 5242880),
  ('course-materials', 'course-materials', false, 52428800),
  ('course-recordings', 'course-recordings', false, 524288000)
on conflict (id) do nothing;

insert into public.courses (title, slug, description, category, status) values
('Liderazgo Sanmartiniano', 'liderazgo-sanmartiniano', 'Una propuesta para desarrollar liderazgos actuales desde la dimensión humana, ética y estratégica de José de San Martín.', 'Liderazgo', 'published'),
('Evolución Profesional en Tiempos de IA', 'evolucion-profesional-ia', 'Un espacio para comprender cómo integrar inteligencia artificial, nuevas competencias y desarrollo humano en el mundo profesional.', 'Innovación', 'published'),
('Comunicación y Oratoria', 'comunicacion-oratoria', 'Herramientas para comunicar con claridad, presencia e impacto.', 'Comunicación', 'draft')
on conflict (slug) do nothing;

insert into public.modules (course_id, title, description, sort_order)
select c.id, m.title, m.description, m.sort_order
from public.courses c
cross join (values
  ('Liderazgo, propósito y legado', 'Fundamentos del liderazgo sanmartiniano.', 1),
  ('Estrategia y toma de decisiones', 'Visión estratégica en contextos desafiantes.', 2),
  ('Comunicación, confianza y equipos', 'Construcción de equipos de alto rendimiento.', 3),
  ('Legado y sostenibilidad', 'Sostener el cambio en el tiempo.', 4)
) as m(title, description, sort_order)
where c.slug = 'liderazgo-sanmartiniano'
  and not exists (select 1 from public.modules existing where existing.course_id = c.id);
