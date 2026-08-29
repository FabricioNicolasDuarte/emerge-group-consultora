<script setup lang="ts">
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({ layout: false })

const route = useRoute()
const { fetchCertificateByCode } = useCampusCommerce()
const { user } = useCampusAuth()
const { homePath } = useCampusPanelHome()

const backLink = computed(() => (user.value ? homePath.value : '/campus'))

const code = computed(() => String(route.params.code || '').toUpperCase())
const certificate = ref<Awaited<ReturnType<typeof fetchCertificateByCode>>>(null)
const loading = ref(true)
const errorMessage = ref('')
const copyMessage = ref('')

const publicUrl = computed(() =>
  import.meta.client ? `${window.location.origin}/campus/certificados/${code.value}` : '',
)

const { brand } = useAppBrand()

usePublicSeo(() => ({
  title: certificate.value
    ? `Certificado de ${certificate.value.student_name} — Campus ${brand.shortName}`
    : `Verificar certificado — Campus ${brand.shortName}`,
  description: certificate.value
    ? `Certificado de finalización del programa «${certificate.value.course_title}» emitido por ${brand.name}.`
    : `Verificá la autenticidad de un certificado del Campus ${brand.shortName} con su código de verificación.`,
}))

async function copyCode() {
  if (!certificate.value) return
  try {
    await navigator.clipboard.writeText(certificate.value.certificate_code)
    copyMessage.value = 'Código copiado'
    setTimeout(() => { copyMessage.value = '' }, 2000)
  } catch {
    copyMessage.value = 'No se pudo copiar'
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copyMessage.value = 'Enlace copiado'
    setTimeout(() => { copyMessage.value = '' }, 2000)
  } catch {
    copyMessage.value = 'No se pudo copiar'
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function printCertificate() {
  window.print()
}

onMounted(async () => {
  if (!code.value) {
    errorMessage.value = 'Código de certificado inválido.'
    loading.value = false
    return
  }

  try {
    certificate.value = await fetchCertificateByCode(code.value)
    if (!certificate.value) {
      errorMessage.value = 'No encontramos un certificado con ese código.'
    }
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al verificar certificado')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="certificate-page">
    <header class="certificate-toolbar no-print">
      <NuxtLink :to="backLink" class="certificate-toolbar__back">
        ← {{ user ? 'Volver al campus' : 'Volver al inicio' }}
      </NuxtLink>
      <div v-if="certificate" class="certificate-toolbar__actions">
        <button type="button" class="public-btn public-btn--outline" @click="copyCode">
          Copiar código
        </button>
        <button type="button" class="public-btn public-btn--outline" @click="copyLink">
          Copiar enlace
        </button>
        <button type="button" class="public-btn public-btn--primary" @click="printCertificate">
          Imprimir PDF
        </button>
      </div>
    </header>

    <p v-if="copyMessage" class="certificate-toast no-print" role="status">
      {{ copyMessage }}
    </p>

    <main id="main-content" class="certificate-main">
      <p v-if="loading" class="certificate-state">Verificando certificado…</p>
      <p v-else-if="errorMessage" class="certificate-state certificate-state--error">
        {{ errorMessage }}
      </p>

      <article v-else-if="certificate" class="certificate-card">
        <div class="certificate-card__frame">
          <div class="certificate-card__inner">
            <BrandLogo variant="full" class="certificate-card__logo" />
            <span class="certificate-card__label">CAMPUS EMERGE</span>
            <h1>Certificado de finalización</h1>
            <p class="certificate-card__intro">Se certifica que</p>
            <h2>{{ certificate.student_name }}</h2>
            <p class="certificate-card__body">
              ha completado satisfactoriamente el programa de formación
            </p>
            <h3>{{ certificate.course_title }}</h3>
            <p class="certificate-card__category">{{ certificate.course_category }}</p>
            <p class="certificate-card__date">Emitido el {{ formatDate(certificate.issued_at) }}</p>
            <p class="certificate-card__code">
              Código de verificación:
              <strong>{{ certificate.certificate_code }}</strong>
            </p>
            <div class="certificate-card__signature">
              <span>{{ brand.name }}</span>
            </div>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>
