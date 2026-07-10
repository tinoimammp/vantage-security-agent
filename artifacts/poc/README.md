# artifacts/poc/

Proof-of-Concept output (written by `poc-agent`).

## Files
- `<finding-id>.md` — one PoC per validated finding (e.g., `F-001.md`),
  following `${CLAUDE_PLUGIN_ROOT}/templates/poc-template.md`.

## Contract
Full quality rules and construction steps are owned by
`${CLAUDE_PLUGIN_ROOT}/agents/others/poc-agent.md` — this file is a directory
map, not the source of truth. See `${CLAUDE_PLUGIN_ROOT}/examples/sample-poc.md`
(web) and `${CLAUDE_PLUGIN_ROOT}/examples/sample-mobile-poc.md` (mobile).