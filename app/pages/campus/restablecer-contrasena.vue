<script setup lang="ts">
definePageMeta({
  layout: false,
})

usePublicSeo({
  title: 'Restablecer contraseña — Campus Emerge',
  description: 'Recuperá el acceso a tu cuenta del Campus Emerge.',
  noindex: true,
})

const { updatePassword } = useCampusAuth()
const supabase = useSupabaseClient()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const ready = ref(false)
const errorMessage = ref('')
const success = ref(false)

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  ready.value = Boolean(data.session)
  if (!ready.value) {
    errorMessage.value = 'El enlace de recuperación expiró o no es válido. Solicitá uno nuevo desde el login.'
  }
})

async function onSubmit() {
  errorMessage.value = ''
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
    await updatePassword(password.value)
    success.value = true
    setTimeout(() => navigateTo('/campus/login'), 2500)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CampusAuthLayout back-to="/campus/login">
    <template #brand>
      <span class="auth-brand__kicker">Recuperar acceso</span>
      <h1>
        Definí tu
        <strong>nueva contraseña</strong>
      </h1>
      <p>
        Elegí una contraseña segura para volver a acceder a tu cuenta del Campus.
      </p>
      <NuxtLink to="/campus/login" class="auth-brand__back">
        ← Volver al login
      </NuxtLink>
    </template>

    <span class="auth-card__kicker">Seguridad</span>
    <h2>Nueva contraseña</h2>

    <p v-if="success" class="auth-alert auth-alert--success" role="status">
      Contraseña actualizada. Te redirigimos al login…
    </p>

    <template v-else-if="ready">
      <p class="auth-card__intro">
        Elegí una contraseña segura para tu cuenta del campus.
      </p>
      <p v-if="errorMessage" class="auth-alert auth-alert--error" role="alert">
        {{ errorMessage }}
      </p>
      <form @submit.prevent="onSubmit">
        <div class="auth-field">
          <label for="password">Nueva contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
          >
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
          {{ loading ? 'Guardando…' : 'Guardar contraseña' }}
        </button>
      </form>
    </template>

    <p v-else-if="errorMessage" class="auth-alert auth-alert--error" role="alert">
      {{ errorMessage }}
    </p>
  </CampusAuthLayout>
</template>
