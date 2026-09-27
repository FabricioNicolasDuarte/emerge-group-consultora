-- Destructive deletes: only superadmin via RLS (UI/API also gated).
-- Staff (admin/coordinador) keep insert/update for operación diaria.

drop policy if exists "courses_manage_staff" on public.courses;
create policy "courses_insert_staff" on public.courses for insert
  with check (public.can_manage_academics());
create policy "courses_update_staff" on public.courses for update
  using (public.can_manage_academics()) with check (public.can_manage_academics());
create policy "courses_delete_superadmin" on public.courses for delete
  using (public.user_has_role_slug(auth.uid(), 'superadmin'));

drop policy if exists "enrollments_manage_staff" on public.enrollments;
create policy "enrollments_insert_staff" on public.enrollments for insert
  with check (public.can_manage_academics());
create policy "enrollments_update_staff" on public.enrollments for update
  using (public.can_manage_academics()) with check (public.can_manage_academics());
create policy "enrollments_delete_superadmin" on public.enrollments for delete
  using (public.user_has_role_slug(auth.uid(), 'superadmin'));
