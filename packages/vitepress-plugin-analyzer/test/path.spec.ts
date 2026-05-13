import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/node/config'
import {
  getProjectRelativePath,
  resolveAbsolutePath,
  resolveLinkMultiMode
} from '../src/node/utils/path'
import type { AnalyzerConfig, ResolutionMode } from '../types'

const testRoot = path.resolve(__dirname)
const testConfig = createConfig({
  docsDir: testRoot,
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  ignoreCase: true
})

const writeTemp = (name: string, content = 'test') => {
  const p = path.resolve(testRoot, name)
  fs.writeFileSync(p, content)
  return p
}

const cleanup = (name: string) => {
  const p = path.resolve(testRoot, name)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

const configWithModes = (modes: ResolutionMode[]): AnalyzerConfig =>
  createConfig({ ...testConfig, resolutionModes: modes })

describe('resolveLinkMultiMode — repoRoot', () => {
  it('resolves link with leading / from docs root', () => {
    const result = resolveLinkMultiMode(
      '/attach/doc1',
      configWithModes(['repoRoot']),
      'index.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('resolves link without leading / from docs root', () => {
    const result = resolveLinkMultiMode(
      'attach/doc1',
      configWithModes(['repoRoot']),
      'index.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('returns null for non-existent file in repoRoot mode', () => {
    const result = resolveLinkMultiMode(
      '/nonexistent/deep/file',
      configWithModes(['repoRoot']),
      'index.md'
    )
    expect(result).toBeNull()
  })

  it('resolves with .md extension appended', () => {
    const result = resolveLinkMultiMode(
      '/attach/doc1.md',
      configWithModes(['repoRoot']),
      'index.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1.md'))
  })
})

describe('resolveLinkMultiMode — absolutePath', () => {
  const tmpFile = 'absolute-path-test.md'

  it('resolves a filesystem absolute path', () => {
    const absPath = writeTemp(tmpFile)
    try {
      const result = resolveLinkMultiMode(
        absPath,
        configWithModes(['absolutePath']),
        'index.md'
      )
      expect(result).toBe(absPath)
    } finally {
      cleanup(tmpFile)
    }
  })

  it('returns null when absolute path does not exist', () => {
    const result = resolveLinkMultiMode(
      '/tmp/definitely-nonexistent-file-xyz123.md',
      configWithModes(['absolutePath']),
      'index.md'
    )
    expect(result).toBeNull()
  })

  it('returns null for relative paths (not absolute)', () => {
    const result = resolveLinkMultiMode(
      './attach/doc1',
      configWithModes(['absolutePath']),
      'index.md'
    )
    expect(result).toBeNull()
  })
})

describe('resolveLinkMultiMode — relativeToCurrentFile', () => {
  it('resolves relative path from current file directory', () => {
    const result = resolveLinkMultiMode(
      './doc1',
      configWithModes(['relativeToCurrentFile']),
      'attach/test.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('resolves ../ parent traversal from nested file', () => {
    // From attach/deep/level1/level1-file1.md, ../../doc1 → attach/doc1
    const result = resolveLinkMultiMode(
      '../../doc1',
      configWithModes(['relativeToCurrentFile']),
      'attach/deep/level1/level1-file1.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('returns null when file does not exist relative to current', () => {
    const result = resolveLinkMultiMode(
      './nonexistent-file',
      configWithModes(['relativeToCurrentFile']),
      'attach/test.md'
    )
    expect(result).toBeNull()
  })

  it('returns null for absolute-style paths', () => {
    const result = resolveLinkMultiMode(
      '/attach/doc1',
      configWithModes(['relativeToCurrentFile']),
      'attach/test.md'
    )
    expect(result).toBeNull()
  })
})

describe('resolveLinkMultiMode — priority ordering', () => {
  it('tries repoRoot before relativeToCurrentFile', () => {
    // /attach/doc1 — both repoRoot and relativeToCurrentFile could resolve it
    // repoRoot should win because it's first
    const result = resolveLinkMultiMode(
      '/attach/doc1',
      configWithModes(['repoRoot', 'relativeToCurrentFile']),
      'index.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('falls back to second mode when first fails', () => {
    // ./doc1 from attach/test.md — repoRoot would try resolving 'doc1' from docs root
    // doc1 doesn't exist at root, but ./doc1 exists relative to attach/
    const result = resolveLinkMultiMode(
      './doc1',
      configWithModes(['repoRoot', 'relativeToCurrentFile']),
      'attach/test.md'
    )
    // repoRoot: {testRoot}/doc1 doesn't exist → fail
    // relativeToCurrentFile: {testRoot}/attach/doc1 → success
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('absolutePath takes precedence when listed first', () => {
    const tmpFile = 'priority-abs-test.md'
    const absPath = writeTemp(tmpFile)
    try {
      // absPath exists on disk, so absolutePath mode should find it first
      const result = resolveLinkMultiMode(
        absPath,
        configWithModes(['absolutePath', 'repoRoot', 'relativeToCurrentFile']),
        'index.md'
      )
      expect(result).toBe(absPath)
    } finally {
      cleanup(tmpFile)
    }
  })

  it('returns null when no mode resolves the link', () => {
    const result = resolveLinkMultiMode(
      '/definitely/nonexistent/path',
      configWithModes(['repoRoot', 'absolutePath', 'relativeToCurrentFile']),
      'index.md'
    )
    expect(result).toBeNull()
  })
})

describe('resolveLinkMultiMode — default config backward compatibility', () => {
  it('uses repoRoot, absolutePath, relativeToCurrentFile by default', () => {
    // /attach/doc1 resolved by repoRoot (first mode in default)
    const result = resolveLinkMultiMode('/attach/doc1', testConfig, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('relative link resolved by relativeToCurrentFile (after repoRoot fails)', () => {
    const result = resolveLinkMultiMode('./doc1', testConfig, 'attach/test.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })
})

describe('getProjectRelativePath with filesystem absolute paths', () => {
  it('converts filesystem absolute path under docsRoot to relative', () => {
    const tmpFile = 'proj-rel-test.md'
    const absPath = writeTemp(tmpFile)
    try {
      const result = getProjectRelativePath(absPath, 'index.md', testRoot)
      expect(result).toBe(tmpFile.replace(/\.md$/, ''))
    } finally {
      cleanup(tmpFile)
    }
  })

  it('treats absolute path outside docsRoot as repo-root-relative', () => {
    // /tmp/some-file.md → not under docsRoot, so treated as repo-root-relative path
    const result = getProjectRelativePath(
      '/tmp/some-file.md',
      'index.md',
      testRoot
    )
    expect(result).toBe('tmp/some-file')
  })

  it('handles repo-root relative paths normally', () => {
    const result = getProjectRelativePath('/attach/doc1', 'index.md', testRoot)
    expect(result).toBe('attach/doc1')
  })

  it('handles current-file relative paths normally', () => {
    const result = getProjectRelativePath('./doc1', 'attach/test.md', testRoot)
    expect(result).toBe('attach/doc1')
  })
})

describe('Resolution with .md extension in link', () => {
  it('repoRoot resolves link with .md extension', () => {
    const result = resolveLinkMultiMode(
      '/attach/doc1.md',
      configWithModes(['repoRoot']),
      'index.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1.md'))
  })

  it('relativeToCurrentFile resolves link without extension', () => {
    const result = resolveLinkMultiMode(
      './doc1',
      configWithModes(['relativeToCurrentFile']),
      'attach/test.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('relativeToCurrentFile resolves link with .md extension', () => {
    const result = resolveLinkMultiMode(
      './doc1.md',
      configWithModes(['relativeToCurrentFile']),
      'attach/test.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1.md'))
  })
})

describe('resolveLinkMultiMode — obsidianShortest', () => {
  it('returns null (not yet implemented)', () => {
    const result = resolveLinkMultiMode(
      '/attach/doc1',
      configWithModes(['obsidianShortest']),
      'index.md'
    )
    expect(result).toBeNull()
  })
})

describe('resolveLinkMultiMode — edge cases', () => {
  it('returns null for empty resolutionModes', () => {
    const result = resolveLinkMultiMode(
      '/attach/doc1',
      configWithModes([]),
      'index.md'
    )
    expect(result).toBeNull()
  })

  it('skips unknown mode names gracefully', () => {
    const config = createConfig({
      ...testConfig,
      resolutionModes: [
        'unknownMode',
        'repoRoot'
      ] as unknown as ResolutionMode[]
    })
    const result = resolveLinkMultiMode('/attach/doc1', config, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })
})

describe('resolveAbsolutePath backward compatibility', () => {
  it('resolves an existing file via multi-mode', () => {
    const result = resolveAbsolutePath(testConfig, '/attach/doc1', 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('falls back to repoRoot path when file does not exist', () => {
    const result = resolveAbsolutePath(
      testConfig,
      '/nonexistent/file.md',
      'index.md'
    )
    // Even though the file doesn't exist, it returns a path (legacy behavior)
    expect(result).toBe(path.resolve(testRoot, 'nonexistent/file.md'))
  })

  it('falls back for relative paths that do not exist', () => {
    const result = resolveAbsolutePath(
      testConfig,
      'relative/missing.md',
      'index.md'
    )
    // relative path without leading / → used as-is in fallback
    expect(result).toBe(path.resolve(testRoot, 'relative/missing.md'))
  })
})
