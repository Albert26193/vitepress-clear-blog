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

<script setup>
  import mermaid from 'mermaid'
  import { onMounted, ref } from 'vue'

  const props = defineProps({
    id: String,
    code: String
  })

  const render = async (id, code) => {
    mermaid.initialize({ startOnLoad: false })
    const { svg } = await mermaid.render(id, code)
    return svg
  }

  // Extract SVG dimensions from SVG string
  const extractSvgDimensions = (svgString) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (!svgElement) {
      return { width: null, height: null }
    }

    // Try to get width and height attributes first
    let width = svgElement.getAttribute('width')
    let height = svgElement.getAttribute('height')

    // If no width/height, try to extract from viewBox
    if (!width || !height) {
      const viewBox = svgElement.getAttribute('viewBox')
      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number)
        width = width || vbWidth
        height = height || vbHeight
      }
    }

    // Parse numeric values (remove 'px' suffix if present)
    const parseSize = (size) => {
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

  // Convert SVG string to data URL for img tag
  const createSvgDataUrl = (svgString) => {
    // Encode SVG for data URL
    const encodedSvg = encodeURIComponent(svgString)
    return `data:image/svg+xml,${encodedSvg}`
  }

  onMounted(async () => {
    const svgString = await render(props.id, decodeURIComponent(props.code))

    // Extract original SVG dimensions
    const { width, height } = extractSvgDimensions(svgString)
    svgWidth.value = width
    svgHeight.value = height

    // Create data URL
    imgSrc.value = createSvgDataUrl(svgString)
  })

  const imgSrc = ref('')
  const svgWidth = ref(null)
  const svgHeight = ref(null)
</script>

<style scoped>
  .mermaid-diagram {
    @apply mx-auto block;
  }
</style>
