// register global components
import 'virtual:uno.css'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'

import Collections from '../../src/components/Collections.vue'
import ExampleUsage from '../../src/components/ExampleUsage.vue'
import NewLayout from '../../src/components/NewLayout.vue'
import Timeline from '../../src/components/Timeline.vue'
import OverallD3 from '../../src/components/common/OverallD3.vue'
import Tags from '../../src/components/common/Tags.vue'
import Homepage from '../../src/components/homepage/Homepage.vue'
import BlogContainer from '../../src/components/page/BlogContainer.vue'
import LinkSidebar from '../../src/components/sidebar/LinkSidebar.vue'
import PageLinkD3 from '../../src/components/sidebar/PageLinkD3.vue'
import TagSidebar from '../../src/components/sidebar/TagSidebar.vue'
import '../../src/styles/animated.css'
import '../../src/styles/generated.css'
import '../../src/styles/main.css'
import { mediumZoomInit } from '../../src/utils/client/themeUtils'

export default {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global components
    app.component('Tags', Tags)
    app.component('Timeline', Timeline)
    app.component('BlogContainer', BlogContainer)
    app.component('Homepage', Homepage)
    app.component('TagSidebar', TagSidebar)
    app.component('LinkSidebar', LinkSidebar)
    app.component('ExampleUsage', ExampleUsage)
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
