# Codex host

Use the in-app browser by default. Reuse the user's authenticated Midjourney tab through the currently supplied browser/computer tool. In the inspected desktop environment, that is `mcp__cua_repl.js` and its documented `cua` API. Read its first-call documentation before acting; a skill does not make missing tools callable.

Chrome is an explicit choice or a fallback for a confirmed obstacle. Keep the tab available through the current handoff/deliverable API when continuing work. Download and upload operations must use the documented host mechanisms.

Verified file route: default full-resolution JPG through the loaded page asset. Optional PNG uses the bundled loopback media bridge plus the current in-app pageAssets capability; see references/library.md in the installed payload. The normal website download button need not produce a usable host download event. Read capability documentation rather than inventing file methods. The bridge requires Node.js, serves only its in-memory page and should be stopped after export.

Fast path for reference reuse → Create → candidates → original JPG: inside `cua_repl`, import `scripts/codex-browser.mjs` from this installed skill directory (`const mj = await import('file://' + skillDir + '/scripts/codex-browser.mjs')`; after a reinstall, add a new `?v=` query because modules are cached). Each helper checks its own postcondition and returns a status. Continue only on `open`, `attached`, `already-attached`, `submitted`, `ready` or `saved`. Any other status means stop and inspect the page; it is never a reason to resubmit or upload again.

1. `openLibrary(tab)` opens Add Images. `listLibraryImages` and `sameAspectItems` narrow candidates for the same-source check in create.md, and `attachLibraryImage(tab, libraryId)` attaches an existing upload to the highlighted role column. Confirm the role column before submitting.
2. `submitPrompt(tab, text)` starts at the top of the Create feed, preserves an unrelated draft, refuses a mismatched read-back and sends Enter at most once. It identifies the new job by its position above the previous top row and by the full prompt text.
3. `readCandidates(tab, jobId)` waits for the decoded original; `pending` means call again later with the same job ID.
4. Compare candidates from one Create-feed screenshot of that job's grid, then `saveCandidate(tab, jobId, index, absoluteDir)` for the chosen index.

Keep helper timeouts below the `cua_repl` call timeout, or raise `timeout_ms`. PNG export, new uploads, Style Reference or Image Prompt roles, Editor work, video and account actions keep their documented flows. The helpers were live-tested on 2026-09-29, including two authorized generations; see the evidence file.
