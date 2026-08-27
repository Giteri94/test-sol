---
name: GitHub synchronization
description: Why GitHub issue API access can work while the repository Git remote still cannot push.
---

The GitHub connector and the repository's HTTPS Git remote are separate authentication paths. A healthy connector can read and update issues while `git push` still fails because the local Git credential helper has no usable credential. When the local Replit history and `github/main` were initialized independently, the Replit Git pane may surface an unhelpful “Unknown Git Error” instead of explaining the divergence.

**Why:** This workspace has a split history between the Replit scaffold and the original GitHub Pages repository; issue API calls work, but the Git CLI remote is unauthenticated and bulk Git Data API writes are proxy-limited.

**How to apply:** Reconnect or reattach the GitHub repository through Replit’s Git interface before retrying a normal push. Do not paste a token into chat or force-push over the divergent remote without an explicit decision.

**Confirmed:** Reconnecting GitHub through the Replit Git interface restores the synchronization path without redoing the local merge.