chore(deps): #123 upgrade devDependencies and enhance tsconfig

DESC
===

code:
- Bump @commitlint/cli to 20.5.0 and @commitlint/config-conventional to 20.5.0
- Update typescript-eslint to 8.57.2 and prettier to 3.8.1
- Tighten tsconfig target to ES2022 with moduleResolution bundler
- Remove unused paths alias across all tsconfig files

test:
- Verify all packages build successfully with new dependency versions
- Confirm ESLint passes without new warnings

summarize:
- Routine devDependency maintenance across the monorepo with minor tsconfig cleanup

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
