# Organize and deliver

## Search and folders

Create/Organize search targets the user's collection; Explore search targets community content. Narrow by prompt text, time, version, aspect, reference or profile attributes exposed in the UI. A no-results state with filters active does not mean creations were deleted. Inspect active filters including In Trash, image/video, SD/HD, likes, upscales and folder membership.

Use observed folder controls for create/rename/group/add/remove. For batch operations verify selection count and images before the action, then membership afterward. An active creation folder can persist across navigation; inspect the folder indicator under Imagine before generating. Leaving a folder needs the indicator's exit control. Folder deletion and image deletion are different operations. Source: [Using Folders](https://docs.midjourney.com/hc/en-us/articles/34580542725645-Using-Folders).

Saved Searches use query rules rather than static membership. Verify matching results after a requested change. Like/Unlike, Spotlight and trash/restore must target the intended image or explicit batch. Trash is recoverable via In Trash and is **not privacy**; it does not permanently delete individual generations. Source: [Organizing Your Creations](https://docs.midjourney.com/hc/en-us/articles/33329462451469-Organizing-Your-Creations).

## Download

**Default to full-resolution JPG.** Save the selected result's actual JPEG bytes from the site; using a `.jpg` filename for `.jpeg` media is not conversion. Use PNG when the user requests it or needs that format. Do not upscale or regenerate just to download. A screenshot, thumbnail or contact sheet is not the selected full-resolution file.

Open the exact observed job/index URL. Match the picture and in-viewport media source to that index; exclude neighboring prefetched images. Read the host's currently advertised download/asset capability documentation before calling it. A success toast, HTTP 200, empty download object or void method return is not a saved file.

### JPG in the in-app browser

1. Let the selected full-resolution JPEG actually load and confirm its decoded dimensions. An image URL appearing in history or a prefetch list is insufficient.
2. Use the supported `pageAssets.list()` to get the current inventory; select only the exact source asset ID. Then `bundle()` it before navigating or changing the UI.
3. Copy the returned file to the requested destination without re-encoding. Verify format, dimensions, bytes and source identity; record SHA256 in the private job record.

If the inventory becomes stale, list again after checking the current source. If a prefetched candidate fails, open that candidate's observed job URL and let it load, or use the bridge below to render the approved comparison set. Do not repeatedly fetch the same stale entry.

### Optional PNG and the media bridge

The website's Download Image action may request PNG while the lightbox displays JPEG. Obtain that PNG URL from the **actual action's observed resource**, never by replacing a file extension or constructing a CDN path. The tested in-app download event did not expose a saved PNG, and bundling its fetch-only resource failed.

Use [media-bridge.mjs](../scripts/media-bridge.mjs) to render the exact approved image URLs as normal image elements:

```sh
# Run from the installed skill directory; substitute the exact observed URL.
node scripts/media-bridge.mjs --url '<exact-observed-CDN-image-URL>'
```

Repeat `--url` for an authorized comparison set. The helper validates HTTPS image URLs on cdn.midjourney.com and prints a loopback URL. It serves only an in-memory page on 127.0.0.1 with an automatically assigned port. It does not fetch media, read credentials, inject code into Midjourney, convert pixels or save personal URLs in the skill.

Open that returned loopback URL in the **same in-app browser**. Confirm each intended image's natural dimensions, then list and bundle its exact asset IDs using the host capability. This route saved three original PNGs and three comparison JPGs in the live test. Copy/verify the returned files, close the temporary bridge tab, and stop only the helper process identified by its returned execution session. Preserve delivered media.

The bridge PNG matched the website-download PNG's decoded pixels exactly in a source comparison. The website download additionally contained creation/author/description metadata, so do not promise identical metadata or file hashes between those routes.

If the current host does not expose the required asset capability or the image does not load, preserve the exact failure. Do not export cookies, invent download-object methods, weaken browser settings or silently switch browsers. Direct unauthenticated file transfer may encounter a CDN challenge. A confirmed alternate-browser export can be useful evidence, but is not a solution to an explicit in-app-only request.

### Other exports and completion

For folder/batch downloads, validate the selected images and count first. Inspect archive extraction/count and representative contents. Editor Save Current Edit may contain transparency and differs from Save Original Generation. Video delivery also requires actual duration and playback verification.

On recovery, keep an earlier unknown download attempt separate from a later successful save. Inspect known destinations and source identities before retrying; filenames may differ, so a missing expected filename alone does not establish non-execution. Deliver absolute file links and matching job/index links, with the true format and any export limitation.

## Visibility and account features

Read the current plan/availability when a feature is gated. Default visibility changes do not retroactively change existing creations. Requested privacy changes require checking the selected existing jobs separately. Stealth is plan-dependent, and trashing is not making private. Website and Discord settings may sync. Source: [Stealth Mode](https://docs.midjourney.com/hc/en-us/articles/32019750070669-Stealth-Mode).

Support account/profile settings, usage inspection, Help, Updates and plan navigation through visible menus when requested. Subscription changes, public sharing, account deletion and external messages remain separate consequential actions governed by current user authorization and runtime confirmation rules. 'All site features' describes coverage, not permission to exercise all account actions while creating this skill.
