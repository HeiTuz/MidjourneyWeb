# Evidence and coverage

Reviewed 2026-09-12. Private job IDs, account data, prompt bodies, images and logs are excluded from this repository. See the [feature matrix](feature-matrix.md) for per-feature status and official links.

## Release workflow confirmation — 2026-09-30

The helper from commit `b6c6bdcc736dc8d7226505837af6c59a51a5c94b` was exercised in the connected Mac Codex in-app browser with three authorized GPU jobs: new still-life creation with an explicit empty reference set, editing a safe existing library upload, and editing candidate index 2 of the new creation by job identity. Each submission matched one new top-row job and its full prompt body, with no other new job reported. Each job completed four candidates. One selected full-resolution JPG per job was copied without re-encoding, checked for byte size and SHA256, and fully decoded as RGB at 1024×1024 using Pillow verify and Image.load. No new upload was needed.

The library image appeared only in the Edit role. Quick Edit attached the exact generated candidate only to Edit, and the reference survived the sidebar return to Create. Both resulting jobs showed Edit reference metadata. The requested mug and sphere color changes were visible, and the surrounding still-life composition was visually retained; pixel identity was not tested. The uploaded source comparison used its 128-pixel reference preview, while the generated source was saved at full resolution.

Disposable drafts confirmed `draft-present` and `navigation-would-clear`; a stale-reference check returned `references-mismatch` without submission. Checked clicks were aligned. One upload-edit attempt returned `input-not-found` before Enter; the input, draft, references and unchanged feed were inspected before the confirmed unsubmitted request was run. No unknown submission was resubmitted. `input-misaligned`, `navigation-pending`, `submission-unknown` and candidate `pending` were not reproduced in this confirmation and are not additional live passes. The operator attributed the initial long tool call to waiting for permission approval. Private job identities, exact prompts, originals and logs remain outside the repository.

## Codex helper fast path — 2026-09-29

A review of eight earlier Codex sessions (399 Midjourney browser calls) found that tool execution took a median of 0.5 s, while the model round trip before each call took a median of 10 s. About 14% of actions were coordinate clicks, mostly on unnamed icons and Editor brush strokes. Read-only inspection of Create, a job page and the empty Editor found SVG group IDs inside most unnamed buttons. The same logs showed older feed rows entering the DOM after a submission. New-job detection therefore requires a row above the previous top and a prompt-text match.

In the in-app browser, the helper module listed feed jobs, read one job row without its neighbour's prompt, and resolved the Settings, Folders, Search and Add Images icons uniquely. It refused to build a selector for the Trash icon. `readCandidates` reported four candidates for an existing job in about 1 s. `saveCandidate` saved index 2 as a 960×1200 JPEG in about 1.2 s; the file header, an independent image tool and the SHA256 agreed. A second save reported the identical existing file, and a request for index 3 while index 2 was displayed returned `another-candidate-displayed`. No GPU job, upload or account change was made.

Two authorized GPU jobs then exercised the whole path. In a fresh visible tab, Add Images showed the role columns and the uploads library, and an existing product reference was attached from the library to Attach to prompt without uploading a file. In the first run, `submitPrompt` returned `submission-unknown` after about 3 s: a single locator wait in the in-app browser ends after about 3 s whatever timeout is requested. As designed, nothing was resubmitted; the feed showed one new top row whose text matched the prompt. Waits now repeat in short slices within one deadline. In the second run, `attachLibraryImage` confirmed the selection and `submitPrompt` returned `submitted` for the matching job in about 3 s. `readCandidates` first reported `pending` while the original was not yet decoded and then `ready` with four candidates; it now rechecks the decode state until its deadline. After a one-screenshot comparison, one candidate from each job was saved as a verified 960×1200 JPEG. Both new jobs showed the same `s.mj.run` reference link as the earlier jobs that had uploaded the image, so reuse involved no second upload. The clear button removed a test attachment, and the bar was left empty.

Library thumbnail names are 64-hex IDs, but none equalled the SHA-256 of 2,908 recent local images, so they are treated as opaque. A long-lived hidden tab stopped reacting to clicks while reads still worked; a fresh visible tab behaved normally. An independent review's five findings (anchor row, weak prompt evidence, undecoded `ready`, header-only file checks, untested guards) were fixed, and ten deliberate code mutations each failed the test suite. Private job IDs, prompts and files remain outside this repository.

A follow-up check without generating showed that one upload can be attached to several role columns at once, so the library thumbnail's outline cannot confirm a role. `attachLibraryImage` now selects the role column by its header icon and confirms the library ID inside that column. Style Reference and Image Prompt attachments, a repeated request (`already-attached` without a click), clearing, and a submission refused with `references-mismatch` (no new job appeared) were checked live. Thirteen deliberate code mutations, including removal of the new role checks, each failed the test suite. Fresh hidden and visible tabs both responded to clicks. A second independent review raised further robustness items: detecting the panel by thumbnails instead of its file input, deadlines that start after navigation, unpaced retries after an immediate wait failure, and browser exceptions that are thrown instead of returned as a status. They are resolved below.

A third session covered generated candidates as references. Quick Edit on a job page had attached a candidate to Style Reference, and the bar's clear button had seemed to do nothing. Both came from one long-lived tab that delivered every input 43 px above the requested point, from Playwright, AX and raw CDP alike: Quick Edit pressed Use Style, whose upper neighbour is HD batch. Fresh tabs were exact, and a viewport override and reset did not reproduce the shift. In an exact tab, Quick Edit attached to Attach to prompt, Use Style to Style Reference, and clearing worked. Clicking helpers now confirm the position the page receives and the element under it before pressing through CDP. That press took 66 ms where a Playwright click on the same button took about 3 s. Further observations: a click outside the open Add Images panel only closes it; the column's attachment area can lie over its header icon; a full page load empties the bar, while the sidebar Create link and a feed row link keep it; a history push changed only the URL.

One authorized GPU job then used a generated candidate as its Attach to prompt reference. `attachJobImage` took 1.3 s including the job page load, `openCreate` 0.2 s, and `submitPrompt` returned `submitted` with the prompt match in 3.0 s. The new row showed a single `s.mj.run` reference link and no upload. Four candidates were ready at the first read; the shown one followed the edit prompt, and it was saved as a verified 960×1200 JPEG in 0.4 s. Without generating, an upload attached to Style Reference in 0.2 s and a candidate of the new job attached to Attach to prompt through its feed row in 0.4 s; both survived the return to Create. With references present, a job outside the feed returned `navigation-would-clear` without a click, and the bar was left empty. The review items above were fixed: the panel is found by its file input, each deadline includes navigation, instant wait failures are paced, and browser exceptions return statuses.

The final maintenance check completed without another GPU job. The inherited mutation run ended with 44 detected mutations and zero missed/skipped cases. A fresh IAB tab verified job/index attachment, Add Images open → Create with the panel closed, reuse of an existing library upload, `already-attached` on repetition, and preservation of both reference types through feed and sidebar navigation. An initial visible tab delivered input 48 px high; the helper refused before pressing, and a separate tab passed. Thus a fresh tab is not guaranteed to be aligned. The existing saved JPEG was independently decoded as RGB, 960×1200, 408,918 bytes, with its recorded checksum unchanged. A disposable prompt confirmed full navigation also clears draft text; full-load paths now refuse drafts and references, covered by regression tests and a live draft-preservation check. Test attachments and drafts were cleared and test tabs closed. No user tab was modified. Deadlines are scheduling budgets, not hard cancellation of transport/read/export work; pending navigation tracking requires the same module instance and tab object.

## Combined references and full Editor generation — 2026-09-23

Two image GPU jobs were submitted in the Codex in-app browser. The first reused a previously recorded source job's Style Reference and Image Prompt. Both roles and the requested aspect, Raw and stylize settings appeared on the new job. Four candidates completed; one full-resolution 1456×816 JPG was saved and decoded. All retained the painted palette and window/photographer composition, but none showed the requested lowered camera. This tests the two roles together, not each role's independent effect or reference weight.

The selected JPG was uploaded into the sidebar's full Edit tab, where the pictured source and active Layer 1 were confirmed. The gallery's Open Editor action had entered the light `/edit/` surface instead. An initial 100 px erase stroke reached outside the intended camera region; Undo restored it. A 40 px brush produced a localized checkerboard mask over the camera. One Submit Edit generated four candidates. One candidate gave the camera body a warm brown/red cast while keeping the face, hands, window and painted treatment broadly intact; it did not fully meet the requested muted brick-red color. The selected generated JPG was saved and decoded at 1456×816. No retry or extra GPU job was submitted.

The Editor result panel displayed thumbnails in reverse numeric order. Selection was confirmed from the live `job_id` and `index` in the URL and the displayed image, not thumbnail position. The new full Editor job also appeared in Create. Its Create metadata showed an Edit reference, Raw and the source image's exact 91:51 pixel ratio; the requested version was not exposed separately in the inspected job metadata. These observations do not establish Stealth behavior, Smart Select generation, layered composition or perfect preservation. The private record and both saved JPGs remain outside this repository.

## Single-role reference comparison — 2026-09-23

Two further image GPU jobs used identical neutral prompt text and displayed settings (16:9, Raw, stylize 200, V8.2 requested). One resulting job showed only the Style Reference role; the other showed only the Image Prompt role. Each completed four candidates. The first candidate from each was visually inspected, saved from the loaded full-resolution image asset and decoded as a 1456×816 JPG. Both showed the photographer, window, crowd and painted palette, but neither visibly lowered the camera. The style-only first candidate framed the camera and upper body more tightly; the image-only first candidate placed the figure beside a broad window and crowd. These are observations of two samples, not proof that a particular reference caused those differences. The source image and style reference were visually related, the combined-reference job used different prompt wording, and no seed was confirmed. Reference weights and repeatability remain untested.

The expanded Imagine bar showed each role before submission, and each completed job showed the intended single role. While preparing the comparison, the bar's “clear image prompts” control removed both loaded reference roles; a role-labelled button on the existing job added back one role at a time. No extra job was submitted during that correction. Private job IDs, exact prompt and images remain outside this repository.

## Smart Select generation and file delivery — 2026-09-23

One additional full Editor GPU job reused the painted photographer/window JPG from the combined-reference batch. The full `/editor/` view showed the pictured source and active Layer 1. A Smart Select Include point on the jacket selected the entire photographer silhouette, excluding most of the vintage camera. The green selection was inspected before Erase Selection; afterward the silhouette became checkerboard while the window, crowd and camera remained pictured. The edit instruction therefore targeted rebuilding the whole photographer in a muted brick-red jacket, aligned to the remaining camera, rather than claiming a jacket-only mask.

Submit Edit produced four completed candidates. All four were opened in the Editor. The selected candidate showed the red jacket and broadly preserved the camera placement and window/crowd composition, but the regenerated face and coat looked markedly more photographic than the original ink-wash painting. It is a successful selection → erase → generation → original-file workflow, not a successful style-preservation result. The exact child job appeared in Create with an Edit reference, Raw and the source's 91:51 ratio; the requested model version was not separately exposed in the inspected metadata. The selected full-resolution JPEG was saved from its loaded job/index asset and decoded at 1456×816. No second submission was made. The private job ID, prompt, and file remain outside this repository.

## Verified core workflow

The core checkpoint below is from 2026-09-12. A separate 2026-09-13 maintenance experiment is recorded next; it does not change the earlier four-job accounting.

## Viewpoint and full Editor experiment — 2026-09-13

One authorized Imagine-bar Edit batch used a previously selected painted photographer/window scene as its single uploaded original. The instruction requested a rear three-quarter over-the-shoulder viewpoint while retaining pose, scene and style, with explicit V8.2, 16:9, Raw and stylize 200 parameters. Four candidates completed and were visually compared; source and all four full-resolution JPGs were saved and decoded at 1456×816.

All candidates showed more of the back of the head/jacket. Palette and brushwork remained broadly consistent. Window/crowd layout largely stayed anchored; one candidate exposed more of the window but no candidate established a coherent orbit of the entire scene. This is a partial viewpoint result, not a validated 3D camera move or identity guarantee. The rear-facing head limits facial-identity assessment. There was no controlled profile/style comparison or repeat batch.

The full sidebar Editor loaded the same original independently. Move/Resize controls, aspect presets and the active layer were inspected. Smart Select isolated the face, not the entire person; Erase Selection produced visible checkerboard, Undo restored the pixels, and Clear all points removed the remaining selection overlay. No Editor generation, layer composition, outpainting or export was submitted. The original was restored visibly.

In the narrow gallery lightbox, Toggle Info exposed the action panel. A scroll over the picture advanced the candidate; the recorded source URL restored the correct image. Quick Edit closed the lightbox but did not leave an attachment in the inspected bar, so it was not treated as success. Uploading the previously saved exact original established the Edit attachment. No extra GPU job was submitted for this recovery.

Official Prompt Basics, Creating on Web, Version, Edit Model and Editor articles were rechecked. [Camera edit guidance](camera-edits.md) separates semantic viewpoint changes, layer transforms and canvas expansion. Private prompt, job IDs, hashes and files remain outside the package.

Maintenance validation on 2026-09-13: package/reference validation, skill quick validation, diff whitespace checks and all 21 existing Node tests passed, including isolated packed installation and host payload parity. No installer or bridge code changed. These checks validate the package, not additional live website features.

## Additional document review — 2026-09-13

Thirteen additional official articles were read: Style Reference, Personalization, Moodboards, Style Creator, Video, Organizing Your Creations, Using Folders, Describe, Upscalers, Parameter List, Seeds, Repeat and Permutations. Added [batch planning](batch-and-controls.md), resolved-style handling, profile/board lifecycle distinctions, search/filter semantics, hidden-upscaler recovery, and video input/export contracts. The Style Reference article's V8.1 Draft sentence was flagged as inconsistent with dedicated model guidance.

No new browser operation, upload, generation, training, deletion or video export was performed in this document-only pass. Existing live evidence remains unchanged. The preceding viewpoint experiment is the only new GPU batch in this maintenance task. The additions explain how to execute these functions; they do not claim those functions passed live testing.

After these additions, package validation, skill quick validation, all 21 Node tests and diff checks passed again. The installer and media bridge implementation were unchanged.

## Earlier image-generation checkpoint

The bounded live budget was four GPU jobs. All four were identified: initial creation, an unintended variation triggered by a feed overlay, a PNG-reference edit, and a separate edit using a JPG downloaded entirely through the in-app browser. No extra jobs, purchases, preference training or public-sharing actions were submitted.

| Step | Actual evidence |
|---|---|
| Authentication and settings | Existing in-app authentication reused after opening the recorded job in a new task; current V8.2/SD, aspect, Raw, stylization and speed controls inspected without changing defaults |
| Creation | One V8.2 SD square product-image job produced four images; selected job/index matched the visible full-resolution media |
| Original file | Selected 1024×1024 JPG saved through in-app pageAssets; original PNG also saved through the new loopback media bridge |
| Reference upload | Both PNG and JPG files uploaded through the documented filechooser API; screenshot confirmed one matching image in Attach to prompt (Edit Model) |
| Targeted edit | Reference-bearing child jobs completed. A red sphere became lemon yellow while the blue mug, right handle, placement, framing, lighting and background remained visually consistent |
| Selection and delivery | All four final candidates inspected and decoded at 1024×1024; index 0 selected and saved as JPG, with optional original PNG |
| Preservation review | Independent read-only visual/quantitative review preferred index 0. Outside a stated sphere mask, mean absolute RGB difference was about 3.13/255 per channel; this is preservation evidence, not a pixel-identity claim |
| PNG transport fidelity | In-app bridge PNG and the same source downloaded through Chrome had identical decoded RGB pixels. File bytes differed because the website download added creation/author/description metadata |

**Default delivery is JPG** at the actual full source resolution, copied without re-encoding. PNG is optional when requested or useful. This format choice was explicitly requested during testing.

## Download findings and recovery

- The earlier Download Image event timeout remains historically unknown. No original success was inferred from it. A later full-resolution JPEG recovery was verified separately.
- Feed-card clicks can hit newly revealed mutation controls. A variation was accidentally submitted and counted against the four-job budget. An unintended trash state on the older source was restored and read back; no original was left trashed. Exact observed job URLs replaced feed clicks for further navigation.
- A narrow carousel could display a neighboring candidate while the URL retained the old index, with offscreen action buttons still considered visible. The intended source was found in Trash. Media identity, viewport position and trash state were added to recovery checks.
- The ordinary in-app Download Image button did not return a usable download event in narrow or desktop layouts. A PNG fetch response or a void downloadMedia return did not establish a file. Direct unauthenticated transfer encountered a CDN challenge; no cookies were exported.
- Full-resolution loaded JPGs exported successfully through pageAssets. Prefetched candidates needed to be loaded or rendered in the bridge before export.
- **Working in-app PNG recovery:** obtain the exact PNG URL from the actual Download Image action, render it as an image in the loopback media bridge, wait for decoded dimensions, then use the host's pageAssets inventory/bundle. This saved original PNGs successfully without Chrome, credential extraction, private endpoints, security changes or image conversion.
- The actual canonical bridge CLI was tested live with six assets: three original PNGs and three comparison JPGs. All six loaded at 1024×1024 and were saved successfully.
- The ordinary download button itself is not claimed fixed; the skill now has a verified in-app file-delivery route.

## Additional live coverage

Explore → Styles and style-detail controls were inspected; Try Style explicitly submits the current/latest prompt. Current Organize filters, profiles and saved-search controls were inspected. A local erase mask was applied only inside the test sphere, visibly became checkerboard, and Undo restored the source; no masked generation was submitted. Earlier same-day inspection covered Moodboards, empty full Editor/layers, Personalize, Style Creator and Tasks.

Describe execution, HD/upscale, Smart Select driven generation, layered composition, profile training, board/folder mutations, Style Creator rounds, batch archives and new video generation remain untested. Image Prompt and Style Reference have combined and separate live batches, but causal effect and weight controls remain unproven. Other reference roles remain untested. Video history or menu presence is not a completed video test. Plan-gated and retired features are labeled separately in the matrix.

## Package verification

Package/reference validation, the host skill validator and 20 Node tests passed. Tests cover the installer, safe replacement and rollback, all three host adapters, actual packed npm CLI execution, complete canonical/payload parity, and the media bridge's URL validation, loopback CLI and bounded HTTP surface. An actual tarball install exposed a physical-path alias issue in the bridge entrypoint; resolving the real path fixed it, and a symlink-entry regression test was added. Final distribution and installation receipts are kept outside the repository.

At the core-test checkpoint, the Codex installation was a verified runtime copy containing the canonical references, bridge script and Codex host adapter; no remote or release tag existed then. Claude/Hermes payloads were locally tested; their live browser workflows and Windows installation were not. Later publication validation is code-only at the user's request: it does not repeat installation tests or reinstall local skills. Publication receipts identify the released commit and assets separately.

Official Create, Version, Edit Model, Editor, Image Prompts, Style Reference, Describe, Variations, Upscalers, Overview, Personalization, Moodboards, Style Creator, Organize, Folders, Plans, Video and Legacy articles were rechecked. The Editor's older generic gallery note conflicts with its version-specific visibility section; the skill now follows the version-specific rule and actual job state.

## Behavioral regression scenarios

1. Submit times out in a feed full of older images: reconcile the exact new job before another GPU submission.
2. A feed link exposes hover buttons or a carousel has offscreen actions: navigate by observed job URL and verify the current image, not the first button.
3. Duplicate moodboard names or evolving profiles: use the resolved prior job code and exact board identity.
4. V8.x background edit: verify the mask and current visibility, without applying legacy gallery rules.
5. Style browsing: separate Copy/preparation from Try Style and taste training.
6. Download event has no file: use the supported loaded-asset route; default JPG, optional observed PNG through the bridge.
7. Current-task tabs are empty: reopen the recorded job in the same browser before asking for new authentication.
