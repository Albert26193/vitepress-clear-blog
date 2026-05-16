---
name: std-antfu-vue
description: Use this coding-standard skill for Vue work in this VitePress Clear Blog repo, especially when editing .vue SFCs, NewLayout.vue, theme components, Composition API logic, props/emits contracts, composables, UI behavior, or Vue refactors. It adapts antfu/skills@vue-best-practices: keep the full reference-driven workflow, but preserve this repo's existing Prettier/ESLint setup, avoid unnecessary abstraction, and require related/full E2E validation for UI changes.
license: MIT
metadata:
  upstream: antfu/skills@vue-best-practices
  upstream_author: github.com/vuejs-ai
  adapted_for: vitepress-clear-blog
---

# std-antfu-vue

Project-local Vue best practices for this VitePress theme monorepo. This skill is adapted from `antfu/skills@vue-best-practices` and keeps its reference-driven workflow, with additional constraints for this repository.

Use this as an instruction set. Follow the workflow in order unless the user explicitly asks for a different order.

## Repository constraints

These constraints override generic Vue advice when they conflict.

- Use Vue 3 Composition API with `<script setup lang="ts">` for Vue SFCs.
- Do not split components casually. Split only when responsibility is clearly complex or boundaries are already evident.
- Do not introduce abstractions just to satisfy a style preference. A small, direct implementation is better than a premature composable/component hierarchy.
- Keep the repository's existing Prettier/ESLint setup. Do not migrate to `@antfu/eslint-config` unless the user explicitly asks for a tooling migration.
- Match existing SFC ordering and style in the edited area. This repo commonly uses `<template>` before `<script setup>` in existing components; preserve local consistency unless intentionally refactoring a whole file.
- UI changes need browser/E2E validation. Use `tool-test-check` for test selection. For broad layout changes, route rendering, navigation, sidebar, or `packages/theme/src/components/NewLayout.vue`, run full theme E2E locally or explain why it was not possible.
- Follow the repo's general rule against unnecessary comments: comments should explain why, not what.

## 1) Confirm architecture before coding

- Default stack: Vue 3 + Composition API + `<script setup lang="ts">`.
- If the project explicitly uses Options API, preserve that local pattern unless the task is to migrate it.
- If JSX/render functions are already used in a target area, inspect the existing pattern before changing it.

### 1.1 Must-read core references

Before implementing any non-trivial Vue task, read and apply these core references:

- `references/reactivity.md`
- `references/sfc.md`
- `references/component-data-flow.md`
- `references/composables.md`

Keep these references in working context for the task. For tiny mechanical edits, still check whether the change affects reactivity, data flow, or SFC structure; if not, state that the full reference pass is unnecessary.

### 1.2 Plan component boundaries before coding

Create a brief component map before implementation for non-trivial features or refactors.

- Define each component's single responsibility in one sentence.
- Keep entry/root and route-level view components as composition surfaces by default.
- Move feature UI and feature logic out of entry/root/view components when they become independent parts.
- Define props/emits contracts for each child component in the map.
- Prefer existing package structure first; only add a feature folder layout when adding more than one related component/composable.

## 2) Apply essential Vue foundations

### Reactivity

Use `references/reactivity.md`.

- Keep source state minimal (`ref`/`reactive`), derive everything possible with `computed`.
- Use watchers for side effects, not for data derivation that can be computed.
- Avoid expensive recomputation in templates.
- Prefer `shallowRef` for large objects or external instances when deep reactivity is not needed.

### SFC structure and template safety

Use `references/sfc.md`.

- Prefer `<script setup lang="ts">` for new SFC logic.
- Preserve local file ordering and style unless the task is an intentional full-file cleanup.
- Keep templates declarative; move branching and derived data into script when it improves readability.
- Avoid `v-html` unless content is trusted and the boundary is clear.
- Use stable keys for list rendering.

### Keep components focused

Split a component when the split improves responsibility boundaries now, not for hypothetical future reuse.

Split if any condition is true:

- It owns both orchestration/state and substantial presentational markup for multiple independent sections.
- It has 3+ distinct UI sections such as form, filters, list, footer/status.
- A template block is repeated or already reusable.
- A route/view/root component is accumulating full feature implementation rather than composing child components.

Do not split if the component is still small, cohesive, and the split would only create pass-through props or one-off wrappers.

### Component data flow

Use `references/component-data-flow.md`.

- Use props down, events up as the primary model.
- Use `v-model` only for true two-way component contracts.
- Use provide/inject only for deep-tree dependencies or shared context.
- Keep contracts explicit and typed with `defineProps`, `defineEmits`, and `InjectionKey` where needed.

### Composables

Use `references/composables.md`.

- Extract logic into composables when it is reused, stateful, or side-effect heavy.
- Keep composable APIs small, typed, and predictable.
- Do not create a composable for a few lines of one-off local logic unless it clarifies the component significantly.

## 3) Consider optional Vue features only when requirements call for them

Load matching references only when the requirement exists:

- Slots: parent controls child content/layout -> `references/component-slots.md`
- Fallthrough attrs: wrapper/base components forward attrs/events -> `references/component-fallthrough-attrs.md`
- `<KeepAlive>`: stateful view caching -> `references/component-keep-alive.md`
- `<Teleport>`: overlays/portals -> `references/component-teleport.md`
- `<Suspense>`: async subtree fallback boundaries -> `references/component-suspense.md`
- `<Transition>`: enter/leave effects -> `references/component-transition.md`
- `<TransitionGroup>`: animated list mutations -> `references/component-transition-group.md`
- Class-based animation -> `references/animation-class-based-technique.md`
- State-driven animation -> `references/animation-state-driven-technique.md`
- Directives: DOM-specific behavior -> `references/directives.md`
- Async components: heavy/rarely-used UI should be lazy loaded -> `references/component-async.md`
- Render functions: templates cannot express the requirement -> `references/render-functions.md`
- Plugins: behavior must be installed app-wide -> `references/plugins.md`
- State management: shared state crosses feature boundaries -> `references/state-management.md`

## 4) Performance pass after behavior is correct

Performance work is a post-functionality pass. Do not optimize before core behavior is implemented and verified.

- Large list bottlenecks -> `references/perf-virtualize-large-lists.md`
- Static subtrees -> `references/perf-v-once-v-memo-directives.md`
- Hot list over-abstraction -> `references/perf-avoid-component-abstraction-in-lists.md`
- Expensive updates -> `references/updated-hook-performance.md`

## 5) Validation expectations for this repo

After Vue UI changes, prefer `tool-test-check` to choose the right checks.

- Small component logic/style change: lint, typecheck/unit if relevant, and related E2E spec if one exists.
- Theme route/page behavior: related E2E specs such as `Tags`, `Collections`, `Timeline`, `BlogMain`, or `Homepage`.
- `NewLayout.vue`, route shell, sidebar, navigation, or global layout: full theme E2E is appropriate because targeted specs can miss cross-route regressions.
- If the user asks for PR readiness, run the CI-aligned gate from `tool-test-check`.

## 6) Final self-check before finishing

- Behavior matches requirements.
- Required core references were read or intentionally skipped only for a tiny mechanical edit.
- Reactivity model is minimal and predictable.
- SFC style matches this repo and uses `<script setup lang="ts">` for new logic.
- Components remain focused without unnecessary splitting.
- Data flow contracts are explicit and typed.
- Composables are used only where reuse or complexity justifies them.
- Optional Vue features are used only when requirements demand them.
- Existing Prettier/ESLint setup is preserved.
- UI validation was run or the limitation is clearly reported.
