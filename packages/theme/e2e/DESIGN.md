# E2E Test Design — vitepress-clear-blog Theme

One spec file per component. 25 components = 25 spec files.

## Rule

Every `.vue` file under `packages/theme/src/components/` **must** have a matching
`packages/theme/e2e/<ComponentName>.spec.ts`. CI enforces this with
`scripts/check-e2e-coverage.sh`.

## Component Map

### Articles

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| DocBanner | `DocBanner.spec.ts` | `/blogs/vitepress-first` | tags rendering, date format, word count, reading time, author link, tag click → `/tags?tag=`, mobile tag overflow scroll |
| PostMermaid | `PostMermaid.spec.ts` | `/blogs/test/mermaid` | mermaid SVG renders, non-zero dimensions, dark mode class on `<pre>` |

### Blog

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| BlogMain | `BlogMain.spec.ts` | `/`, `/pages` | card list renders, card→list toggle, list→card toggle, view preference persists |
| BlogCardItem | `BlogCardItem.spec.ts` | `/` | title, date, tags badges, description, click→navigate to post, card dimensions consistent |
| BlogCardPagination | `BlogCardPagination.spec.ts` | `/pages` | prev/next buttons, page numbers, disabled state on first/last page, URL param `?page=N` |
| BlogListItem | `BlogListItem.spec.ts` | `/pages` (list view) | title, date, description in horizontal layout, click→navigate |
| BlogListPagination | `BlogListPagination.spec.ts` | `/pages` (list view) | same as card pagination but in list view context |

### Collections

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| Collections | `Collections.spec.ts` | `/collections`, `/collections/:slug` | index: collection list with names+counts. detail: title, description, post list, click post→navigate |

### Common

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| Comment | `Comment.spec.ts` | `/blogs/vitepress-first` | iframe/container renders at page bottom, dark mode theme update via postMessage (no full reload) |
| Copyright | `Copyright.spec.ts` | `/` | footer visible, ICP number (if configured), "Theme by" link not empty, current year |
| FooterRef | `FooterRef.spec.ts` | `/blogs/footnote-test` | footnote ref rendered, hover→tooltip appears with content, arrow visible, dismiss on mouse leave |
| HideSidebarButton | `HideSidebarButton.spec.ts` | `/` (mobile viewport) | button visible at 375px, click→sidebar slides in, click again→sidebar hidden, not visible at 1280px |
| IconToggleButton | `IconToggleButton.spec.ts` | `/` | icon renders, click toggles icon, aria-label present |
| PopupContainer | `PopupContainer.spec.ts` | `/blogs/vitepress-first` | open D3 sidebar graph popup, overlay click dismisses, Esc key dismisses, popup has graph SVG |
| Tags | `Tags.spec.ts` | `/tags`, `/tags?tag=AI` | tag cloud/list rendered, each tag clickable, click→URL filter + filtered posts, Chinese tag in URL, empty tag no error |

### D3

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| D3ForceGraph | `D3ForceGraph.spec.ts` | `/` | SVG+circles+lines render, force simulation runs (nodes move), drag node→follows mouse→releases back to simulation, zoom scroll, hover→connected nodes highlight+unrelated fade, click node→navigate to post |
| D3FullScreen | `D3FullScreen.spec.ts` | `/` → fullscreen button | fullscreen graph opens, Escape exits, interactions work (drag/zoom/click) in fullscreen |
| D3HomePage | `D3HomePage.spec.ts` | `/` | graph renders in homepage container, zoomLevel appropriate for inline, nodes labeled |
| D3PageGraph | `D3PageGraph.spec.ts` | `/blogs/vitepress-first` → sidebar graph | page-local graph renders, current page node highlighted, neighbor nodes visible, click neighbor→navigate |
| D3PageSidebar | `D3PageSidebar.spec.ts` | `/blogs/vitepress-first` | graph icon/button in sidebar, click→popup opens, popup contains D3PageGraph |

### Homepage

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| Homepage | `Homepage.spec.ts` | `/` | D3HomePage renders, BlogMain renders, blog cards present, page title set, meta description, copyright visible |

### Layout

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| NewLayout | `NewLayout.spec.ts` | `/`, `/pages`, `/blogs/vitepress-first`, `/timeline`, `/tags` | each route renders correct dynamic component, 404 route shows not-found state, sidebar present on desktop, `#doc-before` slot contains DocBanner on post pages |

### Sidebar

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| SidebarLink | `SidebarLink.spec.ts` | `/blogs/vitepress-first` | sidebar section visible, incoming/outgoing link counts displayed, link click navigates, direction indicator correct |
| SidebarTag | `SidebarTag.spec.ts` | `/blogs/vitepress-first` | tag list in sidebar, tags clickable, click→navigate to `/tags?tag=`, count matches post count |

### Timeline

| Component | Spec | Route | What to Verify |
|-----------|------|-------|----------------|
| Timeline | `Timeline.spec.ts` | `/timeline` | years rendered, expand year→show months, expand month→show posts, click post→navigate, collapse works |

## E2E Coverage Check

```bash
bash scripts/check-e2e-coverage.sh
# PASS: all components have E2E coverage.
```

This check is integrated into CI — adding a `.vue` component without a matching
spec file fails the build.
