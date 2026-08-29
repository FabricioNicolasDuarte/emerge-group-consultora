import type { CampusRoleSlug } from '~/types/campus'

export default defineNuxtRouteMiddleware(async (to) => {
  const allowed = to.meta.campusRoles as CampusRoleSlug[] | undefined
  if (!allowed?.length) return

  const { user, fetchProfile, hasRole, dashboardPath, profile } = useCampusAuth()

  if (!user.value) {
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/campus/login?redirect=${redirect}`)
  }

  await fetchProfile()

  if (profile.value && !profile.value.is_active) {
    return navigateTo('/campus/login')
  }

  const permitted = allowed.some((role) => hasRole(role))
  if (!permitted) {
    return navigateTo(dashboardPath.value)
  }
})
