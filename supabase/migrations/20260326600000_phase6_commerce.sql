-- =============================================================================
-- Campus Emerge — Fase 6: pagos, certificados y videoconferencia
-- Ejecutar en Supabase SQL Editor después de la Fase 5
-- =============================================================================

do $$ begin
  create type public.payment_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

alter table public.courses
  add column if not exists price_amount numeric(10, 2) not null default 0 check (price_amount >= 0);

alter table public.courses
  add column if not exists price_currency text not null default 'ARS';

alter table public.course_sessions
  add column if not exists meeting_url text;

alter table public.course_sessions
  add column if not exists meeting_provider text not null default 'other';

create table if not exists public.course_payments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'ARS',
  status public.payment_status not null default 'pending',
  mp_preference_id text,
  mp_payment_id text,
  external_reference text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  certificate_code text not null unique,
  issued_at timestamptz not null default now(),
  issued_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_course_payments_student on public.course_payments (student_id, created_at desc);
create index if not exists idx_course_payments_course on public.course_payments (course_id, status);
create index if not exists idx_certificates_student on public.certificates (student_id, issued_at desc);
create index if not exists idx_certificates_code on public.certificates (certificate_code);

drop trigger if exists course_payments_set_updated_at on public.course_payments;
create trigger course_payments_set_updated_at
  before update on public.course_payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Inscripción gratuita (self-service)
-- -----------------------------------------------------------------------------

create or replace function public.enroll_self(p_course_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses%rowtype;
  v_enrollment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para inscribirte';
  end if;

  select * into v_course
  from public.courses
  where id = p_course_id and status = 'published';

  if not found then
    raise exception 'Curso no disponible';
  end if;

  if coalesce(v_course.price_amount, 0) > 0 then
    raise exception 'Este curso requiere pago';
  end if;

  insert into public.enrollments (course_id, student_id, status)
  values (p_course_id, auth.uid(), 'active')
  on conflict (course_id, student_id) do update
    set status = excluded.status
  returning id into v_enrollment_id;

  return v_enrollment_id;
end;
$$;

grant execute on function public.enroll_self(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Confirmar pago (solo service role / webhook)
-- -----------------------------------------------------------------------------

create or replace function public.fulfill_course_payment(
  p_external_reference text,
  p_mp_payment_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.course_payments%rowtype;
begin
  select * into v_payment
  from public.course_payments
  where external_reference = p_external_reference
  for update;

  if not found then
    return null;
  end if;

  if v_payment.status = 'approved' then
    return v_payment.id;
  end if;

  update public.course_payments
  set
    status = 'approved',
    mp_payment_id = coalesce(p_mp_payment_id, mp_payment_id),
    paid_at = coalesce(paid_at, now()),
    updated_at = now()
  where id = v_payment.id;

  insert into public.enrollments (course_id, student_id, status)
  values (v_payment.course_id, v_payment.student_id, 'active')
  on conflict (course_id, student_id) do update
    set status = 'active';

  return v_payment.id;
end;
$$;

revoke all on function public.fulfill_course_payment(text, text) from public;
grant execute on function public.fulfill_course_payment(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Certificados automáticos al completar curso
-- -----------------------------------------------------------------------------

create or replace function public.generate_certificate_code()
returns text
language sql
volatile
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
$$;

create or replace function public.auto_complete_enrollment()
returns trigger
language plpgsql
as $$
begin
  if new.progress_percent >= 100 and new.status = 'active' then
    new.status := 'completed';
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_auto_complete on public.enrollments;
create trigger enrollments_auto_complete
  before update on public.enrollments
  for each row execute function public.auto_complete_enrollment();

create or replace function public.auto_issue_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.progress_percent >= 100 or new.status = 'completed')
    and not exists (
      select 1 from public.certificates where enrollment_id = new.id
    ) then
    insert into public.certificates (
      enrollment_id,
      student_id,
      course_id,
      certificate_code
    )
    values (
      new.id,
      new.student_id,
      new.course_id,
      public.generate_certificate_code()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_issue_certificate on public.enrollments;
create trigger enrollments_issue_certificate
  after insert or update on public.enrollments
  for each row execute function public.auto_issue_certificate();

create or replace function public.issue_certificate_manual(p_enrollment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments%rowtype;
  v_certificate_id uuid;
begin
  if not public.can_manage_academics() then
    raise exception 'No autorizado';
  end if;

  select * into v_enrollment from public.enrollments where id = p_enrollment_id;
  if not found then
    raise exception 'Inscripción no encontrada';
  end if;

  insert into public.certificates (
    enrollment_id,
    student_id,
    course_id,
    certificate_code,
    issued_by
  )
  values (
    v_enrollment.id,
    v_enrollment.student_id,
    v_enrollment.course_id,
    public.generate_certificate_code(),
    auth.uid()
  )
  on conflict (enrollment_id) do nothing
  returning id into v_certificate_id;

  if v_certificate_id is null then
    select id into v_certificate_id from public.certificates where enrollment_id = p_enrollment_id;
  end if;

  return v_certificate_id;
end;
$$;

grant execute on function public.issue_certificate_manual(uuid) to authenticated;

create or replace function public.get_certificate_by_code(p_code text)
returns table (
  certificate_code text,
  issued_at timestamptz,
  course_title text,
  course_category text,
  student_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cert.certificate_code,
    cert.issued_at,
    c.title as course_title,
    c.category as course_category,
    p.full_name as student_name
  from public.certificates cert
  join public.courses c on c.id = cert.course_id
  join public.profiles p on p.id = cert.student_id
  where cert.certificate_code = upper(trim(p_code));
$$;

grant execute on function public.get_certificate_by_code(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Vistas actualizadas
-- (DROP + CREATE: Postgres no permite reordenar columnas con CREATE OR REPLACE)
-- -----------------------------------------------------------------------------

drop view if exists public.course_catalog cascade;
drop view if exists public.admin_course_stats cascade;
drop view if exists public.course_session_stats cascade;

create view public.course_catalog as
select
  c.id,
  c.title,
  c.slug,
  c.description,
  c.category,
  c.cover_image_url,
  c.created_at,
  coalesce(mc.cnt, 0)::int as module_count,
  c.price_amount,
  c.price_currency,
  (c.price_amount > 0) as is_paid
from public.courses c
left join lateral (
  select count(*) as cnt from public.modules m where m.course_id = c.id
) mc on true
where c.status = 'published'
order by c.title;

create view public.admin_course_stats as
select
  c.id,
  c.title,
  c.slug,
  c.description,
  c.category,
  c.status,
  c.created_at,
  coalesce(mc.cnt, 0)::int as module_count,
  coalesce(ec.cnt, 0)::int as enrollment_count,
  c.price_amount,
  c.price_currency
from public.courses c
left join lateral (
  select count(*) as cnt from public.modules m where m.course_id = c.id
) mc on true
left join lateral (
  select count(*) as cnt
  from public.enrollments e
  where e.course_id = c.id and e.status = 'active'
) ec on true
order by c.created_at desc;

create view public.course_session_stats as
select
  cs.id,
  cs.course_id,
  cs.module_id,
  cs.title,
  cs.session_date,
  cs.start_time,
  cs.end_time,
  cs.notes,
  coalesce(ac.total, 0)::int as total_marked,
  coalesce(ac.present_count, 0)::int as present_count,
  coalesce(ac.absent_count, 0)::int as absent_count,
  cs.meeting_url,
  cs.meeting_provider
from public.course_sessions cs
left join lateral (
  select
    count(*) as total,
    count(*) filter (where ar.status in ('present', 'late')) as present_count,
    count(*) filter (where ar.status = 'absent') as absent_count
  from public.attendance_records ar
  where ar.session_id = cs.id
) ac on true;

grant select on public.course_catalog to anon, authenticated;
grant select on public.admin_course_stats to authenticated;
grant select on public.course_session_stats to authenticated;

alter view public.admin_course_stats set (security_invoker = false);

create or replace view public.my_certificates as
select
  cert.id,
  cert.certificate_code,
  cert.issued_at,
  cert.course_id,
  c.title as course_title,
  c.slug as course_slug,
  c.category as course_category,
  e.progress_percent,
  e.status as enrollment_status
from public.certificates cert
join public.enrollments e on e.id = cert.enrollment_id
join public.courses c on c.id = cert.course_id
where cert.student_id = auth.uid()
order by cert.issued_at desc;

create or replace view public.admin_certificates as
select
  cert.id,
  cert.certificate_code,
  cert.issued_at,
  cert.enrollment_id,
  p.full_name as student_name,
  p.email as student_email,
  c.title as course_title,
  e.progress_percent,
  e.status as enrollment_status
from public.certificates cert
join public.profiles p on p.id = cert.student_id
join public.courses c on c.id = cert.course_id
join public.enrollments e on e.id = cert.enrollment_id
order by cert.issued_at desc;

create or replace view public.upcoming_live_sessions as
select
  cs.id,
  cs.title,
  cs.session_date,
  cs.start_time,
  cs.end_time,
  cs.meeting_url,
  cs.meeting_provider,
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug
from public.course_sessions cs
join public.courses c on c.id = cs.course_id
where cs.meeting_url is not null
  and trim(cs.meeting_url) <> ''
  and cs.session_date >= current_date
  and (
    public.can_manage_academics()
    or public.is_course_teacher(c.id)
    or public.is_enrolled_in_course(c.id)
  )
order by cs.session_date asc, cs.start_time asc nulls last;

create or replace view public.my_payment_history as
select
  cp.id,
  cp.amount,
  cp.currency,
  cp.status,
  cp.external_reference,
  cp.paid_at,
  cp.created_at,
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug
from public.course_payments cp
join public.courses c on c.id = cp.course_id
where cp.student_id = auth.uid()
order by cp.created_at desc;

create or replace view public.admin_payments as
select
  cp.id,
  cp.amount,
  cp.currency,
  cp.status,
  cp.external_reference,
  cp.mp_preference_id,
  cp.mp_payment_id,
  cp.paid_at,
  cp.created_at,
  c.title as course_title,
  p.full_name as student_name,
  p.email as student_email
from public.course_payments cp
join public.courses c on c.id = cp.course_id
join public.profiles p on p.id = cp.student_id
order by cp.created_at desc;

grant select on public.my_certificates to authenticated;
grant select on public.admin_certificates to authenticated;
grant select on public.upcoming_live_sessions to authenticated;
grant select on public.my_payment_history to authenticated;
grant select on public.admin_payments to authenticated;

alter view public.admin_certificates set (security_invoker = false);
alter view public.admin_payments set (security_invoker = false);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.course_payments enable row level security;
alter table public.certificates enable row level security;

drop policy if exists "payments_select_own_or_staff" on public.course_payments;
create policy "payments_select_own_or_staff"
  on public.course_payments for select
  using (auth.uid() = student_id or public.can_manage_academics());

drop policy if exists "payments_insert_own_pending" on public.course_payments;
create policy "payments_insert_own_pending"
  on public.course_payments for insert
  with check (
    auth.uid() = student_id
    and status = 'pending'
  );

drop policy if exists "certificates_select_own_or_staff" on public.certificates;
create policy "certificates_select_own_or_staff"
  on public.certificates for select
  using (auth.uid() = student_id or public.can_manage_academics());

grant select, insert on public.course_payments to authenticated;
grant select on public.certificates to authenticated;

-- Auditoría de certificados y pagos
create or replace function public.audit_certificates_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_course_title text;
begin
  select p.full_name into v_student_name from public.profiles p where p.id = new.student_id;
  select c.title into v_course_title from public.courses c where c.id = new.course_id;

  perform public.log_audit_event(
    'created',
    'certificate',
    new.id,
    new.course_id,
    'Certificado emitido: ' || coalesce(v_student_name, 'alumno') || ' · ' || coalesce(v_course_title, 'curso'),
    jsonb_build_object('certificate_code', new.certificate_code)
  );
  return new;
end;
$$;

drop trigger if exists audit_certificates on public.certificates;
create trigger audit_certificates
  after insert on public.certificates
  for each row execute function public.audit_certificates_changes();
