// uno.config.tsc
import { presetIcons, presetUno, transformerDirectives } from 'unocss'
import { defineConfig } from 'unocss'

export default defineConfig({
  transformers: [transformerDirectives()],
  presets: [
    presetUno(),
    presetIcons({
      warn: true,
      prefix: ['i-'],
      extraProperties: {
        display: 'inline-block'
      }
    })
  ],
  shortcuts: [
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
      'card',
      'rounded-md shadow-sm border border-[#ddd] dark:border-[#333] transition-all ease-in-out  hover:border-blue  hover:dark:border-blue ring-inset hover:border-blue hover:ring-2 hover:ring-blue'
    ],
    [
      'tag',
      'rounded-full px-[5.5px] py-1 text-xs border-solid border-gray-700 dark:border-gray-200 text-gray-900 dark:text-gray-100'
    ]
  ]
})
