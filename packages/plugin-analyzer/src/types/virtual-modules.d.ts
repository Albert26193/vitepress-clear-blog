import type { SiteMetadata } from './types'

declare module 'virtual:markdown-metadata' {
  export const globalMdMetadata: SiteMetadata
}
