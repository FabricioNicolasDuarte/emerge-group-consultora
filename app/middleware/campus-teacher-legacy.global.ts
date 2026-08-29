import {
  isLegacyTeacherAdminPath,
  isTeacherOnlyStaff,
  toTeacherStaffPath,
} from '~/utils/campus-staff-paths'

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'
  if (!path.startsWith('/campus') || !isLegacyTeacherAdminPath(path)) return

  const user = useSupabaseUser()
  if (!user.value) return

  const { fetchProfile, hasRole } = useCampusAuth()
  await fetchProfile()

  if (!isTeacherOnlyStaff(hasRole)) return

  return navigateTo(toTeacherStaffPath(path), { replace: true })
})
