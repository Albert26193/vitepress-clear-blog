/**
 * Path helpers shared between build-time (markdown-it plugin) and any client
 * code. Keep this module dependency-free so it is safe to import from both the
 * Node build pipeline and the browser bundle.
 */

/**
 * Resolves a wikilink/markdown target against the current file's directory and
 * clamps any overshooting `..` segments to the vault root, so the resulting
 * href always stays within the site base (and lands on VitePress's 404 route
 * when the target does not exist).
 *
 * Node's `path.resolve` returns an escaped path when `..` overshoots the root,
 * which previously let broken hrefs leak outside the site base (issue #434).
 * This helper clamps instead, guaranteeing a vault-absolute result.
 *
 * @param rawPath - Link target as authored (relative or absolute, may carry a `#hash`/`?query`).
 * @param currentFile - Source page's vault-relative path without extension (e.g. `a/b/c`).
 * @returns A vault-absolute path beginning with `/`, preserving any hash/query suffix.
 */
export const clampToVaultPath = (
  rawPath: string,
  currentFile: string
): string => {
  const suffixIndex = rawPath.search(/[?#]/)
  const pathname = suffixIndex === -1 ? rawPath : rawPath.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : rawPath.slice(suffixIndex)

  // Absolute targets resolve from the vault root; relative ones from the
  // current file's directory.
  const segments = pathname.startsWith('/')
    ? []
    : currentFile.split('/').slice(0, -1).filter(Boolean)

  for (const segment of pathname.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      segments.pop()
      continue
    }
    segments.push(segment)
  }

  return `/${segments.join('/')}${suffix}`
}
