import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'

import { CONFIG_PATH } from './defaults'
import { validateConfigTomlWithFallback } from './validate'
import type { ValidatedConfigToml } from './validate'

const configCache = new Map<string, ValidatedConfigToml>()

/**
 * Loads and caches the parsed config.toml. Subsequent calls with the same path
 * return the cached result without re-reading the file.
 */
export function loadConfig(configPath?: string): ValidatedConfigToml | null {
  const path = resolve(process.cwd(), configPath || CONFIG_PATH)
  const cached = configCache.get(path)
  if (cached !== undefined) return cached
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = validateConfigTomlWithFallback(parse(raw), path)
    configCache.set(path, parsed)
    return parsed
  } catch {
    return null
  }
}

/** Clears all cached config entries. */
export function clearConfigCache(): void {
  configCache.clear()
}

/** Clears a single cached entry (used after file change for targeted invalidation). */
export function clearConfigCacheEntry(configPath?: string): void {
  const path = resolve(process.cwd(), configPath || CONFIG_PATH)
  configCache.delete(path)
}
