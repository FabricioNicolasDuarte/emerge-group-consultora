-- public_announcements no filtra por auth.uid(); lectura anónima vía vista como definer.
-- campus_announcements sigue con security_invoker = true (filtros por rol del usuario).

alter view if exists public.public_announcements set (security_invoker = false);

grant select on public.public_announcements to anon, authenticated;
