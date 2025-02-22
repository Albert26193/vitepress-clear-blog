// import 'virtual:uno.css'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'

import Collections from './components/Collections.vue'
import ExampleUsage from './components/ExampleUsage.vue'
import NewLayout from './components/NewLayout.vue'
import Timeline from './components/Timeline.vue'
import OverallD3 from './components/common/OverallD3.vue'
import Tags from './components/common/Tags.vue'
import Homepage from './components/homepage/Homepage.vue'
import BlogContainer from './components/page/BlogContainer.vue'
import LinkSidebar from './components/sidebar/LinkSidebar.vue'
import PageLinkD3 from './components/sidebar/PageLinkD3.vue'
import TagSidebar from './components/sidebar/TagSidebar.vue'
import './style.css'
import './styles/generated.module.css'
import { mediumZoomInit } from './utils/themeUtils'

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
    app.component('LinkSidebar', LinkSidebar)
    // app.component('ExampleUsage', ExampleUsage)
    app.component('PageLinkD3', PageLinkD3)
    app.component('OverallD3', OverallD3)
    // app.component('Collections', Collections)
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
