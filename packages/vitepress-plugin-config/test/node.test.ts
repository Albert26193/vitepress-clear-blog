import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateThemeFile } from '../src/node'
import type { ValidatedConfigToml } from '../src/validate'

let tmpDir: string
let configPath: string
let cssPath: string

beforeEach(() => {
  tmpDir = resolve(
    tmpdir(),
    `vitepress-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  mkdirSync(join(tmpDir, '.vitepress'), { recursive: true })
  mkdirSync(join(tmpDir, '.vitepress/theme/styles'), { recursive: true })
  configPath = join(tmpDir, '.vitepress/config.toml')
  cssPath = join(tmpDir, '.vitepress/theme/styles/generated.css')

  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
})

afterEach(() => {
  vi.restoreAllMocks()
})

const writeToml = (content: string) =>
  writeFileSync(configPath, content, 'utf-8')
const readCss = () => readFileSync(cssPath, 'utf-8')

describe('generateThemeFile', () => {
  it('generates CSS with valid hex colors', async () => {
    writeToml(`[theme]
vp-c-bg = "#fafafa"
vp-c-brand = "#4259f3"
vp-c-brand-1 = "#42a903"
vp-c-text-1 = "#222"
vp-button-brand-bg = "#129083"
c-text-code = "#305fef"
c-text-strong = "#f00"
c-text-em = "#0000ff"
vp-sidebar-bg-color = "#f3f3f3"

[theme.dark]
vp-c-bg = "#202127"
`)

    await generateThemeFile(configPath)
    const css = readCss()

    expect(css).toContain('--vp-c-bg: #fafafa')
    expect(css).toContain('--vp-c-brand: #4259f3')
    expect(css).toContain('--vp-c-bg: #202127')
  })

  it('accepts 8-digit hex with alpha', async () => {
    writeToml(`[theme]
vp-c-brand = "#94fe00ff"
vp-c-text-1 = "#ccccccff"
`)

    await generateThemeFile(configPath)
    const css = readCss()

    expect(css).toContain('--vp-c-brand: #94fe00ff')
  })

  it('accepts CSS variable references', async () => {
    writeToml(`[theme]
vp-c-brand = "var(--some-color)"
vp-c-bg = "var(--bg, #fff)"
`)

    await generateThemeFile(configPath)
    const css = readCss()

    expect(css).toContain('--vp-c-brand: var(--some-color)')
    expect(css).toContain('--vp-c-bg: var(--bg, #fff)')
  })

  it('accepts rgb/rgba/hsl formats', async () => {
    writeToml(`[theme]
vp-c-bg = "rgb(250, 250, 250)"
vp-c-brand = "rgba(66, 89, 243, 1)"
vp-c-brand-1 = "hsl(100, 50%, 40%)"
`)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await generateThemeFile(configPath)
    const css = readCss()

    expect(css).toContain('--vp-c-bg: rgb(250, 250, 250)')
    expect(css).toContain('--vp-c-brand: rgba(66, 89, 243, 1)')
    expect(warn).not.toHaveBeenCalled()
  })

  it('accepts named colors', async () => {
    writeToml(`[theme]
vp-c-brand = "tomato"
vp-c-bg = "white"
`)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await generateThemeFile(configPath)
    const css = readCss()

    expect(css).toContain('--vp-c-brand: tomato')
    expect(warn).not.toHaveBeenCalled()
  })

  it('throws on empty string color values', async () => {
    writeToml(`[theme]
vp-c-brand = ""
`)

    await expect(generateThemeFile(configPath)).rejects.toThrow(
      'vp-c-brand must be a non-empty string'
    )
  })

  it('throws on malformed color values', async () => {
    writeToml(`[theme]
vp-c-brand = "not-a-valid-color!!!"
`)

    await expect(generateThemeFile(configPath)).rejects.toThrow(
      'looks malformed'
    )
  })

  it('throws on non-string value (number)', async () => {
    writeToml(`[theme]
vp-c-brand = 12345
`)

    await expect(generateThemeFile(configPath)).rejects.toThrow(
      'expected string'
    )
  })

  it('throws when theme section is missing', async () => {
    writeToml(`[meta]
title = "test"
`)

    await expect(generateThemeFile(configPath)).rejects.toThrow(
      'Missing theme configuration'
    )
  })

  it('uses defaults when theme section has no colors', async () => {
    writeToml(`[theme]
`)

    await generateThemeFile(configPath)
    const css = readCss()

    // All defaults (Obsidian palette)
    expect(css).toContain('--vp-c-bg: #ffffff')
    expect(css).toContain('--vp-c-brand: #9873f7')
    expect(css).toContain('--vp-c-text-1: #222222')
  })
})

describe('generateThemeFile with pre-parsed config', () => {
  it('generates CSS from ValidatedConfigToml without reading file', () => {
    const toml: ValidatedConfigToml = {
      meta: { title: 'Test' },
      page: {},
      theme: {
        'vp-c-bg': '#fafafa',
        'vp-c-brand': '#4259f3',
        'vp-c-text-1': '#222'
      }
    }

    // Should not throw — no file read needed
    expect(() => generateThemeFile(toml)).not.toThrow()
  })

  it('uses centralized defaults for missing colors in pre-parsed config', async () => {
    const toml: ValidatedConfigToml = {
      meta: {},
      page: {},
      theme: {
        'vp-c-brand': '#abc123'
      }
    }

    await generateThemeFile(toml)
    const css = readCss()

    expect(css).toContain('--vp-c-brand: #abc123')
    expect(css).toContain('--vp-c-bg: #ffffff') // default (Obsidian)
    expect(css).toContain('--vp-c-text-1: #222222') // default (Obsidian)
  })

  it('handles dark theme in pre-parsed config', async () => {
    const toml: ValidatedConfigToml = {
      meta: {},
      page: {},
      theme: {
        'vp-c-bg': '#fff',
        dark: {
          'vp-c-bg': '#202127',
          'vp-c-brand': '#00ff00'
        }
      }
    }

    await generateThemeFile(toml)
    const css = readCss()

    expect(css).toContain('--vp-c-bg: #fff')
    // Dark variables are in .dark block
    expect(css).toContain('--vp-c-bg: #202127')
    expect(css).toContain('--vp-c-brand: #00ff00')
  })

  it('throws when pre-parsed config has empty theme', async () => {
    const toml: ValidatedConfigToml = {
      meta: {},
      page: {},
      theme: {}
    }

    await expect(generateThemeFile(toml)).rejects.toThrow(
      'Missing theme configuration'
    )
  })
})
