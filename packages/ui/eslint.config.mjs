// @ts-check
import config from '@openpencil/eslint-config'
import withNuxt from './.playground/.nuxt/eslint.config.mjs'

export default withNuxt(
  ...config,
  {
    name: '@openpencil/ui',
    rules: {},
  },
)
