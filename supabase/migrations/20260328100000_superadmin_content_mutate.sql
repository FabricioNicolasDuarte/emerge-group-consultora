-- Módulos y clases: mutaciones solo superadmin (docentes/staff pueden seguir leyendo).

drop policy if exists "modules_manage_staff" on public.modules;
drop policy if exists "modules_manage_teacher" on public.modules;
create policy "modules_mutate_superadmin" on public.modules for all
  using (public.user_has_role_slug(auth.uid(), 'superadmin'))
  with check (public.user_has_role_slug(auth.uid(), 'superadmin'));

drop policy if exists "lessons_manage_staff" on public.lessons;
drop policy if exists "lessons_manage_teacher" on public.lessons;
create policy "lessons_mutate_superadmin" on public.lessons for all
  using (public.user_has_role_slug(auth.uid(), 'superadmin'))
  with check (public.user_has_role_slug(auth.uid(), 'superadmin'));
