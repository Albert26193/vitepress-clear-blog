// 主题入口文件
import { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import NewLayout from './components/NewLayout.vue'
import './styles/index.css'

export default {
  extends: DefaultTheme,
  Layout: NewLayout,
  enhanceApp({ app }) {
    // 注册组件
  }
} as Theme
