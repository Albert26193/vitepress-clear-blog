import { createHash } from 'node:crypto'

const BASE62_CHARS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/** Encodes a hex digest string as a base62 number using 0-9, A-Z and a-z. */
export const hexToBase62 = (hex: string): string => {
  let n = BigInt('0x' + hex)
  let out = ''
  while (n > 0n) {
    out = BASE62_CHARS[Number(n % 62n)] + out
    n /= 62n
  }
  return out || BASE62_CHARS[0]
}

/** Maps an input string to a long base62 alphabet used for key prefixes. */
export type DigestFn = (input: string) => string

/** SHA-256 digest re-encoded as a base62 string (~43 chars for 256 bits). */
export const sha256Base62: DigestFn = (input: string): string => {
  const hex = createHash('sha256').update(input).digest('hex')
  return hexToBase62(hex)
}

export interface ShortlinkInput {
  /** Canonical page identity the short link points to (its route path). */
  url: string
  /**
   * Stable page identity read from frontmatter (e.g. `page_id`). Keys are
   * derived from this id rather than the route, so a page keeps its short link
   * across renames as long as the id stays in its frontmatter.
   */
  id: string
}

export interface ShortlinkEntry extends ShortlinkInput {
  /** Final short key — always at least keyLength chars, unique across the set. */
  key: string
  /** True when keyLength had to be extended because a prefix collided. */
  extended: boolean
}

/**
 * Computes a short key for every page. Each key is the shortest base62 prefix of
 * the page id's SHA-256 digest that is globally unique in the set, bounded below
 * by keyLength. This keeps keys deterministic and short while making collisions
 * impossible rather than merely improbable: a colliding id simply receives a
 * longer prefix.
 *
 * Two pages sharing the exact same id would share the same digest and degrade
 * the prefix algorithm into duplicate full-length keys, so identical ids are
 * rejected up front with the two offending pages named.
 *
 * `digest` is injectable so tests can force collisions.
 */
export const computeShortlinks = (
  inputs: ShortlinkInput[],
  keyLength = 6,
  digest: DigestFn = sha256Base62
): ShortlinkEntry[] => {
  const seen = new Map<string, string>()
  for (const { url, id } of inputs) {
    const existing = seen.get(id)
    if (existing) {
      throw new Error(
        `duplicate shortlink id "${id}" declared in "${existing}" and "${url}"`
      )
    }
    seen.set(id, url)
  }

  const items = inputs.map(({ url, id }) => ({ url, id, encoded: digest(id) }))
  const prefixCount = new Map<string, number>()

  // Count every prefix between keyLength and the full digest so that
  // "is this prefix shared?" is a single map lookup.
  for (const item of items) {
    for (let len = keyLength; len <= item.encoded.length; len++) {
      const prefix = item.encoded.slice(0, len)
      prefixCount.set(prefix, (prefixCount.get(prefix) ?? 0) + 1)
    }
  }

  return items.map(({ url, id, encoded }) => {
    let len = keyLength
    while (
      len < encoded.length &&
      (prefixCount.get(encoded.slice(0, len)) ?? 0) > 1
    ) {
      len++
    }
    return {
      url,
      id,
      key: encoded.slice(0, len),
      extended: len > keyLength
    }
  })
}
