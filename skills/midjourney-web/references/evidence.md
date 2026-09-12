# Evidence and coverage

Review date: 2026-09-12. No account identifiers, job IDs, source images, browsing transcripts or private prompt bodies are distributed here.

## Basis

- Historical evidence: existing Computer History summaries and three narrowly selected Chrome event segments from that date. The status tool was unavailable, so capture health/completeness was not verified. These records are retrospective evidence only.
- Historical workflows observed: Explore/Create browsing; reference-bearing prompts with aspect/Raw/stylize/profile controls; image detail actions; animation submission followed by progress; personalization/moodboard use described in saved summaries. Menu presence or a submit toast did not establish export completion.
- Current in-app browser: user completed Google login after a refresh. The agent subsequently observed their existing creation feed and an existing image's detailed actions.
- Official documentation: the sources index, including the V8.2/Edit Model transition. The skill is newly authored; third-party automation examples were assessed earlier but not incorporated as executable code.

## Current verification scope

The compact [feature matrix](feature-matrix.md) maps official current rules to execution evidence and plan/legacy boundaries. It is the release coverage index, not a claim that all features were executed.

| Surface | Evidence level |
|---|---|
| Google login | User-completed; authenticated feed later observed; agent did not enter credentials |
| Create and existing image detail | Live navigation and action labels verified |
| Settings | Live panel and screenshot; version 8.2 and selected controls visible; no defaults changed |
| Moodboards | Live real collection loaded; duplicate board names observed, motivating ID-based selection |
| Editor | Live empty editor: Move/Paint/Select, Erase/Restore, Layers, URL/upload entry and export/submit controls |
| Organize | Live filter controls observed; no batch mutation performed |
| Personalize / Style Creator / Tasks | Navigation and controls inspected; no training, profile creation or style session started |
| New generation / paid modifications / upload | Procedures documented; no new GPU jobs or source uploads performed |
| Original download | Existing image's Download Image invoked; the subscribed browser download event timed out after 15 seconds and no saved-file evidence was established. Outcome unverified; not a passed export test |

The intended coverage is the website's image workflow and associated style/library/account navigation, plus its image-to-video branch. This is not a claim of end-to-end testing of every feature. Subscription changes, permanent deletion, publishing and preference training were not exercised. A future release must keep these distinctions accurate.

Initial validation passed the host skill-format validator, package/reference checks, UI metadata parsing and five Python installer/package tests. That original symlink installer has since been replaced by the Node installer with host selection, runtime copies, backups and isolated tests. Use current test output for the current count. Independent behavioral evaluation was attempted but the provider could not accept the delegated task; no independent-review pass is claimed. The author reviewed the scenarios below against the written procedures.

The subsequent Node installer pass on the same date passed 14 tests, including replacement rollback, all three host payloads, local-data exclusion and execution of the actual npm-packed binary in offline mode. The installed copy remained readable after removal of the test source and npm cache. These are local package tests, not a verified public GitHub install or remote CI run.

## Follow-up maintenance pass

- Started from a clean working tree at the known local installer commit. The runtime installation was confirmed to be a directory copy, not a symlink.
- Reopened the prior exact job in the same in-app browser when the current task had no tabs. Existing authentication persisted; no new login was needed. A Chrome tab owned by another active task was left alone.
- Reconciled the old download as far as current evidence permits: no matching file was found in the known Downloads destination. That does not establish non-execution. The earlier event timeout remains unknown.
- Used the currently documented `pageAssets.list/bundle` capability to save the previously observed result's full-resolution JPEG, then decoded and visually inspected it: 1456×816, JPEG. This verifies displayed-media recovery, not the Download Image original export. Refreshing inventory after a UI change resolved a stale-inventory error.
- Observed a real identity hazard: the selected lightbox URL retained one index while a neighboring candidate's JPEG was visible. A Download Image click exposed a PNG request for that neighboring candidate. Reselecting the original feed link and refreshing did not establish a matching original download. No wrong-index file was accepted as the requested original. Copy Image URL also returned no usable clipboard text in this host.
- Revisited Explore → Styles and a style detail; Try Style explicitly indicated immediate submission of the current/latest prompt. Inspected current Organize media/type/resolution/aspect/version/profile/saved-search controls. No likes, taste rankings, public visibility or account changes were performed.
- Rechecked official Create, Version, Edit Model, Editor, Image Prompts, Style Reference, Describe, Variations, Upscalers, Overview, Personalization, Moodboards, Style Creator, Organize, Folders, Plans, Video and Legacy articles. Corrected version-specific Editor gallery/visibility behavior and documented the conflicting older note.
- Package validator, host quick validator and 16 Node tests passed, including complete installed-payload/adapter comparisons, stale-file and manifest detection, and the real packed npm CLI in an isolated destination. This remains local validation, not remote CI.

**Remaining core gate:** no explicit GPU budget was found in the available request/history; a bounded-budget question was sent and remained unanswered during this pass. No new GPU job was submitted. New creation → original download and original re-upload → targeted edit → selected original file therefore remain untested. Live release readiness is not achieved. Profile training, Style Creator rounds, video generation, folder mutations and batch exports also remain untested. Private recovery files and job identifiers are kept outside the distributable repository.

## Behavioral review scenarios

Use these for independent read-only evaluation, not as brittle phrase-matching tests:

1. The feed already contains many completed images. A new request times out after submit. Identify the next action and completion evidence.
2. Several moodboards have the same display name. Continue the style of a prior job without guessing the board or changing global defaults.
3. A V8.2 job needs a different background while preserving the subject. Select a compatible edit route and explain mask verification.
4. A user asks only to browse styles. Distinguish Copy from Try Style and avoid accidental generation.
5. A download button was clicked but no path is returned. Explain the remaining verification, without pretending a screenshot is the original.
6. Google login fails before account selection. Preserve unsaved content and use proportionate recovery before abandoning the chosen browser.
