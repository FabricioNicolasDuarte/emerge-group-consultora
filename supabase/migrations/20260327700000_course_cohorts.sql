-- =============================================================================
-- Campus Emerge — Cupos y fechas de cohorte por curso
-- =============================================================================

alter table public.courses
  add column if not exists cohort_start_date date,
  add column if not exists cohort_end_date date,
  add column if not exists enrollment_cap integer,
  add column if not exists enrollment_starts_at timestamptz,
  add column if not exists enrollment_ends_at timestamptz;

alter table public.courses
  drop constraint if exists courses_enrollment_cap_positive;

alter table public.courses
  add constraint courses_enrollment_cap_positive
  check (enrollment_cap is null or enrollment_cap > 0);

alter table public.courses
  drop constraint if exists courses_cohort_dates_check;

alter table public.courses
  add constraint courses_cohort_dates_check
  check (
    cohort_end_date is null
    or cohort_start_date is null
    or cohort_end_date >= cohort_start_date
  );

alter table public.courses
  drop constraint if exists courses_enrollment_window_check;

alter table public.courses
  add constraint courses_enrollment_window_check
  check (
    enrollment_ends_at is null
    or enrollment_starts_at is null
    or enrollment_ends_at >= enrollment_starts_at
  );

-- -----------------------------------------------------------------------------
-- Helpers de cupos / ventana de inscripción
-- -----------------------------------------------------------------------------

create or replace function public.course_active_enrollment_count(p_course_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.enrollments e
  where e.course_id = p_course_id
    and e.status = 'active';
$$;

grant execute on function public.course_active_enrollment_count(uuid) to anon, authenticated;

create or replace function public.assert_course_enrollment_available(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses%rowtype;
  v_count integer;
  v_now timestamptz := now();
begin
  if public.is_staff() then
    return;
  end if;

  select * into v_course
  from public.courses
  where id = p_course_id;

  if not found then
    raise exception 'Curso no encontrado';
  end if;

  if v_course.enrollment_starts_at is not null and v_now < v_course.enrollment_starts_at then
    raise exception 'La inscripción aún no está abierta';
  end if;

  if v_course.enrollment_ends_at is not null and v_now > v_course.enrollment_ends_at then
    raise exception 'La inscripción ya cerró';
  end if;

  if v_course.enrollment_cap is not null then
    v_count := public.course_active_enrollment_count(p_course_id);
    if v_count >= v_course.enrollment_cap then
      raise exception 'No hay cupos disponibles';
    end if;
  end if;
end;
$$;

grant execute on function public.assert_course_enrollment_available(uuid) to authenticated, service_role;

create or replace function public.enforce_enrollment_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and (
    tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and old.status is distinct from 'active')
  ) then
    perform public.assert_course_enrollment_available(new.course_id);
  end if;

  return new;
end;
$$;

drop trigger if exists enrollments_capacity_check on public.enrollments;
create trigger enrollments_capacity_check
  before insert or update on public.enrollments
  for each row execute function public.enforce_enrollment_capacity();

-- -----------------------------------------------------------------------------
-- Inscripción gratuita con validación de cupos
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

  perform public.assert_course_enrollment_available(p_course_id);

  insert into public.enrollments (course_id, student_id, status)
  values (p_course_id, auth.uid(), 'active')
  on conflict (course_id, student_id) do update
    set status = excluded.status
  returning id into v_enrollment_id;

  return v_enrollment_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Pago aprobado con validación de cupos
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

  perform public.assert_course_enrollment_available(v_payment.course_id);

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

-- -----------------------------------------------------------------------------
-- Vistas de catálogo con cohorte y cupos
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
  (c.price_amount > 0) as is_paid,
  c.cohort_start_date,
  c.cohort_end_date,
  c.enrollment_cap,
  c.enrollment_starts_at,
  c.enrollment_ends_at,
  coalesce(ec.cnt, 0)::int as enrollment_count,
  case
    when c.enrollment_cap is null then null
    else greatest(c.enrollment_cap - coalesce(ec.cnt, 0), 0)::int
  end as seats_remaining,
  (
    (c.enrollment_starts_at is null or now() >= c.enrollment_starts_at)
    and (c.enrollment_ends_at is null or now() <= c.enrollment_ends_at)
    and (
      c.enrollment_cap is null
      or coalesce(ec.cnt, 0) < c.enrollment_cap
    )
  ) as enrollment_open
from public.courses c
left join lateral (
  select count(*) as cnt from public.modules m where m.course_id = c.id
) mc on true
left join lateral (
  select count(*) as cnt
  from public.enrollments e
  where e.course_id = c.id and e.status = 'active'
) ec on true
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
  c.price_currency,
  c.cohort_start_date,
  c.cohort_end_date,
  c.enrollment_cap,
  c.enrollment_starts_at,
  c.enrollment_ends_at,
  case
    when c.enrollment_cap is null then null
    else greatest(c.enrollment_cap - coalesce(ec.cnt, 0), 0)::int
  end as seats_remaining
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
