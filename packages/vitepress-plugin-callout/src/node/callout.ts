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

export interface CalloutTypeConfig {
  /** Default title shown when the inline title is empty. */
  title?: string
}

export interface CalloutPluginOptions {
  /**
   * Custom callout type definitions. Keys are type names (e.g. "question"),
   * values configure the default title for that type.
   */
  types?: Record<string, CalloutTypeConfig>
  /**
   * When true, preset callout types (tip, note, info, etc.) are also
   * processed by this plugin instead of being left to VitePress.
   * @default false
   */
  overridePresets?: boolean
}

/**
 * Adds support for custom VitePress callout block types.
 *
 * By default, preset callouts (tip, note, info, important, warning, caution,
 * danger) are left for VitePress to handle. Pass {@link CalloutPluginOptions}
 * to configure default titles for custom types or to also handle preset types.
 *
 * @param md - Markdown-it instance whose token pipeline should recognize custom callouts.
 * @param options - Optional configuration for custom type titles and preset override.
 */
const calloutPlugin = (
  md: MarkdownIt,
  options?: CalloutPluginOptions
): void => {
  const types = options?.types || {}
  const overridePresets = options?.overridePresets || false

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
        const isPreset = PRESET_CALLOUTS.includes(type)

        if (isPreset && !overridePresets) {
          continue
        }

        if (!LETTER_RE.test(type)) {
          continue
        }

        if (type.length >= 20) {
          continue
        }

        // Inline title wins, then configured title, then uppercase type name
        const configuredTitle = types[type]?.title
        const title = match[2].trim() || configuredTitle || type.toUpperCase()
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
