/* eslint-disable */

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.png' {
  const value: any
  export = value
}

// declare module 'virtual:vitepress-analyzer' {
//   export const globalMdMetadata: SiteMetadata
// }

declare module 'markdown-it-wikilinks' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (options?: any) => (md: MarkdownIt) => void
  export default plugin
}
