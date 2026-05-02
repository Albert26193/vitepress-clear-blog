export function getThemeConfig(cfg: Record<string, unknown> = {}) {
  const pagesData: unknown[] = []
  return {
    themeConfig: {
      blog: { pagesData, ...cfg }
    }
  }
}
