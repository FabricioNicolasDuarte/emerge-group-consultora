-- Función auxiliar para scripts de seed (service_role vía RPC)
-- Ejecutar una vez en Supabase SQL Editor si npm run seed:test-users falla en roles

create or replace function public.dev_assign_campus_role(
  p_user_id uuid,
  p_role_slug text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id smallint;
begin
  select id into v_role_id from public.roles where slug = p_role_slug;
  if v_role_id is null then
    raise exception 'Rol no encontrado: %', p_role_slug;
  end if;

  if p_role_slug <> 'alumno' then
    delete from public.user_roles where user_id = p_user_id;
  end if;

  insert into public.user_roles (user_id, role_id)
  values (p_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

grant execute on function public.dev_assign_campus_role(uuid, text) to service_role;
