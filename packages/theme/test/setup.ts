// jsdom compatibility: ensure TextEncoder/TextDecoder use Node.js constructors
// jsdom can install shim constructors that break esbuild's invariants
import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder
} from 'node:util'

globalThis.TextEncoder = NodeTextEncoder
globalThis.TextDecoder = NodeTextDecoder as typeof globalThis.TextDecoder
