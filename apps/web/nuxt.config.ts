// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  compatibilityDate: 'latest',
  app: {
    baseURL: '/nuxt-template/',
  },
  robots: {
    robotsTxt: false,
  },
  site: {
    name: 'Template App',
    description: 'PWA-ready Nuxt template with offline support',
    url: 'https://zschzen.github.io/',
  },
  devtools: { enabled: true },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  extends: ['@template/ui', '@template/storage', '@template/seo'],

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
      scope: '/nuxt-template/',
      start_url: '/nuxt-template/',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [
        /^\/_nuxt\//,
        /^\/_?nuxt_devtools__\//,
        /^\/workbox-/,
      ],
      globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
    },
    devOptions: {
      enabled: false,
      type: 'module',
      navigateFallbackAllowlist: [/^\/$/],
    },
  },

  routeRules: {
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  },

  vite: {
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
