import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearConfigCache,
  clearConfigCacheEntry,
  loadConfig
} from '../src/loader'

let tmpDir: string
let configPath: string

beforeEach(() => {
  tmpDir = resolve(
    tmpdir(),
    `vitepress-loader-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  mkdirSync(join(tmpDir, '.vitepress'), { recursive: true })
  configPath = join(tmpDir, '.vitepress/config.toml')

  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  clearConfigCache()
})

afterEach(() => {
  vi.restoreAllMocks()
  clearConfigCache()
})

const writeToml = (content: string) =>
  writeFileSync(configPath, content, 'utf-8')

describe('loadConfig', () => {
  it('returns parsed config for valid TOML file', () => {
    writeToml(`[meta]
title = "Test Blog"
author = "Alice"

[theme]
vp-c-brand = "#ff0000"
`)
    const config = loadConfig()
    expect(config).not.toBeNull()
    expect(config!.meta).toBeDefined()
    expect(config!.meta.title).toBe('Test Blog')
    expect(config!.meta.author).toBe('Alice')
  })

  it('preserves markdown theme config from TOML', () => {
    writeToml(`[markdown.theme]
light = "vitesse-light"
dark = "vitesse-dark"

[theme]
vp-c-brand = "#000"
`)

    const config = loadConfig()

    expect(config).not.toBeNull()
    expect(config!.markdown?.theme).toEqual({
      light: 'vitesse-light',
      dark: 'vitesse-dark'
    })
  })

  it('returns cached result on second call', () => {
    writeToml(`[meta]
title = "First"

[theme]
vp-c-brand = "#000"
`)
    const first = loadConfig()

    // Write different content — should still return cached version
    writeToml(`[meta]
title = "Second"

[theme]
vp-c-brand = "#fff"
`)
    const second = loadConfig()
    expect(second).toBe(first)
    expect(second!.meta.title).toBe('First')
  })

  it('returns null when .vitepress/config.toml does not exist', () => {
    const config = loadConfig()
    expect(config).toBeNull()
  })

  it('throws with the file path on malformed TOML', () => {
    writeToml(`[meta
title = broken`)
    expect(() => loadConfig()).toThrow(/failed to parse .*config\.toml/)
  })

  it('caches null result for missing file', () => {
    const first = loadConfig()
    expect(first).toBeNull()

    writeToml(`[meta]
title = "Created Later"

[theme]
vp-c-brand = "#000"
`)

    const second = loadConfig()
    expect(second).toBeNull()
  })

  it('returns empty defaults for empty TOML with theme section', () => {
    writeToml(`[theme]
vp-c-brand = "#fff"
`)
    const config = loadConfig()
    expect(config).not.toBeNull()
    expect(config!.meta).toEqual({})
    expect(config!.page).toEqual({})
  })
})

describe('clearConfigCache', () => {
  it('clears all entries so next call re-reads', () => {
    writeToml(`[meta]
title = "Before"

[theme]
vp-c-brand = "#000"
`)
    const first = loadConfig()
    clearConfigCache()

    writeToml(`[meta]
title = "After"

[theme]
vp-c-brand = "#fff"
`)
    const second = loadConfig()
    expect(second).not.toBe(first)
    expect(second!.meta.title).toBe('After')
  })
})

describe('clearConfigCacheEntry', () => {
  it('clears the cached config so next call re-reads', () => {
    writeToml(`[meta]
title = "Before"

[theme]
vp-c-brand = "#000"
`)
    const first = loadConfig()
    clearConfigCacheEntry()

    writeToml(`[meta]
title = "After"

[theme]
vp-c-brand = "#fff"
`)
    const second = loadConfig()

    expect(second).not.toBe(first)
    expect(second!.meta.title).toBe('After')
  })
})
