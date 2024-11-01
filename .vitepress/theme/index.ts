import './custom.css'
import 'virtual:uno.css'
import mediumZoom from 'medium-zoom'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'
import Archives from './components/Archives.vue'
import NewLayout from './components/NewLayout.vue'
import Page from './components/Page.vue'
import Tags from './components/Tags.vue'

export default {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global compoment
    app.component('Tags', Tags)
    app.component('Archives', Archives)
    app.component('Page', Page)
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
