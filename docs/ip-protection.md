# Today MBTI IP Protection Track

This repository contains proprietary service logic, copy, and visual assets. Browser-exposure reduction and repository confidentiality are separate controls: the runtime boundary below reduces what ships to users, while a later private-repository split protects source access.

## Runtime Boundary

- The browser receives only sanitized session questions, opaque option IDs, UI hints, and a versioned final `displayModel`.
- Full question pools, answer mappings, weights, scoring, follow-up selection, result copy rules, personalization rules, compatibility, and character metadata are owned by `server/product/`.
- `src/data/typeCharacterAssets.js` and the public character manifest contain only public MBTI-to-image paths. They must not contain character descriptions or product rules.
- `/api/session/*` responses remain `private, no-store`. The browser, CDN, service worker, `localStorage`, and `sessionStorage` must not cache question sessions or tokens.
- Identical concurrent starts may share only one in-flight Promise. Completion identity is deterministic so a retry cannot create a second local history entry.
- A start failure stays on the start screen with an explicit retry. A completion failure restores the exact last sanitized question; neither path creates a local result.

## Secrets

- `SESSION_TOKEN_SECRET` protects the short-lived encrypted session token.
- `CONTENT_VAULT_KEY` protects content-vault artifacts.
- Both are server-only Vercel environment variables and must never use a `VITE_` prefix or appear in source, logs, docs, or commits.

## Release Gate

Run `npm run build && npm run check:bundle-leak`. The command blocks when built client text contains known product copy, proprietary metadata, scoring fields, sourcemaps, or forbidden secret markers. `npm run report:bundle-leak` is diagnostic-only and must not replace the blocking release check.

## Staged Release Order

1. Stage A: release deterministic completion, the complete display contract, and explicit start retry; verify server-session errors, latency, and completion continuity.
2. Wait at least the 30-minute pending-result compatibility window before Stage B.
3. Stage B: release the client import removal, `server/product/` boundary, and blocking bundle gate; smoke-test start, follow-up, retry, result, history, share, pending recovery, and PWA behavior.
4. Only after the runtime boundary is stable, separate the product repository and private `server/product/` source/assets. Repository visibility and Git history changes are a distinct audited task.

This reduces practical browser exposure; it is not a claim of absolute secrecy. A valid public API can still be collected, so suspicious-use monitoring and measured rate controls remain separate follow-up work.
