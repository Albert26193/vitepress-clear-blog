import type { HeadConfig } from 'vitepress'

export const metaData = {
  lang: 'zh-CN',
  locale: 'zh_CN',
  title: 'vitepress-theme-link',
  description:
    'vitepress-theme-link 项目架构、技术选型、工程规范与功能介绍文档',
  site: 'https://github.com/Albert26193/vitepress-theme-link'
}

export const head: HeadConfig[] = [
  ['link', { rel: 'icon', href: '/favicon.ico' }],
  ['meta', { name: 'author', content: 'vitepress-theme-link team' }],
  [
    'meta',
    { name: 'keywords', content: 'vitepress blog theme monorepo architecture' }
  ],
  ['meta', { name: 'theme-color', content: '#1934e9' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:locale', content: metaData.locale }],
  ['meta', { property: 'og:title', content: metaData.title }],
  ['meta', { property: 'og:description', content: metaData.description }]
]
