import {
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
    basePath: '/nuxt-template/',
  },
  preset: combinePresetAndAppleSplashScreens(
    preset,
    {
      padding: 0.3,
      // Brand splash is always black (matches manifest background_color):
      // identical geometry on light + dark so design mock stays 1:1.
      resizeOptions: { background: '#000000', fit: 'contain' },
      darkResizeOptions: { background: '#000000', fit: 'contain' },
      linkMediaOptions: {
        log: true,
        basePath: '/nuxt-template/',
      },
    },
    ['iPhone 14', 'iPhone 16 Pro', 'iPad Air 11"'],
  ),
  images: ['public/icon.svg'],
})
