// copy from https://github.com/emersonbottero/vitepress-plugin-mermaid/blob/main/src/mermaid.ts

import mermaid, { ExternalDiagramDefinition, MermaidConfig } from "mermaid";

const init = async (externalDiagrams: ExternalDiagramDefinition[]) => {
  try {
    if (mermaid.registerExternalDiagrams)
      await mermaid.registerExternalDiagrams(externalDiagrams);
  } catch (e) {
    console.error(e);
  }
};

const render = async (
  id: string,
  code: string,
  config: MermaidConfig
): Promise<string> => {
  // await init;
  mermaid.initialize(config);
  const { svg } = await mermaid.render(id, code);
  return svg;
};

export { init, render }