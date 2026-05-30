import fs from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createConfig } from '../src/node/config'
import {
  buildFilenameIndex,
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

  it('resolves a directory path to its index.md (Obsidian-style [[dir]])', () => {
    const result = resolveLinkMultiMode(
      'attach/directory-index',
      configWithModes(['repoRoot']),
      'index.md'
    )
    expect(result).toBe(
      path.resolve(testRoot, 'attach/directory-index/index.md')
    )
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
  let sharedIndex: Map<string, string[]>

  beforeAll(async () => {
    const result = await buildFilenameIndex(testRoot, testConfig)
    sharedIndex = result.match(
      (idx) => idx,
      (e) => {
        throw e
      }
    )
  })

  it('resolves a short name to a unique file anywhere in the tree', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    const result = resolveLinkMultiMode('doc1', config, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('resolves short name with .md extension', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    // Link includes .md → result preserves .md
    const result = resolveLinkMultiMode('doc1.md', config, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1.md'))
  })

  it('resolves short name with path prefix (basename only matters)', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    // Only the basename "doc1" is used for lookup
    const result = resolveLinkMultiMode('some/nested/doc1', config, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('returns null for non-existent short name', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    const result = resolveLinkMultiMode(
      'nonexistent-page-xyz',
      config,
      'index.md'
    )
    expect(result).toBeNull()
  })

  it('returns null when no filenameIndex is set', () => {
    const config = configWithModes(['obsidianShortest'])
    config.diagnostics = []

    const result = resolveLinkMultiMode('doc1', config, 'index.md')
    expect(result).toBeNull()
  })

  it('returns null when filenameIndex is empty', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = new Map()
    config.diagnostics = []

    const result = resolveLinkMultiMode('doc1', config, 'index.md')
    expect(result).toBeNull()
  })

  it('reports diagnostics for ambiguous matches', () => {
    const config = configWithModes(['obsidianShortest'])
    config.diagnostics = []

    // Create a synthetic index with two files sharing the same basename
    config.filenameIndex = new Map([['dup', ['/a/dup.md', '/b/dup.md']]])

    const result = resolveLinkMultiMode('dup', config, 'index.md')
    expect(result).toBeNull()
    expect(config.diagnostics.length).toBe(1)
    expect(config.diagnostics[0]).toContain('Ambiguous short link "dup"')
    expect(config.diagnostics[0]).toContain('/a/dup.md')
    expect(config.diagnostics[0]).toContain('/b/dup.md')
  })

  it('does not report diagnostics for unique match', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    resolveLinkMultiMode('doc1', config, 'index.md')
    expect(config.diagnostics.length).toBe(0)
  })

  it('handles ambiguous match without diagnostics array gracefully', () => {
    const config = configWithModes(['obsidianShortest'])
    config.filenameIndex = new Map([['dup', ['/a/dup.md', '/b/dup.md']]])

    const result = resolveLinkMultiMode('dup', config, 'index.md')
    expect(result).toBeNull()
  })

  it('respects case-insensitive matching when ignoreCase is true', () => {
    const config = configWithModes(['obsidianShortest'])
    config.diagnostics = []
    config.filenameIndex = new Map([['mypage', ['/a/my-page.md']]])

    const result = resolveLinkMultiMode('MyPage', config, 'index.md')
    expect(result).toBe('/a/my-page')
  })

  it('respects case-sensitive matching when ignoreCase is false', () => {
    const configWithCase = createConfig({
      ...testConfig,
      ignoreCase: false,
      resolutionModes: ['obsidianShortest']
    })
    configWithCase.diagnostics = []
    configWithCase.filenameIndex = new Map([['MyPage', ['/a/MyPage.md']]])

    const result = resolveLinkMultiMode('MyPage', configWithCase, 'index.md')
    expect(result).toBe('/a/MyPage')

    const result2 = resolveLinkMultiMode('mypage', configWithCase, 'index.md')
    expect(result2).toBeNull()
  })
})

describe('resolveLinkMultiMode — obsidianShortest integration', () => {
  let sharedIndex: Map<string, string[]>

  beforeAll(async () => {
    const result = await buildFilenameIndex(testRoot, testConfig)
    sharedIndex = result.match(
      (idx) => idx,
      (e) => {
        throw e
      }
    )
  })

  it('falls back to obsidianShortest when earlier modes fail', () => {
    const config = configWithModes([
      'repoRoot',
      'relativeToCurrentFile',
      'obsidianShortest'
    ])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    const result = resolveLinkMultiMode('doc1', config, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('obsidianShortest placed first resolves before other modes', () => {
    const config = configWithModes(['obsidianShortest', 'repoRoot'])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    const result = resolveLinkMultiMode('doc1', config, 'index.md')
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('falls back to obsidianShortest for explicit relative paths (issue #434)', () => {
    // When the relative segment chain over-shoots / mis-targets, the basename
    // index should still rescue the link — matching Obsidian's resolution.
    const config = configWithModes([
      'relativeToCurrentFile',
      'obsidianShortest'
    ])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    const result = resolveLinkMultiMode(
      '../missing/doc1',
      config,
      'attach/test.md'
    )
    expect(result).toBe(path.resolve(testRoot, 'attach/doc1'))
  })

  it('returns null when neither relative nor obsidianShortest can resolve', () => {
    const config = configWithModes([
      'relativeToCurrentFile',
      'obsidianShortest'
    ])
    config.filenameIndex = sharedIndex
    config.diagnostics = []

    const result = resolveLinkMultiMode(
      '../missing/truly-not-anywhere',
      config,
      'attach/test.md'
    )
    expect(result).toBeNull()
  })
})

describe('buildFilenameIndex', () => {
  const tmpDir = path.resolve(testRoot, '_idx_test')

  beforeAll(async () => {
    await mkdir(path.join(tmpDir, 'sub'), { recursive: true })
    await writeFile(path.join(tmpDir, 'page-a.md'), 'a')
    await writeFile(path.join(tmpDir, 'page-b.md'), 'b')
    await writeFile(path.join(tmpDir, 'sub', 'page-b.md'), 'b2')
    await writeFile(path.join(tmpDir, 'sub', 'page-c.md'), 'c')
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('maps unique basename to single entry', async () => {
    const idxConfig = createConfig({ ...testConfig, docsDir: tmpDir })
    const index = (await buildFilenameIndex(tmpDir, idxConfig))._unsafeUnwrap()

    expect(index.get('page-a')).toEqual([path.join(tmpDir, 'page-a.md')])
    expect(index.get('page-c')).toEqual([path.join(tmpDir, 'sub', 'page-c.md')])
  })

  it('maps duplicate basename to multiple entries', async () => {
    const idxConfig = createConfig({ ...testConfig, docsDir: tmpDir })
    const index = (await buildFilenameIndex(tmpDir, idxConfig))._unsafeUnwrap()

    const entries = index.get('page-b')
    expect(entries).toHaveLength(2)
    expect(entries).toContain(path.join(tmpDir, 'page-b.md'))
    expect(entries).toContain(path.join(tmpDir, 'sub', 'page-b.md'))
  })

  it('uses lowercase keys when ignoreCase is true', async () => {
    const idxConfig = createConfig({
      ...testConfig,
      docsDir: tmpDir,
      ignoreCase: true
    })
    const index = (await buildFilenameIndex(tmpDir, idxConfig))._unsafeUnwrap()

    expect(index.has('page-a')).toBe(true)
    expect(index.has('Page-A')).toBe(false)
  })

  it('preserves original case when ignoreCase is false', async () => {
    const idxConfig = createConfig({
      ...testConfig,
      docsDir: tmpDir,
      ignoreCase: false
    })
    const index = (await buildFilenameIndex(tmpDir, idxConfig))._unsafeUnwrap()

    expect(index.has('page-a')).toBe(true)
  })

  it('skips excluded directories', async () => {
    const dir = path.join(tmpDir, '_ignored')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'hidden.md'), 'x')

    const idxConfig = createConfig({
      ...testConfig,
      docsDir: tmpDir,
      excludeDirs: [...testConfig.excludeDirs, '_ignored']
    })
    const index = (await buildFilenameIndex(tmpDir, idxConfig))._unsafeUnwrap()

    expect(index.has('hidden')).toBe(false)

    await rm(dir, { recursive: true, force: true })
  })

  it('skips files matching exclude pattern', async () => {
    await writeFile(path.join(tmpDir, 'draft-notes.md'), 'draft')

    const idxConfig = createConfig({
      ...testConfig,
      docsDir: tmpDir,
      excludeFiles: ['draft-']
    })
    const index = (await buildFilenameIndex(tmpDir, idxConfig))._unsafeUnwrap()

    expect(index.has('draft-notes')).toBe(false)
    expect(index.has('page-a')).toBe(true)
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
