import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import NewLayout from './components/NewLayout.vue'
import './styles/main.css'

export const theme: Theme = {
  extends: DefaultTheme,
  Layout: NewLayout
}

export default theme
