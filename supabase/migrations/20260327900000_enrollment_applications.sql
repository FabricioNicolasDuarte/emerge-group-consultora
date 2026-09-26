-- =============================================================================
-- Campus Emerge — Ficha de inscripción / solicitudes (Excel, alta masiva)
-- =============================================================================

do $$ begin
  create type public.application_status as enum (
    'ready',      -- verde: listo para crear usuario
    'pending',    -- naranja: en duda
    'converted',  -- ya tiene usuario + inscripción
    'rejected',   -- descartado
    'duplicate'   -- email ya existía / conflicto
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete set null,
  full_name text not null default '',
  email text not null,
  phone text,
  audience text,
  challenge text,
  job_role text,
  occupation text,
  city text,
  status public.application_status not null default 'pending',
  source text not null default 'manual',
  import_batch_id uuid,
  notes text,
  converted_user_id uuid references public.profiles (id) on delete set null,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.enrollment_applications is
  'Ficha de inscripción / leads previos a cuenta de alumno (import Excel, formularios).';

create unique index if not exists enrollment_applications_course_email_uidx
  on public.enrollment_applications (course_id, lower(email))
  where course_id is not null;

create index if not exists idx_enrollment_applications_status
  on public.enrollment_applications (status);

create index if not exists idx_enrollment_applications_course
  on public.enrollment_applications (course_id);

create index if not exists idx_enrollment_applications_batch
  on public.enrollment_applications (import_batch_id);

drop trigger if exists enrollment_applications_set_updated_at on public.enrollment_applications;
create trigger enrollment_applications_set_updated_at
  before update on public.enrollment_applications
  for each row execute function public.set_updated_at();

-- Campos de ficha también en perfil (útiles tras convertir)
alter table public.profiles
  add column if not exists city text,
  add column if not exists job_role text,
  add column if not exists occupation text,
  add column if not exists audience text,
  add column if not exists challenge text;

alter table public.enrollment_applications enable row level security;

drop policy if exists "enrollment_applications_select_staff" on public.enrollment_applications;
create policy "enrollment_applications_select_staff"
  on public.enrollment_applications for select
  to authenticated
  using (public.has_any_role(array['superadmin', 'admin', 'coordinador']));

drop policy if exists "enrollment_applications_insert_staff" on public.enrollment_applications;
create policy "enrollment_applications_insert_staff"
  on public.enrollment_applications for insert
  to authenticated
  with check (public.has_any_role(array['superadmin', 'admin', 'coordinador']));

drop policy if exists "enrollment_applications_update_staff" on public.enrollment_applications;
create policy "enrollment_applications_update_staff"
  on public.enrollment_applications for update
  to authenticated
  using (public.has_any_role(array['superadmin', 'admin', 'coordinador']))
  with check (public.has_any_role(array['superadmin', 'admin', 'coordinador']));

drop policy if exists "enrollment_applications_delete_staff" on public.enrollment_applications;
create policy "enrollment_applications_delete_staff"
  on public.enrollment_applications for delete
  to authenticated
  using (public.has_any_role(array['superadmin', 'admin']));

grant select, insert, update, delete on public.enrollment_applications to authenticated;

create or replace view public.admin_enrollment_applications
with (security_invoker = true)
as
select
  a.*,
  c.title as course_title,
  c.slug as course_slug,
  p.full_name as converted_user_name
from public.enrollment_applications a
left join public.courses c on c.id = a.course_id
left join public.profiles p on p.id = a.converted_user_id;

grant select on public.admin_enrollment_applications to authenticated;
