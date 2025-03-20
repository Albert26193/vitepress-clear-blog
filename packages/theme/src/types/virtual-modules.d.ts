declare module 'virtual:vitepress-analyzer' {
  import type { PageLink, PageMetadata } from './types'

  // Export metadata object
  export const metadata: Record<string, PageMetadata>
}
