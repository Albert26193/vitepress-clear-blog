import { describe, expect, it } from 'vitest'

import { clampToVaultPath } from '../../../src/utils/shared/path'

describe('clampToVaultPath', () => {
  it('resolves a relative target against the current file directory', () => {
    expect(clampToVaultPath('../doc', 'a/b/current')).toBe('/a/doc')
  })

  it('clamps overshooting `..` to the vault root instead of escaping', () => {
    // From a 3-level file, 10 `../` would escape the root with path.resolve;
    // here it is clamped to root and stays vault-absolute.
    const overshoot = '../'.repeat(10) + 'blogs/guide'
    expect(clampToVaultPath(overshoot, 'a/b/c/page')).toBe('/blogs/guide')
  })

  it('always returns a vault-absolute path (leading slash)', () => {
    expect(clampToVaultPath('sibling', 'a/b/current').startsWith('/')).toBe(
      true
    )
    expect(clampToVaultPath('../../x', 'a/b/current').startsWith('/')).toBe(
      true
    )
  })

  it('treats leading-slash targets as vault-absolute', () => {
    expect(clampToVaultPath('/about', 'a/b/deep/current')).toBe('/about')
  })

  it('preserves a hash suffix', () => {
    expect(clampToVaultPath('../guide#section', 'a/b/current')).toBe(
      '/a/guide#section'
    )
  })

  it('preserves a query suffix', () => {
    expect(clampToVaultPath('guide?x=1', 'a/current')).toBe('/a/guide?x=1')
  })

  it('ignores `.` segments', () => {
    expect(clampToVaultPath('./guide', 'a/b/current')).toBe('/a/b/guide')
  })

  it('handles a root-level current file', () => {
    expect(clampToVaultPath('guide', 'index')).toBe('/guide')
  })
})
