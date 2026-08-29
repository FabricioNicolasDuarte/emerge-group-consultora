import {
  ADMIN_COMMS_HUB_PATH,
  CAMPUS_BUZON_PATH,
  CAMPUS_REDACTAR_PATH,
  resolveCommsHubPath,
  STUDENT_COMMS_HUB_PATH,
  TEACHER_COMMS_HUB_PATH,
} from '~/utils/campus-comms-paths'

export function useCampusCommsPaths() {
  const { hasAnyStaffRole, hasRole } = useCampusAuth()
  const { activePanel } = useCampusActivePanel()
  const { anunciosPath } = useCampusStaffPaths()

  const hubPath = computed(() => resolveCommsHubPath(activePanel.value))

  const canComposeMailbox = computed(() =>
    hasAnyStaffRole() || hasRole('docente', 'tutor'),
  )

  const canManageAnnouncements = computed(() => hasAnyStaffRole())

  return {
    hubPath,
    studentHubPath: STUDENT_COMMS_HUB_PATH,
    teacherHubPath: TEACHER_COMMS_HUB_PATH,
    adminHubPath: ADMIN_COMMS_HUB_PATH,
    buzonPath: CAMPUS_BUZON_PATH,
    redactarPath: CAMPUS_REDACTAR_PATH,
    anunciosPath,
    canComposeMailbox,
    canManageAnnouncements,
  }
}
