const calculateWords = (content: string): number => {
  // Store original content for code blocks
  let codeContent = ''

  // Remove frontmatter
  content = content.replace(/^---[\s\S]*?---/, '')

  // Extract and store code blocks before removing them
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    // Remove ``` markers and language identifier
    const code = match
      .replace(/```.*\n/, '') // Remove opening ``` and language
      .replace(/```$/, '') // Remove closing ```
      .trim()
    codeContent += ' ' + code
    return ' ' // Replace with space to maintain word boundaries
  })

  // Extract and store inline code
  content = content.replace(/`[^`]*`/g, (match) => {
    const code = match.slice(1, -1).trim() // Remove backticks
    codeContent += ' ' + code
    return ' ' // Replace with space to maintain word boundaries
  })

  // Remove Markdown formatting while keeping the text content
  content = content
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Keep link text, remove URL
    .replace(/[*_]{1,2}([^*_]*)[*_]{1,2}/g, '$1') // Remove bold and italic markers
    .replace(/^>.*$/gm, (match) => match.replace(/^>\s*/, '')) // Remove blockquote markers
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list item markers

  // Combine main content with code content for processing
  const fullContent = content + ' ' + codeContent

  // Count Chinese characters (excluding punctuation)
  const chineseChars = (fullContent.match(/[\u4e00-\u9fa5]/g) || []).length

  // Process English words
  // 1. Replace Chinese characters and punctuation with spaces
  let processedContent = fullContent
    .replace(/[\u4e00-\u9fa5]/g, ' ') // Replace Chinese characters
    .replace(
      /[\u3000-\u303f\uff00-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]/g,
      ' '
    ) // Replace Chinese punctuation
    .replace(/[.,!?;:"'()[\]{}]/g, ' ') // Replace English punctuation

  // 2. Handle special cases and normalize whitespace
  processedContent = processedContent
    .replace(/[-/\\](?!\w)/g, ' ') // Replace standalone symbols
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim()

  // 3. Count valid English words with specific rules
  const words = processedContent.split(' ').filter((word) => {
    if (!word) return false // Skip empty strings
    if (/^\d+$/.test(word)) return false // Skip pure numbers
    if (word === '-') return false // Skip standalone hyphens
    if (word.length === 1 && !/[a-zA-Z]/.test(word)) return false // Skip single non-letter characters
    return true
  })

  // Return total count of Chinese characters and English words
  return chineseChars + words.length
}

export { calculateWords }
