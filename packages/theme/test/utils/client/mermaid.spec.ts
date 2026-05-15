/**
 * @vitest-environment jsdom
 */
import mermaid from 'mermaid'
import { describe, expect, it, vi } from 'vitest'

import { init } from '../../../src/utils/client/mermaid'

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

    // Returns silently without throwing
  })

  it('skips call when registerExternalDiagrams is falsy', async () => {
    const original = (mermaid as any).registerExternalDiagrams
    delete (mermaid as any).registerExternalDiagrams

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { init: initFresh } =
      await import('../../../src/utils/client/mermaid')
    await initFresh([])

    // Should not throw and should not log errors (falsy branch is taken)
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
    ;(mermaid as any).registerExternalDiagrams = original
  })
})

describe('render (mocked)', () => {
  it('initializes mermaid and returns SVG', async () => {
    ;(mermaid.render as any).mockResolvedValueOnce({ svg: '<svg>test</svg>' })

    const { render: testRender } =
      await import('../../../src/utils/client/mermaid')
    const result = await testRender('test-id', 'graph TD; A-->B;', {})

    expect(result).toBe('<svg>test</svg>')
    expect(mermaid.initialize).toHaveBeenCalledWith({})
    expect(mermaid.render).toHaveBeenCalledWith('test-id', 'graph TD; A-->B;')
  })

  it('passes custom config to mermaid.initialize', async () => {
    ;(mermaid.render as any).mockResolvedValueOnce({
      svg: '<svg>custom</svg>'
    })

    const { render: testRender } =
      await import('../../../src/utils/client/mermaid')
    await testRender('custom-id', 'flowchart LR\nA-->B', {
      theme: 'dark'
    } as any)

    expect(mermaid.initialize).toHaveBeenCalledWith({ theme: 'dark' })
  })
})
