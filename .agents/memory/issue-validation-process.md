---
name: Issue validation process
description: The project gate between agent verification and user acceptance.
---

Automated checks and an agent-rendered preview prove that an implementation is technically ready; they do not constitute user acceptance. A feature issue stays open until the user has tested the behavior and confirmed it, then it can be commented and closed.

**Why:** The user explicitly corrected the premature closure of a feature issue that had not yet been manually tested.

**How to apply:** After implementation, report the testable state and leave the issue open with an “awaiting validation” note. Reopen it if it was closed before user acceptance.