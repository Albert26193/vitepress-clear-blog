import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import { dirname, relative, resolve } from 'node:path'
import {
  type AnalyzerConfig,
  type ResolutionMode,
  buildFilenameIndex,
  createConfig,
  getDocsRoot,
  resolveInternalLink
} from 'vitepress-plugin-analyzer'

import { classifyHref } from '../linkKind'

type WikilinkPluginOptions = {
  base?: string
  cleanUrls?: boolean
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

export const createWikilinkPlugin = async (
  resolutionModes?: ResolutionMode[],
  configOverrides: Partial<AnalyzerConfig> = {},
  options: WikilinkPluginOptions = {}
): Promise<(md: MarkdownIt) => void> => {
  const pluginOptions = options
  const config = createConfig({
    ...configOverrides,
    ...(resolutionModes?.length ? { resolutionModes } : {})
  })
  const docsRoot = getDocsRoot(config)
  const indexResult = await buildFilenameIndex(docsRoot, config)

  config.filenameIndex = indexResult.match(
    (index) => index,
    () => new Map()
  )

  return (md: MarkdownIt) => {
    const wikilink = (state: StateInline, silent: boolean): boolean => {
      const source = state.src.slice(state.pos)
      const match = WIKILINK_RE.exec(source)

      if (!match) return false
      if (silent) return true

      const rawTarget = match[1].trim()
      const [targetPath, targetSuffix] = splitHashAndQuery(rawTarget)
      const label = (match[2] || rawTarget).trim()
      const currentFile = getCurrentFile(state.env || {}, docsRoot)
      const resolved = currentFile
        ? resolveInternalLink(targetPath, config, currentFile)
        : null

      const token = state.push('wikilink_open', 'a', 1)
      token.attrs = [
        [
          'href',
          resolved
            ? formatBasePageHref(
                `${resolved.fullUrl}${targetSuffix}`,
                pluginOptions
              )
            : normalizeHref(rawTarget)
        ],
        ['class', 'clear-wikilink'],
        ['data-link-style-target', '']
      ]

      if (!resolved) {
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
      const href = token.attrGet('href')

      if (href && isPageCandidateHref(href)) {
        const currentFile = getCurrentFile(
          (env || {}) as Record<string, unknown>,
          docsRoot
        )
        const [hrefPath, hrefSuffix] = splitHashAndQuery(href)
        const resolved = currentFile
          ? resolveInternalLink(hrefPath, config, currentFile)
          : null

        if (resolved) {
          token.attrSet(
            'href',
            formatInternalPagePath(
              `${resolved.fullUrl}${hrefSuffix}`,
              pluginOptions
            )
          )
        } else {
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
