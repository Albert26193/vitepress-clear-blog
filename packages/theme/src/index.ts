// styles
import 'photoswipe/style.css'
import 'virtual:uno.css'
import { siteMetadata } from 'virtual:vitepress-analyzer'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import setupCodeBlockFold from 'vitepress-plugin-codeblock-fold'
import 'vitepress-plugin-codeblock-fold/style.css'
import { DetailsBlock } from 'vitepress-plugin-details-block'
import 'vitepress-plugin-details-block/dist/index.css'
import DefaultTheme from 'vitepress/theme'
import { VPBadge } from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'

import Collections from './components/Collections.vue'
import NewLayout from './components/NewLayout.vue'
import Timeline from './components/Timeline.vue'
import PostMermaid from './components/articles/PostMermaid.vue'
import BlogMain from './components/blog/BlogMain.vue'
import FooterRef from './components/common/FooterRef.vue'
import Tags from './components/common/Tags.vue'
import D3FullScreen from './components/d3/D3FullScreen.vue'
import D3PageSidebar from './components/d3/D3PageSidebar.vue'
import Homepage from './components/homepage/Homepage.vue'
import SidebarLink from './components/sidebar/SidebarLink.vue'
import SidebarTag from './components/sidebar/SidebarTag.vue'
import './styles/index.scss'
import { photoSwipeInit } from './utils/client'
import {
  addClassForHetiElement,
  markBrokenLinks,
  registerHetiScript
} from './utils/client/'
import { data as allPostsData } from './utils/node/posts.data'

/**
 * Extends VitePress with Clear Blog layout, global components, and client-only enhancements.
 */
declare const __WIKI_RENDER_TITLE__: string

export const BlogTheme: Theme = {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global components
    app.component('Tags', Tags)
    app.component('Timeline', Timeline)
    app.component('BlogMain', BlogMain)
    app.component('Homepage', Homepage)
    app.component('SidebarTag', SidebarTag)
    app.component('SidebarLink', SidebarLink)
    app.component('D3PageSidebar', D3PageSidebar)
    app.component('D3FullScreen', D3FullScreen)
    app.component('Collections', Collections)
    app.component('FooterRef', FooterRef)
    app.component('PostMermaid', PostMermaid)
    app.component('DetailsBlock', DetailsBlock)
    // vitepress original
    app.component('Badge', VPBadge)

    if (typeof window !== 'undefined') {
      let wikiLinkRefreshTimer: number | undefined
      let wikiLinkObserver: MutationObserver | undefined
      const getBaseFromLocation = () => {
        const relativePath = router.route.data.relativePath
        const pathname = window.location.pathname
        if (relativePath) {
          const clean = relativePath.replace(/\.(md|html)$/, '')
          if (pathname.endsWith(clean + '.html') || pathname.endsWith(clean)) {
            return (
              pathname.slice(
                0,
                -clean.length - (pathname.endsWith(clean + '.html') ? 5 : 0)
              ) || '/'
            )
          }
        }
        return '/'
      }
      const scheduleWikiLinkRefresh = () => {
        window.clearTimeout(wikiLinkRefreshTimer)
        wikiLinkRefreshTimer = window.setTimeout(() => {
          markBrokenLinks(siteMetadata, {
            base: getBaseFromLocation(),
            currentPath: router.route.data.relativePath,
            renderTitle:
              typeof __WIKI_RENDER_TITLE__ !== 'undefined'
                ? __WIKI_RENDER_TITLE__
                : 'frontmatter_title',
            allPosts: allPostsData
          })
        })
      }

      app.mixin({
        mounted: scheduleWikiLinkRefresh,
        updated: scheduleWikiLinkRefresh
      })
      const ensureWikiLinkObserver = () => {
        if (wikiLinkObserver) return
        const target = document.querySelector('#app') || document.body
        if (!target) {
          window.setTimeout(ensureWikiLinkObserver, 50)
          return
        }
        wikiLinkObserver = new MutationObserver(scheduleWikiLinkRefresh)
        wikiLinkObserver.observe(target, {
          childList: true,
          subtree: true
        })
      }
      window.setTimeout(scheduleWikiLinkRefresh)
      window.setTimeout(scheduleWikiLinkRefresh, 100)
      window.setTimeout(scheduleWikiLinkRefresh, 500)
      window.addEventListener('load', scheduleWikiLinkRefresh, { once: true })
      ensureWikiLinkObserver()
    }
  },
  setup() {
    const route = useRoute()
    setupCodeBlockFold()
    onMounted(() => {
      const refreshArticleEnhancements = () =>
        nextTick(() => {
          addClassForHetiElement()
          registerHetiScript()
          photoSwipeInit()
        }).catch()

      refreshArticleEnhancements()
      watch(
        () => route.path,
        () => refreshArticleEnhancements()
      )
    })
  }
} satisfies Theme

export default BlogTheme
