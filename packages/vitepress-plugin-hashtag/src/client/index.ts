import { useRouter, withBase } from 'vitepress'
import { defineComponent, h } from 'vue'

import './hashtag.css'

const HashtagTag = defineComponent({
  name: 'HashtagTag',
  props: {
    tag: {
      type: String,
      required: true
    }
  },
  setup(props, { slots }) {
    const router = useRouter()

    const navigate = () => {
      router.go(withBase(`/tags?tag=${encodeURIComponent(props.tag)}`))
    }

    return () =>
      h(
        'span',
        {
          class: 'blog-tag',
          role: 'button',
          tabindex: 0,
          onClick: navigate,
          onKeydown: (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              navigate()
            }
          }
        },
        slots.default?.() || `#${props.tag}`
      )
  }
})

export { HashtagTag }
