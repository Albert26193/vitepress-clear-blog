import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateThemeFile } from '../src/node'

let tmpDir: string
let configPath: string
let cssPath: string

beforeEach(() => {
  tmpDir = resolve(
    tmpdir(),
    `vitepress-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  mkdirSync(tmpDir, { recursive: true })
  mkdirSync(join(tmpDir, '.vitepress/custom'), { recursive: true })
  mkdirSync(join(tmpDir, '.vitepress/theme/styles'), { recursive: true })
  configPath = join(tmpDir, '.vitepress/custom/config.toml')
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

  it('warns and falls back on empty string', async () => {
    writeToml(`[theme]
vp-c-brand = ""
`)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await generateThemeFile(configPath)
    const css = readCss()

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('vp-c-brand must be a non-empty string')
    )
    expect(css).toContain('--vp-c-brand: #f00')
  })

  it('warns but still uses malformed values (non-fatal)', async () => {
    writeToml(`[theme]
vp-c-brand = "not-a-valid-color!!!"
`)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await generateThemeFile(configPath)
    const css = readCss()

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('looks malformed')
    )
    // Still writes the value (don't silently replace)
    expect(css).toContain('--vp-c-brand: not-a-valid-color!!!')
  })

  it('warns on non-string value (number) and falls back', async () => {
    writeToml(`[theme]
vp-c-brand = 12345
`)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await generateThemeFile(configPath)
    const css = readCss()

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('expected string')
    )
    expect(css).toContain('--vp-c-brand: #f00')
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

    // All defaults
    expect(css).toContain('--vp-c-bg: #fff')
    expect(css).toContain('--vp-c-brand: #f00')
    expect(css).toContain('--vp-c-text-1: #000')
  })
})
