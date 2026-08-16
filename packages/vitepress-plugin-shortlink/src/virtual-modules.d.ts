declare module 'virtual:vitepress-shortlinks' {
  /** URL path segment under which short links are served (default "s"). */
  export const prefix: string

  /** Whether the site uses clean URLs, so short links drop the ".html" suffix. */
  export const cleanUrls: boolean

  /** Canonical page path -> short key mapping, generated at build time. */
  export const shortlinks: Record<string, string>
}
