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
  mkdirSync(tmpDir, { recursive: true })
  mkdirSync(join(tmpDir, '.vitepress/custom'), { recursive: true })
  configPath = join(tmpDir, '.vitepress/custom/config.toml')

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

  it('returns null when file does not exist', () => {
    // configPath was never written, so it doesn't exist
    const config = loadConfig(configPath)
    expect(config).toBeNull()
  })

  it('caches null result for missing file', () => {
    const first = loadConfig(configPath)
    expect(first).toBeNull()

    // Second call should also return null (cached)
    const second = loadConfig(configPath)
    expect(second).toBeNull()
  })

  it('respects custom config path', () => {
    const customPath = join(tmpDir, 'custom-config.toml')
    writeFileSync(
      customPath,
      `[meta]
title = "Custom"

[theme]
vp-c-brand = "#abc"
`,
      'utf-8'
    )
    const config = loadConfig(customPath)
    expect(config).not.toBeNull()
    expect(config!.meta.title).toBe('Custom')
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
  it('invalidates only the specified path', () => {
    const customPath = join(tmpDir, 'custom-config.toml')
    writeFileSync(
      customPath,
      `[meta]
title = "Custom"

[theme]
vp-c-brand = "#abc"
`,
      'utf-8'
    )
    writeToml(`[meta]
title = "Default"

[theme]
vp-c-brand = "#000"
`)

    const defaultFirst = loadConfig()
    const customFirst = loadConfig(customPath)

    clearConfigCacheEntry()

    writeToml(`[meta]
title = "Default Updated"

[theme]
vp-c-brand = "#fff"
`)

    const defaultSecond = loadConfig()
    const customSecond = loadConfig(customPath)

    // Default was cleared, should be re-read
    expect(defaultSecond).not.toBe(defaultFirst)
    expect(defaultSecond!.meta.title).toBe('Default Updated')
    // Custom was not cleared, should still be cached
    expect(customSecond).toBe(customFirst)
  })
})
