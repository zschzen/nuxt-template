import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)
const currentDir = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  devtools: { enabled: true },

  alias: {
    '@openpencil/ui': resolve('./app'),
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
      path: join(currentDir, './app/components'),
    },
  ],

  shadcn: {
    prefix: 'Ui',
    componentDir: join(currentDir, './app/components/ui'),
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
