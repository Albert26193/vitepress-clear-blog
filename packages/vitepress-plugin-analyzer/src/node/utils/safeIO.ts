import { ResultAsync } from 'neverthrow'
import type { Dirent } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'

export interface AnalyzerError {
  readonly type: 'FILE_READ' | 'DIR_READ'
  readonly path: string
  readonly message: string
}

export function toAnalyzerError(
  type: AnalyzerError['type'],
  path: string,
  e: unknown
): AnalyzerError {
  return {
    type,
    path,
    message: e instanceof Error ? e.message : String(e)
  }
}

export function safeReadFile(
  filePath: string
): ResultAsync<string, AnalyzerError> {
  return ResultAsync.fromPromise(readFile(filePath, 'utf-8'), (e) =>
    toAnalyzerError('FILE_READ', filePath, e)
  )
}

export function safeReaddir(
  dirPath: string
): ResultAsync<Dirent[], AnalyzerError> {
  return ResultAsync.fromPromise(
    readdir(dirPath, { withFileTypes: true }),
    (e) => toAnalyzerError('DIR_READ', dirPath, e)
  )
}
