# vitepress-plugin-shortlink

Gives every page in a configured scope a stable short link (`/s/<key>`). Keys
are derived from each page's **id** — a field you put in its frontmatter (e.g.
`page_id`) — not from the route. Because the id lives with the content, a shared
short link survives renames and rebuilds as long as the id stays in the
frontmatter.

- **No database, no server** — each short link is a static redirect page
  (meta-refresh + `location.replace` + fallback link) emitted at build time,
  so it works on any static host.
- **Stable by construction** — same id always yields the same key; collisions
  are impossible rather than improbable (a colliding id simply gets a longer
  prefix).
- **Scope-controlled** — only the directory you configure is scanned. Route
  pages (`about`, `tags`, …) living outside the scope are never touched.
- **Explicit ids only** — a page inside the scope *must* declare the id field;
  a missing or duplicated id fails the build instead of being silently skipped.
- **Read-only site map** — writes `site_map_readonly.csv` (id → key → URLs)
  into the build output for humans and tools; it is never read back, so editing
  it is pointless.

## Install

```bash
pnpm add vitepress-plugin-shortlink
```

## Usage

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { shortlinkPlugin } from 'vitepress-plugin-shortlink'

export default defineConfig({
  vite: {
    plugins: [
      shortlinkPlugin({
        srcDir: './docs',
        scope: 'blogs',       // only docs/blogs/** is scanned
        idField: 'page_id',   // frontmatter field carrying the stable id
        base: '/',
        cleanUrls: false,
        keyLength: 6,
        prefix: 's'
      })
    ]
  }
})
```

Every markdown page inside `scope` must declare the id field in frontmatter:

```md
---
page_id: "my-post-id"
title: My Post
---

# My Post
```

The id is an arbitrary string (no format requirement); the plugin only enforces
that it is unique across the scope. The short link for the page above is
`/s/<base62-key>`.

### Options

| Option      | Type      | Default     | Description                                          |
| ----------- | --------- | ----------- | ---------------------------------------------------- |
| `enabled`   | `boolean` | `true`      | When `false` the plugin is inert (empty map, no writes) but still resolves the virtual module so the copy button can be imported unconditionally. |
| `srcDir`    | `string`  | — (required)| VitePress site root; pages are scanned under it.     |
| `scope`     | `string`  | `'**'`      | Directory (relative to `srcDir`) to scan. Pages outside are ignored. |
| `idField`   | `string`  | `'page_id'` | Frontmatter field carrying each page's stable id.    |
| `base`      | `string`  | `'/'`       | VitePress base path prefix.                          |
| `cleanUrls` | `boolean` | `false`     | Omit the `.html` suffix in redirect targets.         |
| `keyLength` | `number`  | `6`         | Minimum short key length (base62).                   |
| `prefix`    | `string`  | `'s'`       | URL segment under which short links are served.      |

### Build output

At build end the plugin writes into `outDir`:

- `s/<key>.html` — a static redirect page per scoped page (`<key>` with no
  extension when `cleanUrls` is enabled).
- `site_map_readonly.csv` — the id → key → URL mapping, sorted by key so it is
  byte-identical across rebuilds:

  ```csv
  id,key,shortUrl,targetUrl
  my-post-id,3K9aQx,/s/3K9aQx.html,/blogs/my-post.html
  ```

### Client component

Register the copy button in your theme's `enhanceApp`:

```ts
import { ShortlinkCopyButton } from 'vitepress-plugin-shortlink/client'
import 'vitepress-plugin-shortlink/client.css'

app.component('ShortlinkCopyButton', ShortlinkCopyButton)
```

The button renders on pages that have a generated short link and copies
`<origin>/s/<key>` on click. The shared URL always matches the file the host
will serve: with `cleanUrls: false` it is `<origin>/s/<key>.html`, with
`cleanUrls: true` it is `<origin>/s/<key>` — so the link works on any plain
static host (GitHub Pages, Caddy, nginx) without per-host rewrite rules.

## How it works

1. At config time, scan `scope` for markdown pages and read each page's id from
   its frontmatter. A scoped page without an id fails the build; two pages with
   the same id fail the build.
2. For each id, compute `base62(sha256(id))` and assign the shortest
   globally-unique prefix (≥ `keyLength`) as the key.
3. At build end, write `/s/<key>.html` — a static redirect page to the page.
4. In dev, `/s/<key>` is answered by a middleware `302` instead.
5. A virtual module (`virtual:vitepress-shortlinks`) exposes the mapping to the
   client copy button, and `site_map_readonly.csv` documents it.

## License

MIT
