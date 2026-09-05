// https://nuxt.com/docs/api/configuration/nuxt-config
import { templateLocales } from '@template/i18n/locales'

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

  extends: ['@template/ui', '@template/storage', '@template/seo', '@template/i18n'],

  // App messages (apps/web/i18n/locales/*.json) merge over @template/i18n `common.*`.
  // Same objects as the layer (redeclaration replaces, not deep-merges).
  i18n: {
    // Canonical SEO URL; deliberately static (canonicals always point at prod).
    // Origin only — the /nuxt-template/ subpath comes from the route itself.
    baseUrl: 'https://zschzen.github.io',
    locales: [...templateLocales],
  },

  modules: ['@nuxt/eslint', '@vueuse/nuxt', '@vite-pwa/nuxt', '@pinia/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: [
      'favicon.ico',
      'icon.svg',
      'apple-touch-icon-180x180.png',
      'apple-splash-*.png',
    ],
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
      navigateFallback: '/nuxt-template/',
      navigateFallbackDenylist: [
        /^\/_nuxt\//,
        /^\/_?nuxt_devtools__\//,
        /^\/workbox-/,
      ],
      globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.bunny\.net\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'bunny-fonts',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          // i18n messages are fetched at runtime (/_i18n/<hash>/<locale>/messages.json);
          // cache them so locale switching keeps working offline
          urlPattern: /\/_i18n\/.*\.json$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'i18n-messages',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [200] },
          },
        },
      ],
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
