# GitHub release procedure

The repository is prepared locally; no remote publication is implied by these instructions.

1. Run the validator and installer tests from README. Create an `npm pack` tarball outside the repository, inspect its allowlisted contents, and execute its binary with an isolated destination (for example `npm exec --offline --package <tarball> -- heituz-midjourney --target codex --dest <temporary-skill-path>`). Verify the copied payload still works after the unpacked source is removed. Review the complete tracked file list and staged diff for private data. Check that evidence labels are still accurate and refresh any changed official feature rules.
2. With the user's authorization, create or select the exact GitHub repository and visibility. Verify `git remote -v` before pushing. Do not derive the destination owner from a local directory name.
3. Commit the reviewed content. Make any requested release version/tag only within the approved release scope; do not claim a local commit is a published release.
4. Push the approved branch/tag. Check the remote commit SHA and GitHub Actions result against the intended local commit. If either differs or fails, report that state and repair within scope.
5. For an archive, use `git archive --format=zip --output=<external-output-path> HEAD` so only committed files are packaged. Never zip the whole working directory. Unpack into a temporary directory, run validation/tests there, and install to a temporary skills directory to verify the release artifact.
6. If a GitHub Release is requested, attach the validated archive, publish to the approved visibility and read back the release assets/tag. The notes must distinguish package checks from live website tests. Promote the planned GitHub command in both READMEs to a verified installation command only after the destination exists and that remote command has been tested.

Keep workstation handoffs, histories, downloads and screenshots outside the repository and archive. Do not ship a user's sessions merely because they helped discover a workflow.
