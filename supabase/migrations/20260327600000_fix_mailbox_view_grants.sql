-- Restaurar permisos de vistas del buzón (se pierden al DROP/CREATE)
-- y volver a security_invoker=false para que funcionen como antes.

grant select on public.my_mailbox_threads to authenticated;
grant select on public.my_mailbox_unread to authenticated;
grant select on public.mailbox_thread_messages to authenticated;
grant select on public.mailbox_contacts to authenticated;

alter view public.my_mailbox_threads set (security_invoker = false);
alter view public.my_mailbox_unread set (security_invoker = false);
alter view public.mailbox_thread_messages set (security_invoker = false);
alter view public.mailbox_contacts set (security_invoker = false);

-- Permitir ver nombre del otro participante en conversaciones del buzón
drop policy if exists "profiles_select_mailbox_peer" on public.profiles;
create policy "profiles_select_mailbox_peer"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.mailbox_participants mine
      join public.mailbox_participants peer on peer.thread_id = mine.thread_id
      where mine.user_id = auth.uid()
        and peer.user_id = profiles.id
        and peer.user_id <> auth.uid()
    )
  );
