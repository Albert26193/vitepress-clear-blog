const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const mergeDeep = (
  base: Record<string, unknown>,
  user: Record<string, unknown>,
  arraysConcat: boolean
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...base }
  for (const [key, userValue] of Object.entries(user)) {
    if (userValue === undefined) continue
    const baseValue = merged[key]
    if (isPlainObject(baseValue) && isPlainObject(userValue)) {
      merged[key] = mergeDeep(
        baseValue,
        userValue,
        arraysConcat || key === 'vite'
      )
    } else if (
      Array.isArray(baseValue) &&
      Array.isArray(userValue) &&
      (arraysConcat || key === 'head')
    ) {
      merged[key] = [...baseValue, ...userValue]
    } else {
      merged[key] = userValue
    }
  }
  return merged
}

/**
 * Merges a consumer's VitePress config over the theme-generated base so that
 * the user always wins. The contract:
 *
 * - plain objects are merged recursively, user values win per key;
 * - `head` entries are appended after the theme's (both should render);
 * - inside `vite` arrays concatenate (matching Vite's own mergeConfig
 *   semantics, so user plugins/excludes extend rather than clobber the
 *   theme's required entries);
 * - all other arrays and scalars are replaced by the user value, because for
 *   config like `themeConfig.nav` appending would duplicate entries.
 */
export const mergeUserConfig = (
  base: Record<string, unknown>,
  user: Record<string, unknown>
): Record<string, unknown> => mergeDeep(base, user, false)
