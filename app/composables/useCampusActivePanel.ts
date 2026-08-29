import type { CampusPanelRole } from '~/composables/useCampusPanelNav'
import type { CampusRoleSlug } from '~/types/campus'
import { PANEL_HOME_PATHS } from '~/utils/campus-panel-paths'
import { isPanelPreservedRoute } from '~/utils/campus-shared-routes'

const PANEL_PREFIX = PANEL_HOME_PATHS

function defaultPanelForUser(hasRole: (...roles: CampusRoleSlug[]) => boolean): CampusPanelRole {
  if (hasRole('superadmin', 'admin', 'coordinador')) return 'admin'
  if (hasRole('docente', 'tutor')) return 'teacher'
  return 'student'
}

function resolvePanelFromPath(
  path: string,
  fallback: CampusPanelRole,
): CampusPanelRole {
  const normalized = path.replace(/\/$/, '') || '/'

  if (normalized === PANEL_PREFIX.student || normalized.startsWith(`${PANEL_PREFIX.student}/`)) {
    return 'student'
  }

  if (normalized === PANEL_PREFIX.teacher || normalized.startsWith(`${PANEL_PREFIX.teacher}/`)) {
    return 'teacher'
  }

  if (normalized === PANEL_PREFIX.admin || normalized.startsWith(`${PANEL_PREFIX.admin}/`)) {
    if (isPanelPreservedRoute(normalized)) {
      return fallback
    }
    return 'admin'
  }

  if (isPanelPreservedRoute(normalized)) {
    return fallback
  }

  return fallback
}

export function useCampusActivePanel() {
  const route = useRoute()
  const { hasRole } = useCampusAuth()

  const activePanel = useState<CampusPanelRole>('campus-active-panel', () =>
    defaultPanelForUser(hasRole),
  )

  function syncFromRoute(path = route.path) {
    activePanel.value = resolvePanelFromPath(path, activePanel.value)
  }

  watch(() => route.path, (path) => syncFromRoute(path), { immediate: true })

  function setActivePanel(role: CampusPanelRole) {
    activePanel.value = role
  }

  return { activePanel, setActivePanel, syncFromRoute }
}
