---
description: Apply code-level fixes for ALL validated findings, one at a time — modifies the target repository's source code
argument-hint: "[repository path, defaults to current working directory]"
allowed-tools: Task, Read, Glob, Grep
---

**This command modifies source code in the current repository.** Unlike
every scan command, this is destructive by design — review the result with
`git diff` before committing.

Fix every validated finding against `$ARGUMENTS` (default: current working
directory).

1. Read `./.vantage/artifacts/findings/validated-findings.json`. Build the
   list of `validated[]` entries that do **not** already have a
   `./.vantage/artifacts/fixes/<id>.md` record.
   - If there are none (no validated findings, or all already have a fix
     record), say so and stop — do not fabricate work.
2. Sort the remaining list by severity: Critical → High → Medium → Low → Info.
3. Dispatch `fix-agent` via Task **sequentially, one finding at a time — never
   in parallel**. Multiple fixes may touch the same file, and concurrent
   edits to one file would corrupt it; process the list one Task call at a
   time, waiting for each to finish (and its `artifacts/fixes/<id>.md` to be
   written) before starting the next.
4. If one finding is `not_auto_fixable`, log it and continue to the next —
   don't stop the whole batch for one skip.
5. Append each result to `./.vantage/artifacts/run-log.md`.

When done, report a summary table: how many fixed, how many
`not_auto_fixable` (with reasons), and which files were touched overall.
Remind the user that `fix-agent` never runs a build or test suite — they
must review the diff (`git diff`) and run their own tests before committing.
