import { z } from 'zod'

const VALID_COLOR_RE = /^(#|rgba?\(|hsla?\(|var\(--|[a-zA-Z]+$)/

const themeConfigSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z.object({
    'vp-c-bg': z.string().optional(),
    'vp-c-brand': z.string().optional(),
    'vp-c-brand-1': z.string().optional(),
    'vp-c-text-1': z.string().optional(),
    'vp-button-brand-bg': z.string().optional(),
    'c-text-code': z.string().optional(),
    'c-text-strong': z.string().optional(),
    'c-text-em': z.string().optional(),
    'vp-sidebar-bg-color': z.string().optional(),
    dark: themeConfigSchema.optional()
  })
)

const navLabelsSchema = z.object({
  home: z.string().optional(),
  tags: z.string().optional(),
  timeline: z.string().optional(),
  pages: z.string().optional(),
  about: z.string().optional()
})

const markdownSchema = z.object({
  mathjax: z.boolean().optional(),
  wikilinks: z.boolean().optional(),
  footnote: z.boolean().optional(),
  hashtag: z.boolean().optional(),
  mermaid: z.boolean().optional(),
  callout: z.boolean().optional(),
  render_title: z
    .enum(['frontmatter_title', 'first_heading', 'alias', 'file_name'])
    .optional()
})

const metaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  keywords: z.string().optional(),
  locale: z.string().optional(),
  lang: z.string().optional(),
  siteUrl: z.string().optional(),
  'theme-color': z.string().optional(),
  icpNumber: z.string().optional(),
  themeLink: z.string().optional()
})

const pageSchema = z.object({
  pageSize: z.number().int().positive().optional()
})

export const configTomlSchema = z.object({
  meta: metaSchema.optional().default({}),
  page: pageSchema.optional().default({}),
  nav: navLabelsSchema.optional(),
  markdown: markdownSchema.optional(),
  theme: themeConfigSchema
})

export type ValidatedConfigToml = z.infer<typeof configTomlSchema>

export interface ConfigValidationIssue {
  path: string
  message: string
  expected?: string
  received?: string
}

export interface ConfigValidationResult {
  valid: boolean
  data: ValidatedConfigToml | null
  issues: ConfigValidationIssue[]
}

function formatZodIssue(
  issue: z.ZodIssue,
  sourcePath: string
): ConfigValidationIssue {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
  const result: ConfigValidationIssue = {
    path: `${sourcePath}:${path}`,
    message: issue.message
  }
  if (issue.code === 'invalid_type') {
    const invalid = issue as { expected: string; input?: unknown }
    result.expected = invalid.expected
    result.received =
      invalid.input !== undefined ? String(invalid.input) : undefined
  }
  return result
}

/**
 * Validates parsed TOML data against the config.toml schema.
 * Returns structured diagnostics for every field-level issue.
 */
export function validateConfigToml(
  raw: unknown,
  sourcePath: string
): ConfigValidationResult {
  const result = configTomlSchema.safeParse(raw)
  if (result.success) {
    const issues = checkThemeColors(
      result.data.theme as Record<string, unknown> | undefined,
      sourcePath
    )
    return { valid: issues.length === 0, data: result.data, issues }
  }
  return {
    valid: false,
    data: null,
    issues: result.error.issues.map((i) => formatZodIssue(i, sourcePath))
  }
}

/**
 * Validates parsed TOML data against the config.toml schema and logs warnings
 * for every issue. Returns the parsed data regardless (with defaults filled in
 * where possible) so callers can continue with best-effort fallback.
 */
export function validateConfigTomlWithFallback(
  raw: unknown,
  sourcePath: string
): ValidatedConfigToml {
  const result = configTomlSchema.safeParse(raw)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const formatted = formatZodIssue(issue, sourcePath)
      console.warn(
        `[config] ${formatted.path}: ${formatted.message}` +
          (formatted.expected
            ? ` (expected ${formatted.expected}, got ${formatted.received})`
            : '')
      )
    }
    // Return best-effort fallback with defaults filled in
    return configTomlSchema.parse({ theme: {} })
  }

  // Warn about color format issues (non-fatal)
  const colorIssues = checkThemeColors(
    result.data.theme as Record<string, unknown> | undefined,
    sourcePath
  )
  for (const issue of colorIssues) {
    console.warn(`[config] ${issue.path}: ${issue.message}`)
  }

  return result.data
}

export function checkThemeColors(
  theme: Record<string, unknown> | undefined,
  sourcePath: string
): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = []
  if (!theme) return issues

  const walk = (obj: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = `${sourcePath}:${prefix}${key}`
      if (key === 'dark' && typeof value === 'object' && value !== null) {
        walk(value as Record<string, unknown>, `${prefix}${key}.`)
        continue
      }
      if (typeof value !== 'string' || value.length === 0) {
        issues.push({
          path: fieldPath,
          message: `${key} must be a non-empty string, got "${String(value)}"`
        })
        continue
      }
      if (!VALID_COLOR_RE.test(value)) {
        issues.push({
          path: fieldPath,
          message: `${key}="${value}" looks malformed — expected a hex, rgb, hsl, var(--x), or named color`
        })
      }
    }
  }

  walk(theme, 'theme.')
  return issues
}
