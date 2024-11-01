<template>
  <Layout>
    <template v-if="!$frontmatter.page" #doc-before>
      <div style="padding-top: 20px" class="post-info">
        <span class="mr-2">
          <img :src="timePng" class="time-img" />
          {{ $frontmatter.date?.substring(0, 10) }}
        </span>
        <span
          v-for="item in $frontmatter.tags"
          :key="item"
          class="mt-2 hover:.dark:bg-blue-500 hover:bg-blue-200 hover:.dark:text-slate-100 tag rounded-full"
        >
          <a :href="withBase(`/tags.html?tag=${item}`)"> {{ item }}</a>
        </span>
      </div>
    </template>
  </Layout>
  <Copyright />
</template>

<script setup>
import { withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import timePng from '../assets/icon/time.png'
import Copyright from './Copyright.vue'

const { Layout } = DefaultTheme
</script>
