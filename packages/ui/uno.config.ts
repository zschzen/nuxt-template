import type { Preset } from 'unocss'
import type { Theme } from 'unocss/preset-mini'
import { createResolver } from '@nuxt/kit'
import {
  defineConfig,

  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,

  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetBetterBreakpoints } from 'unocss-preset-better-breakpoints'
import { presetShadcn } from 'unocss-preset-shadcn'

const { resolve } = createResolver(import.meta.url)

const NTH_MATCH_PATTERN = /^nth-\[(.+?):/

export default defineConfig({
  variants: [
    {
      // nth-[]:class
      name: ':nth-child()',
      match: (matcher: string) => {
        const match = matcher.match(NTH_MATCH_PATTERN)
        if (!match) {
          return matcher
        }
        return {
          // slice `hover:` prefix and passed to the next variants and rules
          matcher: matcher.substring(match[0].length),
          selector: s => `${s}:nth-child(${match[1]})`,
        }
      },
      multiPass: true,
    },
  ],

  shortcuts: {},

  theme: {
    fontSize: {
      xxs: '0.625rem',
    },
  },

  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
    presetTypography(),
    presetWebFonts({
      // provider: 'bunny',
      fonts: {
        sans: 'Chivo',
        mono: 'Chivo Mono',
      },
    }),
    presetAnimations(),
    presetBetterBreakpoints() as Preset<Theme>,
    presetShadcn({ color: 'blue', radius: 0.75 }, { componentLibrary: 'reka' }),
  ],

  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],

  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        resolve('app/components/ui/**/*.{js,ts}'),
      ],
    },

    filesystem: [
      resolve('app/components/ui/**/*.{js,ts}'),
    ],
  },
})
