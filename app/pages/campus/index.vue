<script setup lang="ts">
import type { CourseCatalogItem } from '~/types/academic'
import type { PublicAnnouncement } from '~/types/comms'

definePageMeta({
  layout: false,
})

usePublicSeo({
  title: 'Campus Emerge — Formación EmergeGroup Consultora',
  description: 'Programas de formación online para personas, equipos y organizaciones. Campus virtual de EmergeGroup Consultora.',
})

const { fetchPublishedCourses } = useAcademic()
const { fetchPublicAnnouncements } = useCampusComms()
const { user, dashboardPath } = useCampusAuth()

const programs = ref<CourseCatalogItem[]>([])
const announcements = ref<PublicAnnouncement[]>([])
const loadingPrograms = ref(true)

onMounted(async () => {
  try {
    const [courseRows, announcementRows] = await Promise.all([
      fetchPublishedCourses(),
      fetchPublicAnnouncements().catch(() => []),
    ])
    programs.value = courseRows
    announcements.value = announcementRows
  } finally {
    loadingPrograms.value = false
  }
})
</script>

<template>
  <div class="campus-public">
    <CampusPublicHeader
      :user="user"
      :dashboard-path="dashboardPath"
      :show-announcements="announcements.length > 0"
    />
    <main id="main-content">
      <CampusPublicHero />
      <CampusPublicPrograms :programs="programs" :loading="loadingPrograms" />
      <CampusPublicAbout />
      <CampusPublicFaculty />
      <CampusPublicJourney />
      <CampusPublicAudience />
      <CampusPublicTestimonials />
      <CampusPublicAnnouncements :announcements="announcements" />
      <CampusPublicCta />
    </main>
    <CampusPublicWhatsapp />
  </div>
</template>
