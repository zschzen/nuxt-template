// @ts-check
import config from '@openpencil/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  ...config,
  {
    name: '@openpencil/web',
    rules: {},
  },
)
