<script setup lang="ts">
import { getPostLoginRedirect } from '~/utils/auth-redirect'

definePageMeta({
  layout: false,
})

usePublicSeo({
  title: 'Crear cuenta — Campus Emerge',
  description: 'Registrate en el Campus virtual de EmergeGroup Consultora.',
  noindex: true,
})

const route = useRoute()
const { signUp, signIn, dashboardPath } = useCampusAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const success = ref(false)

const loginLink = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/campus')) {
    return `/campus/login?redirect=${encodeURIComponent(redirect)}`
  }
  return '/campus/login'
})

const passwordStrength = computed(() => {
  const value = password.value
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  return score
})

const passwordStrengthLabel = computed(() => {
  if (!password.value) return ''
  if (passwordStrength.value <= 2) return 'Débil'
  if (passwordStrength.value <= 3) return 'Media'
  return 'Fuerte'
})

const passwordStrengthClass = computed(() => {
  if (!password.value) return ''
  if (passwordStrength.value <= 2) return 'weak'
  if (passwordStrength.value <= 3) return 'medium'
  return 'strong'
})

async function onSubmit() {
  errorMessage.value = ''
  if (!fullName.value.trim()) {
    errorMessage.value = 'Ingresá tu nombre completo.'
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    const data = await signUp(email.value, password.value, fullName.value)
    if (data.session) {
      await navigateTo(getPostLoginRedirect(dashboardPath.value))
      return
    }
    success.value = true
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la cuenta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CampusAuthLayout back-to="/campus">
    <template #brand>
      <span class="auth-brand__kicker">Campus Emerge</span>
      <h1>
        Empezá tu
        <strong>recorrido formativo</strong>
      </h1>
      <p>
        Creá tu cuenta para acceder a programas, materiales, seguimiento de progreso
        y certificaciones.
      </p>
      <NuxtLink to="/campus" class="auth-brand__back">
        ← Volver al Campus
      </NuxtLink>
    </template>

    <span class="auth-card__kicker">Nueva cuenta</span>
    <h2>Crear cuenta</h2>
    <p class="auth-card__intro">
      Registrate como alumno para acceder a los programas de formación del Campus.
    </p>

    <p v-if="success" class="auth-alert auth-alert--success" role="status">
      Te enviamos un correo de confirmación. Revisá tu bandeja y luego
      <NuxtLink :to="loginLink">iniciá sesión</NuxtLink>.
    </p>

    <template v-else>
      <p v-if="errorMessage" class="auth-alert auth-alert--error" role="alert">
        {{ errorMessage }}
      </p>

      <form @submit.prevent="onSubmit">
        <div class="auth-field">
          <label for="fullName">Nombre completo</label>
          <input id="fullName" v-model="fullName" type="text" autocomplete="name" required>
        </div>
        <div class="auth-field">
          <label for="email">Correo electrónico</label>
          <input id="email" v-model="email" type="email" autocomplete="email" required>
        </div>
        <div class="auth-field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
          >
          <p
            v-if="password"
            class="auth-password-strength"
            :class="`auth-password-strength--${passwordStrengthClass}`"
            role="status"
          >
            Fortaleza: {{ passwordStrengthLabel }}
          </p>
        </div>
        <div class="auth-field">
          <label for="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
          >
        </div>
        <button class="auth-submit" type="submit" :disabled="loading">
          {{ loading ? 'Creando cuenta…' : 'Registrarme' }}
        </button>
      </form>

      <p class="auth-foot">
        ¿Ya tenés cuenta?
        <NuxtLink :to="loginLink">Ingresar al campus</NuxtLink>
      </p>
    </template>
  </CampusAuthLayout>
</template>
