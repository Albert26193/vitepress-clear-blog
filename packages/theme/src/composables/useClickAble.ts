import { useRouter, withBase } from 'vitepress'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

interface ClickAbleOptions {
  onClick?: () => void
}

type ClickTarget = string | Event

export function useClickAble(
  target?: MaybeRefOrGetter<string | undefined>,
  options: ClickAbleOptions = {}
) {
  const router = useRouter()
  const resolveTarget = (nextTarget?: ClickTarget) => {
    return typeof nextTarget === 'string'
      ? nextTarget
      : target === undefined
        ? undefined
        : toValue(target)
  }

  const href = computed(() => {
    const value = resolveTarget()
    return value ? withBase(value) : undefined
  })

  const handleClick = (nextTarget?: ClickTarget) => {
    options.onClick?.()
    const value = resolveTarget(nextTarget)
    if (value) {
      router.go(withBase(value))
    }
  }

  const handleKeydown = (_nextTarget?: ClickTarget) => {
    handleClick()
  }

  return {
    href,
    handleClick,
    handleKeydown
  }
}
