# Security Policy — LiveFactChecker frontend

SvelteKit 2 + Svelte 5 client. It captures microphone audio, streams raw PCM to
the backend over a WebSocket, and renders live transcripts and verified claims.
It also hosts the admin UI, which talks to the backend `/admin/*` routes.

## Supported versions

Only the latest `main` is supported. Fixes land on `main`; deploy from there.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

- Preferred: open a private [GitHub Security Advisory](https://github.com/Logan2234/frontend/security/advisories/new).
- Or email **logan.w@sfr.fr** with steps to reproduce and impact.

Expect an acknowledgement within a few days. Please allow a reasonable window to
ship a fix before public disclosure.

## Security model

The frontend holds **no secrets**. The only sensitive material client-side is the
authentication token.

- **JWT in `localStorage`.** The admin/user token is stored in `localStorage`
  (`src/lib/stores/auth.ts`) and sent via `authFetch`. This makes the token
  reachable by any script running in the page, so **any XSS is a token
  compromise.** Avoid `{@html}` on untrusted content and never inject
  server-provided strings as raw HTML — claims and transcripts must be rendered
  as text.
- **Backend URL** is configured via `PUBLIC_BACKEND_URL` (`src/lib/config.ts`,
  default `http://localhost:8000`). In production it must point to an `https`/
  `wss` backend so audio and tokens are not sent in clear.
- Anything under the `PUBLIC_` prefix is bundled into the client and is public by
  definition — never put a secret there.

## What to watch when contributing

- Do not introduce `{@html}` or `innerHTML` on data coming from the WebSocket or
  the backend (transcripts, claim text, sources).
- Keep dependencies current; run `npm audit` and address advisories on the
  runtime dependency tree.
- Do not commit `.env` files or any backend credentials.

## Scope

In scope: DOM-based XSS in claim/transcript rendering, token handling in
`localStorage`, mixed-content / insecure transport of the backend URL, and any
leak of the auth token. Out of scope: backend authorization logic (see the
backend repo's `SECURITY.md`) and third-party services.
