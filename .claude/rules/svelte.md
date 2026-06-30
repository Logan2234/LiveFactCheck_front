---
paths:
  - "**/*.svelte"
  - "**/*.ts"
---

# Svelte 5 & TypeScript conventions

Generic conventions for the SvelteKit frontend.
Project-specific facts (commands, gotchas, pages) live in CLAUDE.md, not here.

## Svelte 5 (runes)

- Runes mode is forced for non-node_modules files (svelte.config.js). Write runes — not the legacy reactive syntax (`$:`, `export let`).
- State: `$state(...)`. Derived values: `$derived(...)`. Component inputs: `let { foo } = $props()`.
- Side effects that react to state: `$effect(...)`. Don't reach for it when `$derived` expresses the value declaratively.
- Event handlers are attributes: `onclick={...}`, not `on:click`.

## State management

- All app state lives in `lib/stores/`. Components and layouts read from stores; they don't own cross-component state.
- Layouts in `lib/layouts/` are pure views over the stores — no business logic, no fetching.
- Derive filtered/sorted/aggregated values with derived stores rather than recomputing in each component.

## TypeScript

- `strict` is on. Type props, function params, and return values; don't lean on `any` — use `unknown` and narrow with type guards.
- Model message/union shapes as discriminated unions (e.g. a `type` field) and narrow on it.
- Prefer `interface` for object shapes, `type` for unions and primitives.
- Keep a single source of truth for a shared shape; import the type rather than redeclaring it.

## Tailwind CSS

- Tailwind utility classes — no custom CSS unless absolutely necessary.
- Use design tokens from the Tailwind config, not hard-coded values.
- Extract repeated class combinations into components, not `@apply`.

## Networking & WebSocket

- The `WSMessage` union is the client-side mirror of the backend contract — keep both in sync; a change on one side is a change on both.
- Parse and validate incoming messages before trusting them; handle malformed payloads instead of assuming shape.
- Network/WS clients belong in `lib/`, not in components. Components subscribe to stores, not sockets.

## Components

- Reuse before recreating: before adding a new component, scan `lib/components/ui/` and `lib/components/features/`. If a close match exists, reuse it or extend it with a prop/variant rather than building (or inlining) a near-duplicate. Only create a new component when nothing fits.
- Keep components focused: presentation + local UI state. Push shared logic into stores or `lib/`.
- Don't duplicate a hardcoded value (URL, interval, status map) across files; define it once and import it.
- Guard browser-only APIs (mic, localStorage, WebSocket) — they need a browser context, and a secure context for some.

## Tooling

- Format with Prettier; type-check with `svelte-check`. Both are CI gates — keep them green.
- Don't fight the formatter; let it own whitespace and quote style.
