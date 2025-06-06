import { useScriptTag } from '@vueuse/core'
import hetiScript from 'heti/umd/heti-addon.min.js?url'

/**
 * Heti interface declaration
 */
interface HetiConstructor {
  new (selector: string): {
    autoSpacing: () => void
  }
}
declare global {
  interface Window {
    Heti: HetiConstructor
  }
}

const _getHeitElements = (): Element[] => {
  const hetiClassSelector = [
    '#VPContent .VPDoc .content-container main.main',
    '.VPLocalNav .VPLocalNavOutlineDropdown .items .header .top-link',
    '.VPLocalNav .VPLocalNavOutlineDropdown .items .outline .VPDocOutlineItem .outline-link',
    '.VPSidebar #VPSidebar .page-link'
  ]

  const hetiElements: Element[] = []
  hetiClassSelector.forEach((selector) => {
    const elements = document.querySelectorAll(selector)
    if (elements.length) {
      hetiElements.push(...elements)
    }
  })
  return hetiElements
}

const addClassForHetiElement = (): void => {
  const elements = _getHeitElements()
  if (!elements.length) {
    return
  }
  elements.forEach((element) => {
    element.classList.add('heti')
    element.classList.add('heti--serif')
  })

  // console.log(elements, window.Heti)
}

/**
 * Init Heti class and scripts
 */
const registerHetiScript = () => {
  const { load } = useScriptTag(
    hetiScript,
    (el: HTMLScriptElement) => {
      if (!window.Heti) {
        console.warn('Heti is not loaded yet')
        return
      }
      const hetiElements = new window.Heti('.heti')
      hetiElements.autoSpacing()
    },
    { immediate: true }
  )

  load()
}

export { addClassForHetiElement, registerHetiScript }
