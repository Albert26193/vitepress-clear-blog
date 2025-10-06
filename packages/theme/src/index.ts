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
import Tags from './components/common/Tags.vue'
import D3FullScreen from './components/d3/D3FullScreen.vue'
import D3PageSidebar from './components/d3/D3PageSidebar.vue'
import Homepage from './components/homepage/Homepage.vue'
import BlogMain from './components/page/BlogMain.vue'
import LinkSidebar from './components/sidebar/LinkSidebar.vue'
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
    app.component('BlogMain', BlogMain)
    app.component('Homepage', Homepage)
    app.component('TagSidebar', TagSidebar)
    app.component('LinkSidebar', LinkSidebar)
    app.component('D3PageSidebar', D3PageSidebar)
    app.component('D3FullScreen', D3FullScreen)
    app.component('Collections', Collections)
    app.component('FooterRef', FooterRef)
    app.component('PostMermaid', PostMermaid)
    // vitepress original
    app.component('Badge', VPBadge)
  },
  setup() {
    const route = useRoute()
    onMounted(() => {
      nextTick(() => {
        addClassForHetiElement()
        registerHetiScript()
      }).catch()
      mediumZoomInit()
      watch(
        () => route.path,
        () =>
          nextTick(() => {
            addClassForHetiElement()
            registerHetiScript()
          }).catch()
      )
    })
  }
} satisfies Theme

export default BlogTheme
