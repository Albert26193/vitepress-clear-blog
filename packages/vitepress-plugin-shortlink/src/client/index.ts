import { cleanUrls, prefix, shortlinks } from 'virtual:vitepress-shortlinks'
import { useData, withBase } from 'vitepress'
import { computed, defineComponent, h, ref } from 'vue'

import { canonicalizePath } from '../shared/canonicalize'
import './shortlink.css'

type CopyState = 'idle' | 'copied' | 'failed'

// Inline SVG icons keep the component self-contained — the plugin's source is
// not scanned by the theme's UnoCSS config, so `i-carbon-*` classes would not
// be generated in the consumer build.
const linkIcon = () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'none',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5',
      stroke: 'currentColor',
      class: 'shortlink-icon',
      'aria-hidden': 'true'
    },
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244'
    })
  )

const checkIcon = () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'none',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5',
      stroke: 'currentColor',
      class: 'shortlink-icon',
      'aria-hidden': 'true'
    },
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm4.5 12.75 6 6 9-13.5'
    })
  )

const warnIcon = () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'none',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5',
      stroke: 'currentColor',
      class: 'shortlink-icon',
      'aria-hidden': 'true'
    },
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
    })
  )

/** Copies text to the clipboard, falling back to the legacy execCommand path. */
const copyText = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to the legacy path below
    }
  }
  // Clipboard API requires a secure context (https / localhost); LAN-IP
  // previews fall back to a hidden textarea + execCommand.
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    // execCommand may throw in exotic browsers; treat as not copied
  }
  textarea.remove()
  return copied
}

/**
 * Copies the current page's short link (`/s/<key>`) to the clipboard. Renders
 * nothing on pages without a generated short link (e.g. nav/route pages).
 */
const ShortlinkCopyButton = defineComponent({
  name: 'ShortlinkCopyButton',
  setup() {
    const { page } = useData()
    const copyState = ref<CopyState>('idle')

    const key = computed(() => {
      const canonical = canonicalizePath(page.value.relativePath)
      return shortlinks[canonical] ?? null
    })

    const title = computed(() => {
      if (copyState.value === 'failed') return 'Short link unavailable'
      if (copyState.value === 'copied') return 'Copied'
      return 'Copy short link'
    })

    const label = computed(() => {
      if (copyState.value === 'copied') return 'Copied'
      if (copyState.value === 'failed') return 'Unavailable'
      return 'Short link'
    })

    let resetTimer: ReturnType<typeof setTimeout> | undefined
    const flash = (state: CopyState) => {
      copyState.value = state
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => (copyState.value = 'idle'), 2000)
    }

    const copyShortlink = async () => {
      const shortKey = key.value
      if (!shortKey) return
      // The shared URL must be exactly the file the static host will serve:
      // without clean URLs that is /s/<key>.html, with clean URLs /s/<key>.
      const suffix = cleanUrls ? '' : '.html'
      const shortPath = `/${prefix}/${shortKey}${suffix}`
      const url = `${window.location.origin}${withBase(shortPath)}`
      flash((await copyText(url)) ? 'copied' : 'failed')
    }

    return () => {
      if (!key.value) return null
      return h(
        'button',
        {
          type: 'button',
          class: 'shortlink-copy-button',
          title: title.value,
          'aria-label': 'Copy short link',
          onClick: () => void copyShortlink()
        },
        [
          copyState.value === 'copied'
            ? checkIcon()
            : copyState.value === 'failed'
              ? warnIcon()
              : linkIcon(),
          h('span', { class: 'shortlink-copy-label' }, label.value)
        ]
      )
    }
  }
})

export { ShortlinkCopyButton }
