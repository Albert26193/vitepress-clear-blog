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
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = validateConfigTomlWithFallback(parse(raw), path)
    configCache = parsed
    return parsed
  } catch {
    configCache = null
    return null
  }
}

/** Clears all cached config entries. */
export function clearConfigCache(): void {
  configCache = undefined
}

/** Clears the cached config entry. */
export function clearConfigCacheEntry(): void {
  clearConfigCache()
}
