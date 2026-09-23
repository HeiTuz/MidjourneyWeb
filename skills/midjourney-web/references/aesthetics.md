# Explore, Personalization and styles

## Explore / Style Explorer

For a style-search deliverable, return the requested shortlist with observed code/link and concrete visual differences. Stop at browsing/copying unless generation or taste changes were requested. Do not turn a style search into a training session. When correcting a style mismatch, consult [prompting.md](prompting.md) before stacking more references.

Use Images, Videos or Styles explicitly. Sort/search using visible controls; open a candidate to compare examples before adopting its style. Style Explorer's Copy/use action prepares a code, while **Try Style immediately generates using the current/latest prompt**. Do not click Try Style during a read-only search. Inspect the resulting `--sref` and avoid unintended stacked codes. A style like is distinct from training the personal profile. Source: [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference).

Browse creator profiles, Follow, search similar images, likes and personal archive when requested. Public community examples are inspirations, not the user's own generated jobs. Tasks offers ranking/surveys; do not invent the user's aesthetic choices or answer personal surveys automatically. Source: [Website Overview](https://docs.midjourney.com/hc/en-us/articles/33329460426765-Website-Overview), [Profiles](https://docs.midjourney.com/hc/en-us/articles/41117938447629-Profiles).

## Image styles versus numerical codes

An uploaded Style Reference is not convertible into its own numerical `--sref` code. Keep the image reference itself; use Style Explorer or Style Creator when a numerical style code is wanted. Apply an already observed style code for one job with `--sref <code>` and compatible `--sw <value>` in the prompt instead of changing a persistent UI selection. With `--sref random`, preserve the resolved code for a repeatable look. A rerun of that resolved result retains the code, whereas new random inputs may explore different styles.

For ordinary style-reference generation, describe content and add only style words that agree with the reference. Edit Model can accept modification instructions, so do not apply the ordinary content-only advice to all editing. Record `--sv` with an older style code when compatibility matters; the same code across model/style-reference versions may look different. The Style Reference article contains a V8.1 Draft mention that conflicts with the dedicated Version/Parameter List guidance; do not enable V8.x Draft from that sentence.

Source: [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference).

## Personalization

Open Personalize and wait for the actual profiles and point counts. Select the intended version/profile. Training now uses an image-selection grid rather than the older pair-rating flow; follow the visible control, which may still say Add Rankings. Train only within explicit approval and user-supplied aesthetic criteria; when those criteria are missing, the user should choose. Confirm point/profile state afterward. Create or rename profiles only as requested. Existing approval for training covers the agreed batch, not endless voting. Liking community **images** can change Global Profiles, unlike liking Style Explorer **codes**; image likes are not a harmless read-only test when training is excluded.

Global V7 profiles work with V8.1/8.2. Additional V8 profiles do not work with V7; do not assume backwards compatibility from a shared display name.

There is currently no separate Global V8 profile. New additional profiles follow the default model version; inspect that setting before requested profile creation. Global profiles cannot be deleted. Deleting an additional profile removes further training access but does not invalidate its already generated codes. Do not confuse that with deleting the generated images.

The P button and adjacent dropdown have different jobs: toggle application versus choose profiles. For a one-job override, use `--p <observed profile ID/code>` in the prompt rather than changing the default selection. Inspect any active P selection and the submitted job to avoid unintended stacking. A profile's display name is not its code, and a profile code can evolve. For continuation read the code from the selected prior job and confirm whether the user wants that historical look or the latest profile. Source: [Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization).

## Moodboards

Open the exact board, using ID/URL and thumbnails as well as its name: duplicate names were observed during testing. New Moodboard supports uploads, URLs and gallery images; inspect the collection and title after changes. Use Moodboard in Prompt and default Select are different operations. Applying one board for a job should not silently change the user's global selections.

A board ID follows its changing collection; prior generation codes can preserve historical versions. Use an observed board ID/code with `--p` for one job rather than changing the default board; record the resolved code on the submitted job, not only the friendly board name. Stylize controls moodboard influence. Moodboards are not compatible with `--sw`/`--sv` according to the current article. Editing a board's membership changes its future aesthetic; don't curate or delete content merely while browsing. Source: [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards).

Deleting a board removes the editable collection, but previously generated codes remain usable. A code still working does not prove the board was restored. Multiple boards and ranking profiles may be selected together: inspect the full selection rather than treating one visible name as the complete aesthetic input.

## Style Creator

Start from a simple representative prompt or an intentionally selected existing prompt. Preview generation consumes GPU time, including automatic new preview rounds as choices accumulate. Agree on a bounded round budget and aesthetic criteria. Select styles for their appearance, inspect each preview round and retain its code. An existing code in the starting prompt can stack with the new code; record both when both contribute to the desired result. End Session cannot be reopened, so preserve the selected preview/code before ending. Preview images/codes remain in Create. Current documentation describes V7 preview generation even when the account default is newer: inspect actual job metadata.

Source: [Style Creator](https://docs.midjourney.com/hc/en-us/articles/41308374558221-Style-Creator).

The starting prompt renders the previews; it does not describe the content that must appear in sample style choices. Choose samples for visual treatment. Skipping unsuitable samples by scrolling is supported. If a reusable style is the goal, judge it on the intended content within the approved generation scope rather than assuming one attractive preview generalizes. V7 Draft can reduce preview cost when selected deliberately; it is not permission to change ordinary account defaults or to enable Draft on V8.x.
