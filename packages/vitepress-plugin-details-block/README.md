# vitepress-plugin-details-block

A collapsible details/summary block component for VitePress, with customization
via slots and CSS variables.

## Installation

```bash
npm install vitepress-plugin-details-block
```

## Usage

Register the component in your `.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import { DetailsBlock } from 'vitepress-plugin-details-block'
import 'vitepress-plugin-details-block/style.css' // optional, for defaults

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('DetailsBlock', DetailsBlock)
  }
}
```

## Markdown Usage

Use the component directly in any `.md` file:

```html
<DetailsBlock summary="Solution">
  The answer to the exercise is shown here when expanded.
</DetailsBlock>

<DetailsBlock :open="true">
  <template #summary>Click to toggle</template>
  <p>This block starts expanded.</p>
</DetailsBlock>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `summary` | `string` | `"Click to view details"` | Fallback summary text |
| `open` | `boolean` | `false` | Initial expansion state |

## Slots

| Slot | Description |
|------|-------------|
| `summary` | Custom summary content (overrides the `summary` prop) |
| default | Body content, visible when expanded |

## License

MIT
