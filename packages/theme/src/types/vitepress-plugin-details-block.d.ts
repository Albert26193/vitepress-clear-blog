declare module 'vitepress-plugin-details-block' {
  import type { DefineComponent } from 'vue'

  export const DetailsBlock: DefineComponent<{
    summary?: string
    open?: boolean
  }>

  export default DetailsBlock
}
