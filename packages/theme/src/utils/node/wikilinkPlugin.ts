import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import { relative } from 'node:path'
import {
  type AnalyzerConfig,
  type ResolutionMode,
  type SiteMetadata,
  analyzeAllDocuments,
  createConfig,
  getDocsRoot,
  resolveInternalLink
} from 'vitepress-plugin-analyzer'

import { classifyHref } from '../linkKind'
import { clampToVaultPath } from '../shared/path'

/** Wiki link label rendering mode, mirrors `markdown.render_title` in config.toml. */
type RenderTitleMode =
  | 'alias'
  | 'file_name'
  | 'frontmatter_title'
  | 'first_heading'

type WikilinkPluginOptions = {
  base?: string
  cleanUrls?: boolean
  renderTitle?: RenderTitleMode
}

const WIKILINK_RE = /^\[\[([^|\]\n]+)(?:\|([^\]\n]+))?\]\]/

const isPageCandidateHref = (href: string): boolean =>
  classifyHref(href) === 'pageCandidate'

const getCurrentFile = (
  env: Record<string, unknown>,
  docsRoot: string
): string => {
  const path =
    (typeof env.relativePath === 'string' && env.relativePath) ||
    (typeof env.path === 'string' && env.path) ||
    (typeof env.realPath === 'string' && env.realPath) ||
    ''

  if (!path) return ''

  const relativePath = path.startsWith('/') ? relative(docsRoot, path) : path
  return relativePath.replace(/\.md$/, '').replace(/\\/g, '/')
}

/**
 * markdown-it stores link hrefs percent-encoded (via `normalizeLink`), so
 * non-ASCII paths never match the filesystem or the filename index unless
 * decoded first. Malformed sequences fall back to the raw href.
 */
const safeDecodeHref = (href: string): string => {
  try {
    return decodeURIComponent(href)
  } catch {
    return href
  }
}

const normalizeHref = (path: string): string => {
  if (!path) return '#'
  return path.startsWith('/') ? path : `/${path}`
}

const normalizeBase = (base: string | undefined): string => {
  if (!base || base === '/') return '/'
  const prefixed = base.startsWith('/') ? base : `/${base}`
  return prefixed.endsWith('/') ? prefixed : `${prefixed}/`
}

const splitHashAndQuery = (path: string): [string, string] => {
  const index = path.search(/[?#]/)
  return index === -1 ? [path, ''] : [path.slice(0, index), path.slice(index)]
}

const formatInternalPagePath = (
  path: string,
  { cleanUrls = false }: Pick<WikilinkPluginOptions, 'cleanUrls'>
): string => {
  const normalized = normalizeHref(path)
  const [pathname, suffix] = splitHashAndQuery(normalized)
  const htmlPath =
    cleanUrls || pathname === '/' || pathname.endsWith('.html')
      ? pathname
      : `${pathname}.html`

  return `${htmlPath}${suffix}`
}

const formatBasePageHref = (
  path: string,
  { base, cleanUrls = false }: WikilinkPluginOptions
): string => {
  const pagePath = formatInternalPagePath(path, { cleanUrls })
  const siteBase = normalizeBase(base)

  return `${siteBase}${pagePath.replace(/^\/+/, '')}`
}

/**
 * Formats the href for a broken page candidate. The target is clamped to a
 * vault-absolute path so the resulting href can never escape the site base —
 * it always lands on VitePress's 404 route (issue #434).
 */
const formatBrokenPageHref = (
  path: string,
  currentFile: string,
  options: WikilinkPluginOptions,
  withBase: boolean
): string => {
  if (!isPageCandidateHref(path)) return path

  const clamped = clampToVaultPath(path, currentFile)

  return withBase
    ? formatBasePageHref(clamped, options)
    : formatInternalPagePath(clamped, options)
}

type PageCandidateHrefResult = {
  href: string
  broken: boolean
  relativePath: string | null
}

const resolvePageCandidateHref = (
  href: string,
  config: AnalyzerConfig,
  currentFile: string,
  options: WikilinkPluginOptions,
  withBase: boolean
): PageCandidateHrefResult => {
  const [hrefPath, hrefSuffix] = splitHashAndQuery(href)
  const resolved = currentFile
    ? resolveInternalLink(hrefPath, config, currentFile)
    : null

  if (resolved) {
    const resolvedPath = `${resolved.fullUrl}${hrefSuffix}`
    return {
      href: withBase
        ? formatBasePageHref(resolvedPath, options)
        : formatInternalPagePath(resolvedPath, options),
      broken: false,
      relativePath: resolved.relativePath
    }
  }

  return {
    href: formatBrokenPageHref(href, currentFile, options, withBase),
    broken: true,
    relativePath: null
  }
}

/**
 * Looks up analyzer metadata for a resolved target, falling back to the
 * directory's `index` page (since directory links resolve to `dir`, not
 * `dir/index`).
 */
const lookupPageMetadata = (relativePath: string, siteMetadata: SiteMetadata) =>
  siteMetadata[relativePath] || siteMetadata[`${relativePath}/index`]

/**
 * Resolves the display label for a wiki link. An explicit alias always wins;
 * otherwise the label follows `renderTitle`, read from build-time analyzer
 * metadata. Broken links fall back to the raw target text.
 */
const resolveWikiLabel = (
  rawTarget: string,
  alias: string | undefined,
  relativePath: string | null,
  renderTitle: RenderTitleMode,
  siteMetadata: SiteMetadata
): string => {
  if (alias) return alias

  // Broken (unresolved) links keep the raw target as a readable label.
  if (!relativePath) return rawTarget

  const meta = lookupPageMetadata(relativePath, siteMetadata)
  const fileName = relativePath.split('/').pop() || rawTarget

  switch (renderTitle) {
    case 'file_name':
      return fileName

    case 'frontmatter_title':
      return meta?.frontMatterTitle || fileName

    case 'first_heading': {
      const heading = meta?.firstHeading
      if (heading && heading !== 'no-heading') return heading
      return meta?.frontMatterTitle || fileName
    }

    case 'alias':
    default:
      return rawTarget
  }
}

export const createWikilinkPlugin = async (
  resolutionModes?: ResolutionMode[],
  configOverrides: Partial<AnalyzerConfig> = {},
  options: WikilinkPluginOptions = {}
): Promise<(md: MarkdownIt) => void> => {
  const pluginOptions = options
  const renderTitle = options.renderTitle ?? 'alias'
  const config = createConfig({
    ...configOverrides,
    ...(resolutionModes?.length ? { resolutionModes } : {})
  })
  const docsRoot = getDocsRoot(config)

  // A single analysis pass builds the filename index (stored on `config`, used
  // by obsidianShortest resolution) and returns whole-site metadata that powers
  // build-time title rendering — making the analyzer the single source of truth.
  const analysis = await analyzeAllDocuments(config)
  const siteMetadata: SiteMetadata = analysis.match(
    (result) => result.globalMetadata,
    () => ({})
  )

  return (md: MarkdownIt) => {
    const wikilink = (state: StateInline, silent: boolean): boolean => {
      const source = state.src.slice(state.pos)
      const match = WIKILINK_RE.exec(source)

      if (!match) return false
      if (silent) return true

      const rawTarget = match[1].trim()
      const alias = match[2]?.trim()
      const currentFile = getCurrentFile(state.env || {}, docsRoot)
      const targetKind = classifyHref(rawTarget)
      const isNonPageTarget = Boolean(
        targetKind && targetKind !== 'pageCandidate'
      )

      // Decision 1 (#434): leading-slash wiki links like `[[/path]]` are not
      // part of Obsidian's syntax and are always treated as broken. Standard
      // markdown links `[text](/path)` are unaffected — they flow through the
      // `link_open` rule and VitePress's native resolution.
      const forcedBroken = !rawTarget || rawTarget.startsWith('/')

      const hrefResult: PageCandidateHrefResult = isNonPageTarget
        ? {
            href: rawTarget,
            broken: false,
            relativePath: null
          }
        : !forcedBroken && currentFile
          ? resolvePageCandidateHref(
              rawTarget,
              config,
              currentFile,
              pluginOptions,
              true
            )
          : {
              href: rawTarget
                ? formatBrokenPageHref(
                    rawTarget,
                    currentFile,
                    pluginOptions,
                    true
                  )
                : '#',
              broken: true,
              relativePath: null
            }

      const label =
        resolveWikiLabel(
          rawTarget,
          alias,
          hrefResult.relativePath,
          renderTitle,
          siteMetadata
        ) ||
        rawTarget ||
        match[1]

      const token = state.push('wikilink_open', 'a', 1)
      token.attrs = [
        ['href', hrefResult.href],
        ['class', 'clear-wikilink'],
        ['data-link-style-target', '']
      ]

      if (hrefResult.broken) {
        token.attrSet('data-link-broken', '')
        token.attrJoin('class', 'broken-link')
      }

      const text = state.push('text', '', 0)
      text.content = label
      state.push('wikilink_close', 'a', -1)
      state.pos += match[0].length

      return true
    }

    md.inline.ruler.before('emphasis', 'clear_wikilink', wikilink)

    const defaultLinkOpen =
      md.renderer.rules.link_open ||
      ((tokens, idx, options, _env, self) =>
        self.renderToken(tokens, idx, options))

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const rawHref = token.attrGet('href')
      const href = rawHref && safeDecodeHref(rawHref)

      if (href && isPageCandidateHref(href)) {
        const currentFile = getCurrentFile(
          (env || {}) as Record<string, unknown>,
          docsRoot
        )
        const hrefResult = currentFile
          ? resolvePageCandidateHref(
              href,
              config,
              currentFile,
              pluginOptions,
              false
            )
          : {
              href,
              broken: true,
              relativePath: null
            }

        token.attrSet('href', hrefResult.href)

        if (hrefResult.broken) {
          token.attrSet('data-link-broken', '')
          token.attrJoin('class', 'broken-link')
        }
      }

      return defaultLinkOpen(tokens, idx, options, env, self)
    }

    md.renderer.rules.wikilink_open = (
      tokens: Token[],
      idx: number,
      options,
      _env,
      self
    ) => self.renderToken(tokens, idx, options)
    md.renderer.rules.wikilink_close = (
      tokens: Token[],
      idx: number,
      options,
      _env,
      self
    ) => self.renderToken(tokens, idx, options)
  }
}

export type { RenderTitleMode, WikilinkPluginOptions }
