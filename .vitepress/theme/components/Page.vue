<template>
  <div
    v-auto-animate="{ duration: 300 }"
    class="post-list mx-auto mt-2 grid w-4/5 grid-cols-1 gap-4 border-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
  >
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
    <div v-for="(article, index) in posts" :key="index">
      <BlogCard :article="article"></BlogCard>
    </div>
  </div>

  <div class="pagination">
    <a
      v-for="i in pagesNum"
      :key="i"
      class="link ml-1"
      :class="{ active: pageCurrent === i }"
      :href="withBase(i === 1 ? '/pages/index.html' : `/pages/page_${i}.html`)"
      >{{ i }}</a
    >
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { type PropType } from 'vue'

  import { Article } from '../types'
  import BlogCard from './BlogCard.vue'

  const props = defineProps({
    posts: {
      type: Array as PropType<Article[]>,
      required: true
    },
    pageCurrent: {
      type: Number as PropType<number>,
      required: true
    },
    pagesNum: {
      type: Number as PropType<number>,
      required: true
    }
  })
</script>

<style scoped>
  .post-list {
    /* border-bottom: 1px solid rgba(78, 145, 200, 0.586); */
    padding: 24px 0 14px 0;
    max-width: 1280px;
  }

  .post-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pagination {
    margin-top: 24px;
    display: flex;
    justify-content: center;
  }
</style>
