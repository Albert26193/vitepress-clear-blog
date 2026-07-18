import { WEBFONT_DEFAULTS } from './defaults'
import type { FontsConfig } from './types'

/**
 * A VitePress head entry: tag name plus its attributes.
 */
export type WebfontHeadEntry = [string, Record<string, string>]

const GOOGLE_FONTS_ORIGIN = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_STATIC_ORIGIN = 'https://fonts.gstatic.com'

/**
 * Normalizes a FontStack-ish value into a trimmed, non-empty string list.
 */
const toList = (value: string | string[] | undefined): string[] => {
  if (value === undefined || value === null) return []
  const items = Array.isArray(value) ? value : [value]
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/**
 * Splits a webfont entry into its family name and optional css2 axis suffix.
 * `"Noto Serif SC:wght@400;700"` → family `Noto Serif SC`, axis `wght@400;700`.
 */
const splitEntry = (entry: string): { family: string; axis?: string } => {
  const idx = entry.indexOf(':')
  if (idx === -1) return { family: entry.trim() }
  return {
    family: entry.slice(0, idx).trim(),
    axis: entry.slice(idx + 1).trim() || undefined
  }
}

/**
 * Encodes one entry as a css2 `family=` query parameter value. Spaces become
 * `+` (the css2 convention); an axis suffix is passed through verbatim so users
 * can request explicit weights, e.g. `Noto+Serif+SC:wght@400;700`.
 */
const familyParam = (entry: string): string => {
  const { family, axis } = splitEntry(entry)
  const encoded = family.replace(/\s+/g, '+')
  return axis ? `${encoded}:${axis}` : encoded
}

const stripQuotes = (value: string): string =>
  value.replace(/^['"]|['"]$/g, '').trim()

/**
 * Warns when a webfont family is not referenced by any configured font stack —
 * the font would download but never apply, which is almost always a typo.
 */
const warnUnusedFamilies = (
  entries: string[],
  fonts: FontsConfig,
  warn: (message: string) => void
): void => {
  const stackFamilies = new Set(
    [...toList(fonts.sans), ...toList(fonts.serif), ...toList(fonts.mono)].map(
      (family) => stripQuotes(family).toLowerCase()
    )
  )
  if (stackFamilies.size === 0) return
  for (const entry of entries) {
    const { family } = splitEntry(entry)
    if (!stackFamilies.has(stripQuotes(family).toLowerCase())) {
      warn(
        `[config] theme.fonts.webfont: "${family}" is loaded as a webfont but does not appear in any sans/serif/mono stack, so it will never render`
      )
    }
  }
}

/**
 * Builds VitePress head entries that load the configured webfont families from
 * a Google Fonts css2-compatible endpoint. All mirrors of Google Fonts are
 * path-compatible reverse proxies, so only the base origin differs; the default
 * base is a mainland-China-friendly mirror and can be overridden per site.
 *
 * @param fonts - The `[theme.fonts]` section from config.toml.
 * @param warn - Warning sink, defaults to `console.warn` (injectable for tests).
 * @returns Head entries (preconnect + stylesheet), or `[]` when no webfont is
 *   configured so sites without the feature pay zero cost.
 */
export const buildWebfontHead = (
  fonts: FontsConfig | undefined,
  warn: (message: string) => void = console.warn
): WebfontHeadEntry[] => {
  if (!fonts) return []
  const entries = toList(fonts.webfont)
  if (entries.length === 0) return []

  const base = (fonts.webfontBase || WEBFONT_DEFAULTS.base).replace(/\/+$/, '')
  let origin: string
  try {
    origin = new URL(base).origin
  } catch {
    warn(`[config] theme.fonts.webfontBase: "${base}" is not a valid URL`)
    return []
  }

  warnUnusedFamilies(entries, fonts, warn)

  const familyParams = entries
    .map((entry) => `family=${familyParam(entry)}`)
    .join('&')
  const href = `${base}/css2?${familyParams}&display=${WEBFONT_DEFAULTS.display}`

  const head: WebfontHeadEntry[] = [
    ['link', { rel: 'preconnect', href: origin }],
    // Font binaries are fetched in CORS mode, so they need a separate
    // crossorigin preconnect. Official Google serves them from gstatic;
    // mirrors rewrite font URLs onto their own origin.
    origin === GOOGLE_FONTS_ORIGIN
      ? [
          'link',
          {
            rel: 'preconnect',
            href: GOOGLE_FONTS_STATIC_ORIGIN,
            crossorigin: ''
          }
        ]
      : ['link', { rel: 'preconnect', href: origin, crossorigin: '' }],
    ['link', { rel: 'stylesheet', href }]
  ]
  return head
}
