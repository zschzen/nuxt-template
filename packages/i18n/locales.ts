// Single source of truth for locale codes.
//
// Both this layer's nuxt.config.ts and every consuming app's `i18n.locales`
// must declare the SAME objects: app-level redeclaration replaces whole
// locale entries (it does not deep-merge), so omitting `language` here
// silently drops the BCP47 tags the module needs for SEO features.
export const templateLocales = [
  { code: 'en', language: 'en-US', file: 'en.json' },
  { code: 'pt-BR', language: 'pt-BR', file: 'pt-BR.json' },
] as const
