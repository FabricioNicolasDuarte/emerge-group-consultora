-- =============================================================================
-- Campus Emerge — Fase 0: perfiles, roles y seguridad base
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tablas base
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil extendido de cada usuario autenticado';

create table if not exists public.roles (
  id smallserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  hierarchy smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.roles is 'Roles del campus (alumno, docente, admin, etc.)';

create table if not exists public.user_roles (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id smallint not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id),
  unique (user_id, role_id)
);

comment on table public.user_roles is 'Asignación de roles por usuario';

-- -----------------------------------------------------------------------------
-- 2. Roles iniciales
-- -----------------------------------------------------------------------------

insert into public.roles (slug, name, description, hierarchy) values
  ('superadmin', 'Superadministrador', 'Acceso total a la plataforma', 100),
  ('admin', 'Administrador', 'Gestión de usuarios, cursos y comunicaciones', 80),
  ('coordinador', 'Coordinador', 'Coordinación de programas y cohortes', 60),
  ('docente', 'Docente', 'Dictado de clases, materiales y evaluación', 40),
  ('tutor', 'Tutor', 'Seguimiento y acompañamiento de alumnos', 30),
  ('alumno', 'Alumno', 'Acceso a formación e inscripciones', 10)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Funciones auxiliares
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.has_role(role_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug = role_slug
  );
$$;

create or replace function public.has_any_role(role_slugs text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug = any (role_slugs)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array[
    'superadmin', 'admin', 'coordinador', 'docente', 'tutor'
  ]);
$$;

-- Perfil automático al registrarse + rol alumno por defecto
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  alumno_role_id smallint;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Usuario'
    )
  );

  select id into alumno_role_id from public.roles where slug = 'alumno';

  if alumno_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, alumno_role_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

-- profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_staff"
  on public.profiles for select
  using (public.is_staff());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.has_any_role(array['superadmin', 'admin']));

-- roles (lectura para autenticados)
create policy "roles_select_authenticated"
  on public.roles for select
  to authenticated
  using (true);

-- user_roles
create policy "user_roles_select_own"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "user_roles_select_admin"
  on public.user_roles for select
  using (public.has_any_role(array['superadmin', 'admin']));

create policy "user_roles_manage_admin"
  on public.user_roles for all
  using (public.has_any_role(array['superadmin', 'admin']))
  with check (public.has_any_role(array['superadmin', 'admin']));

-- -----------------------------------------------------------------------------
-- 5. Vista útil para el frontend
-- -----------------------------------------------------------------------------

create or replace view public.my_profile as
select
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.phone,
  p.is_active,
  coalesce(
    array_agg(r.slug order by r.hierarchy desc) filter (where r.slug is not null),
    array[]::text[]
  ) as role_slugs,
  coalesce(
    array_agg(r.name order by r.hierarchy desc) filter (where r.slug is not null),
    array[]::text[]
  ) as role_names
from public.profiles p
left join public.user_roles ur on ur.user_id = p.id
left join public.roles r on r.id = ur.role_id
where p.id = auth.uid()
group by p.id;

grant select on public.my_profile to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Privilegios de tabla (RLS filtra filas; GRANT habilita el acceso base)
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.roles to authenticated;
grant select on public.user_roles to authenticated;
