import type { CampusBreadcrumb } from '~/types/campus-nav'
import type { CampusPanelRole } from '~/composables/useCampusPanelNav'
import { ROLE_DASHBOARD_PATHS, type CampusRoleSlug } from '~/types/campus'
import { CAMPUS_ENTRY_PATH } from '~/utils/campus-shared-routes'
import { panelHomePath } from '~/utils/campus-panel-paths'

const SEGMENT_LABELS: Record<string, string> = {
  student: 'Mi campus',
  teacher: 'Panel docente',
  admin: 'Administración',
  dashboard: 'Inicio',
  buzon: 'Mi buzón',
  redactar: 'Redactar',
  anuncios: 'Anuncios',
  comunicaciones: 'Comunicaciones',
  certificados: 'Certificados',
  reportes: 'Reportes',
  auditoria: 'Auditoría',
  cursos: 'Cursos',
  contenido: 'Contenido',
  asistencia: 'Asistencia',
  calificaciones: 'Calificaciones',
  notas: 'Mis notas',
  avisos: 'Avisos',
  progreso: 'Mi progreso',
  alumnos: 'Alumnos',
  docentes: 'Docentes',
  inscripciones: 'Inscripciones',
  nuevo: 'Nuevo',
  editar: 'Editar',
  pagos: 'Pagos',
  resultado: 'Resultado',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function labelForSegment(segment: string, index: number, segments: string[]) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (UUID_RE.test(segment)) {
    const parent = segments[index - 1]
    if (parent === 'buzon') return 'Conversación'
    if (parent === 'anuncios') return 'Anuncio'
    if (parent === 'cursos') return 'Curso'
    return 'Detalle'
  }
  if (segment.length > 24) return 'Detalle'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function resolveCampusHomePath(role: CampusRoleSlug | null | undefined) {
  if (!role) return CAMPUS_ENTRY_PATH
  return ROLE_DASHBOARD_PATHS[role] ?? CAMPUS_ENTRY_PATH
}

export function buildCampusBreadcrumbs(
  path: string,
  homePath: string,
  activePanel?: CampusPanelRole,
): CampusBreadcrumb[] {
  const normalized = path.replace(/\/$/, '') || '/'
  const rootPath = activePanel ? panelHomePath(activePanel) : homePath
  const relative = normalized.replace(/^\/campus\/?/, '')
  const segments = relative ? relative.split('/').filter(Boolean) : []

  if (!segments.length) {
    return [{ label: 'Campus' }]
  }

  const crumbs: CampusBreadcrumb[] = [{ label: 'Campus', to: rootPath }]

  segments.forEach((segment, index) => {
    const acc = `/campus/${segments.slice(0, index + 1).join('/')}`
    const label = labelForSegment(segment, index, segments)
    const isLast = index === segments.length - 1
    crumbs.push(isLast ? { label } : { label, to: acc })
  })

  return crumbs
}

export function resolveCampusBackTarget(
  path: string,
  breadcrumbs: CampusBreadcrumb[],
  homePath: string,
) {
  const normalized = path.replace(/\/$/, '') || '/'
  if (normalized === homePath) return null

  if (breadcrumbs.length > 1) {
    const parent = breadcrumbs[breadcrumbs.length - 2]
    if (parent?.to) return parent.to
  }

  return homePath
}
