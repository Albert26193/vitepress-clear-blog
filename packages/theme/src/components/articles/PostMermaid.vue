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
  import { type PropType, onMounted, ref } from 'vue'

  import { render } from '../../utils/client/mermaid'

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
