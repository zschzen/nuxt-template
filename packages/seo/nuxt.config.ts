export default defineNuxtConfig({
  modules: ['@nuxtjs/seo', 'nuxt-ai-ready', 'nuxt-skew-protection'],

  site: {
    defaultLocale: 'en',
  },

  aiReady: {
    llmsTxt: {
      markdownLinks: true,
    },
  },
})
