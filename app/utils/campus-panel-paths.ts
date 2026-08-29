import type { CampusPanelRole } from '~/composables/useCampusPanelNav'

export const PANEL_HOME_PATHS: Record<CampusPanelRole, string> = {
  student: '/campus/student',
  teacher: '/campus/teacher',
  admin: '/campus/admin',
}

export const PANEL_HOME_LABELS: Record<CampusPanelRole, string> = {
  student: 'mi campus',
  teacher: 'panel docente',
  admin: 'administración',
}

export function panelHomePath(panel: CampusPanelRole) {
  return PANEL_HOME_PATHS[panel]
}

export function panelHomeLabel(panel: CampusPanelRole) {
  return PANEL_HOME_LABELS[panel]
}
