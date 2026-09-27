import type { MaybeRefOrGetter } from 'vue'
import type { CampusIconKey } from '~/types/brand'
import { buildCampusNavFromRoutes } from '~/utils/campus-nav-builder'

export type CampusPanelRole = 'student' | 'teacher' | 'admin'

export interface CampusPanelNavItem {
  to: string
  label: string
  icon: CampusIconKey
  exact?: boolean
  badge?: boolean
}

export interface CampusPanelNavGroup {
  label: string
  items: CampusPanelNavItem[]
}

export function useCampusPanelNav(role: MaybeRefOrGetter<CampusPanelRole>) {
  const router = useRouter()
  const route = useRoute()
  const { signOut, hasRole } = useCampusAuth()

  const groups = computed<CampusPanelNavGroup[]>(() =>
    buildCampusNavFromRoutes(router.getRoutes(), toValue(role), hasRole),
  )

  const storageKey = `campus-${role}-sidebar-collapsed`

  function isActive(item: CampusPanelNavItem) {
    const path = route.path.replace(/\/$/, '') || '/'
    const target = item.to.replace(/\/$/, '') || '/'
    if (item.exact) return path === target
    return path === target || path.startsWith(`${target}/`)
  }

  return { groups, storageKey, signOut, isActive }
}
