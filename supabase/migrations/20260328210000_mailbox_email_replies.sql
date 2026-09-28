-- Respuestas por email → Campus: origen del mensaje + ingest seguro

alter table public.mailbox_messages
  add column if not exists source text not null default 'campus'
    check (source in ('campus', 'email'));

create table if not exists public.mailbox_email_ingest (
  id uuid primary key default gen_random_uuid(),
  internet_message_id text not null unique,
  thread_id uuid references public.mailbox_threads (id) on delete set null,
  message_id uuid references public.mailbox_messages (id) on delete set null,
  from_email text,
  processed_at timestamptz not null default now()
);

create index if not exists idx_mailbox_email_ingest_thread
  on public.mailbox_email_ingest (thread_id);

alter table public.mailbox_email_ingest enable row level security;

-- Solo service role / definer functions tocan esta tabla (sin policies para authenticated).

create or replace function public.mailbox_ingest_email_reply(
  p_thread_id uuid,
  p_sender_email text,
  p_body_html text,
  p_body_text text,
  p_internet_message_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid;
  v_message_id uuid;
  v_email text := lower(trim(coalesce(p_sender_email, '')));
  v_msgid text := nullif(trim(coalesce(p_internet_message_id, '')), '');
begin
  if p_thread_id is null then
    raise exception 'thread_id requerido';
  end if;

  if v_email = '' then
    raise exception 'sender_email requerido';
  end if;

  if v_msgid is not null then
    select message_id into v_message_id
    from public.mailbox_email_ingest
    where internet_message_id = v_msgid;

    if v_message_id is not null then
      return v_message_id;
    end if;
  end if;

  select p.id into v_sender
  from public.profiles p
  where lower(trim(coalesce(p.email, ''))) = v_email
  limit 1;

  if v_sender is null then
    raise exception 'No hay usuario Campus con ese correo';
  end if;

  if not exists (
    select 1
    from public.mailbox_participants mp
    where mp.thread_id = p_thread_id
      and mp.user_id = v_sender
  ) then
    raise exception 'El remitente no participa de esta conversación';
  end if;

  if exists (
    select 1 from public.mailbox_threads t
    where t.id = p_thread_id and t.deleted_at is not null
  ) then
    raise exception 'Conversación eliminada';
  end if;

  insert into public.mailbox_messages (
    thread_id, sender_id, body_html, body_text, message_type, source
  )
  values (
    p_thread_id,
    v_sender,
    coalesce(nullif(trim(p_body_html), ''), replace(coalesce(p_body_text, ''), E'\n', '<br>')),
    coalesce(p_body_text, ''),
    'reply',
    'email'
  )
  returning id into v_message_id;

  if v_msgid is not null then
    insert into public.mailbox_email_ingest (
      internet_message_id, thread_id, message_id, from_email
    )
    values (v_msgid, p_thread_id, v_message_id, v_email)
    on conflict (internet_message_id) do nothing;
  end if;

  return v_message_id;
end;
$$;

revoke all on function public.mailbox_ingest_email_reply(uuid, text, text, text, text) from public;
revoke all on function public.mailbox_ingest_email_reply(uuid, text, text, text, text) from anon, authenticated;
grant execute on function public.mailbox_ingest_email_reply(uuid, text, text, text, text) to service_role;

drop view if exists public.mailbox_thread_messages;

create view public.mailbox_thread_messages as
select
  mm.id,
  mm.thread_id,
  mm.sender_id,
  p.full_name as sender_name,
  p.email as sender_email,
  mm.body_html,
  mm.body_text,
  mm.message_type,
  mm.source,
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

alter view if exists public.mailbox_thread_messages set (security_invoker = false);
grant select on public.mailbox_thread_messages to authenticated;
