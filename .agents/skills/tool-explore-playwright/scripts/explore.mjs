#!/usr/bin/env node
import { chromium } from '@playwright/test'
import { tmpdir } from 'os'
import { join } from 'path'

const USAGE = `Usage: node explore.mjs --url <url> --action <action> [options]

Actions:
  eval             Execute JS in page, return JSON
    --code <js>      JS expression to evaluate (required)
    --selector <css> If given, runs code with element as context (el in scope)

  html             Get rendered outerHTML
    --selector <css> If given, returns only that element's outerHTML

  screenshot       Take a screenshot
    --selector <css>       If given, screenshots only that element
    --screenshot-path <p>  Output path (default: temp file)

  computed-styles  Query getComputedStyle() for an element
    --selector <css>   CSS selector (required)
    --property <name>  Specific CSS property (default: all)

Options:
  --timeout <ms>      Navigation timeout (default: 15000)
  --wait-until <s>    load | domcontentloaded | networkidle (default: networkidle)
`

function parseArgv(argv) {
  const args = {}
  let i = 0
  while (i < argv.length) {
    const key = argv[i]
    if (key === '--help' || key === '-h') {
      args.help = true
      i++
      continue
    }
    const val = argv[i + 1]
    if (val === undefined || val.startsWith('--')) {
      console.error(`Missing value for ${key}`)
      process.exit(1)
    }
    args[key.replace(/^--/, '')] = val
    i += 2
  }
  return args
}

function validateArgs(args) {
  if (args.help) return { valid: false, error: null, help: true }

  if (!args.url) return { valid: false, error: '--url is required' }
  if (!args.url.startsWith('http://') && !args.url.startsWith('https://')) {
    return { valid: false, error: '--url must start with http:// or https://' }
  }

  const actions = ['eval', 'html', 'screenshot', 'computed-styles']
  if (!args.action) return { valid: false, error: '--action is required' }
  if (!actions.includes(args.action)) {
    return { valid: false, error: `--action must be one of: ${actions.join(', ')}` }
  }

  if (args.action === 'eval' && !args.code) {
    return { valid: false, error: '--code is required for eval action' }
  }
  if (args.action === 'computed-styles' && !args.selector) {
    return { valid: false, error: '--selector is required for computed-styles action' }
  }

  return { valid: true, error: null }
}

function result(ok, data, extra = {}) {
  return JSON.stringify({ ok, data, ...extra })
}

async function main() {
  const args = parseArgv(process.argv.slice(2))
  const validation = validateArgs(args)

  if (validation.help || (!validation.valid && validation.error)) {
    if (validation.help) {
      console.error(USAGE)
      process.exit(0)
    }
    console.error(USAGE)
    console.error(`\nError: ${validation.error}`)
    process.exit(1)
  }

  const url = args.url
  const action = args.action
  const code = args.code || null
  const selector = args.selector || null
  const property = args.property || null
  const timeout = parseInt(args.timeout || '15000', 10)
  const waitUntil = args['wait-until'] || 'networkidle'
  const screenshotPath = args['screenshot-path'] || null

  let browser = null
  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    })
    const page = await context.newPage()

    await page.goto(url, { timeout, waitUntil })

    let output

    switch (action) {
      case 'eval': {
        if (selector) {
          output = await page.evaluate(
            ({ sel, codeStr }) => {
              const el = document.querySelector(sel)
              if (!el) throw new Error(`Element not found: ${sel}`)
              return eval(codeStr)
            },
            { sel: selector, codeStr: code }
          )
        } else {
          output = await page.evaluate((codeStr) => eval(codeStr), code)
        }
        break
      }

      case 'html': {
        if (selector) {
          output = await page.evaluate((sel) => {
            const el = document.querySelector(sel)
            if (!el) throw new Error(`Element not found: ${sel}`)
            return el.outerHTML
          }, selector)
        } else {
          output = await page.evaluate(() => document.documentElement.outerHTML)
        }
        break
      }

      case 'screenshot': {
        const outPath =
          screenshotPath || join(tmpdir(), `playwright-explore-${Date.now()}.png`)
        if (selector) {
          const el = page.locator(selector).first()
          await el.screenshot({ path: outPath })
        } else {
          await page.screenshot({ path: outPath, fullPage: true })
        }
        console.log(result(true, null, { path: outPath }))
        return
      }

      case 'computed-styles': {
        output = await page.evaluate(
          ({ sel, prop }) => {
            const el = document.querySelector(sel)
            if (!el) throw new Error(`Element not found: ${sel}`)
            const style = getComputedStyle(el)
            if (prop) return style.getPropertyValue(prop)
            const out = {}
            const len = Math.min(style.length, 500)
            for (let i = 0; i < len; i++) {
              const name = style[i]
              out[name] = style.getPropertyValue(name)
            }
            return out
          },
          { sel: selector, prop: property }
        )
        break
      }
    }

    console.log(result(true, output))
  } catch (err) {
    console.log(
      result(false, null, {
        error: err.message || String(err)
      })
    )
    process.exit(1)
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

main()
