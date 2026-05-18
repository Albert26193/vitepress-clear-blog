declare module 'markdown-it-wikilinks' {
  import type MarkdownIt from 'markdown-it'

  const plugin: (options?: unknown) => (md: MarkdownIt) => void
  export default plugin
}
