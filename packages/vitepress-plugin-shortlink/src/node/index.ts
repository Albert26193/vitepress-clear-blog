import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin, SiteConfig } from 'vitepress'

import { canonicalizePath } from '../shared/canonicalize'
import { renderRedirectPage } from './generate'
import { computeShortlinks } from './keys'

// VitePress exposes its resolved config as `config.vitepress` on the Vite
// config; only the build-end hook carries the SiteConfig (with outDir).
type VitePressConfigWithHook = {
  vitepress?: {
    buildEnd?: (siteConfig: SiteConfig) => void | Promise<void>
  }
}

export type { DigestFn, ShortlinkEntry } from './keys'
export { computeShortlinks, hexToBase62, sha256Base62 } from './keys'
export { escapeHtml, renderRedirectPage } from './generate'

export interface ShortlinkPluginOptions {
  /** Canonical paths (e.g. "blogs/my-post") of the pages that get short links. */
  posts: string[]
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
 * Creates a VitePress plugin that auto-generates a short link (`/s/<key>`) for
 * every injected post. Keys are deterministic base62 prefixes of each URL's
 * SHA-256 digest (shortest unique prefix, bounded by keyLength), so shared
 * links stay stable across rebuilds. The plugin writes static redirect pages
 * at build time, answers `/s/<key>` during dev, and exposes the mapping to the
 * client through a virtual module consumed by the copy-short-link button.
 *
 * @param options - Post list plus URL shaping options.
 * @returns A VitePress plugin.
 */
export const shortlinkPlugin = (options: ShortlinkPluginOptions): Plugin => {
  const { posts, cleanUrls = false, keyLength = 6, prefix = 's' } = options
  const siteBase = normalizeBase(options.base)
  const normalizedPrefix = normalizePrefix(prefix)

  // Keys are computed once from the injected post list so build, dev and the
  // client virtual module all share the exact same mapping.
  const entries = computeShortlinks(posts.map(canonicalizePath), keyLength)
  const shortToLong = new Map(entries.map((e) => [e.key, e.url]))
  const longToShort = new Map(entries.map((e) => [e.url, e.key]))

  const toRoutable = (canonical: string): string =>
    buildTargetUrl(canonical, siteBase, cleanUrls)

  const writeShortlinkPages = async (outDir: string): Promise<void> => {
    const outPath = join(outDir, normalizedPrefix)
    await mkdir(outPath, { recursive: true })
    await Promise.all(
      entries.map(({ url, key }) =>
        writeFile(
          join(outPath, `${key}.html`),
          renderRedirectPage(toRoutable(url)),
          'utf-8'
        )
      )
    )
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

    configResolved(config) {
      // Static redirect pages must be written after VitePress finishes SSG, so
      // wrap the resolved config's build-end hook (the same pattern used by
      // vitepress-plugin-rss) instead of defining a Vite buildEnd hook, whose
      // signature is `(error?)` and carries no SiteConfig.
      const vitepress = (config as unknown as VitePressConfigWithHook).vitepress
      if (!vitepress) return

      const selfBuildEnd = vitepress.buildEnd
      vitepress.buildEnd = async (siteConfig: SiteConfig) => {
        await selfBuildEnd?.(siteConfig)
        await writeShortlinkPages(siteConfig.outDir)
      }
    }
  }
}
