import path from 'path'

/**
 * Get root path for project
 */
const getRootPath = () => {
  const rootPath = path.resolve(process.cwd())
  // console.log('Current working directory:', process.cwd())
  // console.log('Resolved root path:', rootPath)
  return rootPath
}

/**
 * Get src path for project
 *
 * @param srcName - src name
 * @returns src path
 */
const getSrcPath = (srcName = 'src') => {
  const rootPath = getRootPath()
  return `${rootPath}/${srcName}`
}

export { getRootPath, getSrcPath }