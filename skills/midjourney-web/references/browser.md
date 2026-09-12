# Browser execution

Use the currently supplied computer/browser tool contract. This skill supplies Midjourney decisions, not a replacement runtime. In the validated environment UI work uses `mcp__cua_repl.js` with `cua`; do not use terminal Playwright, AppleScript, private HTTP endpoints, cookies, or token extraction to bypass that contract.

## Entry and inspection

- Reuse a bound, live Midjourney tab. Otherwise inventory tabs with `cua.getState()` or `cua.listTabs` according to first-call rules, then select the observed tab/browser IDs. If there is none, `cua.createBrowserTab("iab", "https://www.midjourney.com", {visible:true})` is the tested first-call shape for a user-visible login. Follow current documentation if this changes.
- An empty current-task tab list does not mean authentication was lost. If the earlier tab is unavailable, open the recorded job URL in the same in-app browser and inspect it before requesting another login. This recovered an authenticated page in the maintenance test. A tab owned by another active task must not be seized through a different automation surface.
- After each action, obtain fresh AX state. Numeric indices are ephemeral. Many sidebar links and settings buttons have no accessible name. A URL in the current tree can identify navigation; a screenshot can identify an unlabeled icon. Never paste stored coordinates into a new viewport.
- Where AX omits selected states, inspect the screenshot or a supported read-only DOM view. Labels such as `Selected Select` can contain both action labels; they do not prove selection. Scope duplicate `Subtle`, `Standard`, `HD`, and `Low Motion` controls to the correct section.
- Current navigation surfaces: Explore, Create, Edit, Organize, Personalize, Moodboards, Style Creator, Tasks, Help, Updates and account menu. Obtain current URLs from those links. Preserve the user's active creation folder and draft.
- `Loading...`, disabled profile buttons and placeholder `0 points` are intermediate states, not an empty account or a plan restriction. Wait for the specific real content/enabled control using supported state waits, with a bounded deadline. Do independent work while a page loads. Report persistent loading rather than inventing account state.

## Login and recovery

Normal sequence: Log In → Continue with Google → user's established Google account → return to an authenticated page. Let the user supply credentials or interactive verification when needed; do not ask them to paste passwords into chat. An account creation/consent screen is distinct from ordinary existing-account login.

Observed on 2026-09-12: `auth/network-request-failed` occurred before the Google chooser; the user refreshed, then reported successful login. Later authenticated Create data was observed. This establishes a recovery, not a root cause or universal fix.

When that error recurs, inspect visible state and bounded error logs. If no generation is pending and no unsaved editor/Describe content would be lost, reload the existing tab and repeat the normal login step once. If a draft exists, preserve it first. If it fails again, diagnose the newly observed error or compare Chrome only within the user's browser choice. Never assume all in-app Google logins are unsupported, clear account data as a routine fix, or weaken browser security.

## Exact job tracking

Before the submit action record visible existing `/jobs/` links, intended text, source image, mode and batch count. After submission match newly appearing jobs with that request; concurrent jobs may belong to the user or another task. Open the matching job and retain the full observed link, including `?index=` when present. Prefer navigation to that **observed job URL** over clicking a feed image: hovering a card exposes mutation buttons over its link, and a center click submitted a variation during testing. Never use a feed-card click merely to wait for generation. If an unintended child job is submitted, count it against the approved budget, identify it and report it; don't hide it or delete the evidence.

Record both the user's candidate number and the site's literal index (for example candidate 1 / `index=0` only after observing that mapping). Do not increment or normalize an index in a saved URL. At every source-dependent action recheck the lightbox URL and picture: Escape can close both a menu and its lightbox. If numeric AX targeting fails after page hydration, take a fresh DOM snapshot and use an unambiguous observed role/name or exact observed link. Do not retry stale indices.

The URL alone can be insufficient: in a live recovery test a lightbox URL ending in `index=0` displayed media for a different candidate, and Download Image requested that displayed candidate's PNG. The intended source was later found in Trash. Check its trash state without changing it unless restoration is authorized or corrects your own accidental action. Do not label the neighboring candidate as the requested index or silently rewrite its URL.

Carousels can retain offscreen candidates and duplicate action buttons that Playwright still calls visible. Inspect bounding rectangles to select the button inside the viewport and the matching picture; `visible:true`, `.first()` and global button counts alone are insufficient. Read back the resulting exact media/job before acting. The desktop layout may call the result menu Options and expose Download Image directly, while a narrow layout calls it Open Options. Use current DOM labels rather than assuming one layout's names.

Wait on that job's running/queued status and actual result media. A global `Vary` button, four old CDN images, or `Submitted!` is insufficient. Loaded image elements must have decoded dimensions or an equivalent visual confirmation; a video element needs playable media, not merely a tag. Recheck the requested output count. Use bounded state/event waits, not fixed guesses such as '15 seconds always means finished'. On timeout retain the job identity and current state, then resume the same job later.

No fabricated job IDs, CDN paths, reference URLs, selectors, or fallback success. If submission may have happened, reconcile the feed before any retry. In a busy feed where the match remains ambiguous, ask only for the missing identification instead of rerunning.
