-- Admin/coordinación también pueden eliminar cursos (antes solo superadmin).

drop policy if exists "courses_delete_superadmin" on public.courses;
drop policy if exists "courses_delete_staff" on public.courses;

create policy "courses_delete_staff" on public.courses for delete
  using (public.can_manage_academics() or public.has_role('superadmin'));
