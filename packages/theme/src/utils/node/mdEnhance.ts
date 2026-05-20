import MarkdownIt, { type Options } from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import type Token from 'markdown-it/lib/token.mjs'

const renderFootnoteContent = (
  md: MarkdownIt,
  tokens: Token[],
  idx: number,
  options: Options,
  env: unknown
): string => {
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
  for (const token of contentTokens) {
    renderedContent += md.renderer.renderInline(
      token.children || [],
      options,
      env
    )
  }

  return renderedContent || contentText
}

const collectFootnoteContents = (
  md: MarkdownIt,
  tokens: Token[],
  options: Options,
  env: unknown
): Record<string, string> => {
  const contents: Record<string, string> = {}

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx]
    if (token.type === 'footnote_open') {
      contents[token.meta.id] = renderFootnoteContent(
        md,
        tokens,
        idx,
        options,
        env
      )
    }
  }

  return contents
}

const getFootnoteContent = (
  md: MarkdownIt,
  tokens: Token[],
  id: string | number,
  options: Options,
  env: unknown
): string => {
  const footnoteOpenIndex = tokens.findIndex(
    (token) => token.type === 'footnote_open' && token.meta?.id === id
  )

  if (footnoteOpenIndex === -1) return ''

  return renderFootnoteContent(md, tokens, footnoteOpenIndex, options, env)
}

const encodeVueProp = (value: string | number): string =>
  JSON.stringify(String(value)).replace(/&/g, '&amp;').replace(/'/g, '&#39;')

/**
 * Rewrites footnote references to the theme tooltip component while preserving markdown-it footnote output.
 *
 * @param md - Markdown-it instance whose footnote renderer should be extended.
 * @returns Nothing; renderer rules are registered on the provided Markdown-it instance.
 */
const getFooterRefTag = (md: MarkdownIt) => {
  let footnoteContents: Record<string, string> = {}

  if (md.core?.ruler) {
    const coreRules = (
      md.core.ruler as unknown as { __rules__?: { name: string }[] }
    ).__rules__
    const anchorRule = coreRules?.some((rule) => rule.name === 'footnote_tail')
      ? 'footnote_tail'
      : 'inline'

    md.core.ruler.after(anchorRule, 'clear_blog_footnote_contents', (state) => {
      footnoteContents =
        anchorRule === 'footnote_tail'
          ? collectFootnoteContents(
              md,
              state.tokens,
              state.md.options,
              state.env
            )
          : {}
    })
  }

  const originalFootnoteOpen =
    md.renderer.rules.footnote_open ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options))
  md.renderer.rules.footnote_open = (tokens, idx, options, env, self) => {
    const id = tokens[idx].meta.id
    footnoteContents[id] = renderFootnoteContent(md, tokens, idx, options, env)

    return originalFootnoteOpen(tokens, idx, options, env, self)
  }

  const originalFootnoteRef = md.renderer.rules.footnote_ref
  md.renderer.rules.footnote_ref = (tokens, idx, options, env, self) => {
    const id = tokens[idx].meta?.id ?? idx
    let refLabel: string
    let referenceId = `fnref${id}`
    let targetId = `fn${id}`

    if (originalFootnoteRef) {
      const originalHTML = originalFootnoteRef(tokens, idx, options, env, self)
      const labelMatch = originalHTML.match(/>([^<]+)<\/a>/)
      const idMatch = originalHTML.match(/\sid="([^"]+)"/)
      const hrefMatch = originalHTML.match(/\shref="#([^"]+)"/)

      refLabel = labelMatch ? labelMatch[1] : `${id}`
      referenceId = idMatch ? idMatch[1] : referenceId
      targetId = hrefMatch ? hrefMatch[1] : targetId
    } else {
      refLabel = tokens[idx].meta?.label || `${id}`
    }

    const content =
      footnoteContents[id] || getFootnoteContent(md, tokens, id, options, env)
    const cleanLabel = refLabel.replace(/\[|\]/g, '')

    return `<FooterRef :content='${encodeVueProp(content)}' :text='${encodeVueProp(cleanLabel)}' :id='${encodeVueProp(id)}' :reference-id='${encodeVueProp(referenceId)}' :target-id='${encodeVueProp(targetId)}' />`
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
