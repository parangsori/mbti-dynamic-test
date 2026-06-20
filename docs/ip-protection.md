# Today MBTI IP Protection Track

This product repository contains proprietary service logic, copy, and visual assets.

## Operating Model

- Keep the production product repository private.
- Maintain a separate sanitized public template repository for AI-assisted workflow and portfolio visibility.
- Do not put real question banks, result copy, scoring weights, premium analysis rules, original character assets, or production environment details in the public template.
- Keep server-only secrets in Vercel environment variables without the `VITE_` prefix.

## Serverless Session Boundary

- Browser clients should receive only the current session questions and opaque option ids.
- Scoring weights, option type mappings, full question pools, and premium result rules stay server-side.
- `SESSION_TOKEN_SECRET` signs/encrypts short-lived session state.
- `CONTENT_VAULT_KEY` encrypts content vault payloads and must never be exposed to the browser bundle.

## Rollout Notes

- Phase 1 keeps the existing client-side flow as a fallback to avoid blocking test completion.
- After server metrics are stable, remove real content and scoring logic from the client bundle.
- Run bundle leak checks before shipping releases that claim client-side IP reduction.
