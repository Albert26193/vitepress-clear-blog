// import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/core/config'

describe('createConfig', () => {
  it('should create default config when no user config provided', () => {
    const config = createConfig()
    expect(config.docsDir).toBe('docs')
    expect(config.blogDir).toBe('blog')
    expect(config.excludeDirs).toEqual(['node_modules', '.git', 'dist'])
    expect(config.includeFiles).toEqual(['.md'])
    expect(config.excludeFiles).toEqual([])
    expect(config.maxSearchDepth).toBe(5)
    expect(config.ignoreCase).toBe(true)
  })

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

  it('should handle empty user config', () => {
    const config = createConfig({})
    expect(config.docsDir).toBe('docs')
    expect(config.blogDir).toBe('blog')
  })

  it('should handle partial user config', () => {
    const config = createConfig({ docsDir: 'custom-docs' })
    expect(config.docsDir).toBe('custom-docs')
    expect(config.blogDir).toBe('blog')
    expect(config.excludeDirs).toEqual(['node_modules', '.git', 'dist'])
  })
})
