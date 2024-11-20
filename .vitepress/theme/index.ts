import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import mediumZoom from 'medium-zoom'
import 'virtual:uno.css'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'

import NewLayout from './components/NewLayout.vue'
import Page from './components/Page.vue'
import Timeline from './components/Timeline.vue'
import Tags from './components/common/Tags.vue'
import './styles/generated.css'
import './styles/main.css'

export default {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global compoment
    app.component('Tags', Tags)
    app.component('Timeline', Timeline)
    app.component('Page', Page)
    app.use(autoAnimatePlugin)
  },
  setup() {
    const route = useRoute()

    onMounted(() => {
      const initZoom = () => {
        mediumZoom('.main img', { background: 'var(--vp-c-bg)' })
      }

      initZoom()
      watch(
        () => route.path,
        () => nextTick(() => initZoom())
      )
    })
  }
} satisfies Theme
