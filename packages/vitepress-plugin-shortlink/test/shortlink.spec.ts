import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import {
  buildTargetUrl,
  computeShortlinks,
  hexToBase62,
  renderRedirectPage,
  scanPages,
  shortlinkPlugin,
  toCsv
} from '../src/node/index'
import type { DigestFn } from '../src/node/keys'
import { canonicalizePath } from '../src/shared/canonicalize'

const BASE62_RE = /^[0-9A-Za-z]+$/

/** Builds a throwaway site directory from `{ relPath: content }` entries. */
const makeSite = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), 'shortlink-'))
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content, 'utf-8')
  }
  return dir
}

const cleanup = (dir: string): void =>
  rmSync(dir, { recursive: true, force: true })

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
  const inputs = [
    { url: 'blogs/alpha', id: 'alpha-id' },
    { url: 'blogs/beta', id: 'beta-id' },
    { url: 'blogs/gamma', id: 'gamma-id' }
  ]

  it('is deterministic across runs', () => {
    const first = computeShortlinks(inputs)
    const second = computeShortlinks(inputs)
    expect(second.map((e) => e.key)).toEqual(first.map((e) => e.key))
  })

  it('produces 6-character base62 keys by default', () => {
    const entries = computeShortlinks(inputs)
    for (const entry of entries) {
      expect(entry.key).toHaveLength(6)
      expect(BASE62_RE.test(entry.key)).toBe(true)
    }
  })

  it('keeps every key unique across the set', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({
      url: `blogs/post-${i}`,
      id: `post-${i}-about-ai-and-ml`
    }))
    const entries = computeShortlinks(many)
    expect(new Set(entries.map((e) => e.key)).size).toBe(many.length)
  })

  it('extends a colliding prefix until it is globally unique', () => {
    // Two digests that share their first six characters.
    const collidingDigest: DigestFn = (input: string) => {
      if (input === 'alpha-id') return 'AAAAAA123456'
      if (input === 'beta-id') return 'AAAAAA654321'
      return 'BBBBBB' + input
    }

    const entries = computeShortlinks(
      [
        { url: 'blogs/alpha', id: 'alpha-id' },
        { url: 'blogs/beta', id: 'beta-id' }
      ],
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
    const entries = computeShortlinks([{ url: 'blogs/solo', id: 'solo-id' }])
    expect(entries[0].extended).toBe(false)
    expect(entries[0].key).toHaveLength(6)
  })

  it('rejects two pages that declare the same id', () => {
    expect(() =>
      computeShortlinks([
        { url: 'blogs/a', id: 'duplicate' },
        { url: 'blogs/b', id: 'duplicate' }
      ])
    ).toThrow(/duplicate shortlink id "duplicate".*blogs\/a.*blogs\/b/)
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

describe('toCsv', () => {
  it('joins rows with commas and a trailing newline', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd']
      ])
    ).toBe('a,b\nc,d\n')
  })

  it('quotes and escapes cells that contain delimiters', () => {
    expect(
      toCsv([
        ['a', 'x,y'],
        ['say "hi"', 'line\nbreak']
      ])
    ).toBe('a,"x,y"\n"say ""hi""","line\nbreak"\n')
  })
})

describe('scanPages', () => {
  it('reads ids from frontmatter within the scope', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': '---\npage_id: "alpha-id"\ntitle: A\n---\nbody',
      'docs/blogs/sub/beta.md': '---\npage_id: "beta-id"\n---\nbody',
      // Outside the scope: never scanned, so no id required.
      'docs/about.md': '---\ntitle: About\n---\nbody'
    })

    const pages = await scanPages({
      srcDir: join(dir, 'docs'),
      scope: 'blogs',
      idField: 'page_id'
    })

    expect(pages).toEqual([
      { url: 'blogs/alpha', id: 'alpha-id' },
      { url: 'blogs/sub/beta', id: 'beta-id' }
    ])
    cleanup(dir)
  })

  it('throws when a scoped page has no id', async () => {
    const dir = makeSite({
      'docs/blogs/no-id.md': '---\ntitle: No Id\n---\nbody'
    })

    await expect(
      scanPages({
        srcDir: join(dir, 'docs'),
        scope: 'blogs',
        idField: 'page_id'
      })
    ).rejects.toThrow(/missing "page_id".*blogs\/no-id\.md/)
    cleanup(dir)
  })

  it('ignores underscore- and dot-prefixed entries', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': '---\npage_id: "alpha-id"\n---\nbody',
      'docs/blogs/_draft.md': '---\ntitle: Draft\n---\nbody',
      'docs/blogs/.hidden.md': '---\ntitle: Hidden\n---\nbody'
    })

    const pages = await scanPages({
      srcDir: join(dir, 'docs'),
      scope: 'blogs',
      idField: 'page_id'
    })

    expect(pages).toEqual([{ url: 'blogs/alpha', id: 'alpha-id' }])
    cleanup(dir)
  })

  it('errors with a clear message when the scope directory is missing', async () => {
    const dir = makeSite({ 'docs/about.md': '---\ntitle: About\n---\nbody' })

    await expect(
      scanPages({
        srcDir: join(dir, 'docs'),
        scope: 'missing',
        idField: 'page_id'
      })
    ).rejects.toThrow(/scope "missing"/)
    cleanup(dir)
  })
})

describe('shortlinkPlugin', () => {
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
    }) => Promise<void>
  } =>
    plugin as unknown as {
      resolveId: (id: string) => string | null | undefined
      load: (id: string) => string | null | undefined
      configureServer: (server: {
        middlewares: { use: (fn: unknown) => void }
      }) => void
      configResolved: (config: {
        vitepress: { buildEnd: (sc: { outDir: string }) => Promise<void> }
      }) => Promise<void>
    }

  const buildPlugin = (dir: string, overrides: Record<string, unknown> = {}) =>
    asPlugin(
      shortlinkPlugin({
        srcDir: join(dir, 'docs'),
        scope: 'blogs',
        idField: 'page_id',
        ...overrides
      })
    )

  const readyConfig = {
    vitepress: { buildEnd: async (_sc: { outDir: string }) => {} }
  }

  const twoPageSite = {
    'docs/blogs/alpha.md': '---\npage_id: "alpha-id"\n---\nbody',
    'docs/blogs/beta.md': '---\npage_id: "beta-id"\n---\nbody'
  }

  it('exposes the mapping through the virtual module', async () => {
    const dir = makeSite(twoPageSite)
    const plugin = buildPlugin(dir)
    await plugin.configResolved(readyConfig)

    const content = plugin.load(
      plugin.resolveId('virtual:vitepress-shortlinks')!
    )

    expect(plugin.resolveId('virtual:vitepress-shortlinks')).toBe(
      '\0virtual:vitepress-shortlinks'
    )
    expect(content).toContain('export const prefix = "s"')
    expect(content).toContain('export const cleanUrls = false')
    const key = computeShortlinks([{ url: 'blogs/alpha', id: 'alpha-id' }])[0]
      .key
    expect(content).toContain(`"blogs/alpha":"${key}"`)
    cleanup(dir)
  })

  it('reports clean URLs through the virtual module when enabled', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': twoPageSite['docs/blogs/alpha.md']
    })
    const plugin = buildPlugin(dir, { cleanUrls: true })
    await plugin.configResolved(readyConfig)

    const content = plugin.load(
      plugin.resolveId('virtual:vitepress-shortlinks')!
    )
    expect(content).toContain('export const cleanUrls = true')
    cleanup(dir)
  })

  it('writes one redirect page per post at build time', async () => {
    const dir = makeSite(twoPageSite)
    const config = {
      vitepress: { buildEnd: async (_sc: { outDir: string }) => {} }
    }
    const plugin = buildPlugin(dir)
    await plugin.configResolved(config)

    const outDir = join(dir, 'dist')
    await config.vitepress.buildEnd({ outDir })

    const sDir = join(outDir, 's')
    expect(existsSync(sDir)).toBe(true)
    const files = readdirSync(sDir).filter((f) => f.endsWith('.html'))
    expect(files).toHaveLength(2)

    const html = readFileSync(join(sDir, files[0]), 'utf-8')
    expect(html).toContain('http-equiv="refresh"')
    expect(html).toContain('.html"')
    cleanup(dir)
  })

  it('writes an extensionless redirect page when clean URLs are enabled', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': twoPageSite['docs/blogs/alpha.md']
    })
    const config = {
      vitepress: { buildEnd: async (_sc: { outDir: string }) => {} }
    }
    const plugin = buildPlugin(dir, { cleanUrls: true })
    await plugin.configResolved(config)

    const outDir = join(dir, 'dist')
    await config.vitepress.buildEnd({ outDir })

    const sDir = join(outDir, 's')
    const files = readdirSync(sDir).filter((f) => !f.endsWith('.html'))
    expect(files).toHaveLength(1)
    expect(readFileSync(join(sDir, files[0]), 'utf-8')).not.toContain(
      'blogs/alpha.html'
    )
    cleanup(dir)
  })

  it('writes the read-only CSV site map at build time', async () => {
    const dir = makeSite(twoPageSite)
    const config = {
      vitepress: { buildEnd: async (_sc: { outDir: string }) => {} }
    }
    const plugin = buildPlugin(dir)
    await plugin.configResolved(config)

    const outDir = join(dir, 'dist')
    await config.vitepress.buildEnd({ outDir })

    const csv = readFileSync(join(outDir, 'site_map_readonly.csv'), 'utf-8')
    const lines = csv.split('\n').filter(Boolean)
    expect(lines[0]).toBe('id,key,shortUrl,targetUrl')
    expect(lines).toHaveLength(3) // header + two pages
    expect(csv).toContain('alpha-id')
    expect(csv).toContain('blogs/alpha.html')
    expect(csv).toContain('/s/')
    // Rows are sorted by key so the file is stable across rebuilds.
    const keys = lines.slice(1).map((line) => line.split(',')[1])
    expect(keys).toEqual([...keys].sort())
    cleanup(dir)
  })

  it('is inert when disabled, but still resolves the virtual module', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': '---\npage_id: "alpha-id"\n---\nbody'
    })
    const config = {
      vitepress: { buildEnd: async (_sc: { outDir: string }) => {} }
    }
    const plugin = asPlugin(
      shortlinkPlugin({
        srcDir: join(dir, 'docs'),
        scope: 'blogs',
        idField: 'page_id',
        enabled: false
      })
    )
    await plugin.configResolved(config)

    const content = plugin.load(
      plugin.resolveId('virtual:vitepress-shortlinks')!
    )
    expect(content).toContain('export const shortlinks = {}')

    const outDir = join(dir, 'dist')
    await config.vitepress.buildEnd({ outDir })
    expect(existsSync(join(outDir, 's'))).toBe(false)
    expect(existsSync(join(outDir, 'site_map_readonly.csv'))).toBe(false)
    cleanup(dir)
  })

  it('rejects a scoped page without an id at config time', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': '---\npage_id: "alpha-id"\n---\nbody',
      'docs/blogs/no-id.md': '---\ntitle: No Id\n---\nbody'
    })
    const plugin = buildPlugin(dir)

    await expect(plugin.configResolved(readyConfig)).rejects.toThrow(
      /missing "page_id"/
    )
    cleanup(dir)
  })

  it('redirects known keys and passes through everything else in dev', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': twoPageSite['docs/blogs/alpha.md']
    })
    const plugin = buildPlugin(dir)
    await plugin.configResolved(readyConfig)

    let middleware: Middleware | undefined
    plugin.configureServer({
      middlewares: { use: (fn) => (middleware = fn as Middleware) }
    })

    const key = computeShortlinks([{ url: 'blogs/alpha', id: 'alpha-id' }])[0]
      .key

    const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
    middleware!({ url: `/s/${key}` }, res, vi.fn())
    expect(res.statusCode).toBe(302)
    expect(res.setHeader).toHaveBeenCalledWith('Location', '/blogs/alpha.html')
    expect(res.end).toHaveBeenCalled()

    const passThrough = vi.fn()
    middleware!({ url: `/s/${key}`.slice(0, -1) }, res, passThrough)
    expect(passThrough).toHaveBeenCalled()

    middleware!({ url: '/blogs/alpha' }, res, passThrough)
    expect(passThrough).toHaveBeenCalled()
    cleanup(dir)
  })

  it('honors a base prefix in the dev redirect location', async () => {
    const dir = makeSite({
      'docs/blogs/alpha.md': twoPageSite['docs/blogs/alpha.md']
    })
    const plugin = buildPlugin(dir, { base: '/repo' })
    await plugin.configResolved(readyConfig)

    let middleware: Middleware | undefined
    plugin.configureServer({
      middlewares: { use: (fn) => (middleware = fn as Middleware) }
    })

    const key = computeShortlinks([{ url: 'blogs/alpha', id: 'alpha-id' }])[0]
      .key
    const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
    middleware!({ url: `/s/${key}` }, res, vi.fn())
    expect(res.setHeader).toHaveBeenCalledWith(
      'Location',
      '/repo/blogs/alpha.html'
    )
    cleanup(dir)
  })
})
