# artifacts/fixes/

Remediation output (written by `fix-agent`, invoked only by `/vantage:fix-issue`
or `/vantage:fix` — never part of the automatic Phase 01-06 pipeline).

> **This is the one place in the whole framework where the target repository's
> source code itself gets modified.** Every artifact everywhere else is
> read-only analysis; `fix-agent` is the deliberate, explicit exception —
> see `${CLAUDE_PLUGIN_ROOT}/agents/others/fix-agent.md`.

## Files
- `<finding-id>.md` — one record per finding (e.g. `F-001.md`): status
  (`fixed` | `not_auto_fixable`), file(s) changed, before/after snippet, and
  any follow-up needed (dependency install, manual review, running tests).
  The **presence of this file** is also the "already fixed, don't re-apply"
  marker used when `/vantage:fix` is re-run.

## Contract
Full safety rules and fix procedure are owned by
`${CLAUDE_PLUGIN_ROOT}/agents/others/fix-agent.md` — this file is a directory
map, not the source of truth.

**Before committing anything here, review the diff (`git diff`) in your
target repository and run your normal tests.**
