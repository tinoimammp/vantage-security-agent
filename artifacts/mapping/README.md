# artifacts/mapping/

Attack surface mapping output — written by `mapper-agent` (web) or
`mobile-mapper-agent` (mobile), per `scope.json.platform`.

## Required files
- **Web:** `attack-surface.json` — enriched, prioritized endpoints + `test_plan`.
- **Mobile:** `mobile-attack-surface.json` — prioritized components + `test_plan`,
  categorized by OWASP Mobile Top 10 (2024) — see
  `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-mobile-top10.md`.

## Contract
Full field shapes are owned by `${CLAUDE_PLUGIN_ROOT}/agents/web/mapper-agent.md`
/ `${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-mapper-agent.md` — this file is a
directory map, not the source of truth.

Consumed by all Phase 03 testing agents (the 10 matching the active platform).