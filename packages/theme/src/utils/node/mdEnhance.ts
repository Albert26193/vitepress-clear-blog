import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

/**
 * Get footer ref tag
 * 
 * render footnote to <FooterRef/> vue component
 * side effect: add footer ref tag to the markdown-it instance,
 * and transform it to vue component
 *
 * @param md - markdown-it instance
 */
const getFooterRefTag = (md: MarkdownIt) => {
  const footnoteContents: Record<string, string> = {}

  const originalFootnoteOpen =
    md.renderer.rules.footnote_open ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options))
  md.renderer.rules.footnote_open = (tokens, idx, options, env, self) => {
    const id = tokens[idx].meta.id

    let contentIndex = idx + 1
    let contentText = ''
    const contentTokens: Token[] = []

    while (
      contentIndex < tokens.length &&
      !(
        tokens[contentIndex].type === 'footnote_close' &&
        tokens[contentIndex].level === tokens[idx].level
      )
    ) {
      if (tokens[contentIndex].type === 'inline') {
        contentText += tokens[contentIndex].content
        contentTokens.push(tokens[contentIndex])
      }
      contentIndex++
    }

    let renderedContent = ''
    if (contentTokens.length > 0) {
      const tempTokens = [...contentTokens]

      for (const token of tempTokens) {
        renderedContent += md.renderer.renderInline(
          token.children || [],
          options,
          env
        )
      }
    }

    footnoteContents[id] = renderedContent || contentText

    return originalFootnoteOpen(tokens, idx, options, env, self)
  }

  const originalFootnoteRef = md.renderer.rules.footnote_ref
  md.renderer.rules.footnote_ref = (tokens, idx, options, env, self) => {
    const id = tokens[idx].meta?.id || idx
    let refLabel = ''

    if (originalFootnoteRef) {
      const originalHTML = originalFootnoteRef(tokens, idx, options, env, self)
      const match = originalHTML.match(/>([^<]+)<\/a>/)
      refLabel = match ? match[1] : `${id}`
    } else {
      refLabel = tokens[idx].meta?.label || `${id}`
    }

    const content = footnoteContents[id] || ''

    const cleanLabel = refLabel.replace(/\[|\]/g, '')

    return `<FooterRef content="${content}" text="${cleanLabel}" id="${id}" />`
  }
}

/**
 * Get hashtag tag
 * 
 * render #hashtag to <a href='/tags?tag=hashtag' class='blog-tag'>hashtag</a>
 *
 * @param md - markdown-it instance
 */
const getHashtag = (md: MarkdownIt) => {
  md.renderer.rules.hashtag_text = function (tokens, idx) {
    return `#${tokens[idx].content}`
  }

  md.renderer.rules.hashtag_open = function (tokens, idx) {
    const tagName = tokens[idx].content.toLowerCase()
    return `<a href='/tags?tag=${tagName}' class='blog-tag'>`
  }

  md.renderer.rules.hashtag_close = function () {
    return '</a>'
  }
}

/**
 * Get mermaid plugin
 *
 * render mermaid code block to <PostMermaid/> vue component
 *
 * @param md - markdown-it instance
 */
const mermaidPlugin = (md: MarkdownIt): void => {
  const fence = md.renderer.rules.fence?.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const language = token.info.trim()

    if (language.startsWith('mermaid')) {
      return `<PostMermaid id="mermaid-${idx}" code="${encodeURIComponent(token.content)}"></PostMermaid>`
    }
    return fence?.(tokens, idx, options, env, self) || ''
  }
}

export { getFooterRefTag, getHashtag, mermaidPlugin }
