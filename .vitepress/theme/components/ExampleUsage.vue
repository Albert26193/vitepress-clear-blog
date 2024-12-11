<!-- Example Usage -->
<template>
  <div class="example-container">
    <Animated3DCard>
      <div class="card-content">
        <h2>Animated 3D Card</h2>
        <p>Move your mouse over this card to see the 3D effect!</p>
      </div>
    </Animated3DCard>
  </div>
</template>

<script setup lang="ts">
  import Animated3DCard from './Animated3DCard.vue'
</script>

<style scoped>
  .example-container {
    width: 300px;
    height: 200px;
  }

  .card-content {
    padding: 20px;
    text-align: center;
  }

  h2 {
    margin-bottom: 10px;
  }
</style>
