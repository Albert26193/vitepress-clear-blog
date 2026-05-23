#!/usr/bin/env node

import { cp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const projectName = args[0] || 'my-blog'

function detectPkgManager(): string {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}

async function scaffold(projectDir: string) {
  const templateDir = join(__dirname, 'template')
  const moveDir = join(__dirname, 'move')

  // Copy template files
  await cp(templateDir, projectDir, { recursive: true })

  // Copy .gitignore (npm renames it in the package, so we ship as "gitignore")
  await cp(join(moveDir, 'gitignore'), join(projectDir, '.gitignore'))

  // Update package.json name to match project
  const pkgPath = join(projectDir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = projectName
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  const pkgManager = detectPkgManager()
  const runCmd = pkgManager === 'npm' ? 'npm run' : `${pkgManager}`

  console.log('Created successfully!')
  console.log()
  console.log(`  cd ${projectName}`)
  console.log(`  ${pkgManager} install`)
  console.log(`  ${runCmd} dev`)
}

const target = resolve(process.cwd(), projectName)

console.log(`Creating VitePress Theme Link project: ${projectName}`)
console.log()

scaffold(target).catch((err) => {
  console.error('Failed to create project:', err)
  process.exit(1)
})
