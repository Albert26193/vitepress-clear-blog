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

declare module 'virtual:markdown-metadata' {
  export const globalMdMetadata: SiteMetadata
}

declare module 'markdown-it-wikilinks' {}