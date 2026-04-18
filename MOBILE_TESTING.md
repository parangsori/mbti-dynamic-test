# Mobile HTTPS Testing

This project supports mobile pre-push QA through a local HTTPS tunnel.

## Why this setup

- Mobile browsers often require `https` for share, clipboard, and file APIs.
- We want to test on a real phone before pushing to `main`.
- `Cloudflare Quick Tunnel` was more reliable than `localtunnel` in this project.

## One-time setup on macOS

Install `cloudflared`:

```bash
brew install cloudflared
```

## Start mobile testing

1. Build the app:

```bash
npm run build
```

2. Start the local preview server:

```bash
npm run preview:mobile
```

3. In another terminal, start the HTTPS tunnel:

```bash
npm run tunnel:mobile
```

4. Open the `https://...trycloudflare.com` URL on your phone.

## Security notes

- The tunnel creates a public temporary URL while the process is running.
- Anyone who knows that URL can open the app until the tunnel is stopped.
- Do not use this setup for sensitive admin tools or private backend dashboards.
- Stop both processes after testing.

## Recommended use

- Use for short-lived QA only.
- Prefer `preview` over `dev` when testing on mobile because it is closer to production and exposes less development-only behavior.
