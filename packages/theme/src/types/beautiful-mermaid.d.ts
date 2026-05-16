declare module 'beautiful-mermaid/ascii' {
  interface AsciiRenderOptions {
    useAscii?: boolean
    paddingX?: number
    paddingY?: number
    boxBorderPadding?: number
    colorMode?: string
    theme?: Record<string, unknown>
  }

  export function renderMermaidASCII(
    text: string,
    options?: AsciiRenderOptions
  ): string

  export type { AsciiRenderOptions }
}
