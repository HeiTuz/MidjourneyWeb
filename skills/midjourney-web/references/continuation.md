# Continue without losing the source

Use a small local job record when a request spans several generations, downloads or turns. Save it under the user's project/output directory, never inside the installed skill or package repository. Simple browsing does not need a record. This is task evidence, not cross-task personal memory.

## Record the observable facts

For each logical request record:

- Request intent and protected visual details; original local source paths or explicitly selected source job/image.
- Browser/host and current observed task URL, without cookies, credentials or authentication query strings.
- Actual submitted text, reference roles and identities, selected model, personalization codes, mode, output count and approved remaining job budget.
- Parent job, new job URL/ID, individual image index; submission time and last observed state.
- Chosen candidate and observed changes; downloaded file path, decoded dimensions/format, and video duration where relevant.

Do not infer unseen data. Record unknown fields as unknown. Never put real user data into sample files shipped with this skill.

## State transitions

`prepared → submitted → running → generated → reviewed → downloaded → verified`

`submission_unknown` and `failed` are separate states. A lost browser call can be submission_unknown; it is not proof that no job exists. A successfully decoded original file establishes the last state only when it corresponds to the chosen result. Downloading the wrong index is not delivery success.

On resume, inspect the recorded job first and reconcile the live feed before any resubmission. Check parent/source identity, model and selected reference codes against the saved request. If the user changes direction, preserve old outputs and record the new request separately. If they stop, leave the current job status and remaining work; do not promise future polling unless a real scheduler was requested and registered.

## Candidate review

Review composition, requested subject/action, source identity/product details, palette/style, text defects and output dimensions against the brief. For an edit, inspect the protected areas alongside the changed region. Make concrete observations, not invented quality scores. Present the best candidate with its index and why it fits. If none meets a must-have constraint, report that and adjust only the relevant factors within the authorized iteration budget.

History profiles and moodboards can evolve. A prior job's resolved code is the starting point for a same-style continuation; a similarly named current profile is not equivalent. Preserve the original source for each independent edit rather than using a previous generated candidate unless the user requests a sequential edit.
