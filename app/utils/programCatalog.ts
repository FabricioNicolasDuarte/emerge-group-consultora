import { formatCoursePrice } from '~/types/commerce'

export type ProgramBadgeTone = 'accent' | 'action' | 'success' | 'muted'

export type ProgramBadge = {
  id: string
  label: string
  tone: ProgramBadgeTone
}

const NEW_PROGRAM_DAYS = 60
const POPULAR_MIN_ENROLLMENTS = 3

export function isProgramFree(program: { price_amount?: number; is_paid?: boolean }) {
  const amount = program.price_amount ?? 0
  return amount <= 0 || program.is_paid === false
}

export function isProgramNew(program: { created_at?: string }, now = new Date()) {
  if (!program.created_at) return false
  const created = new Date(program.created_at)
  if (Number.isNaN(created.getTime())) return false
  const diffMs = now.getTime() - created.getTime()
  return diffMs >= 0 && diffMs <= NEW_PROGRAM_DAYS * 24 * 60 * 60 * 1000
}

export function isProgramPopular(
  program: { enrollment_count?: number },
  allPrograms: { enrollment_count?: number }[] = [],
) {
  const count = program.enrollment_count ?? 0
  if (count < POPULAR_MIN_ENROLLMENTS) return false
  const top = Math.max(...allPrograms.map(p => p.enrollment_count ?? 0), 0)
  return top > 0 && count >= top * 0.6
}

export function getProgramBadges(
  program: {
    price_amount?: number
    is_paid?: boolean
    created_at?: string
    enrollment_count?: number
    enrollment_cap?: number | null
    seats_remaining?: number | null
    enrollment_open?: boolean
    enrollment_starts_at?: string | null
  },
  allPrograms: { enrollment_count?: number }[] = [],
): ProgramBadge[] {
  const badges: ProgramBadge[] = []

  const closedLabel = getProgramEnrollmentClosedLabel(program)
  if (closedLabel) {
    badges.push({ id: 'closed', label: closedLabel, tone: 'muted' })
  } else {
    const seatsHint = formatProgramSeatsHint(program)
    if (seatsHint && seatsHint.startsWith('Últim')) {
      badges.push({ id: 'seats', label: seatsHint, tone: 'action' })
    }
  }

  if (isProgramFree(program)) {
    badges.push({ id: 'free', label: 'Gratis', tone: 'success' })
  }

  if (isProgramNew(program)) {
    badges.push({ id: 'new', label: 'Nuevo', tone: 'accent' })
  }

  if (isProgramPopular(program, allPrograms)) {
    badges.push({ id: 'popular', label: 'Popular', tone: 'action' })
  }

  return badges
}

export function formatProgramPublishedDate(createdAt?: string) {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatProgramPriceLabel(
  amount?: number,
  currency = 'ARS',
) {
  const formatted = formatCoursePrice(amount ?? 0, currency)
  if (!amount || amount <= 0) return formatted
  return `Desde ${formatted}`
}

export function formatProgramEnrollmentHint(count?: number) {
  const value = count ?? 0
  if (value <= 0) return null
  if (value === 1) return '1 persona inscripta'
  return `${value} personas inscriptas`
}

type CohortProgram = {
  cohort_start_date?: string | null
  cohort_end_date?: string | null
  enrollment_cap?: number | null
  enrollment_count?: number
  seats_remaining?: number | null
  enrollment_open?: boolean
  enrollment_starts_at?: string | null
  enrollment_ends_at?: string | null
}

function formatCohortDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatProgramCohortDates(program: CohortProgram) {
  const start = program.cohort_start_date
  const end = program.cohort_end_date
  if (!start && !end) return null

  const startLabel = start ? formatCohortDate(start) : null
  const endLabel = end ? formatCohortDate(end) : null

  if (startLabel && endLabel) return `Cohorte ${startLabel} – ${endLabel}`
  if (startLabel) return `Inicio ${startLabel}`
  return endLabel ? `Hasta ${endLabel}` : null
}

export function formatProgramSeatsHint(program: CohortProgram) {
  if (!program.enrollment_cap) return null

  const remaining = program.seats_remaining
    ?? Math.max(program.enrollment_cap - (program.enrollment_count ?? 0), 0)

  if (remaining <= 0) return 'Sin cupos'
  if (remaining === 1) return 'Último cupo'
  if (remaining <= 5) return `Últimos ${remaining} cupos`
  return `${remaining} cupos disponibles`
}

export function isProgramEnrollmentClosed(program: CohortProgram) {
  return program.enrollment_open === false
}

export function getProgramEnrollmentClosedLabel(program: CohortProgram) {
  if (!isProgramEnrollmentClosed(program)) return null

  const now = Date.now()
  if (program.enrollment_starts_at) {
    const starts = new Date(program.enrollment_starts_at).getTime()
    if (!Number.isNaN(starts) && now < starts) return 'Inscripción próximamente'
  }

  if (program.enrollment_cap) {
    const remaining = program.seats_remaining
      ?? Math.max(program.enrollment_cap - (program.enrollment_count ?? 0), 0)
    if (remaining <= 0) return 'Sin cupos'
  }

  return 'Inscripción cerrada'
}
