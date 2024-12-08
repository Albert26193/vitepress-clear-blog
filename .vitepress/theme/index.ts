import NewLayout from '@/theme/components/NewLayout.vue'
import Timeline from '@/theme/components/Timeline.vue'
import Tags from '@/theme/components/common/Tags.vue'
import Homepage from '@/theme/components/homepage/Homepage.vue'
import BlogContainer from '@/theme/components/page/BlogContainer.vue'
import '@/theme/styles/generated.css'
import '@/theme/styles/main.css'
import { mediumZoomInit } from '@/theme/utils/themeUtils'
import TagSidebar from '@theme/components/sidebar/TagSidebar.vue'
import 'virtual:uno.css'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'

export default {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global component
    app.component('Tags', Tags)
    app.component('Timeline', Timeline)
    app.component('BlogContainer', BlogContainer)
    app.component('Homepage', Homepage)
    app.component('TagSidebar', TagSidebar)
  },
  setup() {
    const route = useRoute()

    onMounted(() => {
      mediumZoomInit()
      watch(
        () => route.path,
        () => nextTick(() => mediumZoomInit())
      )
    })
  }
} satisfies Theme
