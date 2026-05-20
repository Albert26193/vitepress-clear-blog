import { describe, expect, it } from 'vitest'

import {
  checkThemeColors,
  configTomlSchema,
  validateConfigToml,
  validateConfigTomlWithFallback
} from '../src/validate'

const CFG = '.vitepress/config.toml'

describe('configTomlSchema', () => {
  it('accepts a minimal valid config (theme only)', () => {
    const result = configTomlSchema.safeParse({ theme: {} })
    expect(result.success).toBe(true)
  })

  it('accepts a full valid config', () => {
    const data = {
      meta: {
        title: 'My Blog',
        description: 'A blog',
        author: 'Alice',
        keywords: 'blog, tech',
        locale: 'zh_CN',
        lang: 'zh-CN',
        siteUrl: 'https://example.com',
        'theme-color': '#42b983'
      },
      page: { pageSize: 10 },
      markdown: {
        mathjax: true,
        wikilinks: true,
        footnote: true,
        hashtag: true,
        mermaid: true,
        callout: true,
        render_title: 'frontmatter_title',
        link_style: 'wiki'
      },
      nav: {
        home: 'Home',
        tags: 'Tags',
        timeline: 'Timeline',
        pages: 'Pages',
        about: 'About'
      },
      blog: { defaultViewMode: 'card' },
      timeline: { sortDirection: 'desc' },
      theme: { 'vp-c-bg': '#fafafa' }
    }
    expect(configTomlSchema.safeParse(data).success).toBe(true)
  })

  it('rejects non-boolean markdown fields', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      markdown: { mathjax: 'yes' }
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-string meta fields', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      meta: { title: 123 }
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-number pageSize', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      page: { pageSize: 'ten' }
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing theme', () => {
    const result = configTomlSchema.safeParse({ meta: { title: 'test' } })
    expect(result.success).toBe(false)
  })

  it('defaults meta and page to empty objects', () => {
    const result = configTomlSchema.safeParse({ theme: {} })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.meta).toEqual({})
      expect(result.data.page).toEqual({})
    }
  })

  it('rejects non-integer pageSize', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      page: { pageSize: 3.5 }
    })
    expect(result.success).toBe(false)
  })
})

describe('markdown link_style', () => {
  it('accepts link_style = "wiki"', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      markdown: { link_style: 'wiki' }
    })
    expect(result.success).toBe(true)
  })

  it('accepts link_style = "origin"', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      markdown: { link_style: 'origin' }
    })
    expect(result.success).toBe(true)
  })

  it('accepts config missing link_style', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      markdown: { render_title: 'frontmatter_title' }
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid link_style values', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      markdown: { link_style: 'invalid' }
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-string link_style values', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      markdown: { link_style: true }
    })
    expect(result.success).toBe(false)
  })
})

describe('blog & timeline sections', () => {
  it('accepts valid blog section with defaultViewMode = "card"', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      blog: { defaultViewMode: 'card' }
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid blog section with defaultViewMode = "list"', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      blog: { defaultViewMode: 'list' }
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid timeline section with sortDirection = "desc"', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      timeline: { sortDirection: 'desc' }
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid timeline section with sortDirection = "asc"', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      timeline: { sortDirection: 'asc' }
    })
    expect(result.success).toBe(true)
  })

  it('accepts config missing blog and timeline sections', () => {
    const result = configTomlSchema.safeParse({ theme: {} })
    expect(result.success).toBe(true)
  })

  it('rejects invalid defaultViewMode', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      blog: { defaultViewMode: 'grid' }
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid sortDirection', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      timeline: { sortDirection: 'reverse' }
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-string blog value', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      blog: { defaultViewMode: true }
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-string timeline value', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      timeline: { sortDirection: 123 }
    })
    expect(result.success).toBe(false)
  })
})

describe('links section', () => {
  it('accepts valid resolutionModes', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      links: {
        resolutionModes: ['repoRoot', 'obsidianShortest']
      }
    })
    expect(result.success).toBe(true)
  })

  it('accepts all valid modes', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      links: {
        resolutionModes: [
          'repoRoot',
          'absolutePath',
          'relativeToCurrentFile',
          'obsidianShortest'
        ]
      }
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty resolutionModes array', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      links: { resolutionModes: [] }
    })
    expect(result.success).toBe(true)
  })

  it('accepts config missing links section', () => {
    const result = configTomlSchema.safeParse({ theme: {} })
    expect(result.success).toBe(true)
  })

  it('rejects invalid resolution mode', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      links: { resolutionModes: ['invalidMode'] }
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-array resolutionModes', () => {
    const result = configTomlSchema.safeParse({
      theme: {},
      links: { resolutionModes: 'repoRoot' }
    })
    expect(result.success).toBe(false)
  })
})

describe('validateConfigToml', () => {
  it('returns valid for a correct config', () => {
    const result = validateConfigToml(
      {
        meta: { title: 'Blog' },
        theme: { 'vp-c-brand': '#ff0000' }
      },
      CFG
    )
    expect(result.valid).toBe(true)
    expect(result.data).not.toBeNull()
    expect(result.issues).toHaveLength(0)
  })

  it('returns structural errors with field paths', () => {
    const result = validateConfigToml(
      {
        theme: {},
        markdown: { mathjax: 'not-a-bool' }
      },
      CFG
    )
    expect(result.valid).toBe(false)
    expect(result.data).toBeNull()
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].path).toContain(CFG)
    expect(result.issues[0].path).toContain('mathjax')
  })

  it('returns color issues as non-fatal warnings', () => {
    const result = validateConfigToml(
      {
        theme: { 'vp-c-brand': 'not-a-color' }
      },
      CFG
    )
    // Schema passes, but color check adds issues
    expect(result.data).not.toBeNull()
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].message).toContain('looks malformed')
  })

  it('returns color issues for empty string', () => {
    const result = validateConfigToml(
      {
        theme: { 'vp-c-brand': '' }
      },
      CFG
    )
    expect(result.data).not.toBeNull()
    const colorIssues = result.issues.filter((i) =>
      i.message.includes('non-empty string')
    )
    expect(colorIssues.length).toBe(1)
  })
})

describe('validateConfigTomlWithFallback', () => {
  it('returns valid data for a correct config', () => {
    const data = validateConfigTomlWithFallback(
      {
        meta: { title: 'Blog' },
        theme: { 'vp-c-brand': '#ff0000' }
      },
      CFG
    )
    expect(data.meta.title).toBe('Blog')
  })

  it('falls back to defaults on invalid config silently', () => {
    const data = validateConfigTomlWithFallback(
      { theme: {}, markdown: { mathjax: 'bad' } },
      CFG
    )
    expect(data.meta).toEqual({})
    expect(data.theme).toEqual({})
  })

  it('returns data on color issues silently', () => {
    const data = validateConfigTomlWithFallback(
      { theme: { 'vp-c-brand': '' } },
      CFG
    )
    expect(data.theme).toBeDefined()
  })
})

describe('checkThemeColors', () => {
  it('returns empty for no theme', () => {
    const issues = checkThemeColors(undefined, CFG)
    expect(issues).toHaveLength(0)
  })

  it('returns empty for valid colors', () => {
    const issues = checkThemeColors(
      { 'vp-c-brand': '#ff0000', 'vp-c-bg': '#fff' },
      CFG
    )
    expect(issues).toHaveLength(0)
  })

  it('flags empty string colors', () => {
    const issues = checkThemeColors({ 'vp-c-brand': '' }, CFG)
    expect(issues.length).toBe(1)
    expect(issues[0].message).toContain('non-empty string')
  })

  it('flags malformed colors', () => {
    const issues = checkThemeColors({ 'vp-c-brand': '!!!bad!!!' }, CFG)
    expect(issues.length).toBe(1)
    expect(issues[0].message).toContain('looks malformed')
  })

  it('walks nested dark theme', () => {
    const issues = checkThemeColors(
      {
        'vp-c-brand': '#fff',
        dark: { 'vp-c-brand': 'bad!!' }
      },
      CFG
    )
    expect(issues.length).toBe(1)
    expect(issues[0].path).toContain('theme.dark.vp-c-brand')
  })

  it('accepts all valid color formats', () => {
    const issues = checkThemeColors(
      {
        'vp-c-brand': '#ff0000',
        'vp-c-bg': 'rgb(255, 255, 255)',
        'vp-c-text-1': 'rgba(0,0,0,0.5)',
        'vp-button-brand-bg': 'hsl(200,50%,50%)',
        'c-text-code': 'var(--some-var)',
        'c-text-strong': 'tomato'
      },
      CFG
    )
    expect(issues).toHaveLength(0)
  })
})
