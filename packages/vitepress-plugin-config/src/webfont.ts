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

const stripQuotes = (value: string): string =>
  value.replace(/^['"]|['"]$/g, '').trim()

/**
 * Extracts the plain family name from a webfont entry. css2 axis syntax
 * (`Family:wght@...`) is NOT supported — weights are a plugin policy, not user
 * syntax — so anything after a `:` is dropped with a warning.
 */
const familyName = (entry: string, warn: (message: string) => void): string => {
  const idx = entry.indexOf(':')
  if (idx === -1) return entry.trim()
  const family = entry.slice(0, idx).trim()
  warn(
    `[config] theme.fonts.webfont: "${entry}" — axis syntax is not supported; weights ${WEBFONT_DEFAULTS.weights.join('/')} are loaded automatically. Using "${family}".`
  )
  return family
}

/**
 * Warns when a webfont family is not referenced by any configured font stack —
 * the font would download but never apply, which is almost always a typo.
 */
const warnUnusedFamilies = (
  families: string[],
  fonts: FontsConfig,
  warn: (message: string) => void
): void => {
  const stackFamilies = new Set(
    [...toList(fonts.sans), ...toList(fonts.serif), ...toList(fonts.mono)].map(
      (family) => stripQuotes(family).toLowerCase()
    )
  )
  if (stackFamilies.size === 0) return
  for (const family of families) {
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
 * Each family gets its own stylesheet link requesting the default weights
 * (400/700 — regular and real bold), so one family with a missing weight fails
 * alone instead of taking down the whole request.
 *
 * @param fonts - The `[theme.fonts]` section from config.toml.
 * @param warn - Warning sink, defaults to `console.warn` (injectable for tests).
 * @returns Head entries (preconnect + stylesheets), or `[]` when no webfont is
 *   configured so sites without the feature pay zero cost.
 */
export const buildWebfontHead = (
  fonts: FontsConfig | undefined,
  warn: (message: string) => void = console.warn
): WebfontHeadEntry[] => {
  if (!fonts) return []
  const families = toList(fonts.webfont).map((entry) => familyName(entry, warn))
  if (families.length === 0) return []

  const base = (fonts.webfontBase || WEBFONT_DEFAULTS.base).replace(/\/+$/, '')
  let origin: string
  try {
    origin = new URL(base).origin
  } catch {
    warn(`[config] theme.fonts.webfontBase: "${base}" is not a valid URL`)
    return []
  }

  warnUnusedFamilies(families, fonts, warn)

  const wght = WEBFONT_DEFAULTS.weights.join(';')
  const stylesheets: WebfontHeadEntry[] = families.map((family) => [
    'link',
    {
      rel: 'stylesheet',
      href: `${base}/css2?family=${family.replace(/\s+/g, '+')}:wght@${wght}&display=${WEBFONT_DEFAULTS.display}`
    }
  ])

  return [
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
    ...stylesheets
  ]
}
