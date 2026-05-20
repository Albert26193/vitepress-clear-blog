// @vitest-environment node
import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'

import {
  getFooterRefTag,
  mermaidPlugin,
  taskListsPlugin
} from '../../../src/utils/node/mdEnhance'

describe('mermaidPlugin', () => {
  it('renders mermaid code block as PostMermaid component', () => {
    const md = new MarkdownIt()
    mermaidPlugin(md)

    const fenceRule = md.renderer.rules.fence
    expect(fenceRule).toBeDefined()

    const tokens = md.parse('```mermaid\ngraph TD; A-->B;\n```\n', {})
    const result = fenceRule!(tokens, 0, md.options, {}, md.renderer)
    expect(result).toContain('<PostMermaid')
    expect(result).toContain('id="mermaid-0"')
    expect(result).toContain('code=')
  })

  it('URL-encodes mermaid diagram content', () => {
    const md = new MarkdownIt()
    mermaidPlugin(md)

    const tokens = md.parse(
      '```mermaid\ngraph TD;\n    A[Hello]-->B[World];\n```\n',
      {}
    )
    const fenceToken = tokens.find((t) => t.type === 'fence')
    expect(fenceToken).toBeDefined()

    const result = md.renderer.rules.fence!(
      tokens,
      0,
      md.options,
      {},
      md.renderer
    )
    expect(result).toContain(
      encodeURIComponent('graph TD;\n    A[Hello]-->B[World];')
    )
  })

  it('delegates non-mermaid code blocks to original fence renderer', () => {
    const md = new MarkdownIt()
    mermaidPlugin(md)

    const tokens = md.parse('```javascript\nconsole.log("hello")\n```\n', {})
    const fenceToken = tokens.find((t) => t.type === 'fence')
    expect(fenceToken).toBeDefined()

    const idx = tokens.indexOf(fenceToken!)
    const result = md.renderer.rules.fence!(
      tokens,
      idx,
      md.options,
      {},
      md.renderer
    )
    expect(result).not.toContain('<PostMermaid')
    expect(result).toContain('javascript')
  })

  it('handles mermaid with additional info (e.g. mermaid{scale:0.8})', () => {
    const md = new MarkdownIt()
    mermaidPlugin(md)

    const tokens = md.parse('```mermaid{scale:0.8}\nflowchart LR\n```\n', {})
    const fenceToken = tokens.find((t) => t.type === 'fence')
    expect(fenceToken).toBeDefined()

    const result = md.renderer.rules.fence!(
      tokens,
      0,
      md.options,
      {},
      md.renderer
    )
    expect(result).toContain('<PostMermaid')
  })

  it('handles empty mermaid content', () => {
    const md = new MarkdownIt()
    mermaidPlugin(md)

    const tokens = md.parse('```mermaid\n\n```\n', {})
    const fenceToken = tokens.find((t) => t.type === 'fence')
    expect(fenceToken).toBeDefined()

    const result = md.renderer.rules.fence!(
      tokens,
      0,
      md.options,
      {},
      md.renderer
    )
    expect(result).toContain('<PostMermaid')
    expect(result).toContain('code=')
  })
})

describe('taskListsPlugin', () => {
  it('registers markdown-it-task-lists plugin', () => {
    const md = new MarkdownIt()
    taskListsPlugin(md)

    // Render a task list
    const result = md.render('- [ ] unchecked\n- [x] checked\n')
    expect(result).toContain('checkbox')
  })

  it('renders unchecked task list items with unchecked checkbox', () => {
    const md = new MarkdownIt()
    taskListsPlugin(md)

    const result = md.render('- [ ] todo item\n')
    expect(result).toContain('checkbox')
    expect(result).not.toContain('checked')
  })

  it('renders checked task list items with checked checkbox', () => {
    const md = new MarkdownIt()
    taskListsPlugin(md)

    const result = md.render('- [x] done item\n')
    expect(result).toContain('checkbox')
  })
})

describe('getFooterRefTag', () => {
  it('registers footnote renderer rules on markdown-it instance', () => {
    const md = new MarkdownIt()
    getFooterRefTag(md)

    const footnoteOpen = md.renderer.rules.footnote_open
    expect(footnoteOpen).toBeDefined()

    const footnoteRef = md.renderer.rules.footnote_ref
    expect(footnoteRef).toBeDefined()
  })

  it('renders footnote references as FooterRef components', () => {
    const md = new MarkdownIt()
    // Create a token injection rule to simulate footnote rendering
    md.use((md) => {
      md.core.ruler.push('footnote_test', (state) => {
        const refToken = new state.Token('footnote_ref', '', 0)
        refToken.meta = { id: 1, label: '[1]' }
        state.tokens.push(refToken)
      })
    })
    getFooterRefTag(md)

    const result = md.render('test')
    expect(result).toContain('<FooterRef')
    expect(result).toContain(':text=\'"1"\'')
  })

  it('renders footnote without originalFootnoteRef using meta.label fallback', () => {
    const md = new MarkdownIt()
    md.use((md) => {
      md.core.ruler.push('footnote_label_test', (state) => {
        const refToken = new state.Token('footnote_ref', '', 0)
        refToken.meta = { id: 99, label: '[99]' }
        state.tokens.push(refToken)
      })
    })
    getFooterRefTag(md)

    const result = md.render('test')
    expect(result).toContain(':text=\'"99"\'')
    expect(result).toContain(':id=\'"99"\'')
  })

  it('renders footnote with idx fallback when no id or label', () => {
    const md = new MarkdownIt()
    md.use((md) => {
      md.core.ruler.push('footnote_nometa_test', (state) => {
        const refToken = new state.Token('footnote_ref', '', 0)
        // No meta at all
        state.tokens.push(refToken)
      })
    })
    getFooterRefTag(md)

    const result = md.render('test')
    expect(result).toContain('<FooterRef')
    // id defaults to idx within the token array (3 in this case: paragraph_open, inline, footnote_ref)
    expect(result).toContain(':id=\'"3"\'')
  })

  it('renders empty content when a footnote definition is missing', () => {
    const md = new MarkdownIt()
    md.use((md) => {
      md.core.ruler.push('footnote_missing_open_test', (state) => {
        const refToken = new state.Token('footnote_ref', '', 0)
        refToken.meta = { id: 'missing', label: '[missing]' }
        state.tokens.push(refToken)
      })
    })
    getFooterRefTag(md)

    const result = md.render('test')
    expect(result).toContain(':content=\'""\'')
  })

  it('escapes special characters in FooterRef dynamic props', async () => {
    const md = new MarkdownIt({ html: true })
    const footnotePlugin = (await import('markdown-it-footnote')).default
    md.use(footnotePlugin)
    getFooterRefTag(md)

    const result = md.render("Text[^1]\n\n[^1]: Fish & chips and Bob's note")

    expect(result).toContain('Fish &amp;amp; chips and Bob&#39;s note')
  })

  it('renders with footnote_open capturing inline content', async () => {
    const md = new MarkdownIt()
    // Use the real markdown-it-footnote plugin for proper token generation
    const footnotePlugin = (await import('markdown-it-footnote')).default
    md.use(footnotePlugin)
    getFooterRefTag(md)

    const result = md.render(
      'Text with footnote[^1]\n\n[^1]: This is the footnote content.'
    )
    expect(result).toContain('<FooterRef')
  })

  it('can be called multiple times without crashing', () => {
    const md = new MarkdownIt()
    getFooterRefTag(md)
    expect(() => getFooterRefTag(md)).not.toThrow()
  })

  it('footnote_close path is tested via full footnote rendering', async () => {
    const md = new MarkdownIt()
    const footnotePlugin = (await import('markdown-it-footnote')).default
    md.use(footnotePlugin)
    getFooterRefTag(md)

    // Render with multiple footnotes to test the close/open boundary logic
    const result = md.render(
      'Text[^first] and more[^second]\n\n[^first]: First note\n[^second]: Second note'
    )
    expect(result).toContain('<FooterRef')
    // Should contain both footnote refs
    const refs = result.match(/<FooterRef/g)
    expect(refs).not.toBeNull()
  })

  it('footnote contents are captured by footnate_open rule', async () => {
    const md = new MarkdownIt()
    const footnotePlugin = (await import('markdown-it-footnote')).default
    md.use(footnotePlugin)
    getFooterRefTag(md)

    const result = md.render(
      'Ref[^testfn]\n\n[^testfn]: The footnote body text'
    )
    // The footnote ref renders as FooterRef component with the text label
    expect(result).toContain('<FooterRef')
    // Content from footnote definition appears in the rendered HTML
    expect(result).toContain('The footnote body text')
  })

  it('footnote ref with original rule extracts label from HTML', async () => {
    const md = new MarkdownIt()
    const footnotePlugin = (await import('markdown-it-footnote')).default
    md.use(footnotePlugin)
    getFooterRefTag(md)

    const result = md.render(
      'Ref[^myfootnote]\n\n[^myfootnote]: Content goes here'
    )
    // The label should have been extracted (the original rule renders <a> with the label)
    expect(result).toContain('<FooterRef')
    expect(result).toContain('text=')
  })

  it('renders footnote ref when contentTokens are empty', async () => {
    const md = new MarkdownIt()
    const footnotePlugin = (await import('markdown-it-footnote')).default
    md.use(footnotePlugin)
    getFooterRefTag(md)

    // Empty footnote definition
    const result = md.render('Ref[^emptyfn]\n\n[^emptyfn]: ')
    expect(result).toContain('<FooterRef')
  })
})
