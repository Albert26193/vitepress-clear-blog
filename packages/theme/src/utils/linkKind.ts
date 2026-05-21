const ASSET_EXTENSION_RE =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|mp4|webm|mp3|wav|ogg|pdf|zip|gz|css|mjs?|json|xml|txt|woff2?|ttf|otf|eot|wasm)$/i
const PROTOCOL_RE = /^[a-z][a-z0-9+.-]*:/i

type LinkKind =
  | 'pageCandidate'
  | 'asset'
  | 'hash'
  | 'external'
  | 'protocolRelative'

const stripHashAndQuery = (href: string): string => href.split(/[?#]/)[0]

export const classifyHref = (href: string): LinkKind | null => {
  const trimmed = href.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) return 'hash'
  if (trimmed.startsWith('//')) return 'protocolRelative'
  if (PROTOCOL_RE.test(trimmed)) return 'external'

  return ASSET_EXTENSION_RE.test(stripHashAndQuery(trimmed))
    ? 'asset'
    : 'pageCandidate'
}

export type { LinkKind }
