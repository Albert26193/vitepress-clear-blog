import type { AsciiRenderOptions } from 'beautiful-mermaid'
import type { ExternalDiagramDefinition, MermaidConfig } from 'mermaid'

type MermaidRenderer = 'ascii' | 'beautiful-svg' | 'mermaid'
type MermaidRenderMode = 'auto' | 'ascii' | 'svg'

type MermaidRenderErrorCode = 'MERMAID_RENDER_FAILED'

type MermaidRenderResult =
  | { type: 'ascii'; content: string }
  | { type: 'svg'; content: string }
  | { type: 'error'; code: MermaidRenderErrorCode; message: string }

const BEAUTIFUL_MERMAID_ASCII_OPTIONS: AsciiRenderOptions = {
  useAscii: true,
  colorMode: 'none'
}

const getFirstMermaidLine = (code: string): string => {
  return (
    code
      .split(/[\n;]/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith('%%')) || ''
  )
}

const selectMermaidRenderer = (code: string): MermaidRenderer => {
  const firstLine = getFirstMermaidLine(code)

  if (/^(graph|flowchart)\s+(TD|TB|LR|BT|RL)\b/i.test(firstLine)) return 'ascii'

  if (/^stateDiagram(-v2)?\b/i.test(firstLine)) return 'ascii'
  if (/^sequenceDiagram\b/i.test(firstLine)) return 'ascii'
  if (/^classDiagram\b/i.test(firstLine)) return 'ascii'
  if (/^erDiagram\b/i.test(firstLine)) return 'ascii'
  if (/^xychart(-beta)?\b/i.test(firstLine)) return 'ascii'

  return 'mermaid'
}

const resolveMermaidRenderer = (
  code: string,
  mode: MermaidRenderMode
): MermaidRenderer => {
  if (mode === 'ascii') return 'ascii'
  if (mode === 'svg') {
    return selectMermaidRenderer(code) === 'ascii' ? 'beautiful-svg' : 'mermaid'
  }

  return selectMermaidRenderer(code)
}

const init = async (externalDiagrams: ExternalDiagramDefinition[]) => {
  try {
    const mermaid = await import('mermaid')
    if (mermaid.default.registerExternalDiagrams)
      await mermaid.default.registerExternalDiagrams(externalDiagrams)
  } catch {
    return
  }
}

const isMermaidErrorSvg = (svg: string): boolean => {
  return (
    /class=(['"])(?:[^'"]*\s)?error-(?:icon|text)(?:\s[^'"]*)?\1/u.test(svg) ||
    svg.includes('Syntax error in text') ||
    svg.includes('mermaid version')
  )
}

const toSvgRenderResult = (svg: string): MermaidRenderResult => {
  if (isMermaidErrorSvg(svg)) {
    return {
      type: 'error',
      code: 'MERMAID_RENDER_FAILED',
      message: 'Mermaid returned an error SVG'
    }
  }

  return { type: 'svg', content: svg }
}

const cleanupMermaidRenderContainer = (id: string): void => {
  document.getElementById(`d${id}`)?.remove()
}

const renderWithBeautifulMermaidSvg = async (
  code: string
): Promise<MermaidRenderResult> => {
  const { renderMermaidSVG } = await import('beautiful-mermaid')
  return toSvgRenderResult(renderMermaidSVG(code))
}

const renderWithMermaid = async (
  id: string,
  code: string,
  config: MermaidConfig
): Promise<MermaidRenderResult> => {
  const mermaid = await import('mermaid')
  mermaid.default.initialize(config)
  return mermaid.default
    .render(id, code)
    .then(({ svg }) => {
      cleanupMermaidRenderContainer(id)
      return toSvgRenderResult(svg)
    })
    .catch((error) => {
      cleanupMermaidRenderContainer(id)
      return {
        type: 'error',
        code: 'MERMAID_RENDER_FAILED',
        message:
          error instanceof Error ? error.message : 'Mermaid render failed'
      }
    })
}

const render = async (
  id: string,
  code: string,
  config: MermaidConfig = { startOnLoad: false },
  mode: MermaidRenderMode = 'auto'
): Promise<MermaidRenderResult> => {
  const renderer = resolveMermaidRenderer(code, mode)

  if (renderer === 'ascii') {
    const { renderMermaidASCII } = await import('beautiful-mermaid')
    return {
      type: 'ascii',
      content: renderMermaidASCII(code, BEAUTIFUL_MERMAID_ASCII_OPTIONS)
    }
  }

  if (renderer === 'beautiful-svg') return renderWithBeautifulMermaidSvg(code)

  return renderWithMermaid(id, code, config)
}

export { init, render, selectMermaidRenderer }
export type { MermaidRenderer, MermaidRenderMode, MermaidRenderResult }
