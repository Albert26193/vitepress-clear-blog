import { type AsciiRenderOptions, renderMermaidASCII } from 'beautiful-mermaid'
import mermaid, {
  type ExternalDiagramDefinition,
  type MermaidConfig
} from 'mermaid'

type MermaidRenderer = 'ascii' | 'mermaid'

type MermaidRenderResult =
  | { type: 'ascii'; content: string }
  | { type: 'svg'; content: string }

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

const init = async (externalDiagrams: ExternalDiagramDefinition[]) => {
  try {
    if (mermaid.registerExternalDiagrams)
      await mermaid.registerExternalDiagrams(externalDiagrams)
  } catch {
    return
  }
}

const renderWithMermaid = async (
  id: string,
  code: string,
  config: MermaidConfig
): Promise<MermaidRenderResult> => {
  mermaid.initialize(config)
  const { svg } = await mermaid.render(id, code)
  return { type: 'svg', content: svg }
}

const render = async (
  id: string,
  code: string,
  config: MermaidConfig = { startOnLoad: false }
): Promise<MermaidRenderResult> => {
  if (selectMermaidRenderer(code) === 'ascii') {
    return {
      type: 'ascii',
      content: renderMermaidASCII(code, BEAUTIFUL_MERMAID_ASCII_OPTIONS)
    }
  }

  return renderWithMermaid(id, code, config)
}

export { init, render, selectMermaidRenderer }
export type { MermaidRenderer, MermaidRenderResult }
