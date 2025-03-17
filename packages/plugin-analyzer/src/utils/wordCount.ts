/**
 * Remove frontmatter from markdown content
 * @param content - The markdown content
 * @returns The content without frontmatter
 */
const removeFrontmatter = (content: string): string => {
  const frontmatterRegex = /^---[\s\S]*?---/
  return content.replace(frontmatterRegex, '')
}

/**
 * Calculate word count in markdown content
 * This function handles both English words and CJK characters
 * @param content - The markdown content
 * @returns The word count
 */
export const calculateWords = (content: string): number => {
  // Remove frontmatter before counting
  const contentWithoutFrontmatter = removeFrontmatter(content)

  // Pattern for matching words and CJK characters
  const pattern =
    /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = contentWithoutFrontmatter.match(pattern)

  let count = 0
  if (!m) {
    return 0
  }

  // Count words, treating each CJK character as one word
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4e00) {
      count += m[i].length
    } else {
      count += 1
    }
  }

  return count
}
