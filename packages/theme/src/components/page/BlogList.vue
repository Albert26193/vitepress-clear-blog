<template>
  <div class="blog-list" @click="navigateToPost">
    <div class="blog-list-container">
      <!-- Left section: Title and tags -->
      <div class="left-section">
        <div class="left-content">
          <!-- left-header -->
          <div class="list-header">
            <h2 class="list-title">
              <a :href="withBase(post.regularPath)" class="title-link">
                {{ post.frontMatter.title }}
              </a>
            </h2>
          </div>

          <!-- Metadata information -->
          <div class="meta-info">
            <!-- Time -->
            <div class="meta-item">
              <div class="i-carbon-time" />
              <span class="meta-text">
                {{ post.frontMatter.date?.substring(0, 10) }}
              </span>
            </div>
            <!-- Author -->
            <div class="meta-item">
              <div class="i-carbon-user" />
              <a class="meta-text" :href="`/about.html`">
                {{ author }}
              </a>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="tags-container">
          <span
            v-for="item in partedTags"
            :key="item + 'key'"
            class="tag-wrapper"
          >
            <a
              @click.stop
              :href="withBase(`/tags.html?tag=${item}`)"
              class="tag"
            >
              {{ item }}
            </a>
          </span>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Right section: Description and metadata -->
      <div class="right-section">
        <!-- Description content -->
        <p
          v-if="post.frontMatter.description"
          class="describe heti heti--serif"
        >
          {{ useListDescription(post.frontMatter.description).value }}
        </p>
        <div v-else class="empty-description"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { PropType } from 'vue'

  import { useAuthor } from '../../composables/useMeta'
  import { useListDescription } from '../../composables/useMeta'
  import type { Post } from '../../types/types'

  const props = defineProps({
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  })

  const partedTags = props.post.frontMatter.tags?.slice(0, 4) ?? []

  const author = useAuthor(props.post.frontMatter) || 'Blogger'
  const navigateToPost = (event: MouseEvent) => {
    window.location.href = props.post.regularPath
  }
</script>

<style scoped lang="scss">
  .blog-list {
    @apply w-full mx-auto cursor-pointer relative;
    @apply transition-colors duration-200;

    &:hover {
      @apply bg-gray-200/20;

      // .title-link {
      //   @apply underline underline-offset-6;
      // }
    }

    &::before {
      @apply content-[''] absolute inset-0 pointer-events-none;
      @apply border-gray-400 border-solid border-y-[0.5px] border-x-0;
    }
  }

  .blog-list-container {
    @apply flex py-0 px-6 min-h-44;
  }

  /* Left section styles */
  .left-section {
    @apply w-3/10 pr-4 flex flex-col py-4;
    @apply justify-between;
  }

  .list-header {
    @apply mt-2;
  }

  .list-title {
    @apply text-xl font-semibold;
  }

  .title-link {
    @apply text-color-[var(--vp-c-brand)];
    @apply transition-all duration-200;
    @apply hover:(underline underline-offset-6);
  }

  .tags-container {
    @apply flex flex-wrap gap-1 mt-auto mb-0;
  }

  .tag-wrapper {
    @apply inline-block;
  }

  .tag {
    @apply cursor-pointer hover:text-[var(--vp-c-brand)];
  }

  /* Divider styles */
  .divider {
    @apply w-[1px] bg-gray-400 dark:bg-gray-700 mx-2;
    @apply relative;

    &::after {
      @apply content-[''] absolute w-2 h-2 rounded-full;
      @apply bg-gray-400;
      @apply transform -translate-x-[45%];
      @apply bottom-[-2%];
    }
  }

  /* Right section styles */
  .right-section {
    @apply flex-1 flex flex-col;
    @apply my-4 mx-8;
  }

  .describe {
    @apply text-md text-gray-700 dark:text-gray-300;
    @apply mt-3 indent-2 line-clamp-3;
  }

  .empty-description {
    @apply h-4;
  }

  .meta-info {
    @apply flex flex-wrap;
    @apply mt-auto text-sm text-gray-600;
    @apply mt-2;
  }

  .meta-item {
    @apply flex items-center mr-5;
  }

  .meta-text {
    @apply ml-1;
  }
</style>
