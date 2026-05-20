// @vitest-environment node
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_FIELDS,
  DEFAULT_FORMATS,
  DEFAULT_OUTPUT,
  _resetDatetimeConfig,
  normalizePostDate,
  resolveDate
} from '../../../src/utils/node/datetime'

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}))

describe('resolveDate', () => {
  describe('default behavior (no datetime config)', () => {
    it('normalizes a standard YYYY-MM-DD date', () => {
      expect(resolveDate({ date: '2024-01-15' })).toBe('2024-01-15')
    })

    it('rejects a non-date field', () => {
      expect(resolveDate({ title: 'Hello' })).toBeUndefined()
    })

    it('rejects empty date string', () => {
      expect(resolveDate({ date: '' })).toBeUndefined()
      expect(resolveDate({ date: '   ' })).toBeUndefined()
    })

    it('rejects missing date field', () => {
      expect(resolveDate({})).toBeUndefined()
    })

    it('rejects null/undefined date', () => {
      expect(resolveDate({ date: null })).toBeUndefined()
      expect(resolveDate({ date: undefined })).toBeUndefined()
    })

    it('falls back to new Date() for unrecognized format', () => {
      const result = resolveDate({ date: 'Jan 15, 2024' })
      expect(result).toBe('2024-01-15')
    })

    it('normalizes a Date object (VitePress frontmatter may produce these)', () => {
      expect(resolveDate({ date: new Date('2024-01-15') })).toBe('2024-01-15')
    })

    it('normalizes a Date object with time component', () => {
      expect(resolveDate({ date: new Date('2024-06-15T12:30:00Z') })).toBe(
        '2024-06-15'
      )
    })
  })

  describe('frontmatter field priority', () => {
    it('uses date field by default', () => {
      expect(resolveDate({ date: '2024-06-01' })).toBe('2024-06-01')
    })

    it('falls through to next field when date is missing', () => {
      const config = { frontmatterFields: ['date', 'createDate'] }
      expect(resolveDate({ createDate: '2024-06-01' }, config)).toBe(
        '2024-06-01'
      )
    })

    it('picks the first non-empty field', () => {
      const config = {
        frontmatterFields: ['modifiedDate', 'createDate', 'date']
      }
      expect(
        resolveDate(
          { date: '2024-01-01', createDate: '2024-06-15', modifiedDate: '' },
          config
        )
      ).toBe('2024-06-15')
    })

    it('skips empty strings in field list', () => {
      const config = { frontmatterFields: ['createDate', 'date'] }
      expect(resolveDate({ date: '2024-12-31', createDate: '' }, config)).toBe(
        '2024-12-31'
      )
    })

    it('returns undefined when no configured field exists', () => {
      const config = { frontmatterFields: ['createDate', 'modifiedDate'] }
      expect(resolveDate({ date: '2024-01-01' }, config)).toBeUndefined()
    })
  })

  describe('format priority', () => {
    it('parses YYYY/MM/DD when configured', () => {
      const config = { formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }
      expect(resolveDate({ date: '2024/03/15' }, config)).toBe('2024-03-15')
    })

    it('parses ISO datetime when configured', () => {
      const config = { formats: ['YYYY-MM-DDTHH:mm:ssZ'] }
      expect(resolveDate({ date: '2024-06-15T10:30:00Z' }, config)).toBe(
        '2024-06-15'
      )
    })

    it('parses YYYY-MM-DD HH:mm when configured', () => {
      const config = { formats: ['YYYY-MM-DD HH:mm'] }
      expect(resolveDate({ date: '2024-06-15 10:30' }, config)).toBe(
        '2024-06-15'
      )
    })

    it('tries formats in order — first match wins', () => {
      const config = { formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }
      expect(resolveDate({ date: '2024-06-15' }, config)).toBe('2024-06-15')
    })

    it('falls back to new Date() when no format matches', () => {
      const config = { formats: ['YYYY/MM/DD'] }
      expect(resolveDate({ date: '2024-06-15' }, config)).toBe('2024-06-15')
    })

    it('returns undefined for completely unparseable input', () => {
      expect(resolveDate({ date: 'not a date at all' })).toBeUndefined()
    })
  })

  describe('combined config', () => {
    it('uses custom field and custom format together', () => {
      const config = {
        frontmatterFields: ['createDate'],
        formats: ['YYYY/MM/DD']
      }
      expect(
        resolveDate({ date: '2024-01-01', createDate: '2024/06/15' }, config)
      ).toBe('2024-06-15')
    })

    it('normalizes to YYYY-MM-DD regardless of source format', () => {
      const config = {
        frontmatterFields: ['date'],
        formats: ['YYYY/MM/DD', 'YYYY-MM-DD HH:mm']
      }
      expect(resolveDate({ date: '2024/03/20' }, config)).toBe('2024-03-20')
      expect(resolveDate({ date: '2024-03-20 14:30' }, config)).toBe(
        '2024-03-20'
      )
    })
  })

  describe('DEFAULT constants', () => {
    it('exports expected defaults', () => {
      expect(DEFAULT_FIELDS).toEqual(['date'])
      expect(DEFAULT_FORMATS).toEqual(['YYYY-MM-DD'])
      expect(DEFAULT_OUTPUT).toBe('YYYY-MM-DD')
    })
  })
})

describe('normalizePostDate', () => {
  beforeEach(() => {
    _resetDatetimeConfig()
    vi.clearAllMocks()
  })

  it('falls back to defaults when config.toml is unreadable', () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(normalizePostDate({ date: '2024-01-15' })).toBe('2024-01-15')
  })

  it('reads datetime config from config.toml and applies custom field', () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["createDate", "date"]\nformats = ["YYYY/MM/DD"]'
    )
    const result = normalizePostDate({
      date: '2024-01-01',
      createDate: '2024/06/15'
    })
    expect(result).toBe('2024-06-15')
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.vitepress/config.toml'),
      'utf-8'
    )
  })

  it('uses cached config on subsequent calls', () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nformats = ["YYYY/MM/DD"]'
    )
    // First call reads and caches
    normalizePostDate({ date: '2024/06/15' })
    // Second call hits cache — readFileSync not called again
    normalizePostDate({ date: '2024/03/20' })
    expect(readFileSync).toHaveBeenCalledTimes(1)
  })
})
