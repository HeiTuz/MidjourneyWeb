# Evidence and coverage

Reviewed 2026-09-12. Private job IDs, account data, prompt bodies, images and logs are excluded from this repository. See the [feature matrix](feature-matrix.md) for per-feature status and official links.

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

Describe execution, HD/upscale, generated masked/layer edits, other reference roles, profile training, board/folder mutations, Style Creator rounds, batch archives and new video generation remain untested. Video history or menu presence is not a completed video test. Plan-gated and retired features are labeled separately in the matrix.

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
