---
description: Scan only the changed files in a single commit or PR/MR for newly introduced vulnerabilities (fast incremental check, not a full pipeline run)
argument-hint: "[commit hash | PR/MR number, defaults to HEAD]"
allowed-tools: Bash(git diff:*), Bash(git show:*), Bash(git rev-parse:*), Bash(gh pr diff:*), Bash(glab mr diff:*), Task, Read, Glob, Write
---

Scan only the changed files in `$ARGUMENTS` — a commit hash, a bare PR/MR
number (e.g. `42` or `#42`), or empty (defaults to `HEAD`) — for
vulnerabilities that change itself introduced. Fast, incremental check, not
the full `/vantage:scan-web`/`scan-mobile` pipeline. Same SAST-only rule
applies: read the diff and resulting file content, never run the
application. `Bash` here is scoped to read-only git/PR history commands only
— never used to build, run, or test the target app.

All output for this run lives under **one self-contained root**,
`artifacts/commit-scans/<id>/` (`<id>` = the commit hash, or
`pr-<number>`/`mr-<number>`) — never touching the main pipeline's
`artifacts/findings/`, `artifacts/poc/`, or `artifacts/reports/` paths.
These accumulate across runs by design — this command doesn't prune old
ones; delete a specific `artifacts/commit-scans/<id>/` folder yourself
whenever you no longer need it.

1. **Resolve what to diff:**
   - `$ARGUMENTS` empty -> use `HEAD`.
   - `$ARGUMENTS` looks like a commit hash and `git rev-parse` resolves it ->
     treat as a commit.
   - `$ARGUMENTS` is a bare number or `#<number>` -> treat as a PR/MR: try
     `gh pr diff <number>` first (GitHub); if `gh` isn't available or errors,
     try `glab mr diff <number>` (GitLab). If neither works, stop and tell
     the user to pass an explicit commit hash instead.
   - Nothing resolves -> stop, don't guess.
2. **Get the changed files + diff:**
   - Commit: `git diff --name-only <hash>^..<hash>` for the file list,
     `git show <hash> -- <files>` for the actual diff.
   - PR/MR: the `gh pr diff`/`glab mr diff` output already is the diff;
     derive the changed-file list from its `diff --git a/... b/...` headers.
   - Drop deletions and anything matching
     `scope.json.analysis_scope.exclude_paths` if `scope.json` exists. If
     zero source files remain, stop and report "nothing to scan."
3. Read `platform` from `./.vantage/artifacts/recon/scope.json` if it exists
   (default `web`). Don't auto-generate a full `scope.json` for this fast path.
4. Dispatch the platform's testing agents (see
   `${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md` Platform Routing for the
   list) as parallel Task calls. Override their normal input for this run:
   instead of reading `artifacts/mapping/attack-surface.json`, give each
   agent the diff from step 2 directly in its dispatch prompt and instruct it
   to analyze **only the changed/added lines** — pre-existing unchanged code
   in the same file was already covered by a full scan and is out of scope
   here. Each agent writes its own file at
   `artifacts/commit-scans/<id>/raw-findings.<agent-name>.json`.
5. Dispatch `validator-agent` the same way, reading + writing inside
   `artifacts/commit-scans/<id>/` (`validated-findings.json`).
6. For every `validated:true` Medium-Critical finding, dispatch `poc-agent`
   the same way, writing to
   `artifacts/commit-scans/<id>/poc/<finding-id>.md` — same PoC contract as
   the full pipeline (code evidence + manual test steps a human runs later).
   **Do not** dispatch `report-agent` or generate a `report.md` for this
   fast path — that's the one full-pipeline artifact this command skips.
7. Report directly in chat: what was resolved (commit hash, or PR/MR number
   plus its head commit — this is the `<commit-scan-id>` used below), which
   agents ran, candidate count, the validated findings (severity, file:line,
   one-line description), and a pointer to each one's PoC file for manual
   test steps.
8. To fix one of these findings, tell the user to run
   `/vantage:fix-diff <commit-scan-id> <finding-id>` — a separate command,
   not part of this one. Never dispatch `fix-agent` from inside this command.

**Do not** treat a clean result ("0 candidates") as proof the change is
safe — this only checked the diff, not the whole attack surface (e.g. a new
call site into an already-vulnerable existing function elsewhere in the repo).
