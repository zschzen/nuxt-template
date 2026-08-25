import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  devtools: { enabled: true },

  alias: {
    '@template/ui': resolve('./app'),
    '@': resolve('./app'),
  },

  vite: {
    optimizeDeps: {
      include: [
        'vue-sonner',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'reka-ui',
      ],
    },
  },

  modules: [
    '@unocss/nuxt',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@nuxt/image',
  ],

  components: [
    {
      path: resolve('./app/components'),
    },
  ],

  shadcn: {
    prefix: 'Ui',
    componentDir: resolve('./app/components/ui'),
  },

  css: [
    resolve('./app/assets/globals.css'),
  ],

  colorMode: {
    classSuffix: '',
  },

  features: {
    inlineStyles: false,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },
})
