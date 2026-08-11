import { env } from '@template/env'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  devtools: { enabled: true },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  extends: ['@template/ui'],

  modules: ['@nuxt/eslint', '@vueuse/nuxt', '@vite-pwa/nuxt', '@pinia/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Template App',
      short_name: 'Template',
      description: 'PWA-ready Nuxt template with offline support',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
    },
  },

  routeRules: {
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  },

  vite: {
    server: {},
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'class-variance-authority',
        'clsx',
        '@lucide/vue',
        'reka-ui',
        'tailwind-merge',
        'vaul-vue',
        'vue-sonner',
      ],
    },
  },

  unocss: {
    nuxtLayers: true,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  runtimeConfig: {
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY,
    public: {
      vapidPublicKey: env.VAPID_PUBLIC_KEY,
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '~/*': ['./.nuxt/types/*.d.ts'],
        },
      },
    },
  },
})
