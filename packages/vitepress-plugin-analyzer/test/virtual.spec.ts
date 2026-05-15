import { describe, expect, it } from 'vitest'

import {
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
  generateVirtualModuleContent
} from '../src/node/virtual'
import type { PageMetadata, SitePages } from '../types'

describe('virtual analyzer module', () => {
  it('exports stable virtual module identifiers', () => {
    expect(VIRTUAL_MODULE_ID).toBe('virtual:vitepress-analyzer')
    expect(RESOLVED_VIRTUAL_MODULE_ID).toBe('\0virtual:vitepress-analyzer')
  })

  it('serializes site metadata and pages into an importable module', () => {
    const siteMetadata: Record<string, PageMetadata> = {
      intro: {
        firstHeading: 'Intro',
        outgoingLinks: [
          {
            text: 'Guide',
            relativePath: 'guide',
            absolutePath: '/docs/guide.md',
            fullUrl: '/guide',
            raw: '[Guide](./guide.md)',
            type: 'markdown'
          }
        ],
        backLinks: [],
        wordCount: 12,
        lastUpdated: 123
      }
    }
    const sitePages: SitePages = {
      intro: {
        absolutePath: '/docs/intro.md',
        relativePath: 'intro',
        metadata: siteMetadata.intro
      }
    }

    const content = generateVirtualModuleContent(siteMetadata, sitePages)

    expect(content).toContain('export const siteMetadata = {')
    expect(content).toContain('export const sitePages = {')
    expect(content).toContain('"firstHeading": "Intro"')
    expect(content).toContain('"relativePath": "guide"')
    expect(content).toContain('"absolutePath": "/docs/intro.md"')
  })
})
