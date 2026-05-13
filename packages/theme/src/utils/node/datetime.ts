import moment from 'moment'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'
import type { DatetimeConfig } from 'vitepress-plugin-config'

const CONFIG_PATH = '.vitepress/custom/config.toml'

export const DEFAULT_FIELDS = ['date']
export const DEFAULT_FORMATS = ['YYYY-MM-DD']
export const DEFAULT_OUTPUT = 'YYYY-MM-DD'

let _cached: DatetimeConfig | null = null

/** Exposed for tests to reset the module-level config cache. */
export function _resetDatetimeConfig(): void {
  _cached = null
}

function readDatetimeConfig(): DatetimeConfig {
  if (_cached) return _cached
  const configPath = resolve(process.cwd(), CONFIG_PATH)
  try {
    const raw = readFileSync(configPath, 'utf-8')
    const toml = parse(raw) as Record<string, unknown>
    _cached = (toml.datetime as DatetimeConfig) || {}
  } catch {
    _cached = {}
  }
  return _cached
}

/**
 * Pure datetime resolution: picks a frontmatter date field by priority, parses
 * it with strict format matching, and normalizes to YYYY-MM-DD. Falls back to
 * `new Date()` behavior when no formats match, preserving legacy compatibility.
 *
 * @param frontmatter - Raw page frontmatter object.
 * @param config - Datetime configuration from config.toml.
 * @returns Normalized YYYY-MM-DD date string, or undefined.
 */
export function resolveDate(
  frontmatter: Record<string, unknown>,
  config: DatetimeConfig = {}
): string | undefined {
  const fields = config.frontmatterFields || DEFAULT_FIELDS
  const formats = config.formats || DEFAULT_FORMATS

  // Phase 1: pick the first configured field that exists and is non-empty
  let dateValue: string | undefined
  for (const field of fields) {
    const value = frontmatter[field]
    // VitePress frontmatter parser may convert date-like strings to Date objects
    if (value instanceof Date && !isNaN(value.getTime())) {
      dateValue = moment(value).format(DEFAULT_OUTPUT)
      break
    }
    if (typeof value === 'string' && value.trim()) {
      dateValue = value.trim()
      break
    }
  }
  if (!dateValue) return undefined

  // Phase 2: strict format matching via moment.
  // Always normalize to YYYY-MM-DD so Timeline and year/month grouping
  // remain stable regardless of the configured outputFormat.
  const parsed = moment(dateValue, formats, true)
  if (parsed.isValid()) {
    return parsed.format(DEFAULT_OUTPUT)
  }

  // Phase 3: fallback — let the runtime parse it (matches current behavior)
  const fallback = new Date(dateValue)
  if (!isNaN(fallback.getTime())) {
    return moment(fallback).format(DEFAULT_OUTPUT)
  }

  return undefined
}

/**
 * Resolves a frontmatter date using the datetime config read from config.toml.
 * Convenience wrapper around {@link resolveDate} that reads the config once.
 *
 * @param frontmatter - Raw page frontmatter object.
 * @returns Normalized YYYY-MM-DD date string, or undefined.
 */
export function normalizePostDate(
  frontmatter: Record<string, unknown>
): string | undefined {
  return resolveDate(frontmatter, readDatetimeConfig())
}
