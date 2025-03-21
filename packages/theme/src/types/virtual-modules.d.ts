declare module 'virtual:vitepress-analyzer' {
  import type {
    PageLink,
    PageMetadata,
    SitePages
  } from 'vitepress-plugin-analyzer/types'

  // Export metadata object
  export const siteMetadata: Record<string, PageMetadata>
  export const sitePages: SitePages
}
