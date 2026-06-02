// styles
import 'photoswipe/style.css'
import 'virtual:uno.css'
import type { EnhanceAppContext, Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import { setupCodeBlockFold } from 'vitepress-plugin-codeblock-fold'
import 'vitepress-plugin-codeblock-fold/style.css'
import { DetailsBlock } from 'vitepress-plugin-details-block'
import 'vitepress-plugin-details-block/style.css'
import { HashtagTag } from 'vitepress-plugin-hashtag/client'
import 'vitepress-plugin-hashtag/client.css'
import DefaultTheme from 'vitepress/theme'
import { VPBadge } from 'vitepress/theme'
import type { Component } from 'vue'
import { defineAsyncComponent, nextTick, onMounted, watch } from 'vue'

import Collections from './components/Collections.vue'
import NewLayout from './components/NewLayout.vue'
import Timeline from './components/Timeline.vue'
import BlogMain from './components/blog/BlogMain.vue'
import FooterRef from './components/common/FooterRef.vue'
import Tags from './components/common/Tags.vue'
import SidebarLink from './components/sidebar/SidebarLink.vue'
import SidebarTag from './components/sidebar/SidebarTag.vue'
import './styles/index.scss'
import { photoSwipeInit } from './utils/client'
import { addClassForHetiElement, registerHetiScript } from './utils/client/'

/**
 * Extends VitePress with Clear Blog layout, global components, and client-only enhancements.
 */
declare const __LINK_STYLE__: string

export const BlogTheme: Theme = {
  ...DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app }: EnhanceAppContext) {
    // register global components
    app.component('Tags', Tags)
    app.component('Timeline', Timeline)
    app.component('BlogMain', BlogMain)
    app.component('SidebarTag', SidebarTag)
    app.component('SidebarLink', SidebarLink)
    // Cast to the loose Component type: TS 6 otherwise hits "excessive stack
    // depth" comparing the cross-package DefineComponent type here (TS2321).
    app.component('HashtagTag', HashtagTag as Component)
    app.component(
      'D3PageSidebar',
      defineAsyncComponent(() => import('./components/d3/D3PageSidebar.vue'))
    )
    app.component(
      'D3FullScreen',
      defineAsyncComponent(() => import('./components/d3/D3FullScreen.vue'))
    )
    app.component('Collections', Collections)
    app.component('FooterRef', FooterRef)
    app.component(
      'Homepage',
      defineAsyncComponent(() => import('./components/homepage/Homepage.vue'))
    )
    app.component(
      'PostMermaid',
      defineAsyncComponent(
        () => import('./components/articles/PostMermaid.vue')
      )
    )
    app.component('DetailsBlock', DetailsBlock)
    // vitepress original
    app.component('Badge', VPBadge)

    if (typeof window !== 'undefined') {
      // Broken-link detection and title rewriting are handled at build time by
      // the wikilink markdown-it plugin (issue #434); the client only applies
      // the configured link style to the document root.
      document.documentElement.dataset.linkStyle =
        typeof __LINK_STYLE__ !== 'undefined' ? __LINK_STYLE__ : 'origin'
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
