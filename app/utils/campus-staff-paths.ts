import type { CampusRoleSlug } from '~/types/campus'

export const TEACHER_STAFF_PREFIX = '/campus/teacher'
export const ADMIN_STAFF_PREFIX = '/campus/admin'

export function resolveStaffPrefixFromPath(path: string) {
  if (path.startsWith(`${TEACHER_STAFF_PREFIX}/`) || path === TEACHER_STAFF_PREFIX) {
    return TEACHER_STAFF_PREFIX
  }
  return ADMIN_STAFF_PREFIX
}

export function isTeacherOnlyStaff(
  hasRole: (...roles: CampusRoleSlug[]) => boolean,
) {
  return hasRole('docente', 'tutor') && !hasRole('superadmin', 'admin', 'coordinador')
}

export function isLegacyTeacherAdminPath(path: string) {
  const normalized = path.replace(/\/$/, '') || '/'
  if (normalized.startsWith('/campus/admin/anuncios')) return true
  if (normalized.startsWith('/campus/admin/comunicaciones')) return true
  return /^\/campus\/admin\/cursos\/[^/]+(\/(contenido|alumnos|asistencia|calificaciones))?(\/|$)/.test(normalized)
}

export function toTeacherStaffPath(adminPath: string) {
  return adminPath.replace('/campus/admin/', '/campus/teacher/')
}

export function staffAnunciosPath(base: string) {
  return `${base}/anuncios`
}

export function staffAnunciosNuevoPath(base: string) {
  return `${base}/anuncios/nuevo`
}

export function staffAnuncioEditarPath(base: string, id: string) {
  return `${base}/anuncios/${id}/editar`
}

export function staffComunicacionesPath(base: string) {
  return `${base}/comunicaciones`
}

export function staffCourseHubPath(base: string, courseId: string) {
  return `${base}/cursos/${courseId}`
}

export function staffCourseContenidoPath(base: string, courseId: string) {
  return `${base}/cursos/${courseId}/contenido`
}

export function staffCourseAlumnosPath(base: string, courseId: string) {
  return `${base}/cursos/${courseId}/alumnos`
}

export function staffCourseAsistenciaPath(base: string, courseId: string) {
  return `${base}/cursos/${courseId}/asistencia`
}

export function staffCourseCalificacionesPath(base: string, courseId: string) {
  return `${base}/cursos/${courseId}/calificaciones`
}
