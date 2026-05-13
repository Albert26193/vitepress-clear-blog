# vitepress-plugin-hashtag

A VitePress markdown-it plugin that converts `#TagName` syntax into clickable tag links pointing to the tag filter page.

## Installation

```bash
npm install vitepress-plugin-hashtag
```

## Usage

The plugin is registered automatically by the theme when using `createBlog()`. No manual setup is required — enable or disable it via `config.toml`:

```toml
[markdown]
# Enable hashtag parsing (default: true)
hashtag = true
```

### Manual Registration

If you are using the plugin standalone without the theme:

```ts
import MarkdownIt from 'markdown-it'
import { hashtagPlugin } from 'vitepress-plugin-hashtag'

const md = new MarkdownIt()
md.use(hashtagPlugin)
```

## How It Works

The plugin registers three markdown-it renderer rules:

| Rule | Output |
| ---- | ------ |
| `hashtag_open` | `<a href='/tags?tag={lowercase}' class='blog-tag'>` |
| `hashtag_text` | `#{original content}` |
| `hashtag_close` | `</a>` |

Tag names are lowercased in the URL for consistency.

## Style Customization

Style the tag links via the `.blog-tag` CSS class:

```css
.blog-tag {
  color: var(--vp-c-brand);
  text-decoration: none;
  border-bottom: 1px dashed var(--vp-c-brand);
}
```

## Example

Input markdown:

```markdown
Today we're discussing #Vue3 Composition API with #TypeScript.
```

Rendered HTML:

```html
Today we're discussing
<a href='/tags?tag=vue3' class='blog-tag'>#Vue3</a>
Composition API with
<a href='/tags?tag=typescript' class='blog-tag'>#TypeScript</a>.
```

## License

MIT
