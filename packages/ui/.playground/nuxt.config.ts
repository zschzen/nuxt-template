export default defineNuxtConfig({
  extends: ['..'],

  css: [
    '~/assets/style.css',
  ],

  unocss: {
    nuxtLayers: true,
  },
})
