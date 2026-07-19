// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { mergeUserConfig } from '../../../src/utils/node/mergeUserConfig'

describe('mergeUserConfig', () => {
  it('returns base keys untouched when user config is empty', () => {
    const base = { title: 'Base', themeConfig: { nav: [{ text: 'Home' }] } }
    expect(mergeUserConfig(base, {})).toEqual(base)
  })

  it('lets user scalars win', () => {
    const merged = mergeUserConfig({ title: 'Base' }, { title: 'User' })
    expect(merged.title).toBe('User')
  })

  it('deep merges plain objects per key', () => {
    const merged = mergeUserConfig(
      { themeConfig: { a: 1, b: 2 } },
      { themeConfig: { b: 3, c: 4 } }
    )
    expect(merged.themeConfig).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('replaces arrays outside vite/head (no duplicate nav entries)', () => {
    const merged = mergeUserConfig(
      { themeConfig: { nav: [{ text: 'Home' }, { text: 'Tags' }] } },
      { themeConfig: { nav: [{ text: 'Mine' }] } }
    )
    expect((merged.themeConfig as { nav: unknown[] }).nav).toEqual([
      { text: 'Mine' }
    ])
  })

  it('concatenates head entries', () => {
    const merged = mergeUserConfig(
      { head: [['meta', { name: 'author' }]] },
      { head: [['script', { src: '/x.js' }]] }
    )
    expect(merged.head).toEqual([
      ['meta', { name: 'author' }],
      ['script', { src: '/x.js' }]
    ])
  })

  it('concatenates arrays anywhere inside vite', () => {
    const merged = mergeUserConfig(
      { vite: { optimizeDeps: { exclude: ['a'] }, plugins: ['p1'] } },
      { vite: { optimizeDeps: { exclude: ['b'] }, plugins: ['p2'] } }
    )
    const vite = merged.vite as {
      optimizeDeps: { exclude: string[] }
      plugins: string[]
    }
    expect(vite.optimizeDeps.exclude).toEqual(['a', 'b'])
    expect(vite.plugins).toEqual(['p1', 'p2'])
  })

  it('ignores explicit undefined user values', () => {
    const merged = mergeUserConfig({ title: 'Base' }, { title: undefined })
    expect(merged.title).toBe('Base')
  })

  it('does not mutate the base object', () => {
    const base = { themeConfig: { nav: ['Home'] } }
    mergeUserConfig(base, { themeConfig: { nav: ['Mine'] } })
    expect(base.themeConfig.nav).toEqual(['Home'])
  })
})
