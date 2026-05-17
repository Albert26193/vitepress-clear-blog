import { defineConfig } from 'vitepress'
import { createBlog } from 'vitepress-clear-blog/node'

const blogConfig = await createBlog()

export default defineConfig({
  ...blogConfig,
  themeConfig: {
    ...(blogConfig.themeConfig as Record<string, unknown>),
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
  }
})
