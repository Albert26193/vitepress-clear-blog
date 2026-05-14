import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  safeReadFile,
  safeReaddir,
  toAnalyzerError
} from '../src/node/utils/safeIO'

describe('toAnalyzerError', () => {
  it('extracts message from Error instance', () => {
    const err = toAnalyzerError('FILE_READ', '/a', new Error('boom'))
    expect(err.message).toBe('boom')
  })

  it('stringifies non-Error rejections', () => {
    const err = toAnalyzerError('DIR_READ', '/b', 'raw string')
    expect(err.message).toBe('raw string')
  })
})

describe('safeIO', () => {
  describe('safeReadFile', () => {
    it('returns Ok with file content for valid file', async () => {
      const result = await safeReadFile(resolve(__dirname, 'attach', 'doc1.md'))

      expect(result.isOk()).toBe(true)
      result.match(
        (content) => expect(content).toContain('#'),
        () => {
          throw new Error('expected Ok')
        }
      )
    })

    it('returns Err for nonexistent file', async () => {
      const result = await safeReadFile('/nonexistent/file-12345.md')

      expect(result.isErr()).toBe(true)
      result.match(
        () => {
          throw new Error('expected Err')
        },
        (error) => {
          expect(error.type).toBe('FILE_READ')
          expect(error.path).toBe('/nonexistent/file-12345.md')
        }
      )
    })
  })

  describe('safeReaddir', () => {
    it('returns Ok with entries for valid directory', async () => {
      const result = await safeReaddir(resolve(__dirname))

      expect(result.isOk()).toBe(true)
      result.match(
        (entries) => expect(entries.length).toBeGreaterThan(0),
        () => {
          throw new Error('expected Ok')
        }
      )
    })

    it('returns Err for nonexistent directory', async () => {
      const result = await safeReaddir('/nonexistent/dir-12345')

      expect(result.isErr()).toBe(true)
      result.match(
        () => {
          throw new Error('expected Err')
        },
        (error) => {
          expect(error.type).toBe('DIR_READ')
          expect(error.path).toBe('/nonexistent/dir-12345')
        }
      )
    })
  })
})
