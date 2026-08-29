export const CAMPUS_BUZON_PATH = '/campus/buzon'
export const CAMPUS_REDACTAR_PATH = '/campus/buzon/redactar'

export const STUDENT_COMMS_HUB_PATH = '/campus/student/comunicaciones'
export const TEACHER_COMMS_HUB_PATH = '/campus/teacher/comunicaciones'
export const ADMIN_COMMS_HUB_PATH = '/campus/admin/comunicaciones'

export const LEGACY_AVISOS_REDIRECTS: Record<string, string> = {
  '/campus/student/avisos': STUDENT_COMMS_HUB_PATH,
  '/campus/teacher/avisos': TEACHER_COMMS_HUB_PATH,
}

export function isLegacyAvisosPath(path: string) {
  const normalized = path.replace(/\/$/, '') || '/'
  return normalized in LEGACY_AVISOS_REDIRECTS
}

export function resolveCommsHubPath(panel: import('~/composables/useCampusPanelNav').CampusPanelRole) {
  if (panel === 'teacher') return TEACHER_COMMS_HUB_PATH
  if (panel === 'admin') return ADMIN_COMMS_HUB_PATH
  return STUDENT_COMMS_HUB_PATH
}
