<script setup lang="ts">
import { formatProgramPriceLabel, formatProgramCohortDates, formatProgramSeatsHint, getProgramEnrollmentClosedLabel } from '~/utils/programCatalog'
import { formatSupabaseError } from '~/utils/supabase-error'

const props = defineProps<{
  courseId: string
  courseTitle: string
  priceAmount?: number
  priceCurrency?: string
  isEnrolled?: boolean
  isLoggedIn?: boolean
  enrollmentOpen?: boolean
  seatsRemaining?: number | null
  cohortStartDate?: string | null
  cohortEndDate?: string | null
  enrollmentStartsAt?: string | null
  enrollmentEndsAt?: string | null
  enrollmentCap?: number | null
}>()

const emit = defineEmits<{
  enrolled: []
}>()

const { enrollFree, createPaymentPreference } = useCampusCommerce()
const { paymentsEnabled } = useCampusFeatures()
const { contact } = useAppContact()
const route = useRoute()

const loginUrl = computed(() =>
  `/campus/login?redirect=${encodeURIComponent(route.fullPath)}`,
)
const registerUrl = computed(() =>
  `/campus/registro?redirect=${encodeURIComponent(route.fullPath)}`,
)

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isPaid = computed(() => (props.priceAmount ?? 0) > 0)
const canPayOnline = computed(() => isPaid.value && paymentsEnabled.value && canEnroll.value)
const enrollmentClosed = computed(() => props.enrollmentOpen === false)
const closedLabel = computed(() => getProgramEnrollmentClosedLabel({
  enrollment_open: props.enrollmentOpen,
  enrollment_cap: props.enrollmentCap,
  seats_remaining: props.seatsRemaining,
  enrollment_starts_at: props.enrollmentStartsAt,
}))
const cohortLabel = computed(() => formatProgramCohortDates({
  cohort_start_date: props.cohortStartDate,
  cohort_end_date: props.cohortEndDate,
}))
const seatsHint = computed(() => formatProgramSeatsHint({
  enrollment_cap: props.enrollmentCap,
  seats_remaining: props.seatsRemaining,
}))
const canEnroll = computed(() => !enrollmentClosed.value)
const priceLabel = computed(() =>
  formatProgramPriceLabel(props.priceAmount, props.priceCurrency ?? 'ARS'),
)
const enrollmentMailto = computed(() => {
  const subject = encodeURIComponent(`Inscripción a ${props.courseTitle}`)
  const body = encodeURIComponent(`Hola, quiero inscribirme al programa "${props.courseTitle}".`)
  return `mailto:${contact.email}?subject=${subject}&body=${body}`
})

async function onEnrollFree() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await enrollFree(props.courseId)
    successMessage.value = '¡Inscripción confirmada! Ya podés acceder al contenido.'
    emit('enrolled')
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo completar la inscripción')
  } finally {
    loading.value = false
  }
}

async function onPay() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { initPoint } = await createPaymentPreference(props.courseId)
    window.location.href = initPoint
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo iniciar el pago')
    loading.value = false
  }
}
</script>

<template>
  <section id="inscripcion" class="enroll-card">
    <div>
      <span class="section-label">INSCRIPCIÓN</span>
      <h2 v-if="isEnrolled">Ya estás inscripto</h2>
      <h2 v-else-if="enrollmentClosed">{{ closedLabel }}</h2>
      <h2 v-else-if="canPayOnline">Inscribite al programa</h2>
      <h2 v-else-if="isPaid">Inscripción con arancel</h2>
      <h2 v-else>Inscripción gratuita</h2>
      <p v-if="isEnrolled">
        Seguí avanzando con las clases y tu progreso se actualizará automáticamente.
      </p>
      <p v-else-if="enrollmentClosed">
        {{ closedLabel }}. Si necesitás más información, escribinos a
        <a href="mailto:emergegroup.fsa@gmail.com">emergegroup.fsa@gmail.com</a>.
      </p>
      <template v-else>
        <p v-if="cohortLabel || seatsHint" class="cohort-meta">
          <span v-if="cohortLabel">{{ cohortLabel }}</span>
          <span v-if="seatsHint">{{ seatsHint }}</span>
        </p>
        <p v-if="!isLoggedIn">
          Iniciá sesión o <NuxtLink :to="registerUrl" class="inline-link">creá tu cuenta</NuxtLink>
          para inscribirte en <strong>{{ courseTitle }}</strong>.
        </p>
        <p v-else-if="canPayOnline">
          Valor del programa: <strong>{{ priceLabel }}</strong>. El pago se procesa de forma segura con Mercado Pago.
        </p>
        <p v-else-if="isPaid">
          Este programa tiene un arancel de <strong>{{ priceLabel }}</strong>.
          El pago online se habilitará próximamente. Escribinos a
          <a href="mailto:emergegroup.fsa@gmail.com">emergegroup.fsa@gmail.com</a>
          para coordinar tu inscripción.
        </p>
        <p v-else>
          Este programa es gratuito. Confirmá tu inscripción para acceder a todo el contenido.
        </p>
      </template>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>

    <div v-if="!isEnrolled" class="actions">
      <template v-if="enrollmentClosed" />
      <NuxtLink v-else-if="!isLoggedIn" :to="loginUrl" class="btn primary">
        Ingresar al Campus →
      </NuxtLink>
      <button
        v-else-if="canPayOnline"
        type="button"
        class="btn primary"
        :disabled="loading"
        @click="onPay"
      >
        {{ loading ? 'Redirigiendo…' : `Pagar ${priceLabel}` }}
      </button>
      <a
        v-else-if="isPaid"
        :href="enrollmentMailto"
        class="btn primary"
      >
        Solicitar inscripción
      </a>
      <button
        v-else
        type="button"
        class="btn primary"
        :disabled="loading"
        @click="onEnrollFree"
      >
        {{ loading ? 'Inscribiendo…' : 'Inscribirme gratis' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.enroll-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 28px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--eg-ink), var(--eg-ink-mid));
  color: var(--eg-surface);
  margin-bottom: 28px;
  scroll-margin-top: 24px;
}

.section-label {
  color: var(--eg-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

h2 {
  margin: 8px 0;
  font-family: var(--eg-font-display);
}

p {
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
  margin: 0;
}

p a {
  color: var(--eg-accent);
  font-weight: 700;
}

.inline-link {
  color: var(--eg-accent);
  font-weight: 700;
  text-decoration: none;
}

.cohort-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 10px !important;
}

.cohort-meta span {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.error {
  color: var(--eg-error-border) !important;
  margin-top: 10px !important;
}

.success {
  color: var(--eg-success-border) !important;
  margin-top: 10px !important;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  white-space: nowrap;
}

.btn.primary {
  background: var(--eg-accent);
  color: var(--eg-surface);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .enroll-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
