/**
 * Custom Playwright reporter that prints an E2E coverage summary.
 * Tracks which spec files (components) had tests run vs skipped.
 * Zero dependencies — uses only Playwright's built-in reporter API.
 */
import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult
} from '@playwright/test/reporter'

interface ComponentStats {
  total: number
  passed: number
  skipped: number
  failed: number
}

class CoverageReporter implements Reporter {
  private stats = new Map<string, ComponentStats>()

  onTestEnd(test: TestCase, result: TestResult) {
    // Derive component name from the spec file: "DocBanner.spec.ts" → "DocBanner"
    const filePath = test.location.file
    const match = filePath.match(/([^/]+)\.spec\.ts$/)
    if (!match) return
    const component = match[1]

    if (!this.stats.has(component)) {
      this.stats.set(component, { total: 0, passed: 0, skipped: 0, failed: 0 })
    }
    const entry = this.stats.get(component)!

    entry.total++
    if (result.status === 'skipped') entry.skipped++
    else if (result.status === 'failed' || result.status === 'timedOut')
      entry.failed++
    else entry.passed++
  }

  onEnd(_result: FullResult) {
    const entries = [...this.stats.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    if (entries.length === 0) return

    const rendered: string[] = []
    const degraded: string[] = []
    const notRendered: string[] = []

    for (const [component, s] of entries) {
      if (s.passed > 0 && s.skipped === 0 && s.failed === 0) {
        rendered.push(component)
      } else if (s.passed > 0) {
        degraded.push(component)
      } else {
        notRendered.push(component)
      }
    }

    console.log('')
    console.log('E2E Component Coverage')
    console.log('═══════════════════════')
    console.log('')

    for (const [component, s] of entries) {
      const icon =
        s.passed > 0 && s.skipped === 0 && s.failed === 0
          ? '✅'
          : s.passed > 0
            ? '⚠️'
            : '❌'
      const parts: string[] = [`${s.passed} pass`]
      if (s.skipped > 0) parts.push(`${s.skipped} skip`)
      if (s.failed > 0) parts.push(`${s.failed} fail`)
      console.log(
        `  ${icon} ${component.padEnd(22)} ${s.total} tests (${parts.join(', ')})`
      )
    }

    console.log('')
    console.log(
      `Covered:  ${rendered.length}/${entries.length} (all tests passing)`
    )

    if (degraded.length > 0) {
      console.log(
        `Degraded: ${degraded.length}/${entries.length} (some tests skipped or failed)`
      )
      console.log(`  ${degraded.join(', ')}`)
    }

    if (notRendered.length > 0) {
      console.log(
        `Missing:  ${notRendered.length}/${entries.length} (no passing tests)`
      )
      console.log(`  ${notRendered.join(', ')}`)
    }

    console.log(`Total:    ${entries.length} components`)
  }
}

export default CoverageReporter
