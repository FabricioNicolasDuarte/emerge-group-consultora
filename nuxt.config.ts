// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase'],

  css: [
    '~/assets/css/tokens.css',
    '~/assets/css/base.css',
    '~/assets/css/public.css',
  ],

  runtimeConfig: {
    mercadopagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    mercadopagoSandbox: process.env.MERCADOPAGO_SANDBOX || 'true',
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      appVersion: pkg.version || '1.0.0',
      paymentsEnabled: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
      /** Opcional: sobreescribe app.config.ts → contact.email */
      contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL || '',
      /** Opcional: sobreescribe app.config.ts → contact.whatsapp (solo dígitos) */
      contactWhatsapp: process.env.NUXT_PUBLIC_CONTACT_WHATSAPP || '',
    },
  },

  supabase: {
    types: '~/types/database.types.ts',
    redirect: true,
    redirectOptions: {
      login: '/campus/login',
      callback: '/campus/dashboard',
      exclude: [
        '/',
        '/campus',
        '/campus/login',
        '/campus/registro',
        '/campus/restablecer-contrasena',
        '/campus/anuncios/**',
        '/campus/pagos/**',
        '/campus/cursos/**',
        '/campus/certificados/**',
      ],
      saveRedirectToCookie: true,
    },
  },
})
