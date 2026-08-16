# vitepress-plugin-shortlink

Auto-generates a stable short link (`/s/<key>`) for every blog post in a
VitePress site. Keys are deterministic base62 prefixes of each URL's SHA-256
digest (shortest unique prefix, default length 6), so a shared short link never
drifts when the site is rebuilt or posts are reordered.

- **No database, no server** — each short link is a static redirect page
  (meta-refresh + `location.replace` + fallback link) emitted at build time,
  so it works on any static host.
- **Stable by construction** — same URL always yields the same key; collisions
  are impossible rather than improbable (a colliding URL simply gets a longer
  prefix).
- **Copy button** — ships a `ShortlinkCopyButton` component that copies the
  current page's short link to the clipboard.

## Install

```bash
pnpm add vitepress-plugin-shortlink
```

## Usage

Wire the plugin into `vite.plugins` and hand it the list of post paths. The
theme's `createBlog` does this for you — the plugin only needs the injected
posts so it stays dependency-free:

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { shortlinkPlugin } from 'vitepress-plugin-shortlink'

export default defineConfig({
  vite: {
    plugins: [
      shortlinkPlugin({
        posts: ['blogs/my-post', 'blogs/other-post'], // canonical paths
        base: '/',
        cleanUrls: false,
        keyLength: 6,
        prefix: 's'
      })
    ]
  }
})
```

### Options

| Option      | Type       | Default | Description                                          |
| ----------- | ---------- | ------- | ---------------------------------------------------- |
| `posts`     | `string[]` | —       | Canonical page paths that get a short link.          |
| `base`      | `string`   | `'/'`   | VitePress base path prefix.                          |
| `cleanUrls` | `boolean`  | `false` | Omit the `.html` suffix in redirect targets.         |
| `keyLength` | `number`   | `6`     | Minimum short key length (base62).                   |
| `prefix`    | `string`   | `'s'`   | URL segment under which short links are served.      |

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

1. For each post URL, compute `base62(sha256(url))`.
2. Assign the shortest globally-unique prefix (≥ `keyLength`) as the key.
3. At build end, write `/s/<key>.html` — a static redirect page to the post.
4. In dev, `/s/<key>` is answered by a middleware `302` instead.
5. A virtual module (`virtual:vitepress-shortlinks`) exposes the mapping to the
   client copy button.

## License

MIT
