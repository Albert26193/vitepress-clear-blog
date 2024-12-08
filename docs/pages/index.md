---
title: home
aside: false
sidebar: false
layout: page
---
<script setup>
import BlogContainer from "../../.vitepress/theme/components/page/BlogContainer.vue";
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(0,10)
</script>
<BlogContainer :posts="posts" :pageCurrent="1" :pagesNum="1" />