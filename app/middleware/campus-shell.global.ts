import {
  CAMPUS_PUBLIC_ROUTES,
  isCampusCourseRoute,
  isCampusGuestRoute,
  isCampusStandaloneLayoutRoute,
} from '~/utils/campus-shared-routes'

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/$/, '') || '/'
  if (!path.startsWith('/campus')) return
  if (CAMPUS_PUBLIC_ROUTES.has(path)) return

  const user = useSupabaseUser()

  if (!user.value) {
    if (isCampusGuestRoute(path)) return
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/campus/login?redirect=${redirect}`)
  }

  if (isCampusCourseRoute(path)) {
    setPageLayout('campus-course')
    return
  }

  if (isCampusStandaloneLayoutRoute(path)) {
    return
  }

  setPageLayout('campus-panel')
})
