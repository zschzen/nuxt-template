// @ts-check
import config from '@template/eslint-config'
import withNuxt from './.playground/.nuxt/eslint.config.mjs'

export default withNuxt(
  ...config,
  {
    name: '@template/ui',
    rules: {},
  },
)
