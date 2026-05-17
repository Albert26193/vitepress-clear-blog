<template>
  <footer class="page-footer">
    <div class="pagination">
      <a
        v-for="i in pagesNum"
        :key="i"
        class="pagination-link"
        :class="{ active: pageCurrent === i }"
        @click="handlePageChange(i)"
        >{{ i }}</a
      >
    </div>
  </footer>
</template>

<script lang="ts" setup>
  const props = defineProps<{
    pagesNum: number
    pageCurrent: number
  }>()

  const emit = defineEmits<{
    pageChange: [page: number]
  }>()

  function handlePageChange(page: number) {
    if (page === props.pageCurrent) return
    emit('pageChange', page)
  }
</script>

<style scoped>
  .page-footer {
    @apply border-t border-gray-200 px-4 pt-6 pb-2;
    @apply dark:border-gray-700;
    @apply md:px-6;
  }

  .pagination {
    @apply flex flex-wrap justify-center gap-1;
    @apply md:gap-0;
  }

  .pagination-link {
    @apply flex cursor-pointer items-center justify-center rounded-md;
    @apply h-8 w-8 text-sm transition-all duration-200;
    @apply text-gray-600 dark:text-gray-400;
    @apply hover:bg-gray-100 dark:hover:bg-gray-800;
    @apply mt-16 ml-[5px] md:h-6 md:w-6 md:text-base;
    text-decoration: none;

    &:hover {
      text-decoration: none;
    }
  }

  .pagination-link.active {
    @apply bg-gray-200/90 text-[var(--vp-c-text-1)] shadow-md shadow-gray-500/70;
    @apply hover:bg-gray-200/90;
    @apply dark:bg-gray-500/90 dark:shadow-gray-900/90 dark:hover:bg-gray-500/90;
  }
</style>
