# MidjourneyWeb

An independently authored agent skill for operating the Midjourney website. Designed for Codex's in-app browser, with Chrome as an explicit choice or a verified fallback.

The skill covers image creation and references, V8.x Edit Model and older-version routing, masks/layers, variations/upscaling, style discovery, Personalization, Moodboards, Style Creator, library organization and original downloads. It also documents the site's image-to-video branch. Account navigation is supported; the skill does not grant permission for purchases, publishing or destructive actions.

## Install from a local checkout

Requires Python 3.10+ and a filesystem supporting symbolic links. On macOS/Linux:

```sh
python3 scripts/validate.py
python3 scripts/install.py
```

The installer links `skills/midjourney-web` into `$CODEX_HOME/skills` (or `~/.codex/skills`). It refuses to overwrite any unrelated existing installation. For another destination:

```sh
python3 scripts/install.py --skills-dir /path/to/skills
```

The checkout must remain available while linked. To uninstall, remove only that installed symlink; do not remove the canonical skill. Windows symlink permissions and non-Codex runtimes have not been tested. Other hosts must adapt the browser transport to their actual tools; a markdown skill does not install a browser controller.

Use `$midjourney-web` or ask to operate Midjourney. Skill discovery may require starting a new task. The repository has no assumed GitHub remote yet; once published, clone the actual repository and run the same commands from its root.

## Runtime requirements

- A logged-in Midjourney account and the appropriate plan/GPU allowance for the requested feature.
- The host's supported browser/computer tool. The validated interface is Codex `cua_repl`; no separate Playwright CLI, database server or API key is installed.
- Local file inspection tools for final download verification.

Existing reference images and source jobs remain authoritative. Generation is tracked by its own job, not by global image/button counts. The skill preserves intended personalization and uses model-specific reference roles. It never exports login state.

## Coverage and validation

See [evidence](skills/midjourney-web/references/evidence.md) for live-inspected versus documentation-only paths, and [official sources](skills/midjourney-web/references/sources.md) for the reviewed feature map (2026-09-12). No paid generation was performed during initial authoring. Website changes or account restrictions may require renewed live verification.

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
```

These checks validate package structure, links, distribution hygiene and installer behavior. They do not prove Midjourney generation quality or every browser workflow. Release preparation is documented in [RELEASING.md](RELEASING.md).

MIT licensed. Not affiliated with or endorsed by Midjourney or OpenAI. Product names belong to their respective owners. Linked official documentation remains under its original terms; this repository distributes original operational guidance, not copies of those manuals.
