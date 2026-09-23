# Create and reference inputs

## Prepare and submit

For writing or correcting text, use [prompting.md](prompting.md). Before replacing an unrelated Imagine draft, preserve its text and attachment identities in the task record or use a separate creation tab when supported. Do not discard unfinished work just to clear the bar.

Open Create through the sidebar. Check the Imagine bar, active folder and reference thumbnails/roles. Inspect inherited Personalization or other UI settings only when they affect the requested job or a parameter cannot express the choice; do not open Settings for every one-off option. Text belongs in the web Imagine bar without a Discord `/imagine prompt:` prefix. Enter submits; Cmd+Enter can submit while retaining text, so it is not a harmless editing shortcut. Read the final text back before one submit. Use the exact-job protocol in `browser.md`.

## One-off option routing

For a single job, put supported options at the **end of the Imagine prompt** with ASCII `--`, instead of opening Settings and changing account defaults. Keep the user's existing compatible flags; do not append a duplicate or a conflicting value. Confirm model, plan and parameter compatibility before submission, then read back the final Imagine text and the resulting job metadata. A typed flag alone does not prove it took effect. Change persistent UI defaults only when the user asks for defaults to change, and read them back after saving.

| One-job intent | Prompt parameter, when supported |
|---|---|
| Frame, model, image resolution, Raw | `--ar <ratio>`, `--v <version>`, `--sd` / `--hd`, `--raw` |
| Stylization, variety, weirdness, exclusion | `--s <value>`, `--c <value>`, `--w <value>`, `--no <subject>` |
| Reproducible comparison, seamless pattern | `--seed <number>`, `--tile` |
| Attached image/style influence | `--iw <value>`, `--sref <observed code>` and compatible `--sw <value>` |
| Existing profile or Moodboard | `--p <observed ID/code>`; use `--p` only when the intended default profile is clear |
| Requested speed, visibility, repeat | `--fast` / `--relax`, `--stealth` / `--public`, `--r <count>` when eligible |

Do not select a faster paid speed, change visibility, or expand repeat merely to avoid UI work. V8.x does not support Turbo, Draft, quality or multi-prompt weighting; `--hd` and other parameters still require model-specific checks. Repeat/permutations multiply jobs: count expansion before submission and stay within the requested amount. `--seed` does not guarantee identical subjects. See [batch controls](batch-and-controls.md) for counts and comparisons.

The website still handles **uploading and assigning reference roles**, selecting the source image, Editor masks/layers, post-generation actions and downloads. Video Starting/Ending Frame attachments and **video SD/HD resolution** also use the UI; do not substitute image `--sd` / `--hd` for video resolution. Inspect active reference roles and any inherited draft flags before submitting. The actual selected UI or job metadata wins over historical defaults.

Do not silently disable Personalization for 'reproducibility': it may be the user's intended aesthetic. For comparisons keep the same recorded profile/code, references and settings while varying the requested factor. Record changed factors; a seed is not an identity guarantee.

## Image roles

Open Add Images; choose a specific upload or upload the authorized local file using the current browser file-upload instructions. Observe the uploaded thumbnail before assigning it. Use the live role buttons or drop zones, then inspect the role and number of attachments. Reusing the uploads library avoids redundant uploads; a different filename alone does not prove image identity.

Before upload, record the source file's bytes, decoded dimensions and SHA256 in the local job record. The current Creating on Web article limits uploads to 10 MB. If conversion or reduction is needed, retain the original and record the derived upload separately. A downloaded reference must match the selected job/index, not a contact sheet, screenshot or neighboring candidate. After upload verify the pictured subject and role; a successful chooser call alone is not an uploaded reference.

| Intent | Input role |
|---|---|
| Content, composition or palette inspiration | Image Prompt; `--iw` controls image influence where supported |
| Look, medium, texture or lighting | Style Reference; `--sref` and supported style controls |
| Keep a subject or change an existing image in V8.x | Edit Model Reference / Attach to prompt |
| V7 identity workflow | Omni Reference, with V7-compatible weight controls |
| V6/Niji 6 character workflow | Character Reference, with compatible character weight |
| Aesthetic collection | Moodboard via Personalization, not a single image reference |
| Animate an image | Starting Frame / Animate, then verify Video mode |

An attachment changes available modes. Confirm Image versus Video before submitting. The reference lock keeps images between prompts; stale locked images must not bleed into a different request. Clear only attachments not intended for the next generation. Multiple Edit references need unambiguous descriptions of which subject/object comes from which image. Never use a local file path as an online reference URL.

For a one-role comparison, inspect the expanded Imagine bar immediately before each submit. A role-labelled reference button on an existing job can add just that reference to an otherwise empty bar. In one live web session, the bar's “clear image prompts” control removed *both* an Image Prompt and a Style Reference; do not assume that control removes only the named role. Check the resulting job metadata for exactly the intended role and keep the text and available settings identical across comparison jobs. If a seed cannot be read back, record that limitation rather than claiming a seed-controlled comparison.

## Version gate

Checked 2026-09-12 against [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version): V8.2 is the documented default. V8.1/8.2 use Edit Model instead of Omni/Character Reference; V7 retains Omni; V6 retains Character Reference. V8.x does not support the quality parameter, multi-prompt weighting, Turbo, or Draft in that compatibility chart. A visible Draft shortcut alone does not establish support for the currently chosen model. Consult the feature article and live UI when they disagree. Niji is a separate model family; verify its selected version instead of treating it as V8.

Use [Parameter List](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List) and the individual feature articles for current ranges and compatibility. Do not copy unsupported flags from an older prompt to a newer model.

## Describe and conversational input

For repeated or comparative runs, use [batch-and-controls.md](batch-and-controls.md). Record the submitted expansion before it disappears from result metadata; do not reconstruct the requested batch count from a single finished prompt.

[Describe](https://docs.midjourney.com/hc/en-us/articles/32497889043981-Describe): use the upload image menu or an existing creation's context menu. Review its four suggested prompts. Use Prompt prepares text; Run all prompts generates multiple batches. Save useful suggestions before refresh because they are transient.

Dragging an image can expose a dedicated Drop image to describe target. Dropping there requests text suggestions, not an Edit reference: verify the intended drop zone. Describe is not recovery of the original prompt, and repeated analysis may produce different suggestions. The current article describes longer V8.1/8.2 suggestions; review them before using an older model.

[Draft & Conversational Modes](https://docs.midjourney.com/hc/en-us/articles/35577175650957-Draft-Conversational-Modes): conversational mode rewrites the user's input, so it is inappropriate when an exact prompt must be submitted unchanged. Inspect the rewritten prompt and actual resulting job. Voice requires the browser's microphone permission and current feature compatibility. Do not enable it for an ordinary typed prompt request. Draft/Enhance availability depends on model; use the supported refinement action shown on that draft.

Sources: [Creating on Web](https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web), [Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts), [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference), [Edit Model](https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model).
