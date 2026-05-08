<template>
  <div class="mermaid-diagram">
    <img
      class="mermaid-img"
      :src="imgSrc"
      :alt="`Mermaid diagram: ${props.id}`"
      :width="svgWidth"
      :height="svgHeight"
    />
  </div>
</template>

<script setup lang="ts">
  import mermaid from 'mermaid'
  import { type PropType, onMounted, ref } from 'vue'

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

  const render = async (id: string, code: string): Promise<string> => {
    mermaid.initialize({ startOnLoad: false })
    const { svg } = await mermaid.render(id, code)
    return svg
  }

  const extractSvgDimensions = (svgString: string): SvgDimensions => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (!svgElement) {
      return { width: null, height: null }
    }

    let width: string | number | null = svgElement.getAttribute('width')
    let height: string | number | null = svgElement.getAttribute('height')

    if (!width || !height) {
      const viewBox = svgElement.getAttribute('viewBox')
      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number)
        width = width || vbWidth
        height = height || vbHeight
      }
    }

    const parseSize = (size: string | number | null): number | null => {
      if (!size) return null
      return typeof size === 'string'
        ? parseFloat(size.replace('px', ''))
        : size
    }

    return {
      width: parseSize(width),
      height: parseSize(height)
    }
  }

  const createSvgDataUrl = (svgString: string): string => {
    const encodedSvg = encodeURIComponent(svgString)
    return `data:image/svg+xml,${encodedSvg}`
  }

  onMounted(async (): Promise<void> => {
    const svgString = await render(props.id, decodeURIComponent(props.code))

    const { width, height } = extractSvgDimensions(svgString)
    svgWidth.value = width
    svgHeight.value = height

    imgSrc.value = createSvgDataUrl(svgString)
  })

  const imgSrc = ref<string>('')
  const svgWidth = ref<number | null>(null)
  const svgHeight = ref<number | null>(null)
</script>

<style scoped>
  .mermaid-diagram {
    @apply mx-auto block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }

  .mermaid-img {
    min-width: 400px;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    display: block;
  }

  /* Scale up small diagrams */
  @media (min-width: 768px) {
    .mermaid-img {
      min-width: 600px;
      transform-origin: center;
    }
  }
</style>
