<script setup lang="ts">
import type { CampusPanelRole } from '~/composables/useCampusPanelNav'
import type { CampusRoleSlug } from '~/types/campus'
import { PANEL_HOME_PATHS } from '~/utils/campus-panel-paths'

const { profile } = useCampusAuth()
const { activePanel, setActivePanel } = useCampusActivePanel()

const PANELS: { panel: CampusPanelRole, roles: CampusRoleSlug[], label: string }[] = [
  { panel: 'admin', roles: ['superadmin', 'admin', 'coordinador'], label: 'Admin' },
  { panel: 'teacher', roles: ['docente', 'tutor'], label: 'Docente' },
  { panel: 'student', roles: ['alumno'], label: 'Alumno' },
]

const availablePanels = computed(() => {
  const slugs = profile.value?.role_slugs ?? []
  return PANELS.filter((panel) => panel.roles.some((role) => slugs.includes(role)))
})

const showSwitcher = computed(() => availablePanels.value.length > 1)

const options = computed(() =>
  availablePanels.value.map((panel) => ({
    value: panel.panel,
    label: panel.label,
  })),
)

const activePanelValue = computed(() => activePanel.value)

async function onPanelChange(panel: string) {
  const next = panel as CampusPanelRole
  setActivePanel(next)
  await navigateTo(PANEL_HOME_PATHS[next])
}
</script>

<template>
  <CampusSegmented
    v-if="showSwitcher"
    :model-value="activePanelValue"
    :options="options"
    aria-label="Cambiar panel"
    class="role-switcher"
    @update:model-value="onPanelChange"
  />
</template>

<style scoped>
.role-switcher {
  margin-bottom: 1.25rem;
}
</style>
