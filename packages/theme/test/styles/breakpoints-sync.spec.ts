import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import unoConfig from '../../uno.config'

/**
 * The SCSS layers cannot import uno.config.ts, so the breakpoint scale is
 * intentionally duplicated in styles/_breakpoints.scss. This test locks the
 * two copies together: editing one without the other fails CI.
 */
describe('breakpoint scale sync', () => {
  it('keeps styles/_breakpoints.scss in sync with uno.config.ts screens', () => {
    const screens = (unoConfig.theme as { screens: Record<string, string> })
      .screens
    expect(Object.keys(screens).length).toBeGreaterThan(0)

    const scss = readFileSync(
      resolve(__dirname, '../../src/styles/_breakpoints.scss'),
      'utf-8'
    )
    const scssMap: Record<string, string> = {}
    for (const match of scss.matchAll(/'([\w-]+)':\s*([\d.]+px)/g)) {
      scssMap[match[1]] = match[2]
    }

    for (const [name, value] of Object.entries(screens)) {
      expect(scssMap[name], `breakpoint "${name}" in _breakpoints.scss`).toBe(
        value
      )
    }
  })
})
