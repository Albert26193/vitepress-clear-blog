import matter from 'gray-matter'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

import { canonicalizePath } from '../shared/canonicalize'
import type { ShortlinkInput } from './keys'

export interface ScanOptions {
  /** VitePress site root; pages are scanned under this directory. */
  srcDir: string
  /** Directory (relative to srcDir) to scan. Pages outside are ignored. */
  scope?: string
  /** Frontmatter field carrying each page's stable id. */
  idField: string
}

// Mirror VitePress's own page conventions: underscore- and dot-prefixed files
// or directories are never built, so they must not be required to carry an id.
const IGNORED_RE = /(^|\/)[_.]/
const NODE_MODULES_RE = /(^|\/)node_modules(\/|$)/

/**
 * Scans the configured scope for pages and reads each page's stable id from
 * frontmatter. Every `.md` page inside the scope must declare the id field —
 * the scope is the explicit opt-in, so a page without an id is a configuration
 * error and fails the build rather than being silently skipped.
 */
export const scanPages = async ({
  srcDir,
  scope,
  idField
}: ScanOptions): Promise<ShortlinkInput[]> => {
  const scopeDir = scope ? resolve(srcDir, scope) : resolve(srcDir)

  let entries: string[]
  try {
    entries = (await readdir(scopeDir, { recursive: true })).map(String)
  } catch {
    throw new Error(
      `[vitepress-plugin-shortlink] cannot scan scope "${scope ?? '**'}" ` +
        `(resolved to ${scopeDir}): directory not found`
    )
  }

  const pages: ShortlinkInput[] = []
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    if (IGNORED_RE.test(entry) || NODE_MODULES_RE.test(entry)) continue

    const absolute = join(scopeDir, entry)
    const relToSrc = relative(srcDir, absolute)
    const { data } = matter(await readFile(absolute, 'utf-8'))
    const raw = data[idField]
    const id = typeof raw === 'string' ? raw.trim() : ''

    if (!id) {
      throw new Error(
        `[vitepress-plugin-shortlink] missing "${idField}" in frontmatter of ` +
          `${relToSrc} (scope "${scope ?? '**'}"). Add ` +
          `"${idField}: <unique-string>" to make the page shareable.`
      )
    }

    pages.push({ url: canonicalizePath(relToSrc), id })
  }

  return pages.sort((a, b) => a.url.localeCompare(b.url))
}
