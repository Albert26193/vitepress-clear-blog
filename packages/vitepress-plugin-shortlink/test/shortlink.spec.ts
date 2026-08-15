import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import {
  buildTargetUrl,
  computeShortlinks,
  hexToBase62,
  renderRedirectPage,
  shortlinkPlugin
} from '../src/node/index'
import type { DigestFn } from '../src/node/keys'
import { canonicalizePath } from '../src/shared/canonicalize'

const BASE62_RE = /^[0-9A-Za-z]+$/

describe('hexToBase62', () => {
  it('encodes small values as their single character', () => {
    // 0xf = 15 -> chars[15] = 'F' (0-9, then A-Z).
    expect(hexToBase62('f')).toBe('F')
  })

  it('encodes a value crossing the radix boundary', () => {
    // 0x62 = 98 decimal = 1 * 62 + 36 -> '1' + chars[36] ('a')
    expect(hexToBase62('62')).toBe('1a')
  })

  it('never returns an empty string', () => {
    expect(hexToBase62('0')).toBe('0')
  })
})

describe('computeShortlinks', () => {
  const urls = ['blogs/alpha', 'blogs/beta', 'blogs/gamma']

  it('is deterministic across runs', () => {
    const first = computeShortlinks(urls)
    const second = computeShortlinks(urls)
    expect(second.map((e) => e.key)).toEqual(first.map((e) => e.key))
  })

  it('produces 6-character base62 keys by default', () => {
    const entries = computeShortlinks(urls)
    for (const entry of entries) {
      expect(entry.key).toHaveLength(6)
      expect(BASE62_RE.test(entry.key)).toBe(true)
    }
  })

  it('keeps every key unique across the set', () => {
    const many = Array.from(
      { length: 500 },
      (_, i) => `blogs/post-${i}-about-ai-and-ml`
    )
    const entries = computeShortlinks(many)
    expect(new Set(entries.map((e) => e.key)).size).toBe(many.length)
  })

  it('extends a colliding prefix until it is globally unique', () => {
    // Two digests that share their first six characters.
    const collidingDigest: DigestFn = (input: string) => {
      if (input === 'blogs/alpha') return 'AAAAAA123456'
      if (input === 'blogs/beta') return 'AAAAAA654321'
      return 'BBBBBB' + input
    }

    const entries = computeShortlinks(
      ['blogs/alpha', 'blogs/beta'],
      6,
      collidingDigest
    )

    const alpha = entries.find((e) => e.url === 'blogs/alpha')!
    const beta = entries.find((e) => e.url === 'blogs/beta')!

    expect(alpha.key).toBe('AAAAAA1')
    expect(beta.key).toBe('AAAAAA6')
    expect(alpha.extended).toBe(true)
    expect(beta.extended).toBe(true)
    expect(alpha.key).not.toBe(beta.key)
  })

  it('marks non-colliding keys as not extended', () => {
    const entries = computeShortlinks(['blogs/solo'])
    expect(entries[0].extended).toBe(false)
    expect(entries[0].key).toHaveLength(6)
  })
})

describe('canonicalizePath', () => {
  it('strips markdown and html suffixes', () => {
    expect(canonicalizePath('blogs/ai-development.md')).toBe(
      'blogs/ai-development'
    )
    expect(canonicalizePath('/blogs/ai-development.html')).toBe(
      'blogs/ai-development'
    )
  })

  it('normalizes index pages and slashes', () => {
    expect(canonicalizePath('pages/index.md')).toBe('pages')
    expect(canonicalizePath('pages/')).toBe('pages')
    expect(canonicalizePath('blogs/my-post')).toBe('blogs/my-post')
    expect(canonicalizePath('index.md')).toBe('')
  })
})

describe('renderRedirectPage', () => {
  it('includes a meta refresh, noindex and a fallback link', () => {
    const html = renderRedirectPage('/blogs/ai-development.html')
    expect(html).toContain(
      'http-equiv="refresh" content="0; url=/blogs/ai-development.html"'
    )
    expect(html).toContain('<meta name="robots" content="noindex">')
    expect(html).toContain('location.replace("/blogs/ai-development.html")')
    expect(html).toContain('<a href="/blogs/ai-development.html">')
  })

  it('respects a redirect delay', () => {
    const html = renderRedirectPage('/blogs/a.html', 2)
    expect(html).toContain('content="2; url=/blogs/a.html"')
  })

  it('HTML-escapes the target in attributes and text', () => {
    const html = renderRedirectPage('/blogs/a?x=1&y="z"')
    expect(html).not.toContain('url=/blogs/a?x=1&y="z"')
    expect(html).toContain('&amp;')
  })
})

describe('buildTargetUrl', () => {
  it('appends .html unless clean URLs are enabled', () => {
    expect(buildTargetUrl('blogs/a', '/', false)).toBe('/blogs/a.html')
    expect(buildTargetUrl('blogs/a', '/', true)).toBe('/blogs/a')
  })

  it('honors a base prefix and normalizes its trailing slash', () => {
    expect(buildTargetUrl('blogs/a', '/repo/', false)).toBe(
      '/repo/blogs/a.html'
    )
    expect(buildTargetUrl('blogs/a', '/repo', false)).toBe('/repo/blogs/a.html')
  })

  it('adds a missing leading slash to the base', () => {
    expect(buildTargetUrl('blogs/a', 'repo', false)).toBe('/repo/blogs/a.html')
  })

  it('resolves an empty canonical path to the site root', () => {
    expect(buildTargetUrl('', '/', true)).toBe('/')
  })
})

describe('shortlinkPlugin', () => {
  // Loosely typed surface so tests avoid Vite's full hook signatures.
  type Middleware = (
    req: { url?: string },
    res: {
      statusCode: number
      setHeader: (name: string, value: string) => void
      end: () => void
    },
    next: () => void
  ) => void

  const asPlugin = (
    plugin: ReturnType<typeof shortlinkPlugin>
  ): {
    resolveId: (id: string) => string | null | undefined
    load: (id: string) => string | null | undefined
    configureServer: (server: {
      middlewares: { use: (fn: unknown) => void }
    }) => void
    configResolved: (config: {
      vitepress: { buildEnd: (sc: { outDir: string }) => Promise<void> }
    }) => void
  } =>
    plugin as unknown as {
      resolveId: (id: string) => string | null | undefined
      load: (id: string) => string | null | undefined
      configureServer: (server: {
        middlewares: { use: (fn: unknown) => void }
      }) => void
      configResolved: (config: {
        vitepress: { buildEnd: (sc: { outDir: string }) => Promise<void> }
      }) => void
    }

  it('exposes the mapping through the virtual module', () => {
    const plugin = asPlugin(
      shortlinkPlugin({ posts: ['blogs/a', 'blogs/b'], prefix: 's' })
    )
    const resolved = plugin.resolveId('virtual:vitepress-shortlinks')
    const content = plugin.load(resolved!)

    expect(resolved).toBe('\0virtual:vitepress-shortlinks')
    expect(content).toContain('export const prefix = "s"')
    expect(content).toContain('export const shortlinks = {')
  })

  it('writes one redirect page per post at build time', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'shortlink-'))
    try {
      const config = {
        vitepress: { buildEnd: async (_sc: { outDir: string }) => {} }
      }
      const plugin = asPlugin(
        shortlinkPlugin({ posts: ['blogs/alpha', 'blogs/beta'] })
      )
      plugin.configResolved(config)
      // configResolved wraps buildEnd; invoking it writes the redirect pages.
      await config.vitepress.buildEnd({ outDir: dir })

      const sDir = join(dir, 's')
      expect(existsSync(sDir)).toBe(true)
      const files = readdirSync(sDir).filter((f) => f.endsWith('.html'))
      expect(files).toHaveLength(2)

      const html = readFileSync(join(sDir, files[0]), 'utf-8')
      expect(html).toContain('http-equiv="refresh"')
      expect(html).toContain('.html"')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('redirects known keys and passes through everything else in dev', () => {
    const plugin = asPlugin(
      shortlinkPlugin({ posts: ['blogs/alpha'], prefix: 's' })
    )
    let middleware: Middleware | undefined
    plugin.configureServer({
      middlewares: { use: (fn) => (middleware = fn as Middleware) }
    })

    const key = computeShortlinks(['blogs/alpha'])[0].key

    const res = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: vi.fn()
    }
    middleware!({ url: `/s/${key}` }, res, vi.fn())
    expect(res.statusCode).toBe(302)
    expect(res.setHeader).toHaveBeenCalledWith('Location', '/blogs/alpha.html')
    expect(res.end).toHaveBeenCalled()

    const passThrough = vi.fn()
    middleware!({ url: `/s/${key}`.slice(0, -1) }, res, passThrough)
    expect(passThrough).toHaveBeenCalled()

    middleware!({ url: '/blogs/alpha' }, res, passThrough)
    expect(passThrough).toHaveBeenCalled()
  })

  it('honors a base prefix in the dev redirect location', () => {
    const plugin = asPlugin(
      shortlinkPlugin({ posts: ['blogs/alpha'], base: '/repo' })
    )
    let middleware: Middleware | undefined
    plugin.configureServer({
      middlewares: { use: (fn) => (middleware = fn as Middleware) }
    })

    const key = computeShortlinks(['blogs/alpha'])[0].key
    const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
    middleware!({ url: `/s/${key}` }, res, vi.fn())
    expect(res.setHeader).toHaveBeenCalledWith(
      'Location',
      '/repo/blogs/alpha.html'
    )
  })
})
