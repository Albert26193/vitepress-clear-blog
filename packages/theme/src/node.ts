export function getThemeConfig(cfg: Record<string, any> = {}) {
  const pagesData: any[] = []
  return {
    themeConfig: {
      blog: { pagesData, ...cfg }
    }
  }
}
