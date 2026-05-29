---
name: tool-test-check
description: >
  Run the right local and CI-aligned validation checks for this pnpm monorepo.
  Use this skill whenever the user asks to test changes, run unit tests, run
  related e2e tests, verify a branch locally, prepare for PR/CI, or says phrases
  like "跑测试", "本地验证", "unit/e2e", "相关 e2e", "test check", "CI 检查",
  "改完跑一下测试", "不要全量 e2e", or asks which checks should be run. For quick
  local validation, run root unit tests and only related Playwright e2e specs;
  for PR/CI confidence, align with .github/workflows/ci.yml: lint, E2E coverage,
  typecheck, build, package artifact validation, unit tests, and related E2E specs
  unless full E2E is explicitly requested or clearly necessary.
---

# Local and CI Test Check

Use this skill to choose and run validation checks for this repository. There
are two modes:

- **Quick local validation**: fast feedback while developing. Run all unit tests,
  then only related Playwright E2E specs.
- **PR / CI-aligned validation**: confidence before pushing or opening a PR. Run
  the same classes of checks that `.github/workflows/ci.yml` requires.

## CI gates in this repository

`.github/workflows/ci.yml` defines these required jobs:

| CI job | CI command |
|---|---|
| Lint | `pnpm lint; git diff --exit-code` |
| E2E coverage check | `bash scripts/check-e2e-coverage.sh` |
| Commit check | `git log -1 --format=%B | pnpm check-commit` |
| Type check | `pnpm typecheck` |
| Unit test | `pnpm build:packages` then `pnpm test:unit` |
| Build + package artifacts | `pnpm build` then `pnpm validate:packages` |
| E2E test | `pnpm test:e2e` in CI; locally prefer targeted `pnpm -F vitepress-theme-link test:e2e -- e2e/<Spec>.spec.ts` |

When the user asks whether a branch is ready for PR/CI, include all relevant CI
gates, not just unit and E2E.

## Default workflow

1. Inspect the change scope before choosing checks:

```bash
git status --short
git diff --name-only
```

If the user asks for branch-level validation, compare against the base branch:

```bash
git diff --name-only master...HEAD
```

2. Choose the mode:

- Quick local validation: use the targeted local matrix.
- PR / CI-aligned validation: use the CI-aligned matrix.
- If the user is ambiguous, start with quick local validation and mention the
  additional CI-aligned checks needed before PR.

3. Run commands in the smallest order that finds failures early: lint/coverage
checks, typecheck/build, unit tests, then E2E.

4. Report what ran, what passed or failed, and whether the scope should be
escalated to full E2E or full CI-aligned validation.

## Quick local matrix

| Need | Command |
|---|---|
| Full unit tests | `pnpm test:unit` |
| One related E2E spec | `pnpm -F vitepress-theme-link test:e2e -- e2e/<Spec>.spec.ts` |
| Multiple related E2E specs | `pnpm -F vitepress-theme-link test:e2e -- e2e/A.spec.ts e2e/B.spec.ts` |
| Full theme E2E when needed | `pnpm -F vitepress-theme-link test:e2e` |
| Type and package export check | `pnpm typecheck` |
| Non-mutating lint check | `pnpm exec eslint './packages/**/*.{ts,tsx,js,jsx,vue}'` |

Avoid `pnpm test` for routine local checks when the user asked for related E2E;
it chains unit tests and full E2E. Use it only when the user explicitly wants the
full local suite.

## PR / CI-aligned matrix

Use this when the user asks for final confidence, PR readiness, CI parity, or
"都得通过".

| Gate | Command | Notes |
|---|---|---|
| Lint exactly like CI | `pnpm lint; git diff --exit-code` | This may modify files through `eslint --fix`; the diff check catches uncommitted formatter/lint changes. |
| E2E coverage | `bash scripts/check-e2e-coverage.sh` | CI runs this in the lint job. Run it when E2E specs/components changed or before PR. |
| Typecheck | `pnpm typecheck` | Includes `pnpm build:packages`. |
| Unit test | `pnpm test:unit` | CI runs `pnpm build:packages` first; `pnpm typecheck` already covers that build step if run earlier. |
| Build | `pnpm build` | Required by CI and produces the docs artifact used by E2E. |
| Package artifacts | `pnpm validate:packages` | Fast tarball/export/content validation; run after `pnpm build`. |
| Consumer package install | `pnpm validate:consumer` | Heavy fresh-consumer tarball install/build validation; run for package-publishing-sensitive changes. |
| Related E2E | `pnpm -F vitepress-theme-link test:e2e -- e2e/<Spec>.spec.ts` | Local CI-aligned checks should still target the cases related to the current change to keep runtime reasonable. |
| Full E2E only when requested or necessary | `pnpm test:e2e` | CI runs full E2E, but locally use this only when the user explicitly asks or the change is broad enough that targeted specs are misleading. |
| Commit check | `git log -1 --format=%B | pnpm check-commit` | Only needed when validating the current commit message. |

For a local PR-ready check, prefer this sequence:

```bash
pnpm lint; git diff --exit-code
bash scripts/check-e2e-coverage.sh
pnpm typecheck
pnpm test:unit
pnpm build
pnpm validate:packages
pnpm -F vitepress-theme-link test:e2e -- e2e/<Related>.spec.ts
```

Add the commit check when the user asks to validate commits or CI parity for an
already-created commit.

Run the heavy consumer package validation when the diff touches package-publishing-sensitive paths:

```bash
pnpm validate:consumer
```

Package-publishing-sensitive paths include `packages/*/package.json`, package build configs (`tsup.config.ts`, `vite.config.ts`), `packages/theme/src/**`, `packages/theme/uno.config.ts`, `packages/create-vitepress-theme-link/public/template/**`, `scripts/validate-*.mjs`, and package/release workflow files.

## Mutation safety

`pnpm lint` and `pnpm format` write files. For quick local validation, do not run
mutating commands unless the user allows fixes.

If the user asks for linting without edits, run:

```bash
pnpm exec eslint './packages/**/*.{ts,tsx,js,jsx,vue}'
```

If the user asks for CI parity, use the CI lint command despite its write
behavior, then inspect `git diff --exit-code` / `git status --short`. If lint
changed files, report that CI would have failed until those generated changes are
reviewed and committed.

## E2E selection rules

E2E tests live in `packages/theme/e2e/` and are invoked from the theme package
with paths relative to that package, for example `e2e/BlogMain.spec.ts`.

Prefer exact component-name matches first:

- `packages/theme/src/components/blog/BlogMain.vue` → `e2e/BlogMain.spec.ts`
- `BlogCardItem.vue` → `e2e/BlogCardItem.spec.ts`
- `BlogCardPagination.vue` → `e2e/BlogCardPagination.spec.ts`
- `BlogListItem.vue` → `e2e/BlogListItem.spec.ts`
- `BlogListPagination.vue` → `e2e/BlogListPagination.spec.ts`
- `DocBanner.vue` → `e2e/DocBanner.spec.ts`
- `FooterRef.vue` → `e2e/FooterRef.spec.ts`
- `IconToggleButton.vue` → `e2e/IconToggleButton.spec.ts`
- `PopupContainer.vue` → `e2e/PopupContainer.spec.ts`
- `SidebarLink.vue` → `e2e/SidebarLink.spec.ts`
- `SidebarTag.vue` → `e2e/SidebarTag.spec.ts`
- `HideSidebarButton.vue` → `e2e/HideSidebarButton.spec.ts`

Use feature families when one changed file affects several browser surfaces:

- Blog list/card/pagination changes → relevant `Blog*.spec.ts` files.
- D3 components or D3 client utils → `D3ForceGraph.spec.ts`,
  `D3FullScreen.spec.ts`, `D3HomePage.spec.ts`, `D3PageGraph.spec.ts`, and
  `D3PageSidebar.spec.ts` as applicable.
- Wiki link parsing or rendering → `WikiLinks.spec.ts`.
- Mermaid rendering → `PostMermaid.spec.ts`.
- Footnotes or footer references → `FooterRef.spec.ts`.
- Article banner/frontmatter display → `DocBanner.spec.ts`.
- Homepage behavior → `Homepage.spec.ts`.
- Tags, collections, or timeline pages → `Tags.spec.ts`, `Collections.spec.ts`,
  or `Timeline.spec.ts`.

If no related E2E exists for a narrow non-UI change, skip E2E in quick local mode
and say why.

## When to run full E2E

Run full E2E only when targeted specs would give misleading confidence because the
change is broad or cross-cutting, or when the user explicitly asks for the full
suite. Do not use naked `pnpm test:e2e` as the default local command because it is
slow; prefer targeted specs first.

```bash
pnpm -F vitepress-theme-link test:e2e -- e2e/<Related>.spec.ts
```

Use full E2E only for explicit/full-scope cases:

```bash
pnpm -F vitepress-theme-link test:e2e
```

Escalate to full E2E for changes touching:

- `packages/theme/src/index.ts`
- `packages/theme/src/components/NewLayout.vue`
- route, navigation, sidebar, or global layout behavior
- global styles, theme variables, or shared visual primitives used across pages
- docs VitePress config or generated content that affects many routes
- Playwright config, E2E setup, or test infrastructure
- multiple unrelated UI areas in the same change

For PR / CI-aligned validation, still run related E2E specs locally by default.
Full E2E belongs to CI or to explicit local full-suite requests.

## Report format

Use this structure when presenting the check plan and results:

```markdown
## Test plan
- Mode: quick local / PR CI-aligned.
- Unit: `pnpm test:unit` — always run for local validation.
- E2E: `<command or skipped>` — <selection reason>.
- CI gates: `<commands or skipped>` — <reason>.

## Results
| Check | Command | Result | Notes |
|---|---|---|---|
| Lint | `...` | Passed/Failed/Skipped | ... |
| E2E coverage | `...` | Passed/Failed/Skipped | ... |
| Typecheck | `...` | Passed/Failed/Skipped | ... |
| Unit | `...` | Passed/Failed/Skipped | ... |
| Build | `...` | Passed/Failed/Skipped | ... |
| Package artifacts | `pnpm validate:packages` | Passed/Failed/Skipped | ... |
| Consumer package install | `pnpm validate:consumer` | Passed/Failed/Skipped | Run for package-sensitive changes. |
| E2E | `...` | Passed/Failed/Skipped | ... |

## Recommendation
Ready / needs fix / quick checks passed but CI-aligned checks still needed.
```
