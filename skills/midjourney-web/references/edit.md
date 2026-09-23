# Modify a selected result

Open the exact source job and image index. Confirm the picture and metadata before choosing an action. The current website uses labelled Creation Actions; do not search for Discord U1–U4/V1–V4 buttons.

| Need | Action and completion check |
|---|---|
| Similar alternatives | Vary Subtle/Strong; bind new child job to source; compare all returned candidates |
| New interpretation of the same input | Rerun; this submits a new job, not a page refresh |
| Larger chosen result | Upscale Subtle/Creative when available; inspect identity/details and actual dimensions |
| Regenerate batch in HD | Run batch as HD; treat as new generation, not a download or byte-identical upscale |
| Change text while varying | Remix only on compatible results; inspect changed text before submission |
| Reuse appearance or wording | Use Style / Prompt loads input; inspect inherited flags and references before running |
| Alter framing | Reframe, Pan, Zoom Out or Editor according to available actions; verify frame and subject scale |
| Change a region | Vary Region / Editor; verify applied mask before Submit Edit |

Use [Modifying Your Creations](https://docs.midjourney.com/hc/en-us/articles/33329329805581-Modifying-Your-Creations) for action selection, [Variations](https://docs.midjourney.com/hc/en-us/articles/32692978437005-Variations) and [Upscalers](https://docs.midjourney.com/hc/en-us/articles/32804058614669-Upscalers) for the current model's behavior. Do not promise that Creative preserves every detail.

If Upscale is absent, inspect Creation Actions → More Options for the hidden Upscale section before declaring it unsupported. Revealing controls is distinct from pressing an upscaler, which immediately submits. For V8.2, SD can be enlarged but already-HD images cannot be upscaled further. Prefer Subtle when preservation matters; Creative adds interpretation. Read the actual source/output dimensions rather than assuming every image is square or HD means a fixed width.

## Edit Model versus Editor

For camera direction changes, see [camera-edits.md](camera-edits.md). Choose semantic Edit for a new viewpoint; use Editor for spatial masks, composition and canvas work. Moving or rotating a flat layer alone does not reconstruct a new camera angle.

[Edit Model](https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model) supports written modification instructions and up to four references in V8.1/8.2. It can combine with Image Prompts, Style References, Moodboards/Personalization and HD. It is not compatible with tile, and Edit Model results currently do not support Remix. Use explicit 'change X, preserve Y' instructions when editing. Quick Edit can be useful for semantic changes; the masked Editor is preferable when the region is exact.

## Editor procedure

The gallery's light Editor and the sidebar's full Edit page are different surfaces. A gallery image's Open Editor action can enter the light `/edit/` view; use the sidebar Edit tab or the light Editor's Open in Edit tab action for the full `/editor/` view. Verify the URL and layer controls before relying on full-Editor features. Preserve any existing draft; open a separate tab for an independent experiment rather than resetting the user's canvas.

Choose mask scope deliberately. For a local change, erase only the target region. For a V8.x whole-image style change, the official Editor walkthrough permits submitting instructions with no erase/selection; an unmasked submission is not necessarily a no-op. This can be explored for global semantic changes such as viewpoint, but do not report viewpoint generation in full Editor as tested merely because the same instruction worked with an Imagine-bar Edit reference. Inspect active layer, mask, version and resulting job separately.

Open the source in Editor or use Edit from URL / Edit Uploaded Image. Inspect source, active layer, canvas boundaries and prompt. Use Move/Resize to place and scale; Paint to erase/restore; Select for Smart Select. Green selection is not an applied erase mask: apply Erase Selection or Erase Background, then verify checkerboard only in the intended region. Undo/Restore repairs a wrong mask before submitting. A broad canvas-wide drag is never an acceptable substitute for a small region.

For a small target, reduce the brush size before erasing. Inspect the first checkerboard stroke against the actual canvas coordinates; Undo and try a smaller brush if it reaches protected content. When importing a local file, subscribe to the browser's filechooser event before clicking the upload control, then verify the pictured source and active layer. After submission, read the child job metadata: the Editor can show the source's exact pixel ratio (for example 91:51 for a 1456×816 image) and can rewrite the input bar's parameter display. The prepared text alone does not prove the effective settings.

The full Editor result panel may display candidate thumbnails in a different order from their numeric indices. Select each relevant thumbnail, verify the observed child job ID and `index` in the URL against the displayed picture, and save the chosen generated image rather than a current-mask export. One 2026-09-23 masked edit generated four candidates and a full-resolution JPG; the requested color was only partially matched. See [evidence.md](evidence.md).

Add/reorder layers with the Layers controls and verify the active layer. Submit only after checking visible protected content and transparency. Results must be inspected for both requested edits and preservation. Retexture is integrated in the V8.x Edit Model; the separate legacy Retexture tab requires a compatible older version. Distinguish Save Original Generation from Save Current Edit (which can export transparency).

Smart Select may isolate a face rather than the whole person. Inspect hair, hands, clothing and held objects before using Erase Background; add Include/Exclude points as needed. After Undo, selection points or green highlighting may remain even though pixels are restored. Clear selection points separately and visually check the restored canvas before the next operation.

Gallery and visibility are version-dependent. The Editor article's **Image History & Visibility** section says V8.x Edit Model results populate Create/Organize automatically, including external-image edits, and follow Stealth visibility. V7 and earlier require Upscale to Gallery; their external-image/layer outputs have different visibility rules. The article also retains an earlier unqualified note saying uploads/layers require upscaling: do not apply that note to V8.x or spend GPU just to make a supposedly missing result appear. Check the selected model, Editor results, and exact job in the gallery first. Do not assume an uploaded-image edit is private. If the user's scope excludes public output and current visibility is public, resolve that before submission.

The first Edit Model reference determines the default output aspect; the account's ordinary aspect default does not. Record reference order and use an explicit supported aspect parameter when the brief requires a different frame. For V7 Omni results, the full Edit tab may be required; remove incompatible Omni/weight input only in the new edit draft, preserving the original job record.

Source: [Editor](https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor), [Legacy Features](https://docs.midjourney.com/hc/en-us/articles/33329788681101-Legacy-Features). Check current output resolution after inpainting/outpainting; do not infer it from the input HD badge.
