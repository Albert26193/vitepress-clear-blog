import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateThemePlugin } from '../src/config'
import { CONFIG_PATH } from '../src/defaults'

const { mockClearConfigCacheEntry, mockGenerateThemeFile, mockLoadConfig } =
  vi.hoisted(() => ({
    mockClearConfigCacheEntry: vi.fn(),
    mockGenerateThemeFile: vi.fn(),
    mockLoadConfig: vi.fn()
  }))

vi.mock('../src/loader', () => ({
  clearConfigCacheEntry: mockClearConfigCacheEntry,
  loadConfig: mockLoadConfig
}))

vi.mock('../src/node', () => ({
  generateThemeFile: mockGenerateThemeFile
}))

const createServer = () => {
  let changeHandler: ((file: string) => Promise<void>) | undefined
  const cssModule = { id: '/virtual/.vitepress/theme/styles/generated.css' }
  const server = {
    watcher: {
      add: vi.fn(),
      on: vi.fn((event: string, handler: (file: string) => Promise<void>) => {
        if (event === 'change') changeHandler = handler
      })
    },
    moduleGraph: {
      getModuleById: vi.fn(() => cssModule),
      invalidateModule: vi.fn()
    },
    ws: {
      send: vi.fn()
    },
    restart: vi.fn()
  }

  return { cssModule, getChangeHandler: () => changeHandler, server }
}

describe('generateThemePlugin', () => {
  const cwd = '/virtual/site'
  const configFilePath = resolve(cwd, CONFIG_PATH)

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(process, 'cwd').mockReturnValue(cwd)
    mockClearConfigCacheEntry.mockReset()
    mockGenerateThemeFile.mockReset().mockResolvedValue(undefined)
    mockLoadConfig.mockReset()
  })

  it('restarts the dev server when markdown theme changes', async () => {
    mockLoadConfig
      .mockReturnValueOnce({
        theme: {},
        markdown: { theme: { light: 'github-light', dark: 'ayu-dark' } }
      })
      .mockReturnValueOnce({
        theme: {},
        markdown: { theme: { light: 'vitesse-light', dark: 'vitesse-dark' } }
      })
    const plugin = generateThemePlugin()
    const { getChangeHandler, server } = createServer()

    await (plugin as any).buildStart()
    ;(plugin as any).configureServer(server)
    await getChangeHandler()!(configFilePath)

    expect(mockClearConfigCacheEntry).toHaveBeenCalledTimes(1)
    expect(server.restart).toHaveBeenCalledTimes(1)
    expect(server.ws.send).not.toHaveBeenCalled()
    expect(server.moduleGraph.invalidateModule).not.toHaveBeenCalled()
  })

  it('full-reloads generated CSS when markdown theme is unchanged', async () => {
    mockLoadConfig
      .mockReturnValueOnce({ theme: {}, markdown: { theme: undefined } })
      .mockReturnValueOnce({
        theme: { 'vp-c-brand': '#ff0000' },
        markdown: { theme: undefined }
      })
    const plugin = generateThemePlugin()
    const { cssModule, getChangeHandler, server } = createServer()

    await (plugin as any).buildStart()
    ;(plugin as any).configureServer(server)
    await getChangeHandler()!(configFilePath)

    expect(server.restart).not.toHaveBeenCalled()
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(cssModule)
    expect(server.ws.send).toHaveBeenCalledWith({
      type: 'full-reload',
      path: '*'
    })
  })
})
