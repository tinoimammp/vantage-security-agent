---
description: Apply a code-level fix for one validated finding by id (e.g. F-001) — modifies the target repository's source code
argument-hint: "<finding-id> e.g. F-001"
allowed-tools: Task, Read, Glob, Grep
---

**This command modifies source code in the current repository.** Unlike
every scan command, this is destructive by design — review the result with
`git diff` before committing.

Fix finding `$ARGUMENTS` (a finding id like `F-001`) against the current
project.

1. If no id was given, stop and ask for one — do not guess which finding to fix.
2. Read `./.vantage/artifacts/findings/validated-findings.json`. Find the
   entry with this `id`.
   - Not found → stop, report that the id doesn't exist (maybe check
     spelling, or run `/vantage:scan-web`/`/vantage:scan-mobile` first).
   - Found but `validated: false` → stop, report that only validated
     findings can be fixed.
   - `./.vantage/artifacts/fixes/<id>.md` already exists → stop, report it's
     already been addressed (fixed or marked not_auto_fixable) — don't
     re-apply.
3. Dispatch `fix-agent` via Task for this one finding. It reads its own
   methodology from `${CLAUDE_PLUGIN_ROOT}/agents/others/fix-agent.md`,
   re-locates the vulnerable pattern in the current source (it may have
   moved), and applies the minimal targeted edit implementing the
   `remediation` — or marks it `not_auto_fixable` with a reason if a safe
   automated edit isn't possible.
4. Confirm `./.vantage/artifacts/fixes/<id>.md` was written, and append the
   result to `./.vantage/artifacts/run-log.md`.

Report which file(s) changed (or why the fix was skipped), and remind the
user that `fix-agent` never runs a build or test suite — they must review
the diff and run their own tests before committing.
