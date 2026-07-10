---
description: Run the full mobile SAST pipeline (phases 01-06) against this repository — Android, iOS, React Native, or Flutter
argument-hint: "[repository path, defaults to current working directory]"
allowed-tools: Task, Read, Glob, Write
---

Run the complete **mobile** `vantage` pipeline against `$ARGUMENTS` (default:
current working directory), phases 01 through 06, honoring the gates in
`${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md`. Covers Android
(Java/Kotlin), iOS (Swift/Objective-C), and cross-platform (React Native,
Flutter, Ionic/Capacitor, Xamarin/MAUI) source trees.

Read `${CLAUDE_PLUGIN_ROOT}/START-HERE.md` and
`${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md` first if you have not
already this session.

1. If `./.vantage/artifacts/recon/scope.json` doesn't exist, copy the plugin
   asset `${CLAUDE_PLUGIN_ROOT}/artifacts/recon/scope.json.template` →
   `./.vantage/artifacts/recon/scope.json`, filling in placeholders with the
   current system timestamp and repository path. Never block to ask the user.
2. Set/confirm `platform: "mobile"` in that `scope.json` — this command
   always runs the mobile pipeline regardless of what's already there (if it
   says `"web"`, overwrite it to `"mobile"` for this run and note that you
   did so).
3. For each phase, in order, check the phase's gate is satisfied (per
   `${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md`) — if not, stop and
   report why — then dispatch via Task:
   - **01 Recon** → `mobile-recon-agent`
   - **02 Mapping** → `mobile-mapper-agent`
   - **03 Testing** → dispatch all 10 as **parallel Task calls in the same
     turn**, each writing its own `raw-findings.<agent-name>.json` (see
     `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-mobile-top10.md` for M1-M10):
     `credential-usage-agent`, `supply-chain-agent`, `mobile-auth-agent`,
     `mobile-validation-agent`, `mobile-network-agent`, `privacy-agent`,
     `binary-protection-agent`, `mobile-config-agent`, `mobile-storage-agent`,
     `mobile-crypto-agent`
   - **04 Validation** → `validator-agent` (merges all `raw-findings.*.json` first)
   - **05 PoC** → `poc-agent` (only if ≥1 `validated:true` finding)
   - **06 Reporting** → `report-agent`
4. Append each phase's result to `./.vantage/artifacts/run-log.md`.

Stop and summarize if a phase produces zero actionable output (see Failure &
Empty Handling in `${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md`) — do
not fabricate findings.

When done, report the final artifact path —
`./.vantage/artifacts/reports/report.md` — and remind the user that
`/vantage:fix-issue <id>` or `/vantage:fix` can apply code-level fixes for
the validated findings.
