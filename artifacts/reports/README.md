# artifacts/reports/

Final reporting output (written by `report-agent`).

## Files
- `report.md` — the **one** report file: executive summary, scope, risk
  matrix, a dense findings index (linking to `artifacts/poc/` or
  `artifacts/findings/validated-findings.json` for full detail), and the
  remediation roadmap (`${CLAUDE_PLUGIN_ROOT}/templates/technical-report-template.md`).

## Contract
Full assembly rules and quality checklist are owned by
`${CLAUDE_PLUGIN_ROOT}/agents/others/report-agent.md` — this file is a
directory map, not the source of truth. See
`${CLAUDE_PLUGIN_ROOT}/examples/sample-report.md` (web) and
`${CLAUDE_PLUGIN_ROOT}/examples/sample-mobile-report.md` (mobile).