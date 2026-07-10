# artifacts/findings/

Testing and validation output.

## Files
- `raw-findings.<agent-name>.json` — one file per Phase 03 testing agent
  (e.g. `raw-findings.sqli-agent.json`), each a JSON array of that agent's
  candidate findings with `validated:false`. Written in parallel; never shared
  between agents. `validator-agent` merges all `raw-findings.*.json` before validating.
- `validated-findings.json` — Phase 04 output from `validator-agent`:
  `{ validated[], rejected[], merged[], stats }`.

## Contract
Full validation rules and field shapes are owned by
`${CLAUDE_PLUGIN_ROOT}/agents/others/validator-agent.md` and
`${CLAUDE_PLUGIN_ROOT}/schemas/finding.schema.json` — this file is a directory
map, not the source of truth. See `${CLAUDE_PLUGIN_ROOT}/examples/sample-findings.json`
(web) and `${CLAUDE_PLUGIN_ROOT}/examples/sample-mobile-findings.json` (mobile).