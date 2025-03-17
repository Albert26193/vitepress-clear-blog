import type { SiteMetadata } from './page'

declare module 'virtual:vitepress-analyzer' {
  export const globalMdMetadata: SiteMetadata
}
