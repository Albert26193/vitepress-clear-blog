// 声明 Heti 模块
declare module 'heti/umd/heti-addon.min.js' {
  // 这里不需要具体内容，只需要声明模块存在
}

// 声明 Heti 类型
interface HetiConstructor {
  new (selector: string): {
    autoSpacing: () => void
  }
}

// 扩展全局 Window 接口
declare global {
  interface Window {
    Heti: HetiConstructor
  }
}
