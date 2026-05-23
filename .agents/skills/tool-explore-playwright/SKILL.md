---
name: tool-explore-playwright
description: >
  Control a headless Playwright Chromium browser to inspect live DOM, CSS
  computed styles, take screenshots, and evaluate JavaScript on any URL.
  Use this skill whenever the agent needs to verify VitePress SSR/hydration,
  inspect UnoCSS generated classes, debug plugin client-side behavior, check
  responsive layout or dark mode, extract DOM/CSS design tokens from external
  websites (GitHub, blogs, etc.), or answer questions about how a page actually
  renders. Triggers on: "inspect the DOM", "check the rendered HTML", "take a
  screenshot", "get computed styles", "what CSS does this use", "how does this
  page render", "browser inspect", "playwright explore", "evaluate in browser",
  "open in browser", "看看这个页面的样式", "截图", "检查 DOM", "浏览器看一下",
  and any request to extract live page information that static file reading
  cannot provide.
---

# Tool: Explore Playwright

Launch a headless Chromium browser to inspect live web pages. The core script
at `scripts/explore.mjs` uses Playwright's library API (not `@playwright/test`)
to open a URL, execute JavaScript, and return structured results.

## Two usage dimensions

| Dimension | Goal | Typical URLs |
|---|---|---|
| **Internal debugging** | Verify VitePress SSR/hydration, UnoCSS classes, plugin behavior | `http://localhost:4173` or `http://localhost:5173` |
| **External design research** | Extract DOM structure, CSS tokens, interaction patterns from production sites | `https://github.com`, `https://tailwindcss.com`, any public URL |

Each invocation launches a fresh, stateless browser — no cookies, no
localStorage, no session persistence across calls.

## Script invocation

Always anchor paths from the repo root so the script works from any CWD:

```bash
GIT_ROOT="$(git rev-parse --show-toplevel)"
EXPLORE="$GIT_ROOT/.agents/skills/tool-explore-playwright/scripts/explore.mjs"

node "$EXPLORE" --url <url> --action <action> [options]
```

## Actions reference

### eval — Execute JavaScript in the page

The `--code` value is evaluated via `eval()` in the browser context. Use a
plain expression (`document.title`) or an arrow function (`() => 42`).

When `--selector` is also provided, a variable `el` references the matched
element inside the code string — use it directly: `el.textContent`.

```bash
# Get page title
node "$EXPLORE" --url http://localhost:4173 --action eval --code "document.title"

# Count links
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "() => document.querySelectorAll('a').length"

# Scoped: get text of first h1
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --selector "h1" --code "el.textContent"

# Scoped: get an attribute
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --selector "meta[name=description]" --code "el.getAttribute('content')"
```

### html — Get rendered outerHTML

Returns the full `<html>` element HTML (client-side rendered, after hydration).
Use `--selector` to scope to a specific element.

```bash
# Full page rendered HTML
node "$EXPLORE" --url http://localhost:4173 --action html

# Single component
node "$EXPLORE" --url http://localhost:4173 --action html \
  --selector ".homepage-container"
```

### screenshot — Capture the page as PNG

Saves to a temp file by default and prints the path in the JSON response.
Use `--screenshot-path` to specify a location. `--selector` screenshots only
that element.

```bash
# Full page screenshot
node "$EXPLORE" --url http://localhost:4173 --action screenshot

# Element screenshot
node "$EXPLORE" --url http://localhost:4173 --action screenshot \
  --selector ".site-footer" --screenshot-path /tmp/footer.png
```

After taking a screenshot, use the Read tool to view the PNG at the path returned in `data.path`.

### computed-styles — Query getComputedStyle()

Requires `--selector`. Returns all CSS properties (up to 500) as a flat object,
or a single property value when `--property` is given.

```bash
# All computed styles for h1
node "$EXPLORE" --url http://localhost:4173 --action computed-styles \
  --selector "h1"

# Single property
node "$EXPLORE" --url http://localhost:4173 --action computed-styles \
  --selector "h1" --property "font-size"
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--timeout <ms>` | 15000 | Navigation timeout in milliseconds |
| `--wait-until <state>` | networkidle | `load`, `domcontentloaded`, or `networkidle` |
| `--screenshot-path <path>` | temp file | Where to save screenshot (screenshot action only) |

## Output contract

Every invocation prints a single JSON object to stdout:

```json
{ "ok": true, "data": <result> }
{ "ok": true, "data": null, "path": "/tmp/playwright-explore-1234567890.png" }
{ "ok": false, "error": "Timeout 15000ms exceeded." }
```

- `ok: true` → `data` contains the action result (string for eval/html, object
  for computed-styles, null for screenshot)
- `ok: false` → the script exits with code 1; `error` describes what failed
- All diagnostic output goes to **stderr** — only parse stdout

## Common workflows

### Verify VitePress hydration

```bash
# Check Vue app is mounted
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "!!document.querySelector('#app')?.__vue_app__"

# Check hydration completed (no mismatch markers)
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "document.documentElement.getAttribute('data-v-app') !== null"
```

### Debug UnoCSS generated classes

```bash
# Dump all classes on <body> (includes generated atomic classes)
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "JSON.stringify([...document.body.classList])"

# Find elements using UnoCSS-generated classes
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "JSON.stringify([...document.querySelectorAll('[class*=\"uno-\"]')].slice(0,30).map(el => el.className))"
```

### Check dark mode

```bash
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "document.documentElement.classList.contains('dark')"

node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "getComputedStyle(document.documentElement).colorScheme"
```

### Extract design tokens from external sites

```bash
# Get a brand color CSS variable
node "$EXPLORE" --url https://tailwindcss.com --action computed-styles \
  --selector ":root" --property "--tw-color-indigo-500"

# Get heading font stack
node "$EXPLORE" --url https://github.com --action computed-styles \
  --selector "h1" --property "font-family"
```

### Inspect responsive layout

```bash
# Check viewport size and active breakpoints
node "$EXPLORE" --url http://localhost:4173 --action eval \
  --code "JSON.stringify({w: window.innerWidth, h: window.innerHeight, isMobile: matchMedia('(max-width: 768px)').matches})"
```

## Reference for JS snippets

See [`references/playwright-snippets.md`](references/playwright-snippets.md) for
a cheatsheet of reusable `--code` snippets organized by task category.

## Limitations

- **Stateless**: fresh browser each invocation — no cookies, localStorage, or
  session continuity
- **Headless only**: the `headless: false` option is not exposed
- **Chromium only**: matches the project's existing Playwright browser install
- **No interaction**: click, type, scroll, hover are not exposed as first-class
  actions. Use `--code` with DOM APIs for simple interactions
  (e.g. `el.click()`), or fall back to raw Playwright scripts for complex flows
- **No auth**: no cookies or login state. For authenticated pages, use a
  different approach
- **External sites**: some sites block headless browsers or require JS
  challenges. Try `--wait-until domcontentloaded` if networkidle hangs
