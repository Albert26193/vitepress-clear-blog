import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'

import { CONFIG_PATH } from './defaults'
import { validateConfigTomlWithFallback } from './validate'
import type { ValidatedConfigToml } from './validate'

let configCache: ValidatedConfigToml | null | undefined

/**
 * Loads and caches the parsed config.toml from .vitepress/config.toml.
 */
export function loadConfig(): ValidatedConfigToml | null {
  if (configCache !== undefined) return configCache
  const path = resolve(process.cwd(), CONFIG_PATH)

  let raw: string
  try {
    raw = readFileSync(path, 'utf-8')
  } catch {
    // Missing config.toml is a legitimate zero-config setup — use defaults.
    configCache = null
    return null
  }

  let parsed: unknown
  try {
    parsed = parse(raw)
  } catch (err) {
    // A malformed file must fail loudly: silently building the whole site
    // with pure defaults makes a single TOML typo impossible to debug.
    throw new Error(
      `[vitepress-plugin-config] failed to parse ${path}: ${
        err instanceof Error ? err.message : String(err)
      }`,
      { cause: err }
    )
  }

  configCache = validateConfigTomlWithFallback(parsed, path)
  return configCache
}

/** Clears all cached config entries. */
export function clearConfigCache(): void {
  configCache = undefined
}

/** Clears the cached config entry. */
export function clearConfigCacheEntry(): void {
  clearConfigCache()
}
