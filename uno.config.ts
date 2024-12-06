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
  theme: {
    animation: {
      keyframes: {
        custom: '{0%, 100% {opacity:1} 50% {opacity:.5}}'
      },
      durations: {
        custom: '1s'
      },
      timingFns: {
        custom: 'cubic-bezier(0.4,0,.6,1)'
      },
      properties: {
        custom: { 'transform-origin': 'center' }
      },
      counts: {
        custom: 2
      },
      category: {
        custom: 'custom'
      }
    }
  },
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
      'tag',
      'rounded-full px-[5px] py-[3px] text-xs border-solid box-border border-gray-700 dark:border-gray-200 text-gray-900 dark:text-gray-100 hover:text-[var(--vp-c-brand)] hover:border-[var(--vp-c-brand)]'
    ],
    ['custom-page-layout', 'w-4/5 h-full mx-auto max-w-1280px']
  ]
})
