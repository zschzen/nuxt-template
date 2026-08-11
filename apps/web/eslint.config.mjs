// @ts-check
import config from '@template/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  ...config,
  {
    name: '@template/web',
    rules: {},
  },
)
