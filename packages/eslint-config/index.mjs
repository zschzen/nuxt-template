import antfu from '@antfu/eslint-config'

/**
 * Shared ESLint base configuration for the OpenPencil monorepo.
 * Powered by @antfu/eslint-config.
 */
export default await antfu(
  {
    type: 'app',
    typescript: true,
    vue: true,

    unocss: true,
    formatters: true,
    pnpm: true,

    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },

    ignores: ['.pnpm-store/**', '**/migrations/*'],
  },

  {
    files: ['**/*.vue'],
    rules: {
      'vue/max-attributes-per-line': ['error', {
        singleline: {
          max: 2,
        },
        multiline: {
          max: 1,
        },
      }],
    },
  },
  {
    rules: {
      'ts/no-redeclare': 'off',
      'ts/consistent-type-definitions': ['error', 'type'],
      'no-console': ['warn'],

      'n/prefer-global/process': 'error',
      'node/prefer-global/process': 'off',

      'n/no-process-env': 'error',
      'node/no-process-env': 'off',

      'antfu/no-top-level-await': ['off'],
      'unicorn/filename-case': ['error', {
        case: 'pascalCase',
        ignore: ['^[^/]+$'],
      }],
      'pnpm/yaml-enforce-settings': 'off',
      'pnpm/yaml-no-unused-catalog-item': 'off',
    },
  },
)
