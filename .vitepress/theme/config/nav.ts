import type { DefaultTheme } from 'vitepress'

export const nav: DefaultTheme.Config['nav'] = [
  { text: 'pages', link: '/pages/index' },
  { text: 'Timeline', link: '/timeline' },
  { text: 'Tags', link: '/tags' },
  { text: 'About', link: '/about' },
  { text: 'collections', link: '/collections' }
]
