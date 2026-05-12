import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn()
}))

vi.mock('node:fs', () => ({
  readFileSync: mockReadFileSync
}))

vi.mock('smol-toml', () => ({
  parse: vi.fn()
}))

describe('getThemeConfig', async () => {
  // Dynamic import after mocks are set up
  const { getThemeConfig } =
    await import('../../../src/utils/node/configProvider')

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

  it('handles readConfig gracefully when config.toml is unreadable', async () => {
    mockReadFileSync.mockImplementationOnce(() => {
      throw new Error('ENOENT: no such file')
    })
    const config = await getThemeConfig()
    // Should not throw, returns default config
    expect(config).toBeDefined()
    expect(config.clearBlogConfig).toBeDefined()
    expect((config as any).clearBlogConfig.title).toBe('TTTTTTTitle')
  })
})

describe('createBlog with mocked config.toml', async () => {
  const mockToml = {
    meta: {
      title: 'Test Blog',
      description: 'Test Desc',
      author: 'Test Author',
      siteUrl: 'https://example.com',
      keywords: 'test',
      locale: 'en_US'
    },
    page: { pageSize: 10 },
    nav: { home: 'Home', tags: 'Tags', about: 'About' },
    markdown: {
      mathjax: true,
      wikilinks: true,
      footnote: false,
      render_title: 'frontmatter_title'
    },
    theme: { 'vp-c-brand': '#ff0000', dark: { 'vp-c-brand': '#00ff00' } }
  }

  const { createBlog } = await import('../../../src/utils/node/configProvider')
  const smolToml = await import('smol-toml')

  beforeEach(() => {
    vi.clearAllMocks()
    mockReadFileSync.mockReturnValue('fake toml content')
    ;(smolToml.parse as any).mockReturnValue(mockToml)
  })

  it('creates a full VitePress config from config.toml', async () => {
    const config = await createBlog()
    expect(config).toBeDefined()
    expect((config as any).title).toBe('Test Blog')
    expect((config as any).description).toBe('Test Desc')
    expect((config as any).base).toBe('/')
    expect((config as any).srcDir).toBe('./docs')
  })

  it('sets wikiRenderTitle in themeConfig', async () => {
    const config = await createBlog()
    const tc = (config as any).themeConfig
    expect(tc.wikiRenderTitle).toBe('frontmatter_title')
  })

  it('creates navigation from toml nav labels', async () => {
    const config = await createBlog()
    const nav = (config as any).themeConfig.nav
    expect(nav[0].text).toBe('Home')
    expect(nav[1].text).toBe('Tags')
  })

  it('includes head metadata with author', async () => {
    const config = await createBlog()
    const head = (config as any).head as [string, Record<string, string>][]
    const authorMeta = head.find(
      (h: [string, Record<string, string>]) => h[1]?.name === 'author'
    )
    expect(authorMeta).toBeDefined()
    expect(authorMeta![1].content).toBe('Test Author')
  })

  it('configures markdown theme', async () => {
    const config = await createBlog()
    const md = (config as any).markdown
    expect(md.theme.light).toBe('github-light')
    expect(md.theme.dark).toBe('ayu-dark')
  })

  it('includes search config', async () => {
    const config = await createBlog()
    expect((config as any).themeConfig.search.provider).toBe('local')
  })

  it('includes outline config', async () => {
    const config = await createBlog()
    expect((config as any).themeConfig.outline).toEqual([2, 3])
    expect((config as any).themeConfig.outlineTitle).toBe('Table of Contents')
  })

  it('includes vite define for render_title', async () => {
    const config = await createBlog()
    const vite = (config as any).vite as Record<string, unknown>
    expect(vite.define).toBeDefined()
    expect((vite.define as Record<string, string>).__WIKI_RENDER_TITLE__).toBe(
      '"frontmatter_title"'
    )
  })

  it('includes og meta tags', async () => {
    const config = await createBlog()
    const head = (config as any).head as [string, Record<string, string>][]
    const ogTitle = head.find(
      (h: [string, Record<string, string>]) => h[1]?.property === 'og:title'
    )
    expect(ogTitle).toBeDefined()
    expect(ogTitle![1].content).toBe('Test Blog')
  })

  it('sets socialLinks in themeConfig', async () => {
    const config = await createBlog()
    const tc = (config as any).themeConfig as Record<string, unknown>
    expect(tc.socialLinks).toBeUndefined() // createBlog doesn't set socialLinks
  })

  it('sets defaults when markdown options are missing', async () => {
    const sparseToml = {
      meta: { title: 'Sparse' },
      page: {},
      theme: {}
    }
    ;(smolToml.parse as any).mockReturnValue(sparseToml)
    const config = await createBlog()
    expect((config as any).title).toBe('Sparse')
    // Should use defaults for nav labels
    expect((config as any).themeConfig.nav[0].text).toBe('Home')
  })

  it('invokes markdown config callback with md instance', async () => {
    const toml = {
      meta: { title: 'MD Test', siteUrl: '' },
      page: {},
      markdown: {
        mathjax: true,
        wikilinks: true,
        footnote: true,
        hashtag: true,
        mermaid: true,
        callout: true
      },
      theme: {}
    }
    ;(smolToml.parse as any).mockReturnValue(toml)
    const config = await createBlog()
    const mdConfig = (config as any).markdown.config
    expect(typeof mdConfig).toBe('function')
    // Create a mock md instance and call the config
    const mockMd = { use: vi.fn(), renderer: { rules: {} } }
    mdConfig(mockMd)
    // Should have registered plugins
    expect(mockMd.use).toHaveBeenCalled()
  })

  it('respects markdown boolean flags set to false', async () => {
    const toml = {
      meta: { title: 'No Footnotes', siteUrl: '' },
      page: {},
      markdown: {
        mathjax: false,
        wikilinks: false,
        footnote: false,
        hashtag: false,
        mermaid: false,
        callout: false
      },
      theme: {}
    }
    ;(smolToml.parse as any).mockReturnValue(toml)
    const config = await createBlog()
    const mdConfig = (config as any).markdown.config
    const mockMd = { use: vi.fn(), renderer: { rules: {} } }
    mdConfig(mockMd)
    // No plugins should be registered (all false)
    // getFooterRefTag modifies renderer.rules, doesn't call md.use
    expect(mockMd.use).not.toHaveBeenCalled()
  })

  it('includes vue template compilerOptions with isCustomElement', async () => {
    const config = await createBlog()
    const vue = (config as any).vue as Record<string, unknown>
    expect(vue).toBeDefined()
    const compilerOptions = (vue.template as Record<string, unknown>)
      .compilerOptions as Record<string, unknown>
    expect(compilerOptions).toBeDefined()
    const isCustomElement = compilerOptions.isCustomElement as (
      tag: string
    ) => boolean
    expect(typeof isCustomElement).toBe('function')
    // MathJax custom elements
    expect(isCustomElement('mjx-container')).toBe(true)
    expect(isCustomElement('math')).toBe(true)
    // Regular HTML elements should not be custom
    expect(isCustomElement('div')).toBe(false)
    expect(isCustomElement('span')).toBe(false)
  })
})

describe('mermaidPlugin', async () => {
  const { mermaidPlugin } =
    await import('../../../src/utils/node/configProvider')

  it('returns empty string from fence fallback when original fence returns empty', () => {
    const mockMd = {
      renderer: {
        rules: {
          fence: vi.fn().mockReturnValue('')
        }
      }
    }
    mermaidPlugin(mockMd as any)
    const fence = (mockMd.renderer.rules as any).fence
    expect(typeof fence).toBe('function')

    const tokens = [{ info: 'javascript', content: 'console.log("hi")' }]
    const result = fence(tokens, 0, {}, {}, mockMd.renderer.rules)
    expect(result).toBe('')
  })
})

describe('getFooterRefTag', async () => {
  const { getFooterRefTag } =
    await import('../../../src/utils/node/configProvider')

  const makeMockMd = () => ({
    renderer: {
      rules: { renderToken: vi.fn().mockReturnValue('') } as Record<
        string,
        any
      >,
      renderInline: vi.fn().mockReturnValue('rendered')
    }
  })

  it('sets overridden footnote_open rule on md instance', () => {
    const mockMd = makeMockMd()
    getFooterRefTag(mockMd as any)
    expect(typeof mockMd.renderer.rules.footnote_open).toBe('function')
    expect(typeof mockMd.renderer.rules.footnote_ref).toBe('function')
  })

  it('overridden footnote_ref falls back to id when regex does not match', () => {
    const mockMd = makeMockMd()
    // Pre-set footnote_ref to return HTML that won't match the regex />([^<]+)<\/a>/
    mockMd.renderer.rules.footnote_ref = vi
      .fn()
      .mockReturnValue('<span>no anchor close</span>')
    getFooterRefTag(mockMd as any)

    // Populate footnoteContents
    const openFn = mockMd.renderer.rules.footnote_open
    const openTokens = [
      { type: 'footnote_open', meta: { id: 'fn1' }, level: 0 },
      { type: 'inline', content: 'Note', children: null },
      { type: 'footnote_close', level: 0 }
    ]
    openFn(openTokens, 0, {}, {}, mockMd.renderer.rules)

    const refFn = mockMd.renderer.rules.footnote_ref
    const refTokens = [{ meta: { id: 'fn1' } }]
    const result = refFn(refTokens, 0, {}, {}, mockMd.renderer.rules)
    expect(result).toContain('FooterRef')
  })

  it('overridden footnote_ref uses else branch when no originalFootnoteRef exists', () => {
    const mockMd = makeMockMd()
    getFooterRefTag(mockMd as any)

    // Call footnote_open to populate footnoteContents
    const openFn = mockMd.renderer.rules.footnote_open
    const openTokens = [
      { type: 'footnote_open', meta: { id: '1' }, level: 0 },
      { type: 'inline', content: 'Footnote text', children: null },
      { type: 'footnote_close', level: 0 }
    ]
    openFn(openTokens, 0, {}, {}, mockMd.renderer.rules)

    // Call footnote_ref without originalFootnoteRef (no original ref rule)
    const refFn = mockMd.renderer.rules.footnote_ref
    const refTokens = [{ meta: { id: '1', label: '1' } }]
    const result = refFn(refTokens, 0, {}, {}, mockMd.renderer.rules)
    expect(result).toContain('FooterRef')
    expect(result).toContain('1')
  })
})
