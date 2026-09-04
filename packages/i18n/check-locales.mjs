// Ensures en.json and pt-BR.json under each given locales dir share
// the exact same key set, so no locale silently falls back to English.
// Usage: node check-locales.mjs <dir> [<dir>...]
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

let failed = false
for (const dir of process.argv.slice(2)) {
  const enFile = join(dir, 'en.json')
  const ptFile = join(dir, 'pt-BR.json')
  if (!existsSync(enFile) || !existsSync(ptFile)) {
    console.error(`i18n:check: missing locale file in ${dir}`)
    failed = true
    continue
  }
  const en = new Set(keys(JSON.parse(readFileSync(enFile, 'utf8'))))
  const pt = new Set(keys(JSON.parse(readFileSync(ptFile, 'utf8'))))
  const missingInPt = [...en].filter(k => !pt.has(k))
  const missingInEn = [...pt].filter(k => !en.has(k))
  if (missingInPt.length > 0 || missingInEn.length > 0) {
    failed = true
    for (const k of missingInPt) console.error(`i18n:check: ${dir}: missing in pt-BR.json: ${k}`)
    for (const k of missingInEn) console.error(`i18n:check: ${dir}: missing in en.json: ${k}`)
  }
}
process.exit(failed ? 1 : 0)
