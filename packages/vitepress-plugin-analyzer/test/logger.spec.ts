import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Re-import after env manipulation so the module sees the current env
const loadLogger = async () => await import('../src/node/utils/logger')

describe('analyzer logger', () => {
  let logger: Awaited<ReturnType<typeof loadLogger>>['logger']
  let setAnalyzerLogLevel: Awaited<
    ReturnType<typeof loadLogger>
  >['setAnalyzerLogLevel']

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupAt = async (level: string) => {
    vi.stubEnv('VITEPRESS_ANALYZER_LOG_LEVEL', level)
    vi.stubEnv('NODE_ENV', 'production')
    const mod = await loadLogger()
    logger = mod.logger
    setAnalyzerLogLevel = mod.setAnalyzerLogLevel
  }

  it('does not log below active level', async () => {
    await setupAt('error')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.info('should not appear')
    expect(spy).not.toHaveBeenCalled()
  })

  it('writes error messages', async () => {
    await setupAt('error')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('something broke')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('something broke'))
  })

  it('writes warn messages', async () => {
    await setupAt('warn')
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('a warning')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('a warning'))
  })

  it('writes info messages', async () => {
    await setupAt('info')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('an info')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('an info'))
  })

  it('writes debug messages', async () => {
    await setupAt('debug')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.debug('a debug')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('a debug'))
  })

  it('suppresses everything in silent mode', async () => {
    await setupAt('silent')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    setAnalyzerLogLevel('silent')
    logger.error('hidden')
    logger.warn('hidden')
    logger.info('hidden')
    logger.debug('hidden')
    expect(spy).not.toHaveBeenCalled()
  })

  it('includes namespace prefix in output', async () => {
    await setupAt('info')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('test')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[vitepress-analyzer] test')
    )
  })

  it('passes extra arguments through', async () => {
    await setupAt('info')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('msg', { a: 1 }, [2, 3])
    expect(spy).toHaveBeenCalledWith(expect.any(String), { a: 1 }, [2, 3])
  })

  it('keeps current level when given undefined with no env override', async () => {
    await setupAt('error')
    vi.stubEnv('VITEPRESS_ANALYZER_LOG_LEVEL', 'garbage')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    setAnalyzerLogLevel(undefined)
    logger.info('should not appear')
    expect(spy).not.toHaveBeenCalled()
  })

  it('updates level via setAnalyzerLogLevel', async () => {
    await setupAt('error')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('before')
    expect(spy).not.toHaveBeenCalled()

    setAnalyzerLogLevel('info')
    logger.info('after')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('after'))
  })
})
