import { defineConfig } from 'vitepress'
import { createBlog } from 'vitepress-theme-link/node'

const blogConfig = await createBlog()

export default defineConfig({
  ...blogConfig,
  themeConfig: {
    ...(blogConfig.themeConfig as Record<string, unknown>),
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Albert26193/vitepress-theme-link'
      }
    ]
  }
})
