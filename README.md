# MidjourneyWeb

**English** · [한국어](README.ko.md)

### Your vision. Your browser. Let's make something incredible.

**Give your agent the playbook for the whole Midjourney workflow.**

Find a look. Bring your references. Shape the image. Push a variation. Pick your favorite. Bring the original home.

MidjourneyWeb is a **browser-first agent skill** built around the way creative work actually happens: exploring, comparing, changing your mind, and getting the details right. It gives Codex practical instructions for working inside Midjourney—from the first prompt to the final download—with your references and personal style at the center.

**Built for Codex's in-app browser · V8.x-aware · MIT licensed**

---

## One creative brief. A whole toolkit.

| You bring the direction | The skill provides the workflow |
|---|---|
| **“Make this idea real.”** | Prompts, image references, aspect ratios, Raw, SD/HD and generation settings |
| **“Same character. A different scene.”** | V8.x Edit Model references, with version-aware routing for older models |
| **“Keep the face. Change the background.”** | Regional edits, applied-mask checks, layers and preservation review |
| **“Find my next visual obsession.”** | Explore, Style Explorer, reusable style codes and Style Creator |
| **“Give the whole series this feeling.”** | Personalization profiles, Moodboards and consistent reference selection |
| **“Show me the strongest take.”** | Candidate comparison, variations, upscaling and HD workflows |
| **“Get this project organized.”** | Search, filters, folders, saved searches and batch actions |
| **“Bring it to life.”** | Image-to-video, motion choices, loops and extensions |
| **“Send me the original.”** | Full-resolution JPG by default, optional PNG, and verified local delivery |

These are the workflows the skill teaches. See [what has been verified](#what-has-been-verified) for the current testing scope.

## Creative control, down to the details

**Your style stays yours.** Personalization and Moodboards are part of the brief. The skill checks the intended profile and references before making changes.

**Every result has a trail.** New generations are matched to their own job IDs. Variations and edits retain their source relationship, so “use the second one” has a concrete meaning.

**The right image, all the way through.** Reference roles, source fingerprints and candidate indices travel with the job. Recovery checks the visible media as well as the URL, so a stale lightbox cannot quietly turn a neighboring image into your final.

**The model matters.** V8.x Edit Model, V7 Omni Reference and older Character Reference workflows get their own paths. The skill consults current official documentation when capabilities change.

**The original is the deliverable.** Downloads are checked as actual files. Screenshots serve as review evidence; original media gets its own verification.

**Bring the file home, inside the app.** JPG delivery uses the selected loaded image. When PNG's download event stalls, the included media bridge renders the site's observed original URL locally so the in-app browser can export it. No image conversion or exported login credentials.

**Stay in the creative workspace.** The in-app browser is the default. Chrome remains available when you choose it or a specific obstacle calls for it.

## Start here

From a local checkout, install with the same Node installer flow used across the HeiTuz skill family:

```sh
node scripts/install.mjs --target codex
```

Then invoke **`$midjourney-web`** in Codex and give it a brief:

> Find three styles for a cinematic botanical series. Show me the options before generating.

> Use the references I attached to create one batch of product images. Keep the packaging design and use a soft daylight setting.

> Open the image I selected, change only the background, and download the chosen result to my project folder.

The skill is designed to carry the requested work through the website. Your account, available tools and approved generation budget determine what can run.

### Installation details

Requires **Node.js 18+**. The installer copies the runtime payload, so it stays installed after the source checkout or npm cache is removed. Select a host, preview a plan, or choose an exact destination:

```sh
node scripts/install.mjs --target codex --dry-run
node scripts/install.mjs --target claude
node scripts/install.mjs --target hermes
node scripts/install.mjs --target all
node scripts/install.mjs --target codex --dest /custom/skills/midjourney-web
node scripts/install.mjs --target codex --force
```

| Target | Installation |
|---|---|
| `codex` / `gpt` | `$CODEX_HOME/skills/midjourney-web`, default `~/.codex/skills/midjourney-web` |
| `claude` | `~/.claude/skills/midjourney-web` |
| `hermes` | `~/.hermes/skills/image-generation/midjourney-web` |

Omit `--target` for directory-based detection. Interactive terminals offer a choice; CI and dry runs never prompt. Non-interactive auto mode uses the first detected host in `claude > hermes > codex` order, or Codex if none is detected. `all` means all detected hosts. Explicit options win; a custom destination without a host uses Codex unless it matches another standard destination. `--quiet` suppresses normal output and prompts.

`--force` replaces only a recognized MidjourneyWeb install and keeps a backup outside the skill discovery tree, under `~/.local/share/heituz/midjourney-web/backups`. It also migrates this project's original source symlink. Unrelated directories, files and symlinks are refused. To uninstall, remove the installed `midjourney-web` directory after preserving anything you added; keep the canonical checkout if you maintain the project. Skill discovery may require a new task.

**GitHub one-line installation, prepared for publication:**

```sh
npx --yes --allow-git=all --package github:HeiTuz/MidjourneyWeb heituz-midjourney -- --target codex
```

The remote repository has **not been published or verified yet**. Use the local command today. After publication, the same one-liner with `--force` updates the installed skill. The Git allowance applies to that command only; no global npm setting is changed. Git is required for the GitHub route.

Bring a logged-in Midjourney account with the relevant plan/GPU allowance, the host's supported browser tool, and local file inspection tools. Codex uses the in-app browser by default; Claude Code and Hermes receive their own transport guidance. The package includes instructions, references and a small Node loopback media helper; it does not install a browser controller or private API client. The three installation payloads are tested locally; live browser execution on Claude Code/Hermes and Windows installation are not yet tested.

## What has been verified

**From a prompt to a real file, tested in the in-app browser.**

- Skill-format and UI metadata checks passed.
- Installer tests cover host selection, safe replacement, symlink migration, payload boundaries, npm-style binary execution and complete canonical/host-adapter parity.
- The distribution archive was extracted, checked and installed successfully.
- Authenticated website navigation, existing image actions, settings and several feature panels were inspected live.
- New V8.2 creation, JPG/PNG reference upload, targeted color editing, candidate comparison and final in-app file delivery passed. The selected JPG and optional PNG are 1024×1024.
- A local erase mask and Undo were exercised. The media bridge saved six real comparison/original assets, and the package passed 19 Node tests.

**JPG is the default; PNG is ready when needed.** The ordinary in-app Download Image event remains unreliable, so the skill uses the verified asset-export route and optional media bridge. The source bridge PNG matched the website export's decoded pixels; website-added metadata differed. An accidental feed-overlay variation was identified and counted within the approved four-job test budget, motivating direct job-URL navigation. HD/upscale, generated mask/layer edits, other reference roles, preference training, board/folder mutations, Style Creator, batch archives and video delivery remain untested.

Read the [feature evidence matrix](skills/midjourney-web/references/feature-matrix.md), [verification record](skills/midjourney-web/references/evidence.md) and [official source map](skills/midjourney-web/references/sources.md), reviewed on **2026-09-12**. The matrix separates live UI/file checks, documentation-only workflows, plan gates and retired features. Purchases, publishing and destructive actions remain subject to the user's authorization and the host's action rules.

## Build on it

The skill lives in [`skills/midjourney-web`](skills/midjourney-web/SKILL.md), with focused references for each workflow. Improvements should come from a concrete task, an observed failure, or a verified website change.

```sh
python3 scripts/validate.py
npm test
node scripts/verify-install.mjs codex /custom/skills/midjourney-web
```

The package validator needs Python 3.10+. These checks cover package structure, links, distribution hygiene and installer behavior. Live generation quality needs live testing. See [RELEASING.md](RELEASING.md) for GitHub publishing and archive verification.

---

**Bring the idea. Let's see how far it can go.**

[MIT License](LICENSE) · Independently authored by HeiTuz. Not affiliated with or endorsed by Midjourney or OpenAI. Product names belong to their respective owners. Official documentation remains under its original terms; this repository distributes original guidance, not copies of those manuals.
