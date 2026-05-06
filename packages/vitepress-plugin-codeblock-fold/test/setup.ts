import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder
} from 'node:util'

globalThis.TextEncoder = NodeTextEncoder as typeof globalThis.TextEncoder
globalThis.TextDecoder = NodeTextDecoder as typeof globalThis.TextDecoder
