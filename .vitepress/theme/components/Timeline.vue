<template>
  <div
    v-for="curYearPostList in dataByYear"
    :key="getYear(curYearPostList)"
    class="my-4 custom-page-layout"
  >
    <div>
      <!-- year and post count -->
      <span @click="toggleYear(getYear(curYearPostList))">
        <span
          v-if="displayStatus.years[getYear(curYearPostList)]"
          class="i-carbon-caret-down text-lg"
        />
        <span class="i-carbon-caret-right text-lg" v-else />
        <span class="font-800 text-xl accent-black">
          {{ getYear(curYearPostList) }}
        </span>
        <span
          class="font-600 dark:text-[var(--vp-c-brand)] ml-3 text-base text-[var(--vp-c-brand)]"
        >
          {{ `( ${curYearPostList.length} )` }}
        </span>
      </span>
    </div>
    <div
      v-for="monthList in dataByYearMonth[getYear(curYearPostList)]"
      :key="`${getYear(curYearPostList)}-${getMonth(monthList)}`"
      v-show="displayStatus.years[getYear(curYearPostList)]"
    >
      <div
        class="dark:text-[var(--vp-c-brand)] ml-4 pb-1 pt-4 text-[var(--vp-c-brand)]"
      >
        <span @click="toggleMonth(getYear(monthList), getMonth(monthList))">
          <span
            v-if="
              displayStatus.months[
                `${getYear(curYearPostList)}-${getMonth(monthList)}`
              ]
            "
            class="i-carbon-caret-down"
          />
          <span class="i-carbon-caret-right" v-else />
          <span class="font-600">{{ getYearMonth(monthList) }}</span>
          <span class="font-600 ml-2 text-sm">
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
      >
        <div
          v-for="(article, index) in monthList"
          :key="index"
          class="posts ml-2"
        >
          <a
            class="dark:text-slate-100 font-bold text-slate-800"
            :href="withBase(article.regularPath)"
          >
            {{ article.frontMatter.title ?? 'Untitled' }}
          </a>
          <div class="mx-3 flex-1 border-b-dashed border-gray-300"></div>
          <div class="date">{{ getDay(article) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useMonthYearSort, useYearSort } from '@/theme/utils/themeUtils'
  import { useData, withBase } from 'vitepress'
  import { computed, reactive } from 'vue'

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

  const dataByYear = computed(() => useYearSort(theme.value.posts))
  const dataByYearMonth = computed(() => useMonthYearSort(theme.value.posts))

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
</script>

<style>
  .posts {
    @apply px-8 py-1 flex justify-between items-center;
  }

  .post-dot {
    @apply inline-block mr-2.5 mb-0.5 w-1 h-1 rounded-full;
    background-color: var(--li-dot-color);
  }

  .post-container {
    @apply text-[var(--vp-c-text-2)] text-[0.9375rem] font-400;
  }
  .post-container:hover {
    @apply text-[var(--vp-c-brand)];
  }

  .date {
    color: var(--date-color);
    font-family: var(--date-font-family);
  }
</style>
