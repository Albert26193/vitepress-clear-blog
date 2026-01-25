declare module 'markdown-it-task-lists' {
  import MarkdownIt from 'markdown-it'

  interface TaskListsOptions {
    /**
     * If truthy, the input's disabled attribute is set to false
     * @default false
     */
    enabled?: boolean

    /**
     * If truthy, the list items are wrapped in a <label> element
     * @default false
     */
    label?: boolean

    /**
     * If truthy and label is truthy, the label element is placed after the checkbox
     * @default false
     */
    labelAfter?: boolean
  }

  function taskLists(md: MarkdownIt, options?: TaskListsOptions): void

  export default taskLists
}
