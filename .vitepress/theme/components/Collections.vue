<template>
  <div
    v-auto-animate
    class="my-card mt-2 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
  >
    <!-- <TransitionGroup name="fade"> -->
    <BlogCard v-for="article in demoData" :key="article._id" v-bind="article" />
    <!-- </TransitionGroup> -->
  </div>
</template>

<script lang="ts">
  import BlogCard from '@/theme/components/page/BlogCard.vue'
  import { ref } from 'vue'

  const demoData = ref([
    {
      _id: '1',
      title: 'Hello World',
      description: 'This is a description',
      tags: ['tag1', 'tag2'],
      date: '2021-01-01'
    },
    {
      _id: '2',
      title: 'Hello World 2',
      description: 'This is a description',
      tags: ['tag1', 'tag2'],
      date: '2021-01-01'
    },
    {
      _id: '3',
      title: 'Hello World 3',
      description: 'This is a description',
      tags: ['tag1', 'tag2'],
      date: '2021-01-01'
    }
  ])
</script>
