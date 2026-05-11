import type MarkdownIt from 'markdown-it'
// @ts-expect-error - markdown-it-hashtag has no type declarations
import markdownItHashtag from 'markdown-it-hashtag'

/**
 * Registers hashtag token rendering rules so `#TagName` patterns become
 * clickable links pointing to the tag filter page.
 *
 * @param md - Markdown-it instance to extend.
 * @returns Nothing; renderer rules are registered on the provided instance.
 */
const hashtagPlugin = (md: MarkdownIt): void => {
  md.use(markdownItHashtag)

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

export { hashtagPlugin }
