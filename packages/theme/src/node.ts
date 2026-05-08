/**
 * Wraps user options in the themeConfig shape expected by the Clear Blog theme.
 *
 * @param cfg - Theme configuration values supplied by the site.
 * @returns VitePress config fragment containing Clear Blog theme settings.
 */
export function getThemeConfig(cfg: Record<string, unknown> = {}) {
  const pagesData: unknown[] = []
  return {
    themeConfig: {
      blog: { pagesData, ...cfg }
    }
  }
}
