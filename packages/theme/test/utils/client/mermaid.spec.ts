/**
 * @vitest-environment jsdom
 */
import { renderMermaidASCII } from 'beautiful-mermaid'
import mermaid from 'mermaid'
import { describe, expect, it, vi } from 'vitest'

import { init } from '../../../src/utils/client/mermaid'

vi.mock('beautiful-mermaid', () => ({
  renderMermaidASCII: vi.fn(() => '+---+ +---+\n| A | | B |\n+---+ +---+')
}))

vi.mock('mermaid', () => {
  const registerExternalDiagrams = vi.fn()
  const initialize = vi.fn()
  const render = vi.fn()

  return {
    default: {
      registerExternalDiagrams,
      initialize,
      render
    },
    registerExternalDiagrams,
    initialize,
    render
  }
})

describe('init', () => {
  it('calls registerExternalDiagrams when available', async () => {
    const diagrams = [{ id: 'test', detector: () => false } as any]
    await init(diagrams)

    expect(mermaid.registerExternalDiagrams).toHaveBeenCalledWith(diagrams)
  })

  it('handles errors from registerExternalDiagrams gracefully', async () => {
    ;(mermaid.registerExternalDiagrams as any).mockRejectedValueOnce(
      new Error('Register failed')
    )

    await init([{ id: 'bad', detector: () => false } as any])
  })

  it('skips call when registerExternalDiagrams is falsy', async () => {
    const original = (mermaid as any).registerExternalDiagrams
    delete (mermaid as any).registerExternalDiagrams

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { init: initFresh } =
      await import('../../../src/utils/client/mermaid')
    await initFresh([])

    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
    ;(mermaid as any).registerExternalDiagrams = original
  })
})

describe('selectMermaidRenderer', () => {
  it.each([
    ['graph TD\nA-->B'],
    ['flowchart LR\nA-->B'],
    ['stateDiagram-v2\n[*] --> Idle'],
    ['sequenceDiagram\nAlice->>Bob: Hi'],
    ['classDiagram\nAnimal <|-- Duck'],
    ['erDiagram\nCUSTOMER ||--o{ ORDER : places'],
    ['xychart-beta\nx-axis [A, B]\nbar [1, 2]'],
    ['%% comment\nflowchart TD\nA-->B']
  ])('uses ascii renderer for supported diagrams', async (code) => {
    const { selectMermaidRenderer } =
      await import('../../../src/utils/client/mermaid')

    expect(selectMermaidRenderer(code)).toBe('ascii')
  })

  it.each([
    ['gantt\ntitle Roadmap'],
    ['pie\ntitle Pets'],
    ['mindmap\n  root((mindmap))'],
    ['timeline\ntitle History'],
    ['journey\ntitle User journey'],
    ['']
  ])('uses mermaid for unsupported diagrams', async (code) => {
    const { selectMermaidRenderer } =
      await import('../../../src/utils/client/mermaid')

    expect(selectMermaidRenderer(code)).toBe('mermaid')
  })
})

describe('render', () => {
  it('renders supported diagrams as ascii text', async () => {
    const { render: testRender } =
      await import('../../../src/utils/client/mermaid')
    const result = await testRender('test-id', 'graph TD\nA-->B')

    expect(result).toEqual({
      type: 'ascii',
      content: '+---+ +---+\n| A | | B |\n+---+ +---+'
    })
    expect(renderMermaidASCII).toHaveBeenCalledWith('graph TD\nA-->B', {
      useAscii: true,
      colorMode: 'none'
    })
    expect(mermaid.initialize).not.toHaveBeenCalled()
  })

  it('renders unsupported diagrams with mermaid svg', async () => {
    ;(mermaid.render as any).mockResolvedValueOnce({
      svg: '<svg>mermaid</svg>'
    })

    const { render: testRender } =
      await import('../../../src/utils/client/mermaid')
    const result = await testRender('test-id', 'gantt\ntitle Roadmap', {
      theme: 'dark'
    } as any)

    expect(result).toEqual({ type: 'svg', content: '<svg>mermaid</svg>' })
    expect(mermaid.initialize).toHaveBeenCalledWith({ theme: 'dark' })
    expect(mermaid.render).toHaveBeenCalledWith(
      'test-id',
      'gantt\ntitle Roadmap'
    )
  })
})
