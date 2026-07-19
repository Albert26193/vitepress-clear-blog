import { defineConfig } from 'vitepress'
import { createBlog } from 'vitepress-theme-link/node'

// All site options live in .vitepress/config.toml — edit that file first.
// Only pass overrides here when you need programmatic config; they are
// deep-merged over the generated config and always win, e.g.
//
//   createBlog({
//     themeConfig: { externalLinkIcon: true },
//     vite: { plugins: [myPlugin()] }
//   })
export default defineConfig(await createBlog())
