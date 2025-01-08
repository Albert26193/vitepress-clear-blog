/// <reference types="./types/vite-env.d.ts" />

// 工具函数可以在客户端使用
export { calculateWords } from './wordCount'
export * from './types'

// 导出插件
export { markdownAnalyzerPlugin } from './analyzer'
