# Organize and deliver

## Search and folders

Create/Organize search targets the user's collection; Explore search targets community content. Narrow by prompt text, time, version, aspect, reference or profile attributes exposed in the UI. A no-results state with filters active does not mean creations were deleted. Inspect active filters including In Trash, image/video, SD/HD, likes, upscales and folder membership.

Use observed folder controls for create/rename/group/add/remove. For batch operations verify selection count and images before the action, then membership afterward. An active creation folder can persist across navigation; inspect the folder indicator under Imagine before generating. Leaving a folder needs the indicator's exit control. Folder deletion and image deletion are different operations. Source: [Using Folders](https://docs.midjourney.com/hc/en-us/articles/34580542725645-Using-Folders).

Saved Searches use query rules rather than static membership. Verify matching results after a requested change. Like/Unlike, Spotlight and trash/restore must target the intended image or explicit batch. Trash is recoverable via In Trash and is **not privacy**; it does not permanently delete individual generations. Source: [Organizing Your Creations](https://docs.midjourney.com/hc/en-us/articles/33329462451469-Organizing-Your-Creations).

## Download

For an image, open its job/index and use Download Image in the result's options menu. For a batch/folder, use the corresponding Download after validating selection. Exported Editor current edits may be transparent, so select the requested export kind. If original download is unavailable, report the limitation instead of relabelling a screenshot as the original.

Subscribe to the supported browser download event before clicking when the runtime provides it. Follow the runtime's documented output mechanism to locate the saved file; an empty download object or success toast alone is not a path. If necessary inspect the user-visible browser downloads UI. Never scrape authentication state or guess CDN URLs to recover a file.

Verify the actual file with local read-only tools: nonzero bytes, decoded format and dimensions; for archives check extraction/count and inspect representative contents. For videos additionally check duration and playback. Preserve original files; use distinct paths for requested exports. A large download may finish after the button click. Deliver absolute file links plus matching source job links. Capture quality evidence separately from original media.

In the inspected in-app runtime, clicking Download Image once did not produce the awaited download event within 15 seconds. Treat that as unverified outcome, not proof of failure or proof that a file exists. First recover the prior exact job/index and inspect returned artifacts, the supported downloads UI and known destination for that identity. No matching filename alone does not prove that no download occurred: the website may rename files.

When the runtime advertises `pageAssets`, its documented `list()` and `bundle()` can recover media already observed on that page. This route saved an existing result's full-resolution JPEG successfully. Filter to the exact media host/job/index; exclude thumbnails, adjacent prefetched candidates and tracking assets. Bind a fresh inventory to the current page and bundle only the selected asset IDs **before any navigation or UI mutation**; an old inventory was rejected after a menu/viewport state change. Re-inventory after that error instead of retrying the same handle. Never construct CDN paths or change file extensions to guess an original.

Record this as displayed-media recovery, with its actual format and resolution. It proves original export only when the site's export/link evidence establishes that this is the intended original; full dimensions alone do not prove byte equivalence to Download Image. Preserve the earlier unknown attempt separately. The current browser download-event object may expose no file methods; do not invent `saveAs()` or `path()`. Copy Image URL returning an empty clipboard is also not a usable URL. If original export remains unavailable, deliver a recovered preview only with that label and leave the original-export requirement open.

## Visibility and account features

Read the current plan/availability when a feature is gated. Default visibility changes do not retroactively change existing creations. Requested privacy changes require checking the selected existing jobs separately. Stealth is plan-dependent, and trashing is not making private. Website and Discord settings may sync. Source: [Stealth Mode](https://docs.midjourney.com/hc/en-us/articles/32019750070669-Stealth-Mode).

Support account/profile settings, usage inspection, Help, Updates and plan navigation through visible menus when requested. Subscription changes, public sharing, account deletion and external messages remain separate consequential actions governed by current user authorization and runtime confirmation rules. 'All site features' describes coverage, not permission to exercise all account actions while creating this skill.
