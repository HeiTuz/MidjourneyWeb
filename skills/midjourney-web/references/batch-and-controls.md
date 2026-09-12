# Batch expansion and controlled comparisons

Documentation checked 2026-09-13; these are submission-planning rules, not live batch-generation evidence. Read the current linked article if limits or controls differ.

## Count work before submission

[Repeat](https://docs.midjourney.com/hc/en-us/articles/32757107922061-Repeat) creates image sets, not individual candidates. It requires Fast or a compatible Turbo mode, not Relax; the available repeat limit depends on the plan. Do not switch GPU mode silently to make it work. The finished prompt omits `--repeat`, so preserve the original input and count actual matched jobs. Rerunning the finished prompt does not automatically repeat the original batch.

[Permutations](https://docs.midjourney.com/hc/en-us/articles/32761322355597-Permutations) expand comma-separated brace options. Independent groups multiply: `{red, blue}` with `{side view, overhead view}` means four prompts before repeat. Nested alternatives must be expanded explicitly; an escaped comma is literal, not another choice. Check every expanded prompt for model/parameter compatibility and count its actual batch size. Permutations also require an eligible plan and Fast/compatible Turbo. For a small comparison, separate explicit prompts may be easier to track than a nested expression.

Where repeat and permutations are combined, estimate the multiplication and confirm supported behavior before submission; do not infer that a syntax accepted for one mode works for every model. Reconcile each submitted job and retain unknown submissions against the budget. Partial success is not permission to repeat the whole expansion.

## Compare one factor at a time

[Seeds](https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds) can control starting noise in a comparison. Capture the seed through the selected image's Copy → Seed action when needed. Keep version, source, reference order, resolved style/profile codes, aspect, resolution and speed constant while changing the intended factor. Seed reuse is not a style or character reference; do not promise identical results across sessions or settings. Turbo is unsuitable for reliable seed comparisons.

Keep three facts separate in the task record: requested parameter, effective submitted setting, observed output. Missing UI metadata stays unknown. Labels such as HD and a requested aspect do not replace decoded output dimensions.
