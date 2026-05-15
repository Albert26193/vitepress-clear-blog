import type { SlideData } from 'photoswipe'
import PhotoSwipeLightbox from 'photoswipe/lightbox'

import { Post } from '../../types/types.d'

/**
 * Groups posts by tag so tag pages can reuse one normalized lookup table.
 *
 * @param post Array of posts to group.
 * @returns Posts keyed by tag name.
 */
const initTags = (post: Post[]) => {
  const data: Record<string, Post[]> = {}
  for (let index = 0; index < post.length; index++) {
    const element = post[index]
    const tags = element.frontMatter.tags
    if (tags) {
      tags.forEach((item: string) => {
        if (data[item]) {
          data[item].push(element)
        } else {
          data[item] = []
          data[item].push(element)
        }
      })
    }
  }
  return data
}

/**
 * Groups posts by year for archive views that need stable reverse-chronological buckets.
 *
 * @param posts Posts to organize by frontmatter year.
 * @returns Year buckets ordered from newest to oldest.
 */
const useYearSort = (posts: Post[]): Post[][] => {
  if (!posts) {
    return []
  }
  const sortedByYear = posts.reduce(
    (acc: Record<string, Post[]>, post: Post) => {
      if (post.frontMatter.date) {
        const year = post.frontMatter.date.split('-')[0]
        if (!acc[year]) {
          acc[year] = []
        }
        acc[year].push(post)
      }
      return acc
    },
    {}
  )
  const sortedYears = Object.keys(sortedByYear).sort((a, b) =>
    b.localeCompare(a)
  )
  const sortedPostsByYear = sortedYears.map((year) => sortedByYear[year])
  return sortedPostsByYear
}

/**
 * Groups posts by year and month for calendar-like archive navigation.
 *
 * @param posts Posts to organize by frontmatter date.
 * @returns Nested year and month buckets.
 */
const useMonthYearSort = (
  posts: Post[]
): Record<string, Record<string, Post[]>> => {
  if (!posts) {
    return {}
  }
  return posts.reduce(
    (acc: Record<string, Record<string, Post[]>>, post: Post) => {
      if (post.frontMatter.date) {
        const [year, month] = post.frontMatter.date.split('-')
        acc[year] = acc[year] || {}
        acc[year][month] = acc[year][month] || []
        acc[year][month].push(post)
      }
      return acc
    },
    {}
  )
}

/**
 * Counts mixed-language content for reading-time and metadata displays.
 *
 * @param content Content to count after Markdown has been loaded.
 * @returns Word-like count with CJK characters counted individually.
 */
const calculateWords = (content: string): number => {
  const pattern =
    /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = content.match(pattern)
  let count = 0
  if (!m) {
    return 0
  }
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4e00) {
      count += m[i].length
    } else {
      count += 1
    }
  }
  return count
}

let photoSwipeLightbox: PhotoSwipeLightbox | null = null

const SVG_SECONDARY_ZOOM_LEVEL = 2

const restoreImageViewerSideEffects = () => {
  document.querySelectorAll('.shiki [data-language]').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.display = ''
    }
  })

  document.body.style.overflow = ''
}

const getImageDimension = (
  image: HTMLImageElement,
  dimension: 'width' | 'height'
): number => {
  const naturalDimension =
    dimension === 'width' ? image.naturalWidth : image.naturalHeight
  if (naturalDimension > 0) return naturalDimension

  const attributeValue = Number(image.getAttribute(dimension))
  if (attributeValue > 0) return attributeValue

  const rectDimension = image.getBoundingClientRect()[dimension]
  if (rectDimension > 0) return Math.round(rectDimension)

  return 1
}

const isSvgImage = (src: string): boolean => {
  const normalizedSrc = src.split('#')[0].split('?')[0].toLowerCase()
  return src.startsWith('data:image/svg+xml') || normalizedSrc.endsWith('.svg')
}

const createPhotoSwipeItemData = (
  itemData: SlideData,
  element: HTMLElement
): SlideData => {
  const image = element instanceof HTMLImageElement ? element : null
  if (!image) return itemData

  const src = image.currentSrc || image.src
  if (!src) return itemData

  const width = getImageDimension(image, 'width')
  const height = getImageDimension(image, 'height')

  if (isSvgImage(src)) {
    const rect = image.getBoundingClientRect()
    const renderedW = rect.width > 0 ? Math.round(rect.width) : 0
    const renderedH = rect.height > 0 ? Math.round(rect.height) : 0

    return {
      ...itemData,
      src,
      msrc: src,
      width: Math.max(width, renderedW, 1),
      height: Math.max(height, renderedH, 1),
      secondaryZoomLevel: SVG_SECONDARY_ZOOM_LEVEL,
      alt: image.alt
    }
  }

  return {
    ...itemData,
    src,
    msrc: src,
    width,
    height,
    alt: image.alt
  }
}

const photoSwipeInit = () => {
  photoSwipeLightbox?.destroy()
  restoreImageViewerSideEffects()

  photoSwipeLightbox = new PhotoSwipeLightbox({
    gallery: 'body',
    children: '.main img',
    bgOpacity: 0.92,
    padding: { top: 18, bottom: 18, left: 18, right: 18 },
    showHideAnimationType: 'none',
    pswpModule: () => import('photoswipe')
  })

  photoSwipeLightbox.addFilter('domItemData', createPhotoSwipeItemData)

  photoSwipeLightbox.on('beforeOpen', () => {
    document.querySelectorAll('.shiki [data-language]').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none'
      }
    })

    document.body.style.overflow = 'hidden'
  })

  photoSwipeLightbox.on('close', restoreImageViewerSideEffects)
  photoSwipeLightbox.on('destroy', restoreImageViewerSideEffects)
  photoSwipeLightbox.init()
}

export {
  initTags,
  useYearSort,
  useMonthYearSort,
  calculateWords,
  photoSwipeInit
}
