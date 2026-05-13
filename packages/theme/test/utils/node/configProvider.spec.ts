// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn()
}))

vi.mock('vitepress-plugin-config', () => ({
  loadConfig: mockLoadConfig,
  generateThemePlugin: vi.fn(() => ({ name: 'mock-plugin' })),
  DEFAULT_NAV_LABELS: {
    home: 'Home',
    tags: 'Tags',
    timeline: 'Timeline',
    pages: 'Pages',
    about: 'About'
  },
  DEFAULT_META: {
    author: 'Blogger',
    locale: 'zh_CN',
    'theme-color': '#1934e9',
    themeLink: 'https://github.com/Albert26193/vitepress-clear-blog'
  },
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_BLOG: { defaultViewMode: 'card' },
  DEFAULT_TIMELINE: { sortDirection: 'desc' }
}))

describe('getThemeConfig', async () => {
  const { getThemeConfig } =
    await import('../../../src/utils/node/configProvider')

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadConfig.mockReturnValue(null)
  })

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

  it('handles loadConfig returning null gracefully', async () => {
    mockLoadConfig.mockReturnValue(null)
    const config = await getThemeConfig()
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

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadConfig.mockReturnValue(mockToml)
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
    expect(tc.socialLinks).toBeUndefined()
  })

  it('sets defaults when markdown options are missing', async () => {
    const sparseToml = {
      meta: { title: 'Sparse' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(sparseToml)
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
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    const mdConfig = (config as any).markdown.config
    expect(typeof mdConfig).toBe('function')
    const mockMd = { use: vi.fn(), renderer: { rules: {} } }
    mdConfig(mockMd)
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
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    const mdConfig = (config as any).markdown.config
    const mockMd = { use: vi.fn(), renderer: { rules: {} } }
    mdConfig(mockMd)
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
    expect(isCustomElement('mjx-container')).toBe(true)
    expect(isCustomElement('math')).toBe(true)
    expect(isCustomElement('div')).toBe(false)
    expect(isCustomElement('span')).toBe(false)
  })

  it('always sets pageSize in themeConfig', async () => {
    const toml = {
      meta: { title: 'No PageSize' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.pageSize).toBe(10)
  })

  it('uses toml pageSize when provided', async () => {
    const toml = {
      meta: { title: 'Custom PageSize' },
      page: { pageSize: 7 },
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.pageSize).toBe(7)
  })

  it('always sets themeConfig.meta.author', async () => {
    const toml = {
      meta: { title: 'With Author', author: 'CustomAuthor' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.meta.author).toBe('CustomAuthor')
  })

  it('uses default author when meta.author is missing', async () => {
    const toml = {
      meta: { title: 'No Author' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.meta.author).toBe('Blogger')
  })

  it('uses centralized themeLink default', async () => {
    const toml = {
      meta: { title: 'No ThemeLink' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.themeLink).toBe(
      'https://github.com/Albert26193/vitepress-clear-blog'
    )
  })

  it('sets defaultViewMode from blog section', async () => {
    const toml = {
      meta: { title: 'Blog' },
      page: {},
      blog: { defaultViewMode: 'list' },
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.defaultViewMode).toBe('list')
  })

  it('uses default view mode when blog section is missing', async () => {
    const toml = {
      meta: { title: 'No Blog Section' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.defaultViewMode).toBe('card')
  })

  it('sets timelineSortDirection from timeline section', async () => {
    const toml = {
      meta: { title: 'Timeline' },
      page: {},
      timeline: { sortDirection: 'asc' },
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.timelineSortDirection).toBe('asc')
  })

  it('uses default sort direction when timeline section is missing', async () => {
    const toml = {
      meta: { title: 'No Timeline Section' },
      page: {},
      theme: {}
    }
    mockLoadConfig.mockReturnValue(toml)
    const config = await createBlog()
    expect((config as any).themeConfig.timelineSortDirection).toBe('desc')
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
    mockMd.renderer.rules.footnote_ref = vi
      .fn()
      .mockReturnValue('<span>no anchor close</span>')
    getFooterRefTag(mockMd as any)

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

    const openFn = mockMd.renderer.rules.footnote_open
    const openTokens = [
      { type: 'footnote_open', meta: { id: '1' }, level: 0 },
      { type: 'inline', content: 'Footnote text', children: null },
      { type: 'footnote_close', level: 0 }
    ]
    openFn(openTokens, 0, {}, {}, mockMd.renderer.rules)

    const refFn = mockMd.renderer.rules.footnote_ref
    const refTokens = [{ meta: { id: '1', label: '1' } }]
    const result = refFn(refTokens, 0, {}, {}, mockMd.renderer.rules)
    expect(result).toContain('FooterRef')
    expect(result).toContain('1')
  })
})
