import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'

export type ImageDimensionConvention =
  | 'altPreset'
  | 'githubTitleSuffix'
  | 'pandocAttrList'
  | 'obsidianBareSize'
  | 'obsidianPixelSize'
  | 'urlQueryParams'
  | 'htmlTitleSize'

export interface ImageDimensionSize {
  width?: number
  height?: number
}

export interface ImageDimensionPluginOptions {
  conventions?: Partial<Record<ImageDimensionConvention, boolean>>
  presets?: Record<string, number | ImageDimensionSize>
  stripDimensionQuery?: boolean
}

interface ResolvedImageDimensionPluginOptions {
  conventions: Record<ImageDimensionConvention, boolean>
  presets: Record<string, ImageDimensionSize>
  stripDimensionQuery: boolean
}

interface ImageDimensionTokenMeta {
  githubTitleSuffix?: ImageDimensionSize
}

const DEFAULT_PRESETS: Record<string, number> = {
  xs: 300,
  s: 400,
  m: 500,
  l: 600,
  xl: 800
}

const DEFAULT_CONVENTIONS: Record<ImageDimensionConvention, boolean> = {
  altPreset: true,
  githubTitleSuffix: true,
  pandocAttrList: true,
  obsidianBareSize: true,
  obsidianPixelSize: true,
  urlQueryParams: true,
  htmlTitleSize: true
}

const normalizePreset = (
  preset: number | ImageDimensionSize
): ImageDimensionSize | null => {
  if (typeof preset === 'number') {
    return Number.isInteger(preset) && preset > 0 ? { width: preset } : null
  }

  const width = isPositiveInteger(preset.width) ? preset.width : undefined
  const height = isPositiveInteger(preset.height) ? preset.height : undefined

  return width || height ? { width, height } : null
}

const resolveOptions = (
  options: ImageDimensionPluginOptions = {}
): ResolvedImageDimensionPluginOptions => {
  const presets: Record<string, ImageDimensionSize> = {}

  Object.entries({ ...DEFAULT_PRESETS, ...options.presets }).forEach(
    ([name, preset]) => {
      const normalized = normalizePreset(preset)
      if (normalized) presets[name.toLowerCase()] = normalized
    }
  )

  return {
    conventions: { ...DEFAULT_CONVENTIONS, ...options.conventions },
    presets,
    stripDimensionQuery: options.stripDimensionQuery === true
  }
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

const parsePositivePixel = (value: string): number | undefined => {
  const unquoted = value
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .trim()
  const normalized = unquoted.endsWith('px')
    ? unquoted.slice(0, -2).trim()
    : unquoted

  if (!/^[1-9]\d*$/.test(normalized)) return undefined

  return Number(normalized)
}

const parseSizePair = (value: string): ImageDimensionSize | null => {
  const normalized = value.trim().replace(/^=/, '')
  if (!normalized) return null

  if (!normalized.includes('x')) {
    const width = parsePositivePixel(normalized)
    return width ? { width } : null
  }

  const match = /^(\d*)x(\d*)$/i.exec(normalized)
  if (!match) return null

  const width = match[1] ? parsePositivePixel(match[1]) : undefined
  const height = match[2] ? parsePositivePixel(match[2]) : undefined

  return width || height ? { width, height } : null
}

const mergeDimension = (
  target: ImageDimensionSize,
  candidate: ImageDimensionSize | null | undefined
): void => {
  if (!candidate) return
  if (!target.width && candidate.width) target.width = candidate.width
  if (!target.height && candidate.height) target.height = candidate.height
}

const applyDimensionAttrs = (
  token: Token,
  dimension: ImageDimensionSize
): void => {
  if (dimension.width) token.attrSet('width', String(dimension.width))
  if (dimension.height) token.attrSet('height', String(dimension.height))
}

const getExistingDimension = (token: Token): ImageDimensionSize => ({
  width: parsePositivePixel(token.attrGet('width') || ''),
  height: parsePositivePixel(token.attrGet('height') || '')
})

const parseAltSuffix = (
  content: string,
  options: ResolvedImageDimensionPluginOptions
): { content: string; dimension: ImageDimensionSize | null } | null => {
  const match = /^(.*?)(\s*)\|([^|\s]+)$/u.exec(content)
  if (!match) return null

  const [, alt, spacing, suffix] = match
  const cleanAlt =
    spacing && alt.endsWith(spacing) ? alt.slice(0, -spacing.length) : alt
  const lowerSuffix = suffix.toLowerCase()

  if (options.conventions.obsidianPixelSize && lowerSuffix.includes('x')) {
    const dimension = parseSizePair(lowerSuffix)
    if (dimension) return { content: cleanAlt.trimEnd(), dimension }
  }

  if (options.conventions.obsidianBareSize) {
    const width = parsePositivePixel(lowerSuffix)
    if (width) return { content: cleanAlt.trimEnd(), dimension: { width } }
  }

  if (options.conventions.altPreset) {
    const dimension = options.presets[lowerSuffix]
    if (dimension) return { content: cleanAlt.trimEnd(), dimension }
  }

  return null
}

const parseHtmlTitleDimension = (token: Token): ImageDimensionSize | null => {
  const title = token.attrGet('title')
  if (!title) return null

  return parseSizePair(title)
}

const parseUrlDimension = (
  token: Token,
  options: ResolvedImageDimensionPluginOptions
): ImageDimensionSize | null => {
  const src = token.attrGet('src')
  if (!src || !/[?&](width|height)=/i.test(src)) return null

  const [baseWithQuery, hash = ''] = src.split('#', 2)
  const queryIndex = baseWithQuery.indexOf('?')
  if (queryIndex < 0) return null

  const base = baseWithQuery.slice(0, queryIndex)
  const query = baseWithQuery.slice(queryIndex + 1)
  const params = new URLSearchParams(query)
  const width = parsePositivePixel(params.get('width') || '')
  const height = parsePositivePixel(params.get('height') || '')

  if (!width && !height) return null

  if (options.stripDimensionQuery) {
    params.delete('width')
    params.delete('height')
    const nextQuery = params.toString()
    const nextHash = hash ? `#${hash}` : ''
    token.attrSet(
      'src',
      `${base}${nextQuery ? `?${nextQuery}` : ''}${nextHash}`
    )
  }

  return { width, height }
}

const parsePandocAttrs = (
  content: string
): {
  dimension: ImageDimensionSize | null
  rest: string
} | null => {
  const match = /^\{([^}]*)\}/u.exec(content)
  if (!match) return null

  const attrs = match[1]
  const widthMatch = /(?:^|\s)width\s*=\s*("[^"]+"|'[^']+'|[^\s}]+)/u.exec(
    attrs
  )
  const heightMatch = /(?:^|\s)height\s*=\s*("[^"]+"|'[^']+'|[^\s}]+)/u.exec(
    attrs
  )
  const width = widthMatch ? parsePositivePixel(widthMatch[1]) : undefined
  const height = heightMatch ? parsePositivePixel(heightMatch[1]) : undefined

  if (!width && !height) return null

  return {
    dimension: { width, height },
    rest: content.slice(match[0].length)
  }
}

const syncImageAlt = (token: Token): void => {
  token.attrSet('alt', token.content)
  if (token.children?.length) {
    token.children.forEach((child) => {
      if (child.type === 'text') child.content = token.content
    })
  }
}

const normalizeImageToken = (
  token: Token,
  options: ResolvedImageDimensionPluginOptions
): void => {
  const dimension = getExistingDimension(token)
  const meta = (token.meta || {}) as ImageDimensionTokenMeta

  if (options.conventions.githubTitleSuffix) {
    mergeDimension(dimension, meta.githubTitleSuffix)
  }

  if (options.conventions.htmlTitleSize) {
    const titleDimension = parseHtmlTitleDimension(token)
    if (titleDimension) {
      mergeDimension(dimension, titleDimension)
      token.attrSet('title', '')
      const titleIndex = token.attrIndex('title')
      if (titleIndex >= 0) token.attrs?.splice(titleIndex, 1)
    }
  }

  if (
    options.conventions.obsidianPixelSize ||
    options.conventions.obsidianBareSize
  ) {
    const altResult = parseAltSuffix(token.content, options)
    if (altResult) {
      token.content = altResult.content
      syncImageAlt(token)
      mergeDimension(dimension, altResult.dimension)
    }
  } else if (options.conventions.altPreset) {
    const altResult = parseAltSuffix(token.content, options)
    if (altResult) {
      token.content = altResult.content
      syncImageAlt(token)
      mergeDimension(dimension, altResult.dimension)
    }
  }

  if (options.conventions.urlQueryParams) {
    mergeDimension(dimension, parseUrlDimension(token, options))
  }

  applyDimensionAttrs(token, dimension)
}

const normalizePandocNeighbor = (
  tokens: Token[],
  index: number,
  dimension: ImageDimensionSize,
  options: ResolvedImageDimensionPluginOptions
): void => {
  if (!options.conventions.pandocAttrList) return

  const nextToken = tokens[index + 1]
  if (!nextToken || nextToken.type !== 'text') return

  const parsed = parsePandocAttrs(nextToken.content)
  if (!parsed) return

  mergeDimension(dimension, parsed.dimension)
  nextToken.content = parsed.rest
  if (!nextToken.content) tokens.splice(index + 1, 1)
}

const normalizeInlineImages = (
  tokens: Token[],
  options: ResolvedImageDimensionPluginOptions
): void => {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'image') continue

    const dimension = getExistingDimension(token)
    normalizePandocNeighbor(tokens, index, dimension, options)
    applyDimensionAttrs(token, dimension)
    normalizeImageToken(token, options)
  }
}

const createGithubSuffixRule = (
  options: ResolvedImageDimensionPluginOptions
) => {
  return (state: StateInline, silent: boolean): boolean => {
    if (!options.conventions.githubTitleSuffix) return false
    if (state.src.charCodeAt(state.pos) !== 0x21) return false
    if (state.src.charCodeAt(state.pos + 1) !== 0x5b) return false

    const start = state.pos
    const altEnd = state.src.indexOf('](', start + 2)
    if (altEnd < 0) return false

    const bodyStart = altEnd + 2
    const bodyEnd = state.src.indexOf(')', bodyStart)
    if (bodyEnd < 0) return false

    const alt = state.src.slice(start + 2, altEnd)
    const body = state.src.slice(bodyStart, bodyEnd)
    const match = /^(.*?)\s+=(\d*x\d*)\s*$/u.exec(body)
    if (!match) return false

    const src = match[1].trim()
    const dimension = parseSizePair(match[2])
    if (!src || !dimension) return false

    if (!silent) {
      const token = state.push('image', 'img', 0)
      token.attrs = [
        ['src', state.md.normalizeLink(src)],
        ['alt', '']
      ]
      token.content = alt
      const child = new state.Token('text', '', 0)
      child.content = alt
      token.children = [child]
      token.markup = 'image'
      token.meta = {
        ...(token.meta || {}),
        githubTitleSuffix: dimension
      } satisfies ImageDimensionTokenMeta
    }

    state.pos = bodyEnd + 1
    return true
  }
}

export const imageDimensionPlugin = (
  md: MarkdownIt,
  options: ImageDimensionPluginOptions = {}
): void => {
  const resolvedOptions = resolveOptions(options)
  const defaultImageRenderer = md.renderer.rules.image

  md.inline.ruler.before(
    'image',
    'image_dimension_github_suffix',
    createGithubSuffixRule(resolvedOptions)
  )

  md.core.ruler.after('inline', 'image_dimension_normalize', (state) => {
    state.tokens.forEach((blockToken) => {
      if (blockToken.type === 'inline' && blockToken.children) {
        normalizeInlineImages(blockToken.children, resolvedOptions)
      }
    })
  })

  md.renderer.rules.image = (tokens, idx, rendererOptions, env, self) => {
    normalizeImageToken(tokens[idx], resolvedOptions)

    if (defaultImageRenderer) {
      return defaultImageRenderer(tokens, idx, rendererOptions, env, self)
    }

    return self.renderToken(tokens, idx, rendererOptions)
  }
}
