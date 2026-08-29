-- Buzón: vistas corregidas, CRUD con auditoría, logs solo superadmin

alter table public.mailbox_messages
  add column if not exists deleted_at timestamptz;

alter table public.mailbox_threads
  add column if not exists deleted_at timestamptz;

drop view if exists public.my_mailbox_unread;
drop view if exists public.my_mailbox_threads;

create view public.my_mailbox_threads as
select
  t.id as thread_id,
  t.subject,
  t.thread_kind,
  t.course_id,
  t.last_message_at,
  t.created_at,
  t.created_by,
  mp.participant_role,
  (t.created_by = auth.uid()) as is_outgoing,
  mp.is_archived,
  mp.last_read_at,
  (
    select count(*)::int
    from public.mailbox_messages mm
    where mm.thread_id = t.id
      and mm.deleted_at is null
      and mm.sender_id <> auth.uid()
      and (mp.last_read_at is null or mm.created_at > mp.last_read_at)
  ) as unread_count,
  (
    select mm.body_text
    from public.mailbox_messages mm
    where mm.thread_id = t.id
      and mm.deleted_at is null
    order by mm.created_at desc
    limit 1
  ) as last_message_preview,
  (
    select p.full_name
    from public.mailbox_participants other_mp
    join public.profiles p on p.id = other_mp.user_id
    where other_mp.thread_id = t.id
      and other_mp.user_id <> auth.uid()
    order by other_mp.joined_at
    limit 1
  ) as other_participant_name
from public.mailbox_threads t
join public.mailbox_participants mp on mp.thread_id = t.id
where mp.user_id = auth.uid()
  and t.deleted_at is null
order by t.last_message_at desc;

create view public.my_mailbox_unread as
select coalesce(sum(unread_count), 0)::int as unread_count
from public.my_mailbox_threads
where not is_archived;

create or replace view public.mailbox_thread_messages as
select
  mm.id,
  mm.thread_id,
  mm.sender_id,
  p.full_name as sender_name,
  p.email as sender_email,
  mm.body_html,
  mm.body_text,
  mm.message_type,
  mm.created_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', ma.id,
          'storage_path', ma.storage_path,
          'file_name', ma.file_name,
          'mime_type', ma.mime_type,
          'file_size', ma.file_size
        )
      )
      from public.mailbox_attachments ma
      where ma.message_id = mm.id
    ),
    '[]'::jsonb
  ) as attachments
from public.mailbox_messages mm
join public.profiles p on p.id = mm.sender_id
where public.is_mailbox_participant(mm.thread_id)
  and mm.deleted_at is null
order by mm.created_at asc;

alter view if exists public.my_mailbox_threads set (security_invoker = false);
alter view if exists public.mailbox_thread_messages set (security_invoker = false);
alter view if exists public.my_mailbox_unread set (security_invoker = false);
alter view if exists public.mailbox_contacts set (security_invoker = false);

grant select on public.my_mailbox_threads to authenticated;
grant select on public.my_mailbox_unread to authenticated;
grant select on public.mailbox_thread_messages to authenticated;
grant select on public.mailbox_contacts to authenticated;

-- Auditoría del buzón
create or replace function public.audit_mailbox_threads_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit_event(
      'created', 'mailbox_thread', new.id, new.course_id,
      'Conversación creada: ' || new.subject,
      jsonb_build_object('subject', new.subject, 'created_by', new.created_by)
    );
  elsif tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then
    perform public.log_audit_event(
      'deleted', 'mailbox_thread', new.id, new.course_id,
      'Conversación eliminada: ' || new.subject,
      jsonb_build_object('subject', new.subject)
    );
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.audit_mailbox_messages_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject text;
begin
  select subject into v_subject from public.mailbox_threads where id = coalesce(new.thread_id, old.thread_id);

  if tg_op = 'INSERT' then
    perform public.log_audit_event(
      'created', 'mailbox_message', new.id, null,
      'Mensaje en: ' || coalesce(v_subject, 'conversación'),
      jsonb_build_object('thread_id', new.thread_id, 'message_type', new.message_type)
    );
  elsif tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then
    perform public.log_audit_event(
      'deleted', 'mailbox_message', new.id, null,
      'Mensaje eliminado en: ' || coalesce(v_subject, 'conversación'),
      jsonb_build_object('thread_id', new.thread_id)
    );
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.audit_mailbox_participants_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject text;
begin
  if tg_op = 'UPDATE' and new.is_archived is distinct from old.is_archived then
    select subject into v_subject from public.mailbox_threads where id = new.thread_id;
    perform public.log_audit_event(
      case when new.is_archived then 'archived' else 'unarchived' end,
      'mailbox_thread',
      new.thread_id,
      null,
      case when new.is_archived then 'Conversación archivada: ' else 'Conversación restaurada: ' end
        || coalesce(v_subject, ''),
      jsonb_build_object('user_id', new.user_id, 'is_archived', new.is_archived)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_mailbox_threads on public.mailbox_threads;
create trigger audit_mailbox_threads
  after insert or update on public.mailbox_threads
  for each row execute function public.audit_mailbox_threads_changes();

drop trigger if exists audit_mailbox_messages on public.mailbox_messages;
create trigger audit_mailbox_messages
  after insert or update on public.mailbox_messages
  for each row execute function public.audit_mailbox_messages_changes();

drop trigger if exists audit_mailbox_participants on public.mailbox_participants;
create trigger audit_mailbox_participants
  after update on public.mailbox_participants
  for each row execute function public.audit_mailbox_participants_changes();

-- RPC archivar / eliminar
create or replace function public.mailbox_archive_thread(p_thread_id uuid, p_archived boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  update public.mailbox_participants
  set is_archived = p_archived
  where thread_id = p_thread_id
    and user_id = auth.uid();

  if not found then
    raise exception 'No tenés acceso a esta conversación';
  end if;
end;
$$;

create or replace function public.mailbox_delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
  v_sender uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select thread_id, sender_id into v_thread_id, v_sender
  from public.mailbox_messages
  where id = p_message_id and deleted_at is null;

  if v_thread_id is null then
    raise exception 'Mensaje no encontrado';
  end if;

  if v_sender <> auth.uid() and not public.user_has_role_slug(auth.uid(), 'superadmin') then
    raise exception 'Solo podés eliminar tus propios mensajes';
  end if;

  update public.mailbox_messages
  set deleted_at = now()
  where id = p_message_id;
end;
$$;

create or replace function public.mailbox_delete_thread(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if not exists (
    select 1 from public.mailbox_participants
    where thread_id = p_thread_id
      and user_id = auth.uid()
      and participant_role = 'owner'
  ) and not public.user_has_role_slug(auth.uid(), 'superadmin') then
    raise exception 'Solo el autor puede eliminar la conversación';
  end if;

  update public.mailbox_threads
  set deleted_at = now()
  where id = p_thread_id;
end;
$$;

grant execute on function public.mailbox_archive_thread(uuid, boolean) to authenticated;
grant execute on function public.mailbox_delete_message(uuid) to authenticated;
grant execute on function public.mailbox_delete_thread(uuid) to authenticated;

-- Auditoría: solo superadmin
drop policy if exists "audit_logs_select_staff" on public.audit_logs;
create policy "audit_logs_select_superadmin"
  on public.audit_logs for select
  using (public.user_has_role_slug(auth.uid(), 'superadmin'));
