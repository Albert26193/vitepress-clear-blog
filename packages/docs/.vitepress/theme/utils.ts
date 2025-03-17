import fsExtra from 'fs-extra'
import { globby } from 'globby'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import path, { resolve } from 'path'
import UnoCSS from 'unocss/vite'
import { Post, PostFrontMatter } from 'vitepress-clear-blog/types'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'

/**
 * Get all posts and generate pagination pages
 *
 * @param pageSize Number of posts per page
 * @returns List of posts
 */
const getPosts = async (pageSize: number): Promise<Post[]> => {
  const rootPath = getRootPath()
  // console.log('Root Path:', rootPath)

  const blogPattern = resolve(rootPath, 'docs/blogs/**/*.md')
  // console.log('Blog Pattern:', blogPattern)

  const paths = await globby([blogPattern])
  // console.log('Found blog files:', paths)

  if (paths.length === 0) {
    // console.warn('No blog posts found!')
    return []
  }

  const posts = await Promise.all(
    paths.map(async (item) => {
      // console.log('Processing blog file:', item)
      const content = await fsExtra.readFile(item, 'utf-8')
      const parsed = matter(content)
      if (!parsed.data.title || !parsed.data.date) {
        throw new Error(`Invalid frontmatter in ${item}: missing title or date`)
      }
      const data = parsed.data as PostFrontMatter

      data.date = _convertDate(data.date)
      const path = item.split('docs/').pop() as string

      return {
        frontMatter: data,
        regularPath: `/${path.replace('.md', '.html')}`
      }
    })
  )
  posts.sort(_compareDate)
  return posts
}

/**
 * Convert date to YYYY-MM-DD format
 *
 * @param date Date string
 * @returns Date string in YYYY-MM-DD format
 */
function _convertDate(date = new Date().toString()) {
  const json_date = new Date(date).toJSON()

  return json_date.split('T')[0]
}

/**
 * Compare two posts by date
 *
 * @param a First post
 * @param b Second post
 * @returns 1 if a is newer than b, -1 otherwise
 */
function _compareDate(a: Post, b: Post): number {
  return a.frontMatter.date < b.frontMatter.date ? 1 : -1
}

/**
 * Get root path for project
 */
const getRootPath = () => {
  const rootPath = path.resolve(process.cwd())
  // console.log('Current working directory:', process.cwd())
  // console.log('Resolved root path:', rootPath)
  return rootPath
}

/**
 * Get src path for project
 *
 * @param srcName - src name
 * @returns src path
 */
const getSrcPath = (srcName = 'src') => {
  const rootPath = getRootPath()
  return `${rootPath}/${srcName}`
}

const getFooterRefTag = (md: MarkdownIt) => {
  // 用于存储脚注内容的映射
  const footnoteContents: Record<string, string> = {}

  // 捕获脚注内容
  const originalFootnoteOpen =
    md.renderer.rules.footnote_open ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options))
  md.renderer.rules.footnote_open = (tokens, idx, options, env, self) => {
    const id = tokens[idx].meta.id

    // 查找下一个脚注内容标记
    let contentIndex = idx + 1
    let contentText = ''
    const contentTokens: Token[] = []

    while (
      contentIndex < tokens.length &&
      !(
        tokens[contentIndex].type === 'footnote_close' &&
        tokens[contentIndex].level === tokens[idx].level
      )
    ) {
      if (tokens[contentIndex].type === 'inline') {
        contentText += tokens[contentIndex].content
        contentTokens.push(tokens[contentIndex])
      }
      contentIndex++
    }

    // 渲染脚注内容为 HTML
    let renderedContent = ''
    if (contentTokens.length > 0) {
      // 创建一个临时的 Token 数组用于渲染
      const tempTokens = [...contentTokens]

      // 使用 markdown-it 渲染内联内容
      for (const token of tempTokens) {
        renderedContent += md.renderer.renderInline(
          token.children || [],
          options,
          env
        )
      }
    }

    // 存储脚注内容 (已渲染为 HTML)
    footnoteContents[id] = renderedContent || contentText

    return originalFootnoteOpen(tokens, idx, options, env, self)
  }

  // 自定义脚注引用渲染
  const originalFootnoteRef = md.renderer.rules.footnote_ref
  md.renderer.rules.footnote_ref = (tokens, idx, options, env, self) => {
    const id = tokens[idx].meta?.id || idx
    let refLabel = ''

    if (originalFootnoteRef) {
      const originalHTML = originalFootnoteRef(tokens, idx, options, env, self)
      const match = originalHTML.match(/>([^<]+)<\/a>/)
      refLabel = match ? match[1] : `${id}`
    } else {
      refLabel = tokens[idx].meta?.label || `${id}`
    }

    // 获取脚注内容，如果没有则使用空字符串
    const content = footnoteContents[id] || ''

    // 清理标签文本中的括号
    const cleanLabel = refLabel.replace(/\[|\]/g, '')

    return `<FooterRef content="${content}" text="${cleanLabel}" id="${id}" />`
  }

  // // 自定义脚注区块开始 (添加标题和样式)
  // md.renderer.rules.footnote_block_open = () =>
  //   '<section class="footnotes">\n' +
  //   '<h4 class="footnotes-title">脚注</h4>\n' +
  //   '<ol class="footnotes-list">\n'
}

export { getPosts, getRootPath, getSrcPath, getFooterRefTag }

//temp
const getThemeConfig = async (cfg = {}) => {
  return {
    blog: {
      title: 'DDDDDDDocs',
      // vite: {
      //   server: { port: 4000 },
      //   plugins: [
      //     vitePressAnalyzerPlugin(),
      //     // generateThemePlugin(),
      //     UnoCSS()
      //     //RssPlugin(RSS)
      //   ]
      // },
      ...cfg
    }
  }
}

export { getThemeConfig }
