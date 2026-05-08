import type MarkdownIt from 'markdown-it'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'
import type Token from 'markdown-it/lib/token.mjs'

const markerRE = /^\[!([^\]]+)\]([^\n\r]*)/i
const PRESET_CALLOUTS = [
  'tip',
  'note',
  'info',
  'important',
  'warning',
  'caution',
  'danger'
]
const LETTER_RE = /^[a-zA-Z]+$/

/**
 * Adds support for custom VitePress callout block types while leaving preset callouts untouched.
 *
 * @param md - Markdown-it instance whose token pipeline should recognize custom callouts.
 * @returns Nothing; renderer rules are registered on the provided Markdown-it instance.
 */
const calloutPlugin = (md: MarkdownIt): void => {
  md.core.ruler.after('block', 'custom-callout', (state: StateCore): void => {
    const tokens = state.tokens as Token[]
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'blockquote_open') {
        const startIndex = i
        const open = tokens[startIndex]

        let endIndex = i + 1
        while (
          endIndex < tokens.length &&
          (tokens[endIndex].type !== 'blockquote_close' ||
            tokens[endIndex].level !== open.level)
        ) {
          endIndex++
        }

        if (endIndex === tokens.length) continue
        const close = tokens[endIndex]

        const firstContent = tokens
          .slice(startIndex, endIndex + 1)
          .find((token) => token.type === 'inline')

        if (!firstContent) continue

        const match = firstContent.content.match(markerRE)
        if (!match) continue

        const type = match[1].toLowerCase()
        if (PRESET_CALLOUTS.includes(type)) {
          continue
        }

        if (!LETTER_RE.test(type)) {
          continue
        }

        if (type.length >= 20) {
          console.warn(
            `[vitepress-plugin-callout] Invalid custom callout type: "${type}". Custom types must be less than 20 characters.`
          )
          continue
        }

        const title = match[2].trim() || type.toUpperCase()
        firstContent.content = firstContent.content
          .slice(match[0].length)
          .trimStart()

        open.type = 'custom_callout_open'
        open.tag = 'div'
        open.meta = {
          title,
          type
        }
        close.type = 'custom_callout_close'
        close.tag = 'div'
      }
    }
  })

  md.renderer.rules.custom_callout_open = function (
    tokens: Token[],
    idx: number
  ): string {
    const { title, type } = tokens[idx].meta
    return `<div class="${type} custom-block custom-callout"><p class="custom-block-title">${title}</p>\n`
  }
}

export { calloutPlugin }
