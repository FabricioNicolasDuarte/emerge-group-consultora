import type { CampusIconKey } from '~/types/brand'
import type { CampusRoleSlug } from '~/types/campus'
import type { CampusPanelRole } from '~/composables/useCampusPanelNav'

export interface CampusNavEntry {
  panel: CampusPanelRole
  group: string
  label: string
  icon: CampusIconKey
  order?: number
  groupOrder?: number
  exact?: boolean
  badge?: boolean
  requiredRoles?: CampusRoleSlug[]
  /** Ruta del ítem si difiere del path de la página. */
  to?: string
}

export interface CampusBreadcrumb {
  label: string
  to?: string
}

export interface CampusTopBarState {
  breadcrumbs: CampusBreadcrumb[]
  backTo: string | null
  showBack: boolean
  useCustomBreadcrumbs: boolean
}
