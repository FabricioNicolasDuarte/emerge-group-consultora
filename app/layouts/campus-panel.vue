<template>
  <CampusPanelShell :role="activePanel">
    <main id="main-content" class="campus-page">
      <CampusUnreadAlert />
      <div class="campus-page__content">
        <slot />
      </div>
      <CampusSubtleFooter />
    </main>
    <CampusHelpNotch />
    <CampusSupportModal />
    <CampusFenixLoader />
  </CampusPanelShell>
</template>

<script setup lang="ts">
import '~/assets/css/campus-shell.css'
import '~/assets/css/campus-sections.css'
import '~/assets/css/campus-mgmt.css'
import '~/assets/css/campus-home.css'

const { activePanel } = useCampusActivePanel()

const student = useStudentCampusData()
const teacher = useTeacherCampusData()
const admin = useAdminCampusData()

const panelLoading = computed(() => {
  if (activePanel.value === 'student') return student.loading.value
  if (activePanel.value === 'teacher') return teacher.loading.value
  return admin.loading.value
})

useTrackFenixLoader(panelLoading)

async function refreshPanelData() {
  if (activePanel.value === 'student') {
    await student.loadData()
    return
  }
  if (activePanel.value === 'teacher') {
    await teacher.loadData()
    return
  }
  await admin.loadData()
}

useCampusAutoRefresh(refreshPanelData)
</script>
