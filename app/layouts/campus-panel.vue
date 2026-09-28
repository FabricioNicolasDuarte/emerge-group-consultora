<template>
  <CampusPanelShell :role="activePanel">
    <main id="main-content" class="campus-page">
      <CampusUnreadAlert />
      <slot />
    </main>
  </CampusPanelShell>
</template>

<script setup lang="ts">
import '~/assets/css/campus-shell.css'
import '~/assets/css/campus-sections.css'
import '~/assets/css/campus-mgmt.css'

const { activePanel } = useCampusActivePanel()

const student = useStudentCampusData()
const teacher = useTeacherCampusData()
const admin = useAdminCampusData()

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
