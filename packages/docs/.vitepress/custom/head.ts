import type { HeadConfig } from 'vitepress'

export const metaData = {
  lang: 'zh-CN',
  locale: 'zh_CN',
  title: 'xxx的个人网站',
  description: 'xxx的个人网站，记录生活、技术、随笔等等。',
  site: 'xxxxxx'
}

export const head: HeadConfig[] = [
  ['link', { rel: 'icon', href: '/favicon.ico' }],
  ['meta', { name: 'author', content: 'xxxxx' }],
  ['meta', { name: 'keywords', content: '个人博客 xxxx 静态站点' }],

  ['meta', { name: 'HandheldFriendly', content: 'True' }],
  ['meta', { name: 'MobileOptimized', content: '320' }],
  ['meta', { name: 'theme-color', content: '#1934e9' }],

  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:locale', content: metaData.locale }],
  ['meta', { property: 'og:title', content: metaData.title }],
  ['meta', { property: 'og:description', content: metaData.description }],
  ['meta', { property: 'og:site', content: metaData.site }],
  ['meta', { property: 'og:site_name', content: metaData.title }]
]
