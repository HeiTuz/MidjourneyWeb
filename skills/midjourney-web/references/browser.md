# Browser execution

Use the currently supplied computer/browser tool contract. This skill supplies Midjourney decisions, not a replacement runtime. In the validated environment UI work uses `mcp__cua_repl.js` with `cua`; do not use terminal Playwright, AppleScript, private HTTP endpoints, cookies, or token extraction to bypass that contract.

## Entry and inspection

- Follow current first-call routing before reusing or opening a tab. A supplied tab mention/ID or explicitly named browser takes precedence over general inventory. For an unspecified existing surface, inventory with `cua.getState()` and select observed tab/browser IDs. If none exists, `cua.createBrowserTab("iab", "https://www.midjourney.com", {visible:true})` is the tested entry for a user-visible login. Use other inventory APIs only when documented by the current tool.
- An empty current-task tab list does not mean authentication was lost. If the earlier tab is unavailable, open the recorded job URL in the same in-app browser and inspect it before requesting another login. This recovered an authenticated page in the maintenance test. A tab owned by another active task must not be seized through a different automation surface.
- Verify each action's result before the next dependent action. Batch deterministic steps with their postcondition check in one tool call; request a full AX tree or a screenshot only when the next decision needs it. Numeric indices are ephemeral. Many sidebar links and settings buttons have no accessible name; try the stable anchors below before a screenshot. A URL in the current tree can identify navigation. Never paste stored coordinates into a new viewport.
- Where AX omits selected states, inspect the screenshot or a supported read-only DOM view. Labels such as `Selected Select` can contain both action labels; they do not prove selection. Scope duplicate `Subtle`, `Standard`, `HD`, and `Low Motion` controls to the correct section.
- Current navigation surfaces: Explore, Create, Edit, Organize, Personalize, Moodboards, Style Creator, Tasks, Help, Updates and account menu. Obtain current URLs from those links. Preserve the user's active creation folder and draft.
- `Loading...`, disabled profile buttons and placeholder `0 points` are intermediate states, not an empty account or a plan restriction. Wait for the specific real content/enabled control using supported state waits, with a bounded deadline. Do independent work while a page loads. Report persistent loading rather than inventing account state.

## Stable page anchors

Observed on 2026-09-29 in the in-app browser. These describe the current website, not a published interface: when an anchor matches zero or several elements, stop using it and inspect fresh state.

- **Navigation:** sidebar destinations are links with unique paths (`/imagine`, `/editor/new`, `/organize`, `/personalize`, `/moodboards`, `/style-creator`, `/tasks`). Navigate by the observed path instead of clicking an icon.
- **Prompt input:** `textarea#desktop_input_bar`; the same Imagine bar also appears on job pages.
- **Unnamed icon buttons:** most carry an SVG group whose ID names the icon, such as `Settings`, `Folders`, `Search` and `AddImageUncentered`. Select them with `button:has(svg g#<ID>)`. The IDs stay the same when the account's interface language changes; visible labels do not (Korean labels were observed). A few job-page and Editor controls have neither a name nor an icon ID.
- **Result media:** `cdn.midjourney.com/<job>/0_<index>.<ext>` is the original; names containing `_<size>_N.webp` are previews. The original exists only after the job completes. The Create feed groups a job's candidates in one media grid, and that row's text contains the submitted prompt.
- **Add Images panel:** role columns above the uploads library. Library thumbnails are `cdn.midjourney.com/u/<user>/<64-hex>_<size>_N.jpg`; the hex is an opaque library ID and matched none of 2,908 recent local file hashes. Clicking a thumbnail attaches it to the highlighted role column, and a selected thumbnail's wrapper gains the `outline` class. The column's clear button removes the attachments. A job shows its reference as an `s.mj.run/<code>` link.
- **Controls that change data or start GPU work:** feed-card `TrashIcon` and `Heart` overlays, and job controls such as Rerun (`Reload`), Subtle/Strong variation, HD batch and animation. Never use them to navigate or wait.
- **Lazy feed rows:** after a submission, an older row can enter the DOM for the first time. Treat a job as new only when it appears above the previous top row and its row text matches the submitted prompt.
- **Editor brush strokes** remain coordinate actions. Derive them from the current canvas bounding box, not from stored screen positions.

## Unresponsive tabs and waits

- A single locator wait in the in-app browser ends after about 3 s whatever timeout is requested. Wait for a condition in repeated slices within one deadline. Right after navigation an element can be re-rendered, so one failed read there is not evidence of absence.
- On 2026-09-29 a long-lived hidden tab stopped reacting to clicks (no focus change, no panel, no file chooser) while page reads still worked; a fresh visible tab responded normally. If a harmless action leaves no trace twice, open a fresh tab rather than switching to coordinates.

## Login and recovery

Reuse an authenticated page first. If sign-in is needed, use the established method offered by the actual screen. The earlier test used Continue with Google; that is evidence for that account, not a universal requirement. Ask which account to use only if the identity remains ambiguous. Let the user supply credentials or interactive verification when needed; do not ask them to paste passwords into chat. An account creation/consent screen is distinct from ordinary existing-account login.

Observed on 2026-09-12: `auth/network-request-failed` occurred before the Google chooser; the user refreshed, then reported successful login. Later authenticated Create data was observed. This establishes a recovery, not a root cause or universal fix.

When that error recurs, inspect visible state and bounded error logs. If no generation is pending and no unsaved editor/Describe content would be lost, reload the existing tab and repeat the normal login step once. If a draft exists, preserve it first. If it fails again, diagnose the newly observed error or compare Chrome only within the user's browser choice. Never assume all in-app Google logins are unsupported, clear account data as a routine fix, or weaken browser security.

## Exact job tracking

Before the submit action record visible existing `/jobs/` links, intended text, source image, mode and batch count. After submission match newly appearing jobs with that request; concurrent jobs may belong to the user or another task. Open the matching job and retain the full observed link, including `?index=` when present. Prefer navigation to that **observed job URL** over clicking a feed image: hovering a card exposes mutation buttons over its link, and a center click submitted a variation during testing. Never use a feed-card click merely to wait for generation. If an unintended child job is submitted, count it against the approved budget, identify it and report it; don't hide it or delete the evidence.

Record both the user's candidate number and the site's literal index (for example candidate 1 / `index=0` only after observing that mapping). Do not increment or normalize an index in a saved URL. At every source-dependent action recheck the lightbox URL and picture: Escape can close both a menu and its lightbox. If numeric AX targeting fails after page hydration, take a fresh DOM snapshot and use an unambiguous observed role/name or exact observed link. Do not retry stale indices.

The URL alone can be insufficient: in a live recovery test a lightbox URL ending in `index=0` displayed media for a different candidate, and Download Image requested that displayed candidate's PNG. The intended source was later found in Trash. Check its trash state without changing it unless restoration is authorized or corrects your own accidental action. Do not label the neighboring candidate as the requested index or silently rewrite its URL.

Carousels can retain offscreen candidates and duplicate action buttons that Playwright still calls visible. Inspect bounding rectangles to select the button inside the viewport and the matching picture; `visible:true`, `.first()` and global button counts alone are insufficient. Read back the resulting exact media/job before acting. The desktop layout may call the result menu Options and expose Download Image directly, while a narrow layout calls it Open Options. Use current DOM labels rather than assuming one layout's names.

In a narrow lightbox, Toggle Info can expand the action panel. Scrolling over the image may move to a neighboring candidate rather than scroll the controls. Expand the panel first and verify the current index again. Quick Edit should produce an actual Edit attachment; lightbox closure alone is not success. If the bar remains empty, inspect Add Images and use the verified selected original upload route instead of assuming a reference was applied.

Wait on that job's running/queued status and actual result media. A global `Vary` button, four old CDN images, or `Submitted!` is insufficient. Loaded image elements must have decoded dimensions or an equivalent visual confirmation; a video element needs playable media, not merely a tag. Recheck the requested output count. Use bounded state/event waits, not fixed guesses such as '15 seconds always means finished'. On timeout retain the job identity and current state, then resume the same job later.

No fabricated job IDs, CDN paths, reference URLs, selectors, or fallback success. If submission may have happened, reconcile the feed before any retry. In a busy feed where the match remains ambiguous, ask only for the missing identification instead of rerunning.
