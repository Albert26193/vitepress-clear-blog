import { describe, expect, it } from 'vitest'

import { getThemeConfig } from '../../../src/utils/node/configProvider'

describe('getThemeConfig', () => {
  it('returns config object with default title', async () => {
    const config = await getThemeConfig()
    expect(config).toBeDefined()
    expect(config.clearBlogConfig).toBeDefined()
    expect((config as any).clearBlogConfig.title).toBe('TTTTTTTitle')
  })

  it('merges custom config overrides', async () => {
    const config = await getThemeConfig({ title: 'MyBlog' })
    expect((config as any).clearBlogConfig.title).toBe('MyBlog')
  })

  it('includes vite config with scss preprocessor', async () => {
    const config = await getThemeConfig()
    const vite = (config as any).vite
    expect(vite).toBeDefined()
    expect(vite.css).toBeDefined()
    expect(vite.css.preprocessorOptions.scss.api).toBe('modern')
  })

  it('includes vite server config', async () => {
    const config = await getThemeConfig()
    const vite = (config as any).vite
    expect(vite.server).toBeDefined()
    expect(vite.server.port).toBe(4000)
    expect(vite.server.watch.usePolling).toBe(true)
  })

  it('includes optimizeDeps exclusions', async () => {
    const config = await getThemeConfig()
    const vite = (config as any).vite
    expect(vite.optimizeDeps.exclude).toContain('gzip-size')
  })

  it('includes VitePress plugins array', async () => {
    const config = await getThemeConfig()
    const plugins = (config as any).vite.plugins
    expect(Array.isArray(plugins)).toBe(true)
    expect(plugins.length).toBeGreaterThan(0)
  })

  it('handles empty object merge', async () => {
    const config = await getThemeConfig({})
    expect(config).toBeDefined()
    expect((config as any).clearBlogConfig.title).toBe('TTTTTTTitle')
  })

  it('handles complex merge with multiple overrides', async () => {
    const config = await getThemeConfig({
      title: 'ComplexBlog',
      extra: 'value'
    })
    expect((config as any).clearBlogConfig.title).toBe('ComplexBlog')
    expect((config as any).clearBlogConfig.extra).toBe('value')
  })
})
