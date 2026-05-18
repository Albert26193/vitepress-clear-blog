<template>
  <div class="mermaid-diagram">
    <pre
      v-if="asciiContent"
      class="mermaid-ascii"
      :aria-label="diagramLabel"
    ><code>{{ asciiContent }}</code></pre>
    <img
      v-else-if="imgSrc"
      class="mermaid-img"
      :src="imgSrc"
      :alt="diagramLabel"
      :width="svgWidth || undefined"
      :height="svgHeight || undefined"
    />
  </div>
</template>

<script setup lang="ts">
  import { type PropType, computed, onMounted, shallowRef } from 'vue'

  import { type MermaidRenderResult, render } from '../../utils/client/mermaid'

  interface SvgDimensions {
    width: number | null
    height: number | null
  }

  const props = defineProps({
    /**
     * Stable Mermaid render id used to keep generated SVG ids unique on the page.
     */
    id: {
      type: String as PropType<string>,
      required: true
    },
    /**
     * URL-encoded Mermaid source passed from the Markdown fence renderer.
     */
    code: {
      type: String as PropType<string>,
      required: true
    }
  })

  const parseSize = (size: string | number | null): number | null => {
    if (typeof size === 'number')
      return Number.isFinite(size) && size > 0 ? size : null
    if (!size || size.trim().endsWith('%')) return null

    const parsed = Number.parseFloat(size.replace('px', ''))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  const extractSvgDimensions = (svgString: string): SvgDimensions => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (!svgElement) {
      return { width: null, height: null }
    }

    const viewBox = svgElement.getAttribute('viewBox')
    const viewBoxSize = viewBox ? viewBox.split(' ').map(Number) : []
    const [, , vbWidth, vbHeight] = viewBoxSize

    let width: string | number | null = parseSize(
      svgElement.getAttribute('width')
    )
    let height: string | number | null = parseSize(
      svgElement.getAttribute('height')
    )

    if (!width && vbWidth > 0) width = vbWidth
    if (!height && vbHeight > 0) height = vbHeight

    return {
      width: parseSize(width),
      height: parseSize(height)
    }
  }

  const createSvgDataUrl = (svgString: string): string => {
    const encodedSvg = encodeURIComponent(svgString)
    return `data:image/svg+xml,${encodedSvg}`
  }

  const applySvgResult = (svgString: string): void => {
    const { width, height } = extractSvgDimensions(svgString)
    svgWidth.value = width
    svgHeight.value = height
    imgSrc.value = createSvgDataUrl(svgString)
  }

  const applyRenderResult = (result: MermaidRenderResult): void => {
    if (result.type === 'ascii') {
      asciiContent.value = result.content
      return
    }

    applySvgResult(result.content)
  }

  onMounted(async (): Promise<void> => {
    applyRenderResult(await render(props.id, decodeURIComponent(props.code)))
  })

  const diagramLabel = computed(() => `Mermaid diagram: ${props.id}`)
  const asciiContent = shallowRef<string>('')
  const imgSrc = shallowRef<string>('')
  const svgWidth = shallowRef<number | null>(null)
  const svgHeight = shallowRef<number | null>(null)
</script>

<style scoped>
  .mermaid-diagram {
    @apply mx-auto block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }

  .mermaid-ascii {
    @apply mx-auto block;
    width: fit-content;
    min-width: 400px;
    max-width: 100%;
    overflow-x: auto;
    padding: 1rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    font-family: var(--vp-font-family-mono);
    font-size: 0.875rem;
    line-height: 1.2;
    text-align: left;
    white-space: pre;
  }

  .mermaid-ascii code {
    font-family: inherit;
  }

  .mermaid-img {
    min-width: 400px;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    display: block;
  }

  @media (min-width: 768px) {
    .mermaid-ascii,
    .mermaid-img {
      min-width: 600px;
    }
  }
</style>
