/**
 * Reduces any page identifier to the same canonical identity, so build-time
 * (node) and runtime (client) always agree on which short key a page maps to.
 * Handles `.md`/`.html` suffixes, `index` pages and leading/trailing slashes.
 */
export const canonicalizePath = (path: string): string =>
  path
    .replace(/\.(?:md|html)$/i, '')
    .replace(/(?:^|\/)index$/i, '')
    .replace(/^\/+|\/+$/g, '')
