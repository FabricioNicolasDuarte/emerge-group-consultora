import {
  ADMIN_STAFF_PREFIX,
  isTeacherOnlyStaff,
  resolveStaffPrefixFromPath,
  staffAnuncioEditarPath,
  staffAnunciosNuevoPath,
  staffAnunciosPath,
  staffComunicacionesPath,
  staffCourseAsistenciaPath,
  staffCourseCalificacionesPath,
  staffCourseContenidoPath,
  TEACHER_STAFF_PREFIX,
} from '~/utils/campus-staff-paths'
import { isPanelPreservedRoute } from '~/utils/campus-shared-routes'
import type { CampusPanelRole } from '~/composables/useCampusPanelNav'

const STAFF_PREFIX_BY_PANEL: Record<CampusPanelRole, string> = {
  student: ADMIN_STAFF_PREFIX,
  teacher: TEACHER_STAFF_PREFIX,
  admin: ADMIN_STAFF_PREFIX,
}

export function useCampusStaffPaths() {
  const route = useRoute()
  const { hasRole } = useCampusAuth()
  const { activePanel } = useCampusActivePanel()

  const basePath = computed(() => {
    if (
      route.path.startsWith(`${TEACHER_STAFF_PREFIX}/`)
      || route.path === TEACHER_STAFF_PREFIX
      || route.path.startsWith(`${ADMIN_STAFF_PREFIX}/`)
      || route.path === ADMIN_STAFF_PREFIX
    ) {
      return resolveStaffPrefixFromPath(route.path)
    }
    if (isPanelPreservedRoute(route.path)) {
      return STAFF_PREFIX_BY_PANEL[activePanel.value]
    }
    if (isTeacherOnlyStaff(hasRole)) return TEACHER_STAFF_PREFIX
    return ADMIN_STAFF_PREFIX
  })

  const anunciosPath = computed(() => staffAnunciosPath(basePath.value))
  const anunciosNuevoPath = computed(() => staffAnunciosNuevoPath(basePath.value))
  const comunicacionesPath = computed(() => staffComunicacionesPath(basePath.value))

  function anuncioEditarPath(id: string) {
    return staffAnuncioEditarPath(basePath.value, id)
  }

  function courseContenidoPath(courseId: string) {
    return staffCourseContenidoPath(basePath.value, courseId)
  }

  function courseAsistenciaPath(courseId: string) {
    return staffCourseAsistenciaPath(basePath.value, courseId)
  }

  function courseCalificacionesPath(courseId: string) {
    return staffCourseCalificacionesPath(basePath.value, courseId)
  }

  return {
    basePath,
    anunciosPath,
    anunciosNuevoPath,
    comunicacionesPath,
    anuncioEditarPath,
    courseContenidoPath,
    courseAsistenciaPath,
    courseCalificacionesPath,
  }
}
