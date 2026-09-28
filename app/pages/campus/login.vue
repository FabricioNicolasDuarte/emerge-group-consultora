<script setup lang="ts">
import { getPostLoginRedirect } from '~/utils/auth-redirect'

definePageMeta({
  layout: false,
})

const { brand } = useAppBrand()
const route = useRoute()

usePublicSeo(computed(() => ({
  title: `Ingresar — Campus ${brand.shortName}`,
  description: `Accedé a tu cuenta del Campus virtual de ${brand.name}.`,
  noindex: true,
})))
const { buildWhatsappHref } = useAppContact()
const supportWhatsappHref = computed(() =>
  buildWhatsappHref('Hola, tengo dificultades para ingresar al Campus Emerge.'),
)
const { user, profile, displayName, signIn, signOut, dashboardPath, requestPasswordReset } = useCampusAuth()

const REMEMBER_KEY = 'campus-remember-email'

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const switchingAccount = ref(false)
const errorMessage = ref('')
const resetSent = ref(false)

const activeSessionEmail = computed(() =>
  profile.value?.email
  || (typeof user.value?.email === 'string' ? user.value.email : '')
  || '',
)

const hasActiveSession = computed(() => Boolean(user.value))

const registerLink = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/campus')) {
    return `/campus/registro?redirect=${encodeURIComponent(redirect)}`
  }
  return '/campus/registro'
})

async function onSubmit() {
  errorMessage.value = ''
  resetSent.value = false
  loading.value = true

  try {
    await signIn(email.value, password.value)
    if (remember.value) {
      localStorage.setItem(REMEMBER_KEY, email.value.trim())
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
    await navigateTo(getPostLoginRedirect(dashboardPath.value))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

async function onForgotPassword() {
  if (!email.value.trim()) {
    errorMessage.value = 'Ingresá tu correo para recibir el enlace de recuperación.'
    return
  }

  errorMessage.value = ''
  resetSent.value = false
  loading.value = true

  try {
    await requestPasswordReset(email.value)
    resetSent.value = true
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : 'No se pudo enviar el correo.'
    const lower = raw.toLowerCase()
    if (lower.includes('rate limit') || lower.includes('only request this after')) {
      errorMessage.value = 'Se pidió recuperación demasiadas veces. Esperá 1–2 minutos e intentá de nuevo.'
    } else {
      errorMessage.value = raw
    }
    resetSent.value = false
  } finally {
    loading.value = false
  }
}

async function continueAsCurrentUser() {
  await navigateTo(getPostLoginRedirect(dashboardPath.value))
}

async function useAnotherAccount() {
  switchingAccount.value = true
  errorMessage.value = ''
  try {
    await signOut()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cerrar la sesión.'
  } finally {
    switchingAccount.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    email.value = saved
    remember.value = true
  }
})
</script>

<template>
  <CampusAuthLayout back-to="/campus">
    <template #brand>
      <span class="auth-brand__kicker">Campus Emerge</span>
      <h1>
        Tu espacio para
        <strong>seguir aprendiendo</strong>
      </h1>
      <p>
        Accedé a tus programas, materiales, actividades, progreso y certificaciones
        desde un único lugar.
      </p>
      <NuxtLink to="/campus" class="auth-brand__back">
        ← Volver al Campus
      </NuxtLink>
    </template>

    <span class="auth-card__kicker">Acceso al Campus</span>
    <h2>Bienvenido/a</h2>

    <template v-if="hasActiveSession">
      <p class="auth-card__intro">
        Hay una sesión abierta en este navegador.
      </p>
      <p class="auth-alert auth-alert--success" role="status">
        Sesión activa:
        <strong>{{ displayName || activeSessionEmail || 'usuario' }}</strong>
        <template v-if="displayName && activeSessionEmail">
          <br>
          <span class="auth-session-email">{{ activeSessionEmail }}</span>
        </template>
      </p>
      <p v-if="errorMessage" class="auth-alert auth-alert--error" role="alert">
        {{ errorMessage }}
      </p>
      <button class="auth-submit" type="button" :disabled="switchingAccount" @click="continueAsCurrentUser">
        Continuar con esta cuenta
      </button>
      <button
        class="auth-submit auth-submit--secondary"
        type="button"
        :disabled="switchingAccount"
        @click="useAnotherAccount"
      >
        {{ switchingAccount ? 'Cerrando sesión…' : 'Usar otra cuenta' }}
      </button>
    </template>

    <template v-else>
      <p class="auth-card__intro">
        Ingresá tus datos para continuar tu recorrido de aprendizaje en {{ brand.shortName }}.
      </p>

      <p v-if="errorMessage" class="auth-alert auth-alert--error" role="alert">
        {{ errorMessage }}
      </p>

      <p v-if="resetSent" class="auth-alert auth-alert--success" role="status">
        Te enviamos un enlace de recuperación a tu correo.
      </p>

      <form @submit.prevent="onSubmit">
        <div class="auth-field">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="nombre@correo.com"
          >
        </div>

        <div class="auth-field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Ingresá tu contraseña"
          >
        </div>

        <div class="auth-row">
          <label class="auth-check">
            <input v-model="remember" type="checkbox">
            Recordarme
          </label>
          <button type="button" class="auth-link" @click="onForgotPassword">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button class="auth-submit" type="submit" :disabled="loading">
          {{ loading ? 'Ingresando…' : 'Ingresar al Campus' }}
        </button>
      </form>

      <p class="auth-foot">
        ¿No tenés cuenta?
        <NuxtLink :to="registerLink">Registrate gratis</NuxtLink>
      </p>
    </template>

    <p class="auth-foot">
      ¿Tenés dificultades para ingresar?
      <a :href="supportWhatsappHref" target="_blank" rel="noopener noreferrer">Contactanos</a>
    </p>
  </CampusAuthLayout>
</template>

<style scoped>
.auth-session-email {
  font-weight: 500;
  opacity: 0.85;
}

.auth-submit--secondary {
  margin-top: 0.75rem;
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
}
</style>
