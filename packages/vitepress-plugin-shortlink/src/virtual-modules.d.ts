declare module 'virtual:vitepress-shortlinks' {
  /** URL path segment under which short links are served (default "s"). */
  export const prefix: string

  /** Canonical page path -> short key mapping, generated at build time. */
  export const shortlinks: Record<string, string>
}
