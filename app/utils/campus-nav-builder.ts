import type { CampusPanelNavGroup, CampusPanelNavItem } from '~/composables/useCampusPanelNav'
import type { CampusPanelRole } from '~/composables/useCampusPanelNav'
import type { CampusNavEntry } from '~/types/campus-nav'
import type { CampusRoleSlug } from '~/types/campus'

const DEFAULT_GROUP_ORDER: Record<CampusPanelRole, Record<string, number>> = {
  student: {
    Panel: 1,
    Comunicación: 2,
    Progreso: 3,
  },
  teacher: {
    Panel: 1,
    Comunicación: 2,
  },
  admin: {
    General: 1,
    Certificaciones: 2,
    Sistema: 3,
  },
}

function normalizeCampusNav(meta: CampusNavEntry | CampusNavEntry[]) {
  return Array.isArray(meta) ? meta : [meta]
}

function resolveGroupOrder(panel: CampusPanelRole, group: string, entryOrder?: number) {
  return entryOrder ?? DEFAULT_GROUP_ORDER[panel][group] ?? 99
}

function normalizeRoutePath(path: string) {
  if (path === '/') return path
  return path.replace(/\/$/, '') || '/'
}

export function buildCampusNavFromRoutes(
  routes: Array<{ path: string, meta: Record<string, unknown> }>,
  panel: CampusPanelRole,
  hasRole: (...roles: CampusRoleSlug[]) => boolean,
): CampusPanelNavGroup[] {
  const items: Array<CampusPanelNavItem & { group: string, groupOrder: number, order: number }> = []
  const seen = new Set<string>()

  for (const route of routes) {
    const navMeta = route.meta.campusNav as CampusNavEntry | CampusNavEntry[] | undefined
    if (!navMeta) continue

    const routePath = normalizeRoutePath(route.path)
    if (routePath.includes(':')) continue

    for (const entry of normalizeCampusNav(navMeta)) {
      if (entry.panel !== panel) continue
      if (entry.requiredRoles?.length && !entry.requiredRoles.some((role) => hasRole(role))) {
        continue
      }

      const to = normalizeRoutePath(entry.to ?? routePath)
      const key = `${panel}:${to}`
      if (seen.has(key)) continue
      seen.add(key)

      items.push({
        to,
        label: entry.label,
        icon: entry.icon,
        exact: entry.exact,
        badge: entry.badge,
        group: entry.group,
        groupOrder: resolveGroupOrder(panel, entry.group, entry.groupOrder),
        order: entry.order ?? 99,
      })
    }
  }

  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const bucket = grouped.get(item.group) ?? []
    bucket.push(item)
    grouped.set(item.group, bucket)
  }

  return [...grouped.entries()]
    .sort((a, b) => {
      const orderA = a[1][0]?.groupOrder ?? 99
      const orderB = b[1][0]?.groupOrder ?? 99
      return orderA - orderB || a[0].localeCompare(b[0], 'es')
    })
    .map(([label, groupItems]) => ({
      label,
      items: groupItems
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'es'))
        .map(({ group, groupOrder, order, ...navItem }) => navItem),
    }))
}
