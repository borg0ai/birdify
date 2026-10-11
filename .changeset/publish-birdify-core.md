---
"@borg0ai/birdify-core": minor
"@borg0ai/birdify": patch
---

Publish `@birdify/core` as the public package `@borg0ai/birdify-core` (RFC 0015). The CLI now declares it as a normal runtime dependency instead of inlining it into the bundle, reversing RFC 0006/0010's private-and-bundled decision.
