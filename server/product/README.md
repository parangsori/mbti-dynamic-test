# Server Product Boundary

`server/product/` owns the proprietary product layer: question pools and metadata, selection/follow-up logic, scoring and result construction, personalization and tempo copy, compatibility, and character metadata.

Browser code under `src/` must not import this directory. The only shared character surface is `src/data/typeCharacterAssets.js`, which maps public MBTI asset keys to already-public image paths and contains no descriptive metadata.

For the later private-repository split, move this directory and the private source assets together, then expose only the existing server-session API contract to the public application repository. Do not move session crypto, generic API hardening, or the client-safe asset map unless the deployment topology requires it.
