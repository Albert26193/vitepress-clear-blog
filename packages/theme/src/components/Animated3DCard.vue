<!-- Animated 3D Card Component -->
<template>
  <div
    class="card-wrapper"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    ref="cardWrapper"
  >
    <div
      class="card"
      :style="{
        transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
        transition: isHovering ? 'none' : 'all 0.5s ease'
      }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const cardWrapper = ref<HTMLElement | null>(null)
  const rotateX = ref(0)
  const rotateY = ref(0)
  const isHovering = ref(false)

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardWrapper.value) return

    isHovering.value = true
    const rect = cardWrapper.value.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX
    const mouseY = e.clientY

    // Calculate rotation values
    const rotateYValue = ((mouseX - centerX) / (rect.width / 2)) * 10
    const rotateXValue = ((centerY - mouseY) / (rect.height / 2)) * 10

    rotateY.value = rotateYValue
    rotateX.value = rotateXValue
  }

  const handleMouseLeave = () => {
    isHovering.value = false
    rotateX.value = 0
    rotateY.value = 0
  }
</script>

<style scoped>
  .card-wrapper {
    perspective: 1000px;
    transform-style: preserve-3d;
    padding: 20px;
  }

  .card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    border-radius: 20px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.5s ease;
  }

  .card:hover {
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
  }
</style>
