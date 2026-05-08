import path from 'path'

/**
 * Resolves the current project root for node-side theme helpers.
 *
 * @returns Absolute path to the current working directory.
 */
const getRootPath = () => {
  const rootPath = path.resolve(process.cwd())
  // console.log('Current working directory:', process.cwd())
  // console.log('Resolved root path:', rootPath)
  return rootPath
}

/**
 * Resolves a source-like directory below the current project root.
 *
 * @param srcName - Directory name to append to the project root.
 * @returns Absolute path to the requested source directory.
 */
const getSrcPath = (srcName = 'src') => {
  const rootPath = getRootPath()
  return `${rootPath}/${srcName}`
}

export { getRootPath, getSrcPath }
