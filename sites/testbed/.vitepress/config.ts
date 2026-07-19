import { defineConfig } from 'vitepress'
import { createBlog } from 'vitepress-theme-link/node'

// All site options live in .vitepress/config.toml. Overrides passed to
// createBlog() are deep-merged over the generated config (user wins).
export default defineConfig(await createBlog())
