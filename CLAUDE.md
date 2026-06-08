# CLAUDE.md — Frontend

LiveFactChecker frontend. Cross-component context (WebSocket contract, two-repo layout)
lives in ../CLAUDE.md. README.md documents stack, scripts, structure and the audio flow —
read it for anything descriptive; this file is only conventions and traps.

SvelteKit 2 + Svelte 5 (TypeScript): mic capture → audio streamed to the backend over
WebSocket → verified claims rendered live across several layouts. Plus an admin UI.

## Commands

Own git repo — run git/CI from `frontend/`.

- Dev: `npm run dev` (localhost:5173)
- CI gates (on pull_request): `npm run format:check`, `npm run check`

No test suite yet (no test script in package.json).

## Admin UI

- Pages under `routes/admin/` consume the backend `/admin/*` API via `authFetch` (`lib/stores/auth.ts`), which stores the JWT in localStorage and attaches the bearer token.
- The admin nav in `routes/admin/+layout.svelte` is the source of truth for the current set of admin pages.

## Gotchas
