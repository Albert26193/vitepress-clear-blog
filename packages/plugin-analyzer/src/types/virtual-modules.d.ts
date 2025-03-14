import type { SiteMetadata } from './page'

declare module 'virtual:markdown-metadata' {
  export const globalMdMetadata: SiteMetadata
}
