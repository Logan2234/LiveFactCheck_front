# CLAUDE.md — Frontend

LiveFactChecker frontend. Cross-component context (WebSocket contract, two-repo layout)
lives in ../CLAUDE.md. README.md documents stack, scripts, structure and the audio flow —
read it for anything descriptive; this file is only conventions and traps.

SvelteKit 2 + Svelte 5 (TypeScript): mic capture → audio streamed to the backend over
WebSocket → verified claims rendered live across several layouts. Plus an admin UI.

## Tracking files (TODO.md, README.md)

- Read them at the start of a task for **direction and intent** — where the project
  is headed and the why behind choices.
- Treat their **progress/done state as a hint, not the truth**: a task marked done
  may not be, or may have drifted. Verify against the code before relying on it. When
  they disagree, **the code wins** — flag the gap, don't edit code to match the docs.
- Update these files **only when I ask** (or at the end of a task I've validated).
  No speculative or routine updates. Exception: when I point to a specific TODO item
  and ask you to handle it, update that line automatically (check it off / amend it)
  as part of completing the task — no need to ask first.

## Commands

Own git repo — run git/CI from `frontend/`.

- Dev: `npm run dev` (localhost:5173)
- CI gates (on pull_request): `npm run format:check`, `npm run check`

No test suite yet (no test script in package.json).

## Admin UI

- Pages under `routes/admin/` consume the backend `/admin/*` API via `authFetch` (`lib/stores/auth.ts`), which stores the JWT in localStorage and attaches the bearer token.
- The admin nav in `routes/admin/+layout.svelte` is the source of truth for the current set of admin pages.

## Gotchas
