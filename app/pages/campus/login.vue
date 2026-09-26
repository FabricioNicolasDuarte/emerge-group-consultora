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
const { emailHref } = useAppContact()
const { signIn, dashboardPath, requestPasswordReset } = useCampusAuth()

const REMEMBER_KEY = 'campus-remember-email'

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const resetSent = ref(false)

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
  loading.value = true

  try {
    await requestPasswordReset(email.value)
    resetSent.value = true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el correo.'
    errorMessage.value = message
  } finally {
    loading.value = false
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

    <p class="auth-foot">
      ¿Tenés dificultades para ingresar?
      <a :href="emailHref">Contactanos</a>
    </p>
  </CampusAuthLayout>
</template>
