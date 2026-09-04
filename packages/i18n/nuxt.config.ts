import { createResolver } from '@nuxt/kit'
import { templateLocales } from './locales'

const { resolve } = createResolver(import.meta.url)

// https://i18n.nuxtjs.org/
export default defineNuxtConfig({
  compatibilityDate: 'latest',

  modules: ['@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [...templateLocales],
    // file-based locales are always lazy-loaded in v10 (`lazy` flag removed)
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    vueI18n: resolve('./i18n.config.ts'),
  },
})
