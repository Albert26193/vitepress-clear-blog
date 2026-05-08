import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

// Initialize markdown-it instance
const md = new MarkdownIt({ html: true })

/**
 * Extract heading content for a given heading token
 *
 * @param tokens - The tokens of the markdown content
 * @param index - The index of the heading token
 * @returns The content of the heading or empty string if not found
 */
const extractHeadingContent = (tokens: Token[], index: number): string => {
  const contentToken = tokens[index + 1]
  if (!contentToken || contentToken.type !== 'inline') return ''

  return (
    contentToken.children
      ?.map((child) => (child.content ?? '') as string)
      .join('')
      .trim() || ''
  )
}

/**
 * Checks if a token is a valid heading token
 *
 * @param token - The token to check
 * @returns Whether the token is a valid heading
 */
const isValidHeading = (token: Token): boolean => {
  const validTypes = ['heading_open', 'heading_close']
  const markupRegex = /^#{1,6}$/
  const validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

  return (
    validTypes.includes(token.type) &&
    markupRegex.test(token.markup) &&
    validTags.includes(token.tag)
  )
}

/**
 * Finds the first heading in tokens and extracts its content
 *
 * @param tokens - The tokens of the markdown content
 * @returns The content of the first heading or 'no-heading' if none found
 */
const findFirstHeading = (tokens: Token[]): string => {
  if (!tokens.length) return 'no-heading'

  const headingTokenIndex = tokens.findIndex(isValidHeading)
  if (headingTokenIndex === -1) return 'no-heading'

  const token = tokens[headingTokenIndex]
  const level = token.markup.length
  const content = extractHeadingContent(tokens, headingTokenIndex)

  if (!content) return 'no-heading'

  // If heading is H1 or H2, return it
  // If lower than H2, return string 'no-heading'
  return level <= 2 ? content : 'no-heading'
}

/**
 * Extracts the first meaningful top-level heading for page summaries.
 *
 * @param content - Markdown content to parse.
 * @returns First H1/H2 text, a sentinel when no suitable heading exists, or null for empty content.
 */
export const extractFirstHeading = (content: string): string | null => {
  if (!content) return null

  const tokens: Token[] = md.parse(content, {})
  return findFirstHeading(tokens)
}

/**
 * Preserves the historical array-based heading API while the analyzer stores one summary heading.
 *
 * @param content - Markdown content to parse.
 * @returns An array containing the first summary heading when one is available.
 */
export const extractHeading = (content: string): string[] => {
  // This implementation can be expanded when needed
  const firstHeading = extractFirstHeading(content)
  return firstHeading ? [firstHeading] : []
}
