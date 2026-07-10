---
description: Apply a code-level fix for a finding from /vantage:scan-diff's commit/PR/MR scan — modifies the target repository's source code
argument-hint: "<commit-scan-id> <finding-id>  e.g. pr-42 F-001"
allowed-tools: Task, Read, Glob, Grep
---

**This command modifies source code in the current repository.** Unlike
every scan command, this is destructive by design — review the result with
`git diff` before committing. This is `/vantage:fix-issue`'s counterpart for
findings from `/vantage:scan-diff` instead of a full pipeline run.

Fix finding `$ARGUMENTS` (expects two values: a commit-scan id — the commit
hash, or `pr-<number>`/`mr-<number>` — then a finding id like `F-001`)
against the current project.

1. If either value is missing, stop and ask for both — do not guess which
   commit-scan or finding to fix. If the commit-scan id is unknown, list the
   existing ones by listing `./.vantage/artifacts/commit-scans/*/` directory
   names.
2. Read `./.vantage/artifacts/commit-scans/<commit-scan-id>/validated-findings.json`.
   Find the entry with this `id`.
   - File or entry not found → stop, report that it doesn't exist (check the
     commit-scan id and finding id, or re-run
     `/vantage:scan-diff <commit-scan-id>` first).
   - Found but `validated: false` → stop, report that only validated
     findings can be fixed.
   - `./.vantage/artifacts/commit-scans/<commit-scan-id>/fixes/<id>.md`
     already exists → stop, report it's already been addressed — don't
     re-apply.
3. Dispatch `fix-agent` via Task for this one finding
   (`${CLAUDE_PLUGIN_ROOT}/agents/others/fix-agent.md`), telling it
   explicitly to read the finding from
   `artifacts/commit-scans/<commit-scan-id>/validated-findings.json` (not
   the main pipeline's file) and, if present,
   `artifacts/commit-scans/<commit-scan-id>/poc/<id>.md`. It re-locates the
   vulnerable pattern in the current source (it may have moved), and
   applies the minimal targeted edit implementing the `remediation` — or
   marks it `not_auto_fixable` with a reason if a safe automated edit isn't
   possible.
4. Confirm `./.vantage/artifacts/commit-scans/<commit-scan-id>/fixes/<id>.md`
   was written, and append the result to `./.vantage/artifacts/run-log.md`.

Report which file(s) changed (or why the fix was skipped), and remind the
user that `fix-agent` never runs a build or test suite — they must review
the diff and run their own tests before committing.
