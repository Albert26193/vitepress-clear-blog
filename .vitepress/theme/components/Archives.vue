<template>
  <div v-for="curYearPostList in dataByYear" :key="getYear(curYearPostList)" class="my-4">
    <div @click="toggleYear(getYear(curYearPostList))">
      <span class="font-800 accent-black text-xl"> {{ getYear(curYearPostList) }} </span>
      <span class="ml-2 font-600 text-base text-blue-700 .dark:text-blue-200">
        {{ `(${curYearPostList.length})` }}
      </span>
    </div>
    <div
      v-for="monthList in dataByYearMonth[getYear(curYearPostList)]"
      :key="`${getYear(curYearPostList)}-${getMonth(monthList)}`"
      v-show="displayStatus.years[getYear(curYearPostList)]"
    >
      <div
        class="ml-4 pt-4 pb-1 italic text-blue-700 .dark:text-blue-400"
        @click="toggleMonth(getYear(monthList), getMonth(monthList))"
      >
        <span class="font-600">{{ getYearMonth(monthList) }}</span>
        <span class="font-600 ml-1 text-sm">{{ `(${monthList.length})` }}</span>
      </div>
      <div v-show="displayStatus.months[`${getYear(curYearPostList)}-${getMonth(monthList)}`]">
        <a
          :href="withBase(article.regularPath)"
          v-for="(article, index) in monthList"
          :key="index"
          class="posts"
        >
          <div class="post-container .dark:text-slate-100 text-slate-800 font-bold">
            <div class="post-dot"></div>
            {{ article.frontMatter.title }}
          </div>
          <div class="date">{{ getDay(article) }}</div>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useData, withBase } from 'vitepress'
  import { computed, reactive, onMounted } from 'vue'
  import { useYearSort, useMonthYearSort } from '../utils'
  const { theme } = useData()

  interface DisplayStatus {
    years: { [year: string]: boolean }
    months: { [yearMonth: string]: boolean }
  }

  interface PostList {
    title: string
    date: string
    // ... 其他属性
  }

  interface DataByYear {
    [year: string]: PostList[]
  }

  interface DataByYearMonth {
    [year: string]: {
      [month: string]: PostList[]
    }
  }

  // Helper functions to extract year, month, and day
  const getYear = (yearList: { frontMatter: { date: string } }[]) =>
    yearList[0].frontMatter.date.split('-')[0]
  const getMonth = (monthList: { frontMatter: { date: string } }[]) =>
    monthList[0].frontMatter.date.split('-')[1]
  const getYearMonth = (monthList: { frontMatter: { date: string } }[]) =>
    monthList[0].frontMatter.date.split('-').slice(0, 2).join('-')
  const getDay = (article: { frontMatter: { date: string } }) => article.frontMatter.date.slice(5)

  const dataByYear = computed(() => useYearSort(theme.value.posts))
  const dataByYearMonth = computed(() => useMonthYearSort(theme.value.posts))

  // New display status management
  const displayStatus: DisplayStatus = reactive({
    years: {},
    months: {}
  })

  // Initialize display status for each year and month
  onMounted(() => {
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
  })

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
