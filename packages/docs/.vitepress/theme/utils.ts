import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import path, { resolve } from 'path'

/**
 * Get root path for project
 */
const getRootPath = () => {
  const rootPath = path.resolve(process.cwd())
  // console.log('Current working directory:', process.cwd())
  // console.log('Resolved root path:', rootPath)
  return rootPath
}

/**
 * Get src path for project
 *
 * @param srcName - src name
 * @returns src path
 */
const getSrcPath = (srcName = 'src') => {
  const rootPath = getRootPath()
  return `${rootPath}/${srcName}`
}

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
export { getRootPath, getSrcPath, getFooterRefTag, getHashtag }

//temp
const getThemeConfig = async (cfg = {}) => {
  return {
    blog: {
      title: 'DDDDDDDocs',
      vite: {
        server: { port: 4000 }
        // plugins: [
        //   vitePressAnalyzerPlugin(),
        //   // generateThemePlugin(),
        //   UnoCSS()
        //   //RssPlugin(RSS)
        // ]
      },
      ...cfg
    }
  }
}

export { getThemeConfig }
