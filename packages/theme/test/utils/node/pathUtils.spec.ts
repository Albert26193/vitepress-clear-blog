// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { getRootPath, getSrcPath } from '../../../src/utils/node/pathUtils'

describe('getRootPath', () => {
  it('returns process.cwd()', () => {
    const result = getRootPath()
    expect(result).toBe(process.cwd())
  })

  it('returns an absolute path', () => {
    const result = getRootPath()
    expect(result.startsWith('/')).toBe(true)
  })

  it('is consistent across calls', () => {
    const first = getRootPath()
    const second = getRootPath()
    expect(first).toBe(second)
  })
})

describe('getSrcPath', () => {
  it('returns cwd/src by default', () => {
    const result = getSrcPath()
    expect(result).toBe(`${process.cwd()}/src`)
  })

  it('accepts custom src name', () => {
    const result = getSrcPath('customSrc')
    expect(result).toBe(`${process.cwd()}/customSrc`)
  })

  it('accepts empty string as src name', () => {
    const result = getSrcPath('')
    expect(result).toBe(`${process.cwd()}/`)
  })

  it('accepts multi-segment path', () => {
    const result = getSrcPath('path/to/code')
    expect(result).toBe(`${process.cwd()}/path/to/code`)
  })

  it('returns a path starting with rootPath', () => {
    const result = getSrcPath('lib')
    expect(result.startsWith(getRootPath())).toBe(true)
  })
})
