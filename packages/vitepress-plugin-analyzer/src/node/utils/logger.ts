import type { AnalyzerLogLevel } from '../../../types'

const levelPriority: Record<AnalyzerLogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
}

const namespace = '[vitepress-analyzer]'

const normalizeLevel = (
  level: string | undefined
): AnalyzerLogLevel | undefined => {
  if (
    level === 'silent' ||
    level === 'error' ||
    level === 'warn' ||
    level === 'info' ||
    level === 'debug'
  ) {
    return level
  }
}

let activeLevel: AnalyzerLogLevel =
  normalizeLevel(process.env.VITEPRESS_ANALYZER_LOG_LEVEL) ??
  normalizeLevel(process.env.ANALYZER_LOG_LEVEL) ??
  (process.env.NODE_ENV === 'development' ? 'debug' : 'warn')

export const setAnalyzerLogLevel = (level?: AnalyzerLogLevel): void => {
  activeLevel =
    level ??
    normalizeLevel(process.env.VITEPRESS_ANALYZER_LOG_LEVEL) ??
    activeLevel
}

const shouldLog = (level: Exclude<AnalyzerLogLevel, 'silent'>): boolean => {
  return levelPriority[activeLevel] >= levelPriority[level]
}

const writeLog = (
  level: Exclude<AnalyzerLogLevel, 'silent'>,
  message: string,
  ...args: unknown[]
): void => {
  if (!shouldLog(level)) {
    return
  }

  const output = `${namespace} ${message}`

  if (level === 'error') {
    console.error(output, ...args)
    return
  }

  if (level === 'warn') {
    console.warn(output, ...args)
    return
  }

  console.info(output, ...args)
}

export const logger = {
  error: (message: string, ...args: unknown[]): void =>
    writeLog('error', message, ...args),
  warn: (message: string, ...args: unknown[]): void =>
    writeLog('warn', message, ...args),
  info: (message: string, ...args: unknown[]): void =>
    writeLog('info', message, ...args),
  debug: (message: string, ...args: unknown[]): void =>
    writeLog('debug', message, ...args)
}
