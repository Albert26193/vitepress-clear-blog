import { defineConfig } from 'vitepress'
import { createBlog } from 'vitepress-theme-link/node'

const blogConfig = await createBlog()
const blogVite = (blogConfig.vite ?? {}) as Record<string, unknown>
const blogOptimizeDeps = (blogVite.optimizeDeps ?? {}) as {
  exclude?: string[]
}

export default defineConfig({
  ...blogConfig,
  themeConfig: {
    ...(blogConfig.themeConfig as Record<string, unknown>),
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
  },
  vite: {
    ...blogVite,
    // vitepress-theme-link ships its client code as source: its "." export
    // points at src/*.ts and *.vue, and those files import build-time virtual
    // modules (`virtual:uno.css`, `virtual:vitepress-analyzer`) plus VitePress
    // content-loader data (`*.data.ts`) that only exist inside this project's
    // Vite pipeline. Vite does not transform files under node_modules by
    // default, so the theme must be marked noExternal (and excluded from dep
    // pre-bundling) for `pnpm dev` to resolve them instead of failing with
    // "Could not resolve". The plugins themselves are wired by createBlog().
    optimizeDeps: {
      ...blogOptimizeDeps,
      exclude: [...(blogOptimizeDeps.exclude ?? []), 'vitepress-theme-link']
    },
    ssr: {
      ...((blogVite.ssr ?? {}) as Record<string, unknown>),
      noExternal: ['vitepress-theme-link']
    }
  }
})
