// import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/core/config'

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
    expect(config.blogDir).toBe('custom-blog')
    expect(config.excludeDirs).toEqual(['test'])
    expect(config.includeFiles).toEqual(['.md'])
    expect(config.excludeFiles).toEqual([])
    expect(config.maxSearchDepth).toBe(3)
    expect(config.ignoreCase).toBe(true)
  })
})
