<template>
  <div class="custom-page-layout timeline-page">
    <div class="mr-18 -mb-8 mt-6 flex justify-end gap-6">
      <IconToggleButton
        v-model="sortDirection"
        :icons="[
          { value: 'asc', iconClass: 'i-carbon-arrow-up', tooltip: '升序' },
          { value: 'desc', iconClass: 'i-carbon-arrow-down', tooltip: '降序' }
        ]"
        size="sm"
      />
      <IconToggleButton
        v-model="expandStatus"
        :icons="[
          {
            value: 'expand',
            iconClass: 'i-carbon-expand-all',
            tooltip: '展开全部'
          },
          {
            value: 'collapse',
            iconClass: 'i-carbon-collapse-all',
            tooltip: '折叠全部'
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
        <div class="font-serif">
          <!-- year and post count -->
          <span
            @click="toggleYear(getYear(curYearPostList))"
            class="flex max-w-36 cursor-pointer items-center"
          >
            <span
              v-if="displayStatus.years[getYear(curYearPostList)]"
              class="i-carbon-chevron-down mr-2 text-lg"
            />
            <span class="i-carbon-chevron-right mr-2 text-lg" v-else />
            <span class="timeline-year-title">
              {{ getYear(curYearPostList) }}
            </span>
            <span class="timeline-post-count mt-[3px]">
              {{ `( ${curYearPostList.length} )` }}
            </span>
          </span>
        </div>
        <div
          v-for="monthList in dataByYearMonth[getYear(curYearPostList)]"
          :key="`${getYear(curYearPostList)}-${getMonth(monthList)}`"
          v-show="displayStatus.years[getYear(curYearPostList)]"
          class="timeline-year-content"
        >
          <div class="timeline-year-line"></div>
          <div class="timeline-month-title">
            <span
              @click="toggleMonth(getYear(monthList), getMonth(monthList))"
              class="flex max-w-36 cursor-pointer items-center font-serif"
            >
              <span
                v-if="
                  displayStatus.months[
                    `${getYear(curYearPostList)}-${getMonth(monthList)}`
                  ]
                "
                class="i-carbon-chevron-down mr-1"
              />
              <span class="i-carbon-chevron-right mr-1" v-else />
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
                <a
                  class="post-item heti heti--classic"
                  :href="withBase(article.regularPath)"
                >
                  {{ article.frontMatter.title ?? 'No title' }}
                </a>
                <div class="border-b-dashed mx-3 flex-1 border-gray-200"></div>
                <div class="date">{{ getDay(article) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useData, withBase } from 'vitepress'
  import { computed, reactive, ref, watch } from 'vue'

  import { useMonthYearSort, useYearSort } from '../utils/client/'
  import IconToggleButton from './common/IconToggleButton.vue'

  const { theme } = useData()

  interface DisplayStatus {
    years: { [year: string]: boolean }
    months: { [yearMonth: string]: boolean }
  }

  // interface PostList {
  //   title: string
  //   date: string
  // }

  // interface DataByYear {
  //   [year: string]: PostList[]
  // }

  // interface DataByYearMonth {
  //   [year: string]: {
  //     [month: string]: PostList[]
  //   }
  // }

  // Helper functions to extract year, month, and day
  const getYear = (yearList: { frontMatter: { date: string } }[]) =>
    yearList[0].frontMatter.date.split('-')[0]
  const getMonth = (monthList: { frontMatter: { date: string } }[]) =>
    monthList[0].frontMatter.date.split('-')[1]
  const getYearMonth = (monthList: { frontMatter: { date: string } }[]) =>
    monthList[0].frontMatter.date.split('-').slice(0, 2).join('-')
  const getDay = (article: { frontMatter: { date: string } }) =>
    article.frontMatter.date.slice(5)

  const sortDirection = ref<'asc' | 'desc'>('desc')
  const expandStatus = ref<'expand' | 'collapse'>('expand')

  const dataByYear = computed(() => useYearSort(theme.value.posts))
  const dataByYearMonth = computed(() => useMonthYearSort(theme.value.posts))

  console.warn(JSON.stringify(theme.value.posts, null, 2))
  // Add new computed property for sorted data
  const sortedDataByYear = computed(() => {
    const data = [...dataByYear.value]
    return sortDirection.value === 'asc' ? data.reverse() : data
  })

  // Watch for changes in expandStatus
  watch(expandStatus, (newValue: 'expand' | 'collapse') => {
    if (newValue === 'expand') {
      expandAll()
    } else if (newValue === 'collapse') {
      collapseAll()
    }
  })

  // New display status management
  const displayStatus: DisplayStatus = reactive({
    years: {},
    months: {}
  })

  // Initialize display status for each year and month
  const initDisplayStatus = () => {
    Object.entries(dataByYear.value).forEach(([year, posts]) => {
      const currentYear = getYear(posts)
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

  // Toggle year expansion
  const toggleYear = (year: string | number) => {
    displayStatus.years[year] = !displayStatus.years[year]
  }

  // Toggle month expansion
  const toggleMonth = (year: string, month: string) => {
    const key = `${year}-${month}`
    displayStatus.months[key] = !displayStatus.months[key]
  }

  // Add new expand/collapse functions
  const expandAll = () => {
    Object.entries(dataByYear.value).forEach(([year, posts]) => {
      const currentYear = getYear(posts)
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
      const currentYear = getYear(posts)
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
  .timeline-page {
    @apply w-7/10 mx-auto;
  }

  .timeline-container {
    @apply mx-auto flex w-4/5 flex-col;
    @apply border-b-solid border border-gray-200 pb-4;
  }

  .timeline-year-content {
    @apply relative mb-1 ml-2;
  }

  .timeline-post-count {
    @apply ml-2 text-[var(--vp-c-brand)];
    @apply font-normal;
  }

  .timeline-year-title {
    @apply pb-1 pt-2 text-xl;
    @apply font-extrabold;
  }

  .timeline-year-line {
    @apply absolute bottom-0 top-0 w-[1px] bg-gray-200 dark:bg-gray-700;
  }

  .timeline-month-title {
    @apply ml-4 pb-1 pt-2;
    @apply font-semibold;
    @apply flex items-center justify-between;
  }

  .timeline-month-container {
    @apply relative;
  }

  .timeline-month-line {
    @apply absolute bottom-0 left-4 top-0 w-[1px] bg-gray-200 dark:bg-gray-700;
    @apply ml-2;
  }

  .posts-wrapper {
    @apply relative ml-2 flex items-center justify-between px-9 py-1;
  }

  .post-item {
    @apply hover:text-[var(--vp-c-brand)];
    @apply h-6 hover:no-underline;
  }

  .date {
    @apply text-gray-500 dark:text-gray-400;
    @apply font-serif;
  }
</style>
