declare module 'virtual:vitepress-analyzer' {
  import type { ClientAPI } from 'vitepress-plugin-analyzer'
  export * from 'vitepress-plugin-analyzer'

  // 导出 ClientAPI 接口中定义的所有函数
  export const getPageMetadata: ClientAPI['getPageMetadata']
  export const getAllMetadata: ClientAPI['getAllMetadata']
  export const getPageWordCount: ClientAPI['getPageWordCount']
  export const getPageHeadings: ClientAPI['getPageHeadings']
  export const getPageOutgoingLinks: ClientAPI['getPageOutgoingLinks']
  export const getPageBackLinks: ClientAPI['getPageBackLinks']
}
