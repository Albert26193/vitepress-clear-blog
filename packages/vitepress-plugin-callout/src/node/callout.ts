import type MarkdownIt from 'markdown-it'

const markerRE = /^\[\!([^\]]+)\]([^\n\r]*)/i
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

const calloutPlugin = (md: MarkdownIt) => {
  md.core.ruler.after('block', 'custom-callout', (state) => {
    const tokens = state.tokens
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

  md.renderer.rules.custom_callout_open = function (tokens, idx) {
    const { title, type } = tokens[idx].meta
    return `<div class="${type} custom-block custom-callout"><p class="custom-block-title">${title}</p>\n`
  }
}

export { calloutPlugin }
