// copy from https://github.com/emersonbottero/vitepress-plugin-mermaid/blob/main/src/mermaid.ts
import mermaid, { ExternalDiagramDefinition, MermaidConfig } from 'mermaid'

/**
 * Registers Mermaid external diagrams before rendering content that depends on custom syntax.
 *
 * @param externalDiagrams - External diagram definitions to register with Mermaid.
 * @returns Nothing once Mermaid has attempted registration.
 */
const init = async (externalDiagrams: ExternalDiagramDefinition[]) => {
  try {
    if (mermaid.registerExternalDiagrams)
      await mermaid.registerExternalDiagrams(externalDiagrams)
  } catch {
    return
  }
}

/**
 * Renders Mermaid code to SVG so Markdown diagrams can be embedded as static image data.
 *
 * @param id - Stable render id required by Mermaid.
 * @param code - Mermaid source code to render.
 * @param config - Mermaid configuration for the current render pass.
 * @returns Rendered SVG markup.
 */
const render = async (
  id: string,
  code: string,
  config: MermaidConfig
): Promise<string> => {
  // await init;
  mermaid.initialize(config)
  const { svg } = await mermaid.render(id, code)
  return svg
}

export { init, render }
