import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import type Token from 'markdown-it/lib/token.mjs'

/**
 * Rewrites footnote references to the theme tooltip component while preserving markdown-it footnote output.
 *
 * @param md - Markdown-it instance whose footnote renderer should be extended.
 * @returns Nothing; renderer rules are registered on the provided Markdown-it instance.
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
    let refLabel: string

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
 * Replaces Mermaid fences with the theme renderer component so diagrams hydrate inside VitePress pages.
 *
 * @param md - Markdown-it instance whose fence renderer should be extended.
 * @returns Nothing; renderer rules are registered on the provided Markdown-it instance.
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

/**
 * Enables accessible task-list checkboxes in Markdown content.
 *
 * @param md - Markdown-it instance that should receive task-list support.
 * @returns Nothing; the task-list plugin is registered on the provided instance.
 */
const taskListsPlugin = (md: MarkdownIt): void => {
  md.use(taskLists, {
    enabled: true,
    label: true,
    labelAfter: true
  })
}

export { getFooterRefTag, mermaidPlugin, taskListsPlugin }
