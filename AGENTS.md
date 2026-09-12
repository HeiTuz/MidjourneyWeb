# MidjourneyWeb maintenance

Canonical skill: `skills/midjourney-web/`. Installations are runtime copies created by `scripts/install.mjs`, with `hosts/` selecting the browser adapter. Edit canonical files, then reinstall with the intended target and `--force`; do not edit installed copies. This is an independently authored Midjourney website skill, not an official Midjourney product.

Keep the entrypoint small and route detailed workflows to references. Use the current browser tool contract; do not add cookie extraction, private API clients, global selectors that mistake old jobs for new ones, or fixed-delay success checks. Preserve user defaults and exact source/result identities.

Before a local commit run `python3 scripts/validate.py` and `npm test`. Installer changes also need an npm packed-tarball install using an isolated destination. Keep README.md and README.ko.md aligned. Update evidence when a capability is actually exercised; documentation coverage is not a live generation test.

Public files must not contain local usernames/paths, account identifiers, private job links, profile codes, history transcripts, screenshots, credentials or generated customer images. Use official public source links and generalized observations. Local handoff records stay outside the repository.

GitHub creation, pushing, release tags and version bumps require the user's corresponding authorization. When publishing is authorized, follow `RELEASING.md`. Local commits and required HeiTuz handoff follow the parent workspace contract.
