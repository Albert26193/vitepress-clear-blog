---
name: tool-test-check
description: 'Run the right local and CI-aligned validation checks for this pnpm monorepo. Use this skill whenever the user asks to test changes, run unit tests, run related e2e tests, verify a branch locally, prepare for PR/CI, or says phrases like "跑测试", "本地验证", "unit/e2e", "相关 e2e", "test check", "CI 检查", "改完跑一下测试", "不要全量 e2e", or asks which checks should be run. For quick local validation, run root unit tests and only related Playwright e2e specs; for PR/CI confidence, align with .github/workflows/ci.yml: lint, E2E coverage, typecheck, build, unit tests, and related E2E specs unless full E2E is explicitly requested or clearly necessary.'
---

Invoke the skill at `../skills/tool-test-check/SKILL.md` and follow its instructions exactly.
