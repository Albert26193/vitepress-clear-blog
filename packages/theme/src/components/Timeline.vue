<template>
  <div class="custom-page-layout timeline-page">
    <div class="controls-container">
      <IconToggleButton
        v-model="sortDirection"
        :icons="[
          {
            value: 'asc',
            iconClass: 'i-carbon-arrow-up',
            tooltip: 'Ascending'
          },
          {
            value: 'desc',
            iconClass: 'i-carbon-arrow-down',
            tooltip: 'Descending'
          }
        ]"
        size="sm"
      />
      <IconToggleButton
        v-model="expandStatus"
        :icons="[
          {
            value: 'expand',
            iconClass: 'i-carbon-expand-all',
            tooltip: 'Expand All'
          },
          {
            value: 'collapse',
            iconClass: 'i-carbon-collapse-all',
            tooltip: 'Collapse All'
          }
        ]"
        size="sm"
      />
    </div>
    <div class="timeline-container">
      <div
        v-for="curYearPostList in sortedDataByYear"
        :key="getYear(curYearPostList)"
      >
        <div class="year-header">
          <!-- year and post count -->
          <span
            @click="toggleYear(getYear(curYearPostList))"
            class="timeline-year-title-span"
          >
            <span
              v-if="displayStatus.years[getYear(curYearPostList)]"
              class="chevron-icon i-carbon-chevron-down"
            />
            <span class="chevron-icon i-carbon-chevron-right" v-else />
            <span class="timeline-year-title">
              {{ getYear(curYearPostList) }}
            </span>
            <span class="timeline-post-count">
              {{ `( ${curYearPostList.length} )` }}
            </span>
          </span>
        </div>
        <div
          v-for="monthList in sortedDataByYearMonth[getYear(curYearPostList)]"
          :key="`${getYear(curYearPostList)}-${getMonth(monthList)}`"
          v-show="displayStatus.years[getYear(curYearPostList)]"
          class="timeline-year-content"
        >
          <div class="timeline-year-line"></div>
          <div class="timeline-month-title">
            <span
              @click="toggleMonth(getYear(monthList), getMonth(monthList))"
              class="timeline-month-title-span"
            >
              <span
                v-if="
                  displayStatus.months[
                    `${getYear(curYearPostList)}-${getMonth(monthList)}`
                  ]
                "
                class="chevron-icon-small i-carbon-chevron-down"
              />
              <span class="chevron-icon-small i-carbon-chevron-right" v-else />
              <span>{{ getYearMonth(monthList) }}</span>
              <span class="timeline-post-count">
                {{ `( ${monthList.length} )` }}
              </span>
            </span>
          </div>
          <div
            v-show="
              displayStatus.months[
                `${getYear(curYearPostList)}-${getMonth(monthList)}`
              ]
            "
            class="timeline-month-container"
          >
            <div class="timeline-month-line"></div>
            <div class="slide-enter-content">
              <div
                v-for="(article, index) in monthList"
                :key="index"
                class="posts-wrapper"
              >
                <span
                  class="post-item heti heti--classic"
                  role="link"
                  tabindex="0"
                  @click="handlePostClick(article.regularPath)"
                  @keydown.enter="handlePostKeydown(article.regularPath)"
                  @keydown.space.prevent="
                    handlePostKeydown(article.regularPath)
                  "
                >
                  {{ useTitle(article.frontMatter, article.html) }}
                </span>
                <div class="post-divider"></div>
                <div class="post-date">{{ getDay(article) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'
  import { computed, reactive, ref, watch } from 'vue'

  import { useClickAble } from '../composables/useClickAble'
  import { useTitle } from '../composables/useMeta'
  import type { Post } from '../types/types.d'
  import { useMonthYearSort, useYearSort } from '../utils/client/'
  import { data as allPostsData } from '../utils/node/posts.data.js'
  import IconToggleButton from './common/IconToggleButton.vue'

  interface DisplayStatus {
    years: { [year: string]: boolean }
    months: { [yearMonth: string]: boolean }
  }

  const { theme } = useData()
  const { handleClick: handlePostClick, handleKeydown: handlePostKeydown } =
    useClickAble()
  const sortDirection = ref<'asc' | 'desc'>(
    (theme.value.timelineSortDirection as 'asc' | 'desc') || 'desc'
  )
  const expandStatus = ref<'expand' | 'collapse'>('expand')

  const dataByYear = computed(() => useYearSort(allPostsData || []))
  const dataByYearMonth = computed(() => useMonthYearSort(allPostsData || []))

  const getYear = (yearList: { frontMatter: { date: string } }[]) =>
    yearList[0].frontMatter.date.split('-')[0]
  const getMonth = (monthList: { frontMatter: { date: string } }[]) =>
    monthList[0].frontMatter.date.split('-')[1]
  const getYearMonth = (monthList: { frontMatter: { date: string } }[]) =>
    monthList[0].frontMatter.date.split('-').slice(0, 2).join('-')
  const getDay = (article: { frontMatter: { date: string } }) =>
    article.frontMatter.date.slice(5)

  const sortedDataByYear = computed(() => {
    const data = [...dataByYear.value]
    return sortDirection.value === 'asc' ? data.reverse() : data
  })

  const sortedDataByYearMonth = computed(() => {
    const data = dataByYearMonth.value
    const direction = sortDirection.value

    const result: Record<string, Record<string, Post[]>> = {}
    for (const year of Object.keys(data)) {
      result[year] = {}
      const sortedMonths = Object.keys(data[year]).sort((a, b) =>
        direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      )
      for (const month of sortedMonths) {
        result[year][month] = [...data[year][month]].sort((a, b) => {
          const dateA = +new Date(a.frontMatter.date)
          const dateB = +new Date(b.frontMatter.date)
          return direction === 'asc' ? dateA - dateB : dateB - dateA
        })
      }
    }
    return result
  })

  watch(expandStatus, (newValue: 'expand' | 'collapse') => {
    if (newValue === 'expand') {
      expandAll()
    } else if (newValue === 'collapse') {
      collapseAll()
    }
  })

  const displayStatus: DisplayStatus = reactive({
    years: {},
    months: {}
  })

  const initDisplayStatus = () => {
    Object.entries(dataByYear.value).forEach(([year, posts]) => {
      const currentYear = getYear(posts as Post[])
      displayStatus.years[currentYear] = true

      const months = dataByYearMonth.value[currentYear]
      if (months) {
        Object.keys(months).forEach((month) => {
          displayStatus.months[`${currentYear}-${month}`] = true
        })
      }
    })
  }

  initDisplayStatus()

  const toggleYear = (year: string | number) => {
    displayStatus.years[year] = !displayStatus.years[year]
  }

  const toggleMonth = (year: string, month: string) => {
    const key = `${year}-${month}`
    displayStatus.months[key] = !displayStatus.months[key]
  }

  const expandAll = () => {
    Object.entries(dataByYear.value).forEach(([year, posts]) => {
      const currentYear = getYear(posts as Post[])
      displayStatus.years[currentYear] = true

      const months = dataByYearMonth.value[currentYear]
      if (months) {
        Object.keys(months).forEach((month) => {
          displayStatus.months[`${currentYear}-${month}`] = true
        })
      }
    })
  }

  const collapseAll = () => {
    Object.entries(dataByYear.value).forEach(([year, posts]) => {
      const currentYear = getYear(posts as Post[])
      displayStatus.years[currentYear] = false

      const months = dataByYearMonth.value[currentYear]
      if (months) {
        Object.keys(months).forEach((month) => {
          displayStatus.months[`${currentYear}-${month}`] = false
        })
      }
    })
  }
</script>

<style scoped>
  /* Page Container — use full doc column width (avoid nested md:w-7/10 + md:w-4/5 shrinking) */
  .timeline-page {
    @apply mx-auto w-full px-4;
    @apply md:px-0;
  }

  /* Controls Container */
  .controls-container {
    @apply mt-6 -mb-8 flex justify-end gap-3;
    @apply md:mr-18 md:gap-6;
  }

  /* Timeline Container */
  .timeline-container {
    @apply border-b-solid mx-auto flex w-full flex-col border border-gray-200 pb-4;
    @apply dark:border-gray-900/20;
  }

  /* Year Header */
  .year-header {
    @apply font-serif;
  }

  /* Year Content */
  .timeline-year-content {
    @apply relative mb-1 ml-1;
    @apply md:ml-2;
  }

  /* Year Title Span */
  .timeline-year-title-span {
    @apply flex max-w-full cursor-pointer items-center font-serif text-sm;
    @apply animate-fade-in delay-100 duration-200;
    @apply text-[var(--vp-c-text-2)];
    @apply md:text-base;
  }

  /* Year Title */
  .timeline-year-title {
    @apply pt-2 pb-1 text-lg font-extrabold;
    @apply md:text-xl;
  }

  /* Post Count */
  .timeline-post-count {
    @apply ml-2 text-xs font-normal text-[var(--vp-c-brand)];
    @apply md:text-sm;
  }

  /* Chevron Icons */
  .chevron-icon {
    @apply mr-2 text-lg;
  }

  .chevron-icon-small {
    @apply mr-1;
  }

  /* Year Line */
  .timeline-year-line {
    @apply absolute top-0 bottom-0 left-0 w-[1px];
    @apply bg-gray-200 dark:bg-gray-700;
    @apply md:left-auto;
  }

  /* Month Title */
  .timeline-month-title {
    @apply ml-3 flex items-center justify-between pt-2 pb-1 text-sm font-semibold;
    @apply text-[var(--vp-c-text-2)];
    @apply md:ml-4 md:text-base;
  }

  /* Month Title Span */
  .timeline-month-title-span {
    @apply flex max-w-full cursor-pointer items-center font-serif;
    @apply animate-fade-in delay-200 duration-200;
  }

  /* Month Container */
  .timeline-month-container {
    @apply relative;
  }

  /* Month Line */
  .timeline-month-line {
    @apply absolute top-0 bottom-0 left-3 ml-2 w-[1px];
    @apply bg-gray-200 dark:bg-gray-700;
    @apply md:left-4;
  }

  /* Posts Wrapper */
  .posts-wrapper {
    @apply relative ml-1 flex items-center justify-between gap-2 px-6 py-1;
    @apply md:ml-2 md:px-9;
  }

  /* Post Item */
  .post-item {
    @apply h-auto min-w-0 flex-shrink cursor-pointer text-sm break-words;
    @apply hover:text-[var(--vp-c-brand)] hover:no-underline;
    @apply md:h-6 md:text-base;
  }

  /* Post Divider */
  .post-divider {
    @apply border-b-dashed mx-3 flex-1 border-gray-200;
    @apply dark:border-gray-600;
  }

  /* Post Date */
  .post-date {
    @apply flex-shrink-0 font-serif text-xs whitespace-nowrap;
    @apply text-[var(--vp-c-text-2)];
    @apply md:text-sm;
  }
</style>
