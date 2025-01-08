import type { SiteMetadata } from './index'

declare module 'virtual:markdown-metadata' {
  export const globalMdMetadata: SiteMetadata
}
