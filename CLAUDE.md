# LiveFactCheck

LiveFactChecker est un outil de fact-checking en temps réel à partir de l'audio. Il capte le son (micro, fichier audio ou onglet du navigateur), le transcrit à la volée (faster-whisper côté backend), en extrait les affirmations factuelles puis les vérifie automatiquement via l'API Anthropic — affichant en direct chaque claim avec son statut (vrai / faux / etc.).

Il se décline en une app web (SvelteKit) et une extension Chrome, toutes deux branchées sur le même backend FastAPI via un WebSocket audio→claims.

Ce projet est LiveFactChecker Frontend. Cross-component context (WebSocket contract, repos layout) lives in ../CLAUDE.md.

This file is loaded automatically by Claude Code at the start of every session. Treat it as the source of truth for how to work in this repo.

## Backlog

The backlog lives in **GitHub Issues**, not in a tracked file — there is no `TODO.md`.
Features, tech tasks and tests are tracked as issues (labels: `enhancement`, `tests`,
`tooling`, `ui`, …). When they disagree with the code, **the code wins** — flag the gap,
don't edit code to match an issue.

## Build & Test

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Test (unit, Vitest)**: `npm run test`
- **Test (e2e, Playwright)**: `npm run test:e2e`
- **Test (coverage)**: `npm run test:coverage`
- **Check**: `npm run check`
- **Format**: `npm run format`
- **Lint**: `npm run lint`

## Versioning

`package.json` `version` is injected into the build as `__APP_VERSION__` (vite.config.ts)
and shown on the admin system page, so it must track **user-facing** change. Bump it as
part of completing a validated change, with `npm version <type> --no-git-tag-version`
(edits package.json + package-lock only, no git tag — tagging is a release concern), and
include the bump in the same commit. Map the bump to the change type (same taxonomy as the
commit emojis):

- ✨ new feature → `npm version minor --no-git-tag-version`
- 🐛 bugfix → `npm version patch --no-git-tag-version`
- breaking change → `npm version major --no-git-tag-version`
- ♻️ refactor / 📝 docs/tests / ⚡ tooling → **no bump** (nothing the user sees changes)

Don't bump speculatively or mid-task; only when a user-facing change is done and validated.

## Conventions

Generic Svelte 5 / TypeScript / Tailwind conventions (runes, state management,
networking, components, naming-by-example) live in `.claude/rules/svelte.md`, which
Claude Code auto-loads for `*.svelte` / `*.ts` files. The sections below are the
project-specific rules that file deliberately keeps out.

## Testing

### Vitest

- Co-locate tests as `*.test.ts` next to source files
- Use `describe` / `it` blocks with descriptive names
- Mock with `vi.mock()` — never reach into module internals

### Playwright

- Tests live in `e2e/` and use the Page Object Model
- Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
- Use `await expect(locator).toHaveText()` — auto-retrying assertions

## Naming Conventions

- Variables and functions use camelCase
- Classes, types, interfaces, and components use PascalCase
- File and folder names use kebab-case
- Module-level constants use SCREAMING_SNAKE_CASE
- Prefer descriptive names over short or cryptic ones

## Imports & Modules

- Use the `$lib` alias (e.g. `$lib/components/Button`) over deep relative paths
- Group and sort imports: stdlib, external, internal, relative
- Prefer named exports over default exports
- Avoid `index.ts` barrel re-exports that increase build time

## Error Handling

- Never silently catch errors — log, rethrow, or surface to the user
- Throw subclasses of `Error` with descriptive names, not strings
- Validate inputs at the boundary and throw early on bad data

## Architecture

- `routes/` — pages. +page.svelte is the live fact-checking view (the heart of the app); routes/admin/ is the admin UI consuming the backend /admin/ API (the nav in routes/admin/+layout.svelte is the source of truth for the set of admin pages); routes/account/\* is the user space; routes/login.
- `lib/stores/` — single source of truth for all cross-component state (Svelte stores). audio.ts (recording + mic capture), claims.ts (the Claim shape + add/update/remove + derived sortedClaims/filteredClaims/claimStats), auth.ts (admin JWT + authFetch), userAuth.ts, transcription.ts, verification.ts, layout.ts, theme.ts, alerts.ts.
- `lib/layouts/` — interchangeable pure views over the stores, selected via layout.ts. No business logic, no fetching.
- `lib/components/` — `ui/` (generic, reusable: Button, Modal, Icon…) and `features/` (domain: claims, audio, account).
- `lib/` (root) — networking & infra, kept out of components: websocket.ts (WS client + WSMessage union + payload validation), config.ts (single source for backend URL / WS_URL / API_BASE_URL), admin.ts, languages.ts, constants/, utils/.
- `static/pcm-worklet.js` — AudioWorklet that downsamples mic audio to 16 kHz mono Int16 PCM.

## Gotchas & Anti-Patterns

- **The whole app is client-only** (`routes/+layout.ts` sets `ssr = false`). No SSR,
  no prerender — anything running at module import time still needs the `browser`
  guard (see `initialToken` in `stores/auth.ts`).
- **Two unrelated auth tokens.** Admin auth: `stores/auth.ts`, JWT in localStorage
  (`lfc_admin_token`), attached by `authFetch`. User auth for the live session: a JWT
  sent on the WS _config_ frame via `setUserToken` (`websocket.ts`). Don't conflate them.
  Note `authFetch` re-reads localStorage on every call (`getToken()`), not the `token`
  store — the store drives reactive UI, the request takes the persisted value.
- **The audio worklet is connected to `audioContext.destination` on purpose** even though
  it emits silence — an unconnected node isn't pulled by the render graph, so this keeps
  `process()` running. It is **not** mic playback; don't "clean it up". Also
  `audioContext.resume()` is required: the context can start suspended under the autoplay
  policy and `process()` won't run otherwise.

## Environment Variables

The following environment variables are required. Names only — actual values live in `.env.local` (gitignored) or your shell.

- `PUBLIC_BACKEND_URL`
