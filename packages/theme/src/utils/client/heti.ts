import { useScriptTag } from '@vueuse/core'
import hetiScript from 'heti/umd/heti-addon.min.js?url'

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

/**
 * Adds Heti classes to VitePress content regions so Chinese typography is applied consistently.
 *
 * @returns Nothing; matching DOM elements are updated in place.
 */
const addClassForHetiElement = (): void => {
  const elements = _getHeitElements()
  if (!elements.length) {
    return
  }
  elements.forEach((element) => {
    element.classList.add('heti')
    element.classList.add('heti--serif')
  })
}

/**
 * Loads Heti after content exists so automatic spacing can run against hydrated pages.
 *
 * @returns Nothing once the Heti script has loaded and spacing has been applied.
 */
const registerHetiScript = async () => {
  const { load } = useScriptTag(hetiScript, () => {}, { immediate: false })
  await load()

  if (!window.Heti) {
    return
  }

  await new Promise<void>((resolve) => {
    const poll = () => {
      if (document.querySelectorAll('.heti').length > 0) resolve()
      else setTimeout(poll, 100)
    }
    poll()
  })

  const heti = new window.Heti('.heti')
  heti.autoSpacing()
}

export { addClassForHetiElement, registerHetiScript }
