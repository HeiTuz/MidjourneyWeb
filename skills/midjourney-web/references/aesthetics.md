# Explore, Personalization and styles

## Explore / Style Explorer

For a style-search deliverable, return the requested shortlist with observed code/link and concrete visual differences. Stop at browsing/copying unless generation or taste changes were requested. Do not turn a style search into a training session. When correcting a style mismatch, consult [prompting.md](prompting.md) before stacking more references.

Use Images, Videos or Styles explicitly. Sort/search using visible controls; open a candidate to compare examples before adopting its style. Style Explorer's Copy/use action prepares a code, while **Try Style immediately generates using the current/latest prompt**. Do not click Try Style during a read-only search. Inspect the resulting `--sref` and avoid unintended stacked codes. A style like is distinct from training the personal profile. Source: [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference).

Browse creator profiles, Follow, search similar images, likes and personal archive when requested. Public community examples are inspirations, not the user's own generated jobs. Tasks offers ranking/surveys; do not invent the user's aesthetic choices or answer personal surveys automatically. Source: [Website Overview](https://docs.midjourney.com/hc/en-us/articles/33329460426765-Website-Overview), [Profiles](https://docs.midjourney.com/hc/en-us/articles/41117938447629-Profiles).

## Personalization

Open Personalize and wait for the actual profiles and point counts. Select the intended version/profile. Training now uses an image-selection grid rather than the older pair-rating flow; follow the visible control, which may still say Add Rankings. Train only within explicit approval and user-supplied aesthetic criteria; when those criteria are missing, the user should choose. Confirm point/profile state afterward. Create or rename profiles only as requested. Existing approval for training covers the agreed batch, not endless voting. Liking community **images** can change Global Profiles, unlike liking Style Explorer **codes**; image likes are not a harmless read-only test when training is excluded.

Global V7 profiles work with V8.1/8.2. Additional V8 profiles do not work with V7; do not assume backwards compatibility from a shared display name.

The P button and adjacent dropdown have different jobs: toggle application versus choose profiles. Inspect both. A profile's display name is not its code, and a profile code can evolve. For continuation read the code from the selected prior job and confirm whether the user wants that historical look or the latest profile. Source: [Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization).

## Moodboards

Open the exact board, using ID/URL and thumbnails as well as its name: duplicate names were observed during testing. New Moodboard supports uploads, URLs and gallery images; inspect the collection and title after changes. Use Moodboard in Prompt and default Select are different operations. Applying one board for a job should not silently change the user's global selections.

A board ID follows its changing collection; prior generation codes can preserve historical versions. Record the resolved code on the submitted job, not only the friendly board name. Stylize controls moodboard influence. Moodboards are not compatible with `--sw`/`--sv` according to the current article. Editing a board's membership changes its future aesthetic; don't curate or delete content merely while browsing. Source: [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards).

## Style Creator

Start from a simple representative prompt or an intentionally selected existing prompt. Preview generation consumes GPU time, including automatic new preview rounds as choices accumulate. Agree on a bounded round budget and aesthetic criteria. Select styles for their appearance, inspect each preview round and retain its code. An existing code in the starting prompt can stack with the new code; record both when both contribute to the desired result. End Session cannot be reopened, so preserve the selected preview/code before ending. Preview images/codes remain in Create. Current documentation describes V7 preview generation even when the account default is newer: inspect actual job metadata.

Source: [Style Creator](https://docs.midjourney.com/hc/en-us/articles/41308374558221-Style-Creator).
