import BlogTheme from '@blog/theme'
import type { EnhanceAppContext } from 'vitepress'

const inBrowser = typeof window !== 'undefined'

export default {
  ...BlogTheme,
  enhanceApp: (ctx: EnhanceAppContext) => {
    const { app } = ctx
    BlogTheme?.enhanceApp?.(ctx)
  }
}
