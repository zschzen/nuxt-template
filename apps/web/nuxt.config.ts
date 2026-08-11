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

  modules: ['@nuxt/eslint'],

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
})
