-- Materiales de clase: mutaciones solo superadmin.

drop policy if exists "lesson_materials_manage_staff" on public.lesson_materials;
drop policy if exists "lesson_materials_manage_teacher" on public.lesson_materials;
create policy "lesson_materials_mutate_superadmin" on public.lesson_materials for all
  using (public.user_has_role_slug(auth.uid(), 'superadmin'))
  with check (public.user_has_role_slug(auth.uid(), 'superadmin'));
