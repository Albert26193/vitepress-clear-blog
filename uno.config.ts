// uno.config.ts
import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: [
    [
      'btn',
      'px-4 py-1 rounded inline-block bg-teal-600 text-white cursor-pointer hover:bg-teal-700 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'
    ],
    [
      'icon-btn',
      'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'
    ],
    [
      'card-hover',
      'transition duration-200 ease-in-out dark:hover:border-blue hover:border-blue border'
    ],
    ['title-font', 'text-left text-blue font-600 text-2xl my-4 text-shadow'],
    ['title-btn', 'my-4 mb-[150px] flex flex-row justify-start'],
    [
      'common-border',
      'inline-flex mr-4 rounded px-4 py-2 font-bold focus:outline-none focus-visible:ring hover:cursor-default transition duration-100 animate-shadow text-gray-800 dark:text-gray-100'
    ],
    ['card-border', 'rounded-md z-50 hover:cursor-default'],
    [
      'header-link',
      'px-3 mx-1 py-2 transition-all duration-150 hover:cursor-default hover:text-blue font-500 hover:cursor-pointer'
    ],
    [
      'card',
      'rounded-md shadow-sm border border-[#ddd] dark:border-[#333] transition-all ease-in-out  hover:border-blue  hover:dark:border-blue ring-inset hover:border-blue hover:ring-2 hover:ring-blue'
    ],
    ['mobile-head-link', 'header-link text-2xl my-1 mt-1 mr-2 line-height-12']
  ]
})
