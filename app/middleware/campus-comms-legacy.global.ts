import { isLegacyAvisosPath, LEGACY_AVISOS_REDIRECTS } from '~/utils/campus-comms-paths'

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/$/, '') || '/'
  if (!isLegacyAvisosPath(path)) return
  return navigateTo(LEGACY_AVISOS_REDIRECTS[path], { replace: true })
})
