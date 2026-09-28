<script setup lang="ts">
import { resolveCampusHelp } from '~/data/campus-help'

const { open, closeSupport } = useCampusSupport()
const { displayName } = useCampusAuth()
const route = useRoute()

const subject = ref('')
const message = ref('')
const loading = ref(false)
const errorMessage = ref('')
const sent = ref(false)

const help = computed(() => resolveCampusHelp(route.path))

watch(open, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    sent.value = false
    if (!subject.value) {
      subject.value = `Consulta: ${help.value.title}`
    }
  }
})

async function onSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await $fetch('/api/campus/support', {
      method: 'POST',
      body: {
        subject: subject.value,
        message: message.value,
        pagePath: route.fullPath,
        pageTitle: help.value.title,
      },
    })
    sent.value = true
    message.value = ''
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
    errorMessage.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'No se pudo enviar.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="campus-support" role="dialog" aria-modal="true" aria-labelledby="campus-support-title">
      <button type="button" class="campus-support__backdrop" aria-label="Cerrar" @click="closeSupport()" />
      <div class="campus-support__panel campus-glass">
        <header class="campus-support__head">
          <div>
            <span class="campus-support__eyebrow">Ayuda</span>
            <h2 id="campus-support-title">Soporte técnico</h2>
            <p>Describí el problema y lo enviamos al correo del Campus.</p>
          </div>
          <button type="button" class="campus-support__close" @click="closeSupport()">✕</button>
        </header>

        <p v-if="sent" class="campus-support__ok" role="status">
          Listo. Recibimos tu pedido{{ displayName ? `, ${displayName}` : '' }}. Te responderemos a tu correo de cuenta.
        </p>
        <p v-if="errorMessage" class="campus-support__err" role="alert">{{ errorMessage }}</p>

        <form v-if="!sent" class="campus-support__form" @submit.prevent="onSubmit">
          <label>
            Asunto
            <input v-model="subject" type="text" maxlength="120" required placeholder="Ej. No puedo ver un curso">
          </label>
          <label>
            Descripción
            <textarea
              v-model="message"
              rows="6"
              maxlength="4000"
              required
              placeholder="Contá qué estabas haciendo, qué viste y qué esperabas que pasara."
            />
          </label>
          <p class="campus-support__meta">Página actual: {{ help.title }} · {{ route.path }}</p>
          <div class="campus-support__actions">
            <button type="button" class="campus-btn" @click="closeSupport()">Cancelar</button>
            <button type="submit" class="campus-btn campus-btn--primary" :disabled="loading">
              {{ loading ? 'Enviando…' : 'Enviar al Campus' }}
            </button>
          </div>
        </form>
        <div v-else class="campus-support__actions">
          <button type="button" class="campus-btn campus-btn--primary" @click="closeSupport()">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
