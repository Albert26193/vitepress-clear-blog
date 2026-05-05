// import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/node/config'

describe('createConfig', () => {
  it('should merge user config with default config', () => {
    const userConfig = {
      docsDir: 'custom-docs',
      blogDir: 'custom-blog',
      excludeDirs: ['test'],
      maxSearchDepth: 3
    }
    const config = createConfig(userConfig)
    expect(config.docsDir).toBe('custom-docs')
    expect(config.excludeDirs).toEqual(['test'])
    expect(config.includeFiles).toEqual(['.md'])
    expect(config.excludeFiles).toEqual([])
    expect(config.ignoreCase).toBe(true)
  })

  it('should use default when array field is undefined', () => {
    const config = createConfig({ excludeDirs: undefined })
    expect(config.excludeDirs).toEqual(['node_modules', '.git', 'dist'])
  })

  it('should use empty array when array field is empty array', () => {
    const config = createConfig({ excludeDirs: [], includeFiles: [] })
    expect(config.excludeDirs).toEqual([])
    expect(config.includeFiles).toEqual([])
  })

  it('should use user value when array field has values', () => {
    const config = createConfig({
      excludeDirs: ['custom-lib'],
      includeFiles: ['.md', '.mdx']
    })
    expect(config.excludeDirs).toEqual(['custom-lib'])
    expect(config.includeFiles).toEqual(['.md', '.mdx'])
  })
})
