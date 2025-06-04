// import 'virtual:uno.css'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { VPBadge } from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'

import Collections from './components/Collections.vue'
import NewLayout from './components/NewLayout.vue'
import Timeline from './components/Timeline.vue'
import PostMermaid from './components/articles/PostMermaid.vue'
import FooterRef from './components/common/FooterRef.vue'
import OverallD3 from './components/common/OverallD3.vue'
import Tags from './components/common/Tags.vue'
import Homepage from './components/homepage/Homepage.vue'
import BlogContainer from './components/page/BlogContainer.vue'
import LinkSidebar from './components/sidebar/LinkSidebar.vue'
import PageLinkD3 from './components/sidebar/PageLinkD3.vue'
import TagSidebar from './components/sidebar/TagSidebar.vue'
// styles
import './styles/index.scss'
import { mediumZoomInit } from './utils/client'
import { addClassForHetiElement, registerHetiScript } from './utils/client/'

export const BlogTheme: Theme = {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global components
    // app.component('ExampleUsage', ExampleUsage)
    app.component('Tags', Tags)
    app.component('Timeline', Timeline)
    app.component('BlogContainer', BlogContainer)
    app.component('Homepage', Homepage)
    app.component('TagSidebar', TagSidebar)
    app.component('LinkSidebar', LinkSidebar)
    app.component('PageLinkD3', PageLinkD3)
    app.component('OverallD3', OverallD3)
    app.component('Collections', Collections)
    app.component('FooterRef', FooterRef)
    app.component('PostMermaid', PostMermaid)
    // vitepress original
    app.component('Badge', VPBadge)
  },
  setup() {
    const route = useRoute()
    onMounted(() => {
      addClassForHetiElement()
      registerHetiScript()
      mediumZoomInit()
      watch(
        () => route.path,
        () =>
          nextTick(() => {
            addClassForHetiElement()
            // registerHetiScript()
          })
      )
    })
  }
} satisfies Theme

export default BlogTheme
