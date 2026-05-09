import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'
import type { HeadConfig } from 'vitepress'

const tomlPath = resolve(import.meta.dirname, 'config.toml')
let meta: Record<string, string> = {}
try {
  const raw = readFileSync(tomlPath, 'utf-8')
  const parsed = parse(raw) as Record<string, unknown>
  meta = (parsed.meta as Record<string, string>) || {}
} catch {
  // fall back to empty meta if config.toml is missing or unreadable
}

export const metaData = {
  lang: meta.lang || 'zh-CN',
  locale: meta.locale || 'zh_CN',
  title: meta.title || 'Blog',
  description: meta.description || 'A personal blog',
  site: meta.siteUrl || ''
}

export const head: HeadConfig[] = [
  ['link', { rel: 'icon', href: '/favicon.ico' }],
  ['meta', { name: 'author', content: meta.author || 'Blogger' }],
  ['meta', { name: 'keywords', content: meta.keywords || '' }],

  ['meta', { name: 'HandheldFriendly', content: 'True' }],
  ['meta', { name: 'MobileOptimized', content: '320' }],
  ['meta', { name: 'theme-color', content: meta['theme-color'] || '#1934e9' }],

  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:locale', content: metaData.locale }],
  ['meta', { property: 'og:title', content: metaData.title }],
  ['meta', { property: 'og:description', content: metaData.description }],
  ['meta', { property: 'og:site', content: metaData.site }],
  ['meta', { property: 'og:site_name', content: metaData.title }]
]
