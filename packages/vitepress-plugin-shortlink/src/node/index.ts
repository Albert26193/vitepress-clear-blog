import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin, SiteConfig } from 'vitepress'

import { toCsv } from './csv'
import { renderRedirectPage } from './generate'
import { type ShortlinkEntry, computeShortlinks } from './keys'
import { scanPages } from './scan'

// VitePress exposes its resolved config as `config.vitepress` on the Vite
// config; only the build-end hook carries the SiteConfig (with outDir).
type VitePressConfigWithHook = {
  vitepress?: {
    buildEnd?: (siteConfig: SiteConfig) => void | Promise<void>
  }
}

export type { DigestFn, ShortlinkEntry, ShortlinkInput } from './keys'
export { computeShortlinks, hexToBase62, sha256Base62 } from './keys'
export { escapeHtml, renderRedirectPage } from './generate'
export { toCsv } from './csv'
export { scanPages, type ScanOptions } from './scan'

export interface ShortlinkPluginOptions {
  /**
   * Whether short links are active. When false the plugin still resolves the
   * virtual module (with an empty map) so the copy button can be imported
   * unconditionally, but no pages are scanned and nothing is written. Defaults
   * to true.
   */
  enabled?: boolean
  /** VitePress site root; pages are scanned under this directory. */
  srcDir: string
  /**
   * Directory (relative to srcDir) to scan for shortlinks. Pages outside the
   * scope are never touched, so route pages like `about` or `tags` are skipped
   * simply by living elsewhere. Defaults to the whole srcDir.
   */
  scope?: string
  /**
   * Frontmatter field carrying each page's stable id. Keys are derived from it
   * (not from the route), so a page keeps its short link across renames as long
   * as the id stays in its frontmatter. Defaults to "page_id".
   */
  idField?: string
  /** VitePress base path prefix (e.g. "/repo/"). Defaults to "/". */
  base?: string
  /** Whether clean URLs are enabled, so targets omit the ".html" suffix. */
  cleanUrls?: boolean
  /** Short key length. Defaults to 6. */
  keyLength?: number
  /** URL path segment under which short links are served. Defaults to "s". */
  prefix?: string
}

const VIRTUAL_MODULE_ID = 'virtual:vitepress-shortlinks'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const normalizeBase = (base: string | undefined): string => {
  if (!base || base === '/') return '/'
  const prefixed = base.startsWith('/') ? base : `/${base}`
  return prefixed.endsWith('/') ? prefixed : `${prefixed}/`
}

const normalizePrefix = (prefix: string): string =>
  prefix.replace(/^\/+|\/+$/g, '')

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Builds the routable URL for a canonical path, honoring base + cleanUrls. */
export const buildTargetUrl = (
  canonical: string,
  base: string,
  cleanUrls: boolean
): string => {
  const siteBase = normalizeBase(base)
  const path = cleanUrls || canonical === '' ? canonical : `${canonical}.html`
  return `${siteBase}${path}`
}

/**
 * Creates a VitePress plugin that gives every page in `scope` a short link
 * (`/s/<key>`) derived from the page's stable id (frontmatter `idField`).
 *
 * Keys are deterministic base62 prefixes of each id's SHA-256 digest (shortest
 * unique prefix, bounded by keyLength), so shared links stay stable across
 * rebuilds and renames as long as the id stays in the frontmatter. The plugin
 * scans the scope itself and fails the build when a scoped page lacks an id or
 * two pages declare the same id.
 *
 * Outputs at build end:
 * - static redirect pages under `outDir/<prefix>/`
 * - `outDir/site_map_readonly.csv` — the id → key → URL map (generated, never
 *   consumed back by the plugin, stable across rebuilds)
 * - a virtual module consumed by the copy-short-link button
 *
 * @param options - Scope plus URL shaping options.
 * @returns A VitePress plugin.
 */
export const shortlinkPlugin = (options: ShortlinkPluginOptions): Plugin => {
  const {
    enabled = true,
    srcDir,
    scope,
    idField = 'page_id',
    cleanUrls = false,
    keyLength = 6,
    prefix = 's'
  } = options
  const siteBase = normalizeBase(options.base)
  const normalizedPrefix = normalizePrefix(prefix)

  // Computed once inside configResolved, then shared by the virtual module,
  // the dev middleware and the build-end writers.
  let entries: ShortlinkEntry[] = []
  let shortToLong = new Map<string, string>()
  let longToShort = new Map<string, string>()

  if (!srcDir) {
    throw new Error('[vitepress-plugin-shortlink] `srcDir` option is required')
  }

  const toRoutable = (canonical: string): string =>
    buildTargetUrl(canonical, siteBase, cleanUrls)

  const init = async (): Promise<void> => {
    const inputs = await scanPages({ srcDir, scope, idField })
    entries = computeShortlinks(inputs, keyLength)
    shortToLong = new Map(entries.map((e) => [e.key, e.url]))
    longToShort = new Map(entries.map((e) => [e.url, e.key]))
  }

  const writeShortlinkPages = async (outDir: string): Promise<void> => {
    const outPath = join(outDir, normalizedPrefix)
    await mkdir(outPath, { recursive: true })
    await Promise.all(
      entries.map(({ url, key }) =>
        writeFile(
          // Match the site's URL convention: with clean URLs the short link is
          // extensionless, otherwise it keeps the ".html" suffix so the shared
          // URL is exactly the file that a plain static host will serve.
          join(outPath, `${key}${cleanUrls ? '' : '.html'}`),
          renderRedirectPage(toRoutable(url)),
          'utf-8'
        )
      )
    )
  }

  const writeSiteMap = async (outDir: string): Promise<void> => {
    const rows: (string | number)[][] = [
      ['id', 'key', 'shortUrl', 'targetUrl'],
      // Sorted by key so identical inputs always produce an identical file.
      ...entries
        .map(({ id, key, url }) => [
          id,
          key,
          `${siteBase}${normalizedPrefix}/${key}${cleanUrls ? '' : '.html'}`,
          toRoutable(url)
        ])
        .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
    ]
    await writeFile(join(outDir, 'site_map_readonly.csv'), toCsv(rows), 'utf-8')
  }

  return {
    name: 'vitepress-plugin-shortlink',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `// Auto-generated short link map (canonical path -> short key).
// Do not edit manually.
export const prefix = ${JSON.stringify(normalizedPrefix)}
export const cleanUrls = ${cleanUrls}
export const shortlinks = ${JSON.stringify(Object.fromEntries(longToShort))}`
      }
    },

    configureServer(server) {
      // Dev has no static redirect files, so intercept /s/<key> and 302 to the
      // real page, keeping dev behavior in sync with the built output.
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split(/[?#]/)[0]
        const match = pathname.match(
          new RegExp(`^/${escapeRegExp(normalizedPrefix)}/([^/]+)/?$`)
        )
        if (match) {
          const target = shortToLong.get(match[1])
          if (target) {
            res.statusCode = 302
            res.setHeader('Location', toRoutable(target))
            res.end()
            return
          }
        }
        next()
      })
    },

    async configResolved(config) {
      if (enabled) await init()

      // Static redirect pages and the site map must be written after VitePress
      // finishes SSG, so wrap the resolved config's build-end hook (the same
      // pattern used by vitepress-plugin-rss) instead of defining a Vite
      // buildEnd hook, whose signature is `(error?)` and carries no SiteConfig.
      const vitepress = (config as unknown as VitePressConfigWithHook).vitepress
      if (!vitepress) return

      const selfBuildEnd = vitepress.buildEnd
      vitepress.buildEnd = async (siteConfig: SiteConfig) => {
        await selfBuildEnd?.(siteConfig)
        if (!enabled || entries.length === 0) return
        await writeShortlinkPages(siteConfig.outDir)
        await writeSiteMap(siteConfig.outDir)
      }
    }
  }
}
