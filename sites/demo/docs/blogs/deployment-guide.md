---
page_id: "deployment-guide"
title: Deployment Guide
date: 2026-05-09
tags:
  - deployment
  - github-pages
---

# Deployment Guide

Deploy your blog to GitHub Pages with a single workflow.

## GitHub Pages Setup

1. Push your blog repository to GitHub
2. Enable GitHub Pages in repository Settings
3. Add a deploy workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v5
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v4
        with:
          path: .vitepress/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

## Custom Domain

Add a `CNAME` file to your `docs/public/` directory with your custom domain.

## Build Optimization

The theme automatically handles asset optimization, code splitting, and cache busting through VitePress.

## 延伸阅读

- [[theme/rss-seo-and-sitemap|RSS、SEO 与站点地图]]
- [[../collections/operations/ci-cd-pipeline-setup|CI/CD 流水线配置]]
- [[../collections/operations/部署与运维实践|部署与运维实践]]
- [[navigation/nav-bar-configuration|导航栏配置]]
