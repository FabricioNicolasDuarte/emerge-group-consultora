import type { CampusBreadcrumb, CampusTopBarState } from '~/types/campus-nav'
import {
  buildCampusBreadcrumbs,
  resolveCampusBackTarget,
} from '~/utils/campus-breadcrumbs'
import { panelHomePath } from '~/utils/campus-panel-paths'

const TOPBAR_STATE_KEY = 'campus-topbar-state'

import { CAMPUS_ENTRY_PATH } from '~/utils/campus-shared-routes'

export function useCampusTopBar() {
  const route = useRoute()
  const { primaryRole } = useCampusAuth()
  const { activePanel } = useCampusActivePanel()

  const state = useState<CampusTopBarState>(TOPBAR_STATE_KEY, () => ({
    breadcrumbs: [],
    backTo: null,
    showBack: true,
    useCustomBreadcrumbs: false,
  }))

  const homePath = computed(() => panelHomePath(activePanel.value) || CAMPUS_ENTRY_PATH)

  function syncFromRoute() {
    if (state.value.useCustomBreadcrumbs) return

    const crumbs = buildCampusBreadcrumbs(route.path, homePath.value, activePanel.value)
    state.value.breadcrumbs = crumbs
    state.value.backTo = resolveCampusBackTarget(route.path, crumbs, homePath.value)
    state.value.showBack = Boolean(state.value.backTo)
  }

  function setBreadcrumbs(crumbs: CampusBreadcrumb[], options?: { showBack?: boolean, backTo?: string }) {
    state.value.useCustomBreadcrumbs = true
    state.value.breadcrumbs = crumbs
    state.value.backTo = options?.backTo ?? resolveCampusBackTarget(route.path, crumbs, homePath.value)
    state.value.showBack = options?.showBack ?? Boolean(state.value.backTo)
  }

  function resetBreadcrumbs() {
    state.value.useCustomBreadcrumbs = false
    syncFromRoute()
  }

  watch(
    () => route.fullPath,
    () => syncFromRoute(),
    { immediate: true },
  )

  watch(homePath, () => {
    if (!state.value.useCustomBreadcrumbs) syncFromRoute()
  })

  watch(activePanel, () => {
    if (!state.value.useCustomBreadcrumbs) syncFromRoute()
  })

  return {
    breadcrumbs: computed(() => state.value.breadcrumbs),
    backTo: computed(() => state.value.backTo),
    showBack: computed(() => state.value.showBack),
    homePath,
    primaryRole,
    setBreadcrumbs,
    resetBreadcrumbs,
    syncFromRoute,
  }
}
