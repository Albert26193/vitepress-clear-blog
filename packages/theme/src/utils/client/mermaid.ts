import { type RenderOptions, renderMermaidSVG } from 'beautiful-mermaid'
import mermaid, {
  type ExternalDiagramDefinition,
  type MermaidConfig
} from 'mermaid'

type MermaidRenderer = 'beautiful' | 'mermaid'

const BEAUTIFUL_MERMAID_OPTIONS: RenderOptions = {
  bg: 'var(--vp-c-bg)',
  fg: 'var(--vp-c-text-1)',
  accent: 'var(--vp-c-brand-1)',
  transparent: true
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

  if (/^(graph|flowchart)\s+(TD|TB|LR|BT|RL)\b/i.test(firstLine))
    return 'beautiful'

  if (/^stateDiagram(-v2)?\b/i.test(firstLine)) return 'beautiful'
  if (/^sequenceDiagram\b/i.test(firstLine)) return 'beautiful'
  if (/^classDiagram\b/i.test(firstLine)) return 'beautiful'
  if (/^erDiagram\b/i.test(firstLine)) return 'beautiful'
  if (/^xychart(-beta)?\b/i.test(firstLine)) return 'beautiful'

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
): Promise<string> => {
  mermaid.initialize(config)
  const { svg } = await mermaid.render(id, code)
  return svg
}

const render = async (
  id: string,
  code: string,
  config: MermaidConfig = { startOnLoad: false }
): Promise<string> => {
  if (selectMermaidRenderer(code) === 'beautiful') {
    return renderMermaidSVG(code, BEAUTIFUL_MERMAID_OPTIONS)
  }

  return renderWithMermaid(id, code, config)
}

export { init, render, selectMermaidRenderer }
export type { MermaidRenderer }
