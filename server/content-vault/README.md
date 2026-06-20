# Content Vault

`content.enc.json` is generated from proprietary product content with:

```bash
CONTENT_VAULT_KEY=... npm run vault:build
```

The key must be configured as a server-only Vercel environment variable. Do not use `VITE_` for this key.

This folder intentionally does not contain plaintext product content.
