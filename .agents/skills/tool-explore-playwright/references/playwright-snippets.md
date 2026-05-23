# Playwright Snippets Reference

Copy-paste-ready `--code` snippets for `explore.mjs`. Each is a complete
`--action eval --code "..."` argument. For scoped eval against a specific
element, add `--selector "..."` and use `el.` prefix in the code.

Always wrap complex expressions that return objects with `JSON.stringify()` so
the JSON output is parseable.

## DOM Inspection

```bash
# Page title
--code "document.title"

# Meta description
--code "document.querySelector('meta[name=description]')?.getAttribute('content')"

# All links with href and text
--code "JSON.stringify([...document.querySelectorAll('a')].map(a => ({href: a.href, text: a.textContent.trim().slice(0,60)})))"

# Count specific elements
--code "document.querySelectorAll('nav a').length"

# Check if an element exists
--code "!!document.querySelector('.target-class')"

# Get all heading hierarchy
--code "JSON.stringify([...document.querySelectorAll('h1,h2,h3')].map(h => ({tag: h.tagName, text: h.textContent.trim().slice(0,80)})))"
```

## CSS / UnoCSS / Design Tokens

```bash
# All classes on body (UnoCSS generated classes end up here)
--code "JSON.stringify([...document.body.classList])"

# CSS custom property from :root
--code "getComputedStyle(document.documentElement).getPropertyValue('--vp-c-brand')"

# Multiple custom properties at once
--code "JSON.stringify(['--vp-c-brand','--vp-c-bg','--vp-font-family-base'].reduce((o,k)=>({...o,[k]:getComputedStyle(document.documentElement).getPropertyValue(k)}),{}))"

# Find elements with a specific class pattern
--code "JSON.stringify([...document.querySelectorAll('[class*=\"rounded\"]')].slice(0,20).map(el => ({tag: el.tagName, class: el.className.slice(0,100)})))"

# Count CSS rules in stylesheets (proxy for CSS size)
--code "JSON.stringify([...document.styleSheets].map(s => ({href: s.href, rules: s.cssRules?.length||0})))"
```

## VitePress SSR / Hydration

```bash
# Is Vue app mounted?
--code "!!document.querySelector('#app')?.__vue_app__"

# Hydration completed?
--code "document.documentElement.getAttribute('data-v-app') !== null"

# VitePress version
--code "document.querySelector('meta[name=generator]')?.getAttribute('content')"

# Get VitePress app config
--code "JSON.stringify(document.querySelector('#app').__vue_app__?.config?.globalProperties?.$frontmatter)"

# Check for Vue components registered
--code "JSON.stringify(Object.keys(document.querySelector('#app').__vue_app__._instance?.appContext?.components||{}).slice(0,30))"
```

## Layout & Responsive

```bash
# Viewport dimensions
--code "JSON.stringify({width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio})"

# Active media queries
--code "JSON.stringify({isMobile: matchMedia('(max-width: 768px)').matches, isTablet: matchMedia('(max-width: 1024px)').matches, prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches})"

# Scroll info
--code "JSON.stringify({scrollX: window.scrollX, scrollY: window.scrollY, bodyHeight: document.body.scrollHeight})"

# Element bounding box (scoped: --selector "nav")
--code "JSON.stringify(el.getBoundingClientRect())"
```

## Dark Mode

```bash
# Is dark mode active on <html>?
--code "document.documentElement.classList.contains('dark')"

# Current color-scheme
--code "getComputedStyle(document.documentElement).colorScheme"

# VitePress theme preference from localStorage
--code "localStorage.getItem('vitepress-theme') || 'auto'"

# Background and text colors in dark mode
--code "JSON.stringify({bg: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color})"
```

## Plugin Behavior

```bash
# Check for callout elements (vitepress-plugin-callouts)
--code "document.querySelectorAll('.callout, [class*=\"callout\"]').length"

# Check for code fold buttons (vitepress-plugin-codeblock-fold)
--code "document.querySelectorAll('.codeblock-fold-btn, [class*=\"fold\"]').length"

# Check for details blocks (vitepress-plugin-details-block)
--code "document.querySelectorAll('details.custom-block').length"

# Check for hashtag links (vitepress-plugin-hashtag)
--code "document.querySelectorAll('a[href*=\"hashtag\"], a[href*=\"/tag/\"]').length"
```

## Interaction (via eval)

```bash
# Click an element
--code "document.querySelector('.theme-toggle')?.click()"

# Scroll to bottom
--code "window.scrollTo(0, document.body.scrollHeight)"

# Focus an input
--code "document.querySelector('input[type=search]')?.focus()"
```

## Performance

```bash
# Navigation timing
--code "JSON.stringify(performance.getEntriesByType('navigation')[0], (k,v) => typeof v==='number'?Math.round(v):v)"

# Total DOM nodes
--code "document.getElementsByTagName('*').length"

# Resource count by type
--code "JSON.stringify(Object.groupBy?.(performance.getEntriesByType('resource'), r => r.initiatorType)||{})"
```

## Console Error Capture

For capturing console errors, you need a multi-step approach: make a script
that attaches console listeners before navigation. Or use a two-call approach:

```bash
# 1. Get current console errors (must be run AFTER page loads)
#    This only catches errors that happened before this call
--code "JSON.stringify((()=>{const e=[];const orig=console.error;console.error=(...a)=>e.push(a.map(String).join(' '));setTimeout(()=>{console.error=orig},1000);return 'listener attached, run again in 2s to collect'})())"
```

For reliable console tracking across page loads, write a small Playwright
script using `page.on('console', ...)` instead.
