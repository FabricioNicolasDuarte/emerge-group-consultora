<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
})

const {
  profile,
  profileLoading,
  displayName,
  updateOwnProfile,
  uploadOwnAvatar,
  removeOwnAvatar,
  updatePassword,
} = useCampusAuth()

const form = reactive({
  full_name: '',
  phone: '',
  city: '',
  job_role: '',
  occupation: '',
  audience: '',
  challenge: '',
})

const password = reactive({
  next: '',
  confirm: '',
})

const saving = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(
  profile,
  (value) => {
    if (!value) return
    form.full_name = value.full_name || ''
    form.phone = value.phone || ''
    form.city = value.city || ''
    form.job_role = value.job_role || ''
    form.occupation = value.occupation || ''
    form.audience = value.audience || ''
    form.challenge = value.challenge || ''
  },
  { immediate: true },
)

async function onSaveProfile() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await updateOwnProfile(form)
    successMessage.value = 'Perfil actualizado.'
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo guardar el perfil'
  } finally {
    saving.value = false
  }
}

async function onPickAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await uploadOwnAvatar(file)
    successMessage.value = 'Foto actualizada.'
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo subir la foto'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function onRemoveAvatar() {
  uploading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await removeOwnAvatar()
    successMessage.value = 'Foto eliminada.'
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo quitar la foto'
  } finally {
    uploading.value = false
  }
}

async function onChangePassword() {
  if (password.next.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.next !== password.confirm) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await updatePassword(password.next)
    password.next = ''
    password.confirm = ''
    successMessage.value = 'Contraseña actualizada.'
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña'
  } finally {
    saving.value = false
  }
}

usePublicSeo({
  title: 'Mi perfil — Campus Emerge',
  description: 'Editá tus datos y foto de perfil en Campus Emerge.',
  noindex: true,
})
</script>

<template>
  <div class="campus-mgmt-ambient">
    <CampusPageHeader
      eyebrow="CUENTA"
      title="Mi perfil"
      description="Actualizá tus datos y la foto que ven docentes y administración."
    />

    <p v-if="profileLoading" class="mgmt-empty campus-glass">Cargando perfil…</p>
    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="campus-banner campus-banner--success">{{ successMessage }}</p>

    <template v-if="profile">
      <section class="profile-hero campus-glass">
        <CampusAvatar :name="displayName" :src="profile.avatar_url" size="lg" />
        <div class="profile-hero__copy">
          <h2>{{ displayName }}</h2>
          <p>{{ profile.email || 'Sin correo' }}</p>
          <div class="profile-hero__actions">
            <button
              type="button"
              class="campus-btn campus-btn--primary"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              {{ uploading ? 'Subiendo…' : 'Cambiar foto' }}
            </button>
            <button
              v-if="profile.avatar_url"
              type="button"
              class="campus-btn"
              :disabled="uploading"
              @click="onRemoveAvatar"
            >
              Quitar foto
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              @change="onPickAvatar"
            >
          </div>
          <small>JPG, PNG o WebP. Máximo 5 MB.</small>
        </div>
      </section>

      <section class="mgmt-compose campus-glass">
        <h2>Datos personales</h2>
        <div class="profile-form">
          <label>
            Nombre completo
            <input v-model="form.full_name" type="text" required>
          </label>
          <label>
            Teléfono
            <input v-model="form.phone" type="tel">
          </label>
          <label>
            Ciudad
            <input v-model="form.city" type="text">
          </label>
          <label>
            Rol / cargo
            <input v-model="form.job_role" type="text">
          </label>
          <label>
            Ocupación
            <input v-model="form.occupation" type="text">
          </label>
          <label>
            Audiencia / perfil
            <input v-model="form.audience" type="text">
          </label>
          <label class="profile-form__full">
            Desafío / objetivo
            <textarea v-model="form.challenge" rows="3" />
          </label>
        </div>
        <div class="profile-form__footer">
          <button
            type="button"
            class="campus-btn campus-btn--primary"
            :disabled="saving"
            @click="onSaveProfile"
          >
            {{ saving ? 'Guardando…' : 'Guardar perfil' }}
          </button>
        </div>
      </section>

      <section class="mgmt-compose campus-glass">
        <h2>Cambiar contraseña</h2>
        <div class="profile-form">
          <label>
            Nueva contraseña
            <input v-model="password.next" type="password" autocomplete="new-password">
          </label>
          <label>
            Confirmar contraseña
            <input v-model="password.confirm" type="password" autocomplete="new-password">
          </label>
        </div>
        <div class="profile-form__footer">
          <button
            type="button"
            class="campus-btn"
            :disabled="saving"
            @click="onChangePassword"
          >
            Actualizar contraseña
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.profile-hero {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: center;
  padding: 1.35rem 1.4rem;
  margin-bottom: 1.15rem;
}

.profile-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
}

.profile-hero__copy h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--campus-ink);
}

.profile-hero__copy p {
  margin: 0;
  color: var(--campus-muted);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.profile-hero__copy small {
  color: var(--campus-subtle);
  font-size: 0.75rem;
}

.profile-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.profile-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.profile-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--campus-ink-soft);
}

.profile-form__full {
  grid-column: 1 / -1;
}

.profile-form input,
.profile-form textarea {
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--eg-field-border);
  background: rgba(255, 255, 255, 0.85);
  font: inherit;
  font-weight: 500;
  color: var(--campus-ink);
}

.profile-form__footer {
  margin-top: 1rem;
}
</style>
