# AI Agent Guidelines

This document provides comprehensive guidelines for AI assistants working with this VitePress blog monorepo project.

---

## 1. Project Overview

### Basic Information
- **Project Name**: vitepress-theme-link
- **Type**: VitePress Blog Monorepo
- **Description**: A customizable VitePress-based blog system with plugin architecture
- **Origin**: Forked from [vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure)
- **License**: MIT

### Technology Stack
- **Framework**: VitePress 1.6.4 (Vue 3.5.26 based)
- **Build Tool**: Vite 5.4.14
- **Language**: TypeScript 5.9.3
- **Package Manager**: pnpm 9.0.0+
- **CSS Framework**: UnoCSS 66.5.12
- **Testing**: Vitest 4.0.16
- **Code Quality**: ESLint 9.39.2 + Prettier 3.7.4

### Environment Requirements
- **Node.js**: >= 22.0.0
- **pnpm**: >= 9.0.0

### Project Purpose
This monorepo provides:
- A clean, customizable VitePress blog theme
- Reusable VitePress plugins for enhanced functionality
- Modular architecture for easy extension and maintenance

---

## 2. Architecture & Structure

### Monorepo Structure

```
vitepress-theme-link/
├── packages/
│   ├── docs/                              # Documentation site (main blog)
│   ├── theme/                             # Custom VitePress theme (vitepress-theme-link)
│   ├── vitepress-plugin-analyzer/         # Global analyzer plugin
│   ├── vitepress-plugin-callouts/          # Callout/admonition plugin
│   ├── vitepress-plugin-codeblock-fold/   # Code block folding plugin
│   ├── vitepress-plugin-config/           # Configuration utilities plugin
│   ├── vitepress-plugin-details-block/    # Details/summary block plugin
│   └── vitepress-plugin-hashtag/          # Hashtag support plugin
├── .windsurfrules                         # AI assistant rules
├── package.json                           # Root package configuration
└── pnpm-workspace.yaml                    # pnpm workspace configuration
```

### Package Descriptions

#### Core Packages
- **`docs/`**: The main documentation site that uses the custom theme and plugins
  - Private package (not published)
  - Depends on `vitepress-theme-link` theme and various plugins
  - Contains blog content and configuration

- **`theme/` (vitepress-theme-link)**: Custom VitePress theme
  - Main theme package with styles and components
  - Exports theme configuration and utilities
  - Includes UnoCSS configuration
  - Uses SCSS for styling

#### Plugin Packages
All plugins follow a consistent structure:
- **Node-side exports**: Build-time plugin logic
- **Client-side exports**: Runtime client components (if needed)
- **Type definitions**: TypeScript types for plugin options
- **Styles**: Plugin-specific CSS/SCSS (if needed)

### Package Dependencies
```
docs
├── vitepress-theme-link (theme)
├── vitepress-plugin-analyzer
├── vitepress-plugin-callouts
├── vitepress-plugin-config
└── vitepress-plugin-rss (external)

theme (vitepress-theme-link)
├── vitepress (peer)
├── vitepress-plugin-analyzer (dev)
├── vitepress-plugin-callouts (dev)
├── vitepress-plugin-codeblock-fold (dev)
├── vitepress-plugin-config (dev)
└── vitepress-plugin-details-block (dev)
```

### Build System
- **Root level**: Orchestrates builds across all packages
- **Theme & Plugins**: Use `tsup` for TypeScript compilation
- **Docs**: Uses VitePress native build system
- **Parallel builds**: Supported via pnpm workspace commands

---

## 3. Code Standards

### Language Requirements
- **Code Comments**: English only
- **Documentation**: English preferred, Chinese acceptable
- **Commit Messages**: English (Conventional Commits format)

### Code Style
- **Formatter**: Prettier 3.7.4
  - Config: `.prettierrc` or `prettier.config.js`
  - Import sorting: `@trivago/prettier-plugin-sort-imports`
  - Tailwind sorting: `prettier-plugin-tailwindcss`

- **Linter**: ESLint 9.39.2
  - TypeScript support: `typescript-eslint`
  - Vue support: `eslint-plugin-vue`
  - Prettier integration: `eslint-config-prettier`

### Naming Conventions
- **Files**: kebab-case (e.g., `my-component.vue`, `use-feature.ts`)
- **Components**: PascalCase (e.g., `MyComponent.vue`)
- **Functions/Variables**: camelCase (e.g., `getUserData`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_COUNT`, `API_URL`)
- **Types/Interfaces**: PascalCase (e.g., `UserData`, `PluginOptions`)

### TypeScript Guidelines
- **Strict mode**: Enabled
- **Type annotations**: Required for function parameters and return types
- **Any usage**: Avoid unless absolutely necessary
- **Type exports**: Use `export type` for type-only exports

### Git Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

**Example**:
```
feat(plugin-callout): add support for custom icons

- Add icon prop to callout component
- Update documentation with icon examples

Closes #123
```

### Testing Requirements
- **Framework**: Vitest 4.0.16
- **Coverage**: Use `@vitest/coverage-v8`
- **UI Mode**: Available via `pnpm test:ui`
- **Test files**: `*.test.ts` or `*.spec.ts`

---

## 4. Common Tasks

### Development Commands

#### Start Development
```bash
# Start all packages in development mode (parallel)
pnpm dev

# Start only docs site
pnpm dev:testbed

# Start only packages (watch mode)
pnpm dev:packages

# Watch UnoCSS changes
pnpm dev:unocss
```

#### Build Commands
```bash
# Clean and build all packages
pnpm build

# Build only packages (no docs)
pnpm build:packages

# Build only docs site
pnpm build:testbed

# Build UnoCSS styles
pnpm build:unocss

# Clean all build artifacts
pnpm clean

# Clean only docs cache
pnpm clean:testbed
```

#### Preview & Testing
```bash
# Preview built docs site
pnpm preview:testbed

# Run tests with UI
pnpm test:ui
```

#### Code Quality
```bash
# Lint and auto-fix
pnpm lint

# Format all files
pnpm format

# Generate changelog
pnpm changelog
```

### Package Management

#### Install Dependencies
```bash
# Install all dependencies
pnpm install

# Add dependency to root
pnpm add <package> -w

# Add dependency to specific package
pnpm add <package> --filter <package-name>

# Example: Add lodash to theme package
pnpm add lodash --filter vitepress-theme-link
```

#### Update Dependencies
```bash
# Check outdated packages
pnpm outdated -r

# Update all packages to latest
pnpm update -r --latest

# Update specific package
pnpm update <package-name> --latest
```

#### Workspace Commands
```bash
# Run command in all packages
pnpm -r <command>

# Run command in specific package
pnpm -F <package-name> <command>

# Run command in parallel
pnpm --parallel <command>
```

### Git Workflow

#### Pre-commit Hooks
- **Husky**: Manages git hooks
- **lint-staged**: Runs linters on staged files
- **commitlint**: Validates commit messages

#### Typical Workflow
```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes and commit (will trigger hooks)
git add .
git commit -m "feat(scope): description"

# 3. Push changes
git push origin feat/my-feature
```

---

## 5. Development Workflow

### Adding a New Plugin

#### 1. Create Plugin Structure
```bash
# Create plugin directory
mkdir packages/vitepress-plugin-my-feature

# Create basic structure
cd packages/vitepress-plugin-my-feature
mkdir src
touch package.json tsup.config.ts
```

#### 2. Setup package.json
```json
{
  "name": "vitepress-plugin-my-feature",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "import": "./lib/index.js",
      "require": "./lib/index.cjs"
    }
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "clean": "rimraf lib"
  },
  "peerDependencies": {
    "vitepress": "^1.5.0"
  }
}
```

#### 3. Create Plugin Code
```typescript
// src/index.ts
import type { Plugin } from 'vitepress'

export interface MyFeatureOptions {
  // Plugin options
}

export function myFeaturePlugin(options?: MyFeatureOptions): Plugin {
  return {
    name: 'vitepress-plugin-my-feature',
    // Plugin implementation
  }
}
```

#### 4. Add to Theme/Docs
```typescript
// In docs/.vitepress/config.ts
import { myFeaturePlugin } from 'vitepress-plugin-my-feature'

export default {
  vite: {
    plugins: [myFeaturePlugin()]
  }
}
```

### Modifying the Theme

#### 1. Theme Structure
```
packages/theme/
├── src/
│   ├── components/      # Vue components
│   ├── composables/     # Vue composables
│   ├── styles/          # SCSS styles
│   ├── types/           # TypeScript types
│   └── index.ts         # Main entry
├── lib/                 # Build output
└── uno.config.ts        # UnoCSS configuration
```

#### 2. Development Process
```bash
# 1. Start theme in watch mode
cd packages/theme
pnpm dev

# 2. Start docs to see changes
cd ../docs
pnpm dev:testbed

# 3. Make changes to theme files
# Changes will hot-reload in docs site
```

#### 3. Adding Components
```vue
<!-- src/components/MyComponent.vue -->
<script setup lang="ts">
// Component logic
</script>

<template>
  <!-- Component template -->
</template>

<style scoped lang="scss">
// Component styles
</style>
```

### Adding Documentation

#### 1. Create Markdown File
```bash
# Add new post/page
cd packages/testbed
touch posts/my-new-post.md
```

#### 2. Add Frontmatter
```markdown
---
title: My New Post
date: 2024-01-11
tags:
  - tutorial
  - vitepress
---

# My New Post

Content here...
```

#### 3. Update Navigation (if needed)
```typescript
// docs/.vitepress/config.ts
export default {
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Posts', link: '/posts/' }
    ]
  }
}
```

### Local Development Best Practices

1. **Always run from root**: Use `pnpm dev` to start all packages
2. **Watch for errors**: Check terminal output for build errors
3. **Clear cache**: Run `pnpm clean` if you encounter strange issues
4. **Test builds**: Run `pnpm build` before committing
5. **Check types**: Ensure TypeScript compilation succeeds

### Release Process

1. **Update versions**: Bump version in affected package.json files
2. **Generate changelog**: Run `pnpm changelog`
3. **Commit changes**: `git commit -m "chore: release v0.x.x"`
4. **Tag release**: `git tag v0.x.x`
5. **Push**: `git push && git push --tags`

---

## 6. Architecture Decisions

### Why Monorepo?
- **Code Sharing**: Easy to share types, utilities, and configurations
- **Atomic Changes**: Update multiple packages in a single commit
- **Consistent Versioning**: Ensure compatibility across packages
- **Simplified Development**: Single repository for all related code

### Why VitePress?
- **Vue 3 Based**: Modern, performant framework
- **Markdown-Centric**: Perfect for blog/documentation
- **Fast**: Vite-powered development and build
- **Extensible**: Plugin system for customization
- **SSG**: Static site generation for optimal performance

### Plugin System Design
- **Separation of Concerns**: Each plugin handles one feature
- **Reusability**: Plugins can be used independently
- **Type Safety**: Full TypeScript support
- **Dual Exports**: Node-side (build) and client-side (runtime) logic
- **Peer Dependencies**: Avoid version conflicts with VitePress

### Why UnoCSS?
- **Performance**: Instant on-demand CSS generation
- **Flexibility**: Atomic CSS with preset system
- **Icon Support**: Built-in icon integration via `@unocss/preset-icons`
- **Small Bundle**: Only includes used styles
- **Developer Experience**: Intuitive utility-first approach

### Theme Customization Strategy
- **SCSS for Structure**: Complex layouts and component styles
- **UnoCSS for Utilities**: Spacing, colors, responsive design
- **CSS Variables**: Theme-able colors and dimensions
- **Component Scoping**: Prevent style conflicts

### Build Tool Choices
- **tsup**: Fast TypeScript bundler for libraries
  - ESM and CJS dual output
  - Type declaration generation
  - Watch mode for development
- **VitePress Native**: For docs site
  - Optimized for static site generation
  - Built-in markdown processing

---

## 7. AI Assistant Instructions

### General Principles

1. **Think in English, Converse in Chinese**
   - Internal reasoning should be in English
   - Responses to users should be in Chinese
   - Code comments must be in English

2. **Careful Consideration**
   - Every question should be answered after thorough analysis
   - Don't rush to conclusions
   - Verify assumptions before proceeding

3. **File Analysis Protocol**
   - **Step 1**: Determine total line count of the file
   - **Step 2**: Apply reading strategy:
     - **< 50 lines**: Read and analyze the entire file
     - **> 500 lines**: Select and read only necessary sections
     - **50-500 lines**: Use judgment based on context

4. **Incremental Progress**
   - Work step by step
   - Confirm with user at appropriate checkpoints
   - Don't execute blindly without validation

5. **Project Understanding**
   - Repeatedly review and understand the entire project
   - Think carefully before answering
   - Consider the monorepo context in all decisions

6. **Code Comments**
   - All code comments must be in English
   - Use clear, concise language
   - Explain "why" not just "what"

### Specific Guidelines

#### When Reading Files
```typescript
// Good: Concise, explains intent
// Calculate user's total score based on completed tasks
const totalScore = tasks.reduce((sum, task) => sum + task.score, 0)

// Bad: Redundant, states the obvious
// Add task.score to sum
const totalScore = tasks.reduce((sum, task) => sum + task.score, 0)
```

#### When Modifying Code
1. **Understand Context**: Read related files before making changes
2. **Maintain Consistency**: Follow existing patterns and styles
3. **Test Impact**: Consider how changes affect other packages
4. **Update Types**: Keep TypeScript definitions in sync
5. **Document Changes**: Add comments for complex logic

#### When Creating New Features
1. **Check Existing**: Look for similar implementations first
2. **Follow Patterns**: Use established project patterns
3. **Consider Reusability**: Design for potential reuse
4. **Add Tests**: Include test cases for new functionality
5. **Update Docs**: Document new features and APIs

#### When Debugging
1. **Reproduce Issue**: Understand the problem fully
2. **Check Logs**: Review build and runtime errors
3. **Isolate Cause**: Narrow down to specific code/package
4. **Test Fix**: Verify solution works as expected
5. **Prevent Regression**: Consider adding tests

#### Monorepo-Specific Considerations
1. **Package Dependencies**: Be aware of workspace dependencies
2. **Build Order**: Some packages must build before others
3. **Shared Types**: Changes to types affect multiple packages
4. **Version Compatibility**: Ensure peer dependencies align
5. **Cross-Package Testing**: Test changes across affected packages

### Communication Protocol

#### When Uncertain
- Ask clarifying questions before proceeding
- Present options with pros/cons
- Explain reasoning behind recommendations

#### When Proposing Changes
- Explain what will be changed and why
- Highlight potential impacts
- Suggest testing approach

#### When Encountering Errors
- Provide clear error description
- Suggest potential causes
- Offer multiple solution approaches

### Project-Specific Knowledge

#### Key Files to Reference
- `package.json`: Scripts, dependencies, workspace config
- `.windsurfrules`: AI assistant behavior rules
- `tsup.config.ts`: Build configuration for packages
- `uno.config.ts`: UnoCSS configuration
- `.vitepress/config.ts`: VitePress site configuration

#### Common Patterns
- **Plugin Structure**: Node + Client exports with types
- **Theme Components**: Vue 3 SFC with TypeScript and SCSS
- **Build Scripts**: tsup for libraries, VitePress for docs
- **Workspace Commands**: Use `pnpm -F` for package-specific tasks

#### Gotchas to Avoid
- Don't modify `lib/` directories (they're build output)
- Don't forget to rebuild after changing plugin code
- Don't mix ESM and CJS imports incorrectly
- Don't skip type checking before committing
- Don't ignore peer dependency warnings

---

## Conclusion

This document serves as a comprehensive guide for AI assistants working with the vitepress-theme-link monorepo. Always refer back to these guidelines when uncertain, and prioritize code quality, maintainability, and user experience in all decisions.

For questions or clarifications, consult the project maintainer or refer to the official VitePress documentation at https://vitepress.dev.
