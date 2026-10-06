# Orchestration

**Owner:** orchestrating agent (the one that drives the whole run)
**Inputs:** `artifacts/recon/scope.json`
**Outputs:** none of its own — it sequences Phases 01–06 and maintains `artifacts/run-log.md`

> This file covers ONLY cross-phase control: ordering, parallelism, gates,
> failure/empty handling, and resume. For the pipeline diagram, the universal
> agent loop, run-log format, and quality bar, see
> `${CLAUDE_PLUGIN_ROOT}/START-HERE.md` (§3, §5, §8). Do not duplicate those here.
>
> Path convention: bare `artifacts/...` paths below (no `${CLAUDE_PLUGIN_ROOT}`
> prefix) are relative to the target project's cwd, i.e.
> `<project-cwd>/.vantage/artifacts/...` — see `${CLAUDE_PLUGIN_ROOT}/START-HERE.md` §4.

---

## Phase Dependency Gates

A phase may start only when its gate is satisfied. If a gate fails, do not skip —
follow the failure handling below.

| Phase | May start when | Reads | Writes |
|-------|----------------|-------|--------|
| 01 Recon | `scope.json` exists (else auto-generate, see below) | scope.json | web: endpoints.json, recon.json — mobile: mobile-recon.json |
| 02 Mapping | Phase 01 output exists & validates | web: endpoints.json, recon.json — mobile: mobile-recon.json | web: attack-surface.json — mobile: mobile-attack-surface.json |
| 03 Testing | Phase 02 output exists & has `test_plan` + `repo_wide_tasks` | attack-surface.json / mobile-attack-surface.json | raw-findings.\<agent-name\>.json (one file per agent, either platform) |
| 04 Validation | at least one `raw-findings.*.json` exists | raw-findings.*.json (merged, both platforms if both ran) | validated-findings.json |
| 05 PoC | `validated-findings.json` has ≥1 `validated:true` | validated-findings.json | poc/*.md |
| 06 Reporting | `validated-findings.json` exists (PoCs if any) | validated, poc/*, recon output, attack-surface output | report.md (the one file) |

Phases 01–03 route to a different agent set depending on
`scope.json.platform` — see **Platform Routing** below. Phases 04–06 are
platform-agnostic: same three agents, same schema, regardless of which
pipeline produced the findings.

## Scope Gate (before Phase 01)

`scope.json` is the precondition for the whole pipeline, and its `platform`
field decides which agent set Phases 01–03 dispatch to.

1. If `artifacts/recon/scope.json` is missing, copy the plugin asset
   `${CLAUDE_PLUGIN_ROOT}/artifacts/recon/scope.json.template` → your
   project's `./.vantage/artifacts/recon/scope.json`.
2. Replace `<PLACEHOLDERS>` using system time (see `${CLAUDE_PLUGIN_ROOT}/TIMESTAMPS.md`) and repo path.
3. Read `platform` (defaults to `"web"` if the field is somehow absent from an
   older `scope.json`). Determine it once here — do not re-derive it per phase.
4. **Never block to ask the user.** Auto-generate with documented defaults and proceed.

## Platform Routing (Phases 01–03)

Each agent file is fully self-contained (role, methodology, decision tree,
output contract) — there is no separate phase playbook to read; the table
below is the complete routing.

| Phase | `platform: "web"` | `platform: "mobile"` |
|-------|--------------------|------------------------|
| 01 Recon | `${CLAUDE_PLUGIN_ROOT}/agents/web/recon-agent.md` → `endpoints.json`, `recon.json` | `${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-recon-agent.md` → `mobile-recon.json` (+ `endpoints.json`/`recon.json` if a backend API exists) |
| 02 Mapping | `${CLAUDE_PLUGIN_ROOT}/agents/web/mapper-agent.md` → `attack-surface.json` | `${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-mapper-agent.md` → `mobile-attack-surface.json` |
| 03 Testing | 11 agents in `${CLAUDE_PLUGIN_ROOT}/agents/web/`: `auth-agent`, `authorization-agent`, `api-agent`, `sqli-agent`, `xss-agent`, `upload-agent`, `business-logic-agent`, `injection-agent`, `dependency-agent`, `secrets-agent`, `misconfiguration-agent` | 10 agents in `${CLAUDE_PLUGIN_ROOT}/agents/mobile/`: `credential-usage-agent`, `supply-chain-agent`, `mobile-auth-agent`, `mobile-validation-agent`, `mobile-network-agent`, `privacy-agent`, `binary-protection-agent`, `mobile-config-agent`, `mobile-storage-agent`, `mobile-crypto-agent` (see `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-mobile-top10.md`) |

Phases 04–06 always dispatch `${CLAUDE_PLUGIN_ROOT}/agents/others/validator-agent.md`,
`poc-agent.md`, `report-agent.md` — never the web or mobile agent sets — because
`${CLAUDE_PLUGIN_ROOT}/schemas/finding.schema.json` is shared across both
pipelines (`platform` field on each finding records where it came from).

## Parallelism Rules

- **Phases run sequentially 01 → 02 → 03 → 04 → 05 → 06.** A later phase never
  starts before its gate is satisfied.
- **Within Phase 03, the testing agents for the active platform (11 web /
  10 mobile) MAY run in parallel** (see Platform Routing above for the web
  vs. mobile agent list), because each only reads its platform's Phase 02
  output and writes **its own** `raw-findings.<agent-name>.json`. No two
  agents ever write the same file, so true parallel Task dispatch is safe.
  Only one platform's agent set runs per pipeline execution — never mix web
  and mobile testing agents in the same Phase 03 run.
  - Each candidate finding MUST have a unique `id` (prefix per agent, e.g.
    `sqli-001`, `dep-001`).
  - `validator-agent` merges all `raw-findings.*.json` files (glob) before
    validating in Phase 04 — it is the only agent that reads across all of them.
- **Phases 04–06 are single-owner** (validator, poc, report) and do not parallelize.

## Large Repo / Monorepo Strategy

Activate this strategy when the repository is large (rough triggers: >2,000
source files, >200k LOC, or a monorepo with multiple services/packages). The goal
is to stay within the agent's context/time budget while never silently skipping
high-risk code.

1. **Aggressive exclusion first.** Honor `scope.json.exclude_paths` and skip
   non-source noise: `node_modules/`, `vendor/`, `dist/`, `build/`, minified
   bundles, generated code, fixtures, snapshots. (The dependency-agent reads
   lockfiles separately, so they need not be parsed during code inventory.)
2. **High-signal-first inventory (Phase 01).** Do not read every file blindly.
   Prioritize, in order: (a) route/controller definitions, (b) auth/session code,
   (c) config & env files, (d) dependency manifests/lockfiles, (e) DB/query
   layer, (f) file-upload & deserialization code. Everything else is secondary.
3. **Chunk by unit, not by whole repo.** For a monorepo, treat each
   service/package as a chunk: run recon→mapping per chunk and append to the
   shared artifacts. Record a `chunk_id` on endpoints so findings stay traceable.
4. **Budget per phase.** If a phase approaches its context/time budget, stop
   expanding breadth, finish the current high-priority chunk, write a partial but
   valid artifact, and log remaining chunks in `run-log.md` as `PENDING`.
5. **Resume by chunk.** A follow-up run reads `run-log.md`, picks up `PENDING`
   chunks, and merges into existing artifacts (additive, unique ids per chunk).
6. **Prioritize P0/P1 across chunks before P2/P3 anywhere.** Testing works the
   global `test_plan` impact-first, so a budget cut still covers the riskiest code
   across the whole repo rather than exhausting depth on one chunk.

> Partial coverage must be **explicit**: the final report states which chunks/paths
> were analyzed and which remain `PENDING`. Never imply full coverage when it was capped.

## Failure & Empty Handling

| Situation | Action |
|-----------|--------|
| Recon finds 0 endpoints (web) / 0 components (mobile) | Web: still write `endpoints.json: []` and `recon.json` with `app_purpose` + `critical_assets[]`. Mobile: still write `mobile-recon.json` with all sections present (empty where nothing found). Continue either way; repo-wide agents (web: dependency/secrets — mobile: supply-chain/privacy) can still run. |
| Mapping yields 0 P0/P1 | Continue to testing; work P2/P3 in impact order. |
| A testing agent errors out | Log the failure to `run-log.md`, continue other agents. Missing or empty `raw-findings.<that-agent>.json` is fine — validation merges whichever files exist. |
| Validation rejects ALL candidates | Write `validated-findings.json` with empty `validated[]` and populated `rejected[]`. Skip Phase 05. Phase 06 still produces a report stating "no validated findings". |
| No Medium–Critical findings | Phase 05 PoCs are optional; Phase 06 still runs. |
| A required input artifact is missing | Do NOT fabricate it. Re-run the producing phase; if it cannot produce, log and stop with a clear reason. |

## Idempotency & Resume

- The pipeline is **resumable**: re-running a phase overwrites its own output
  artifact deterministically from its inputs. It must not corrupt downstream files.
- To resume after interruption, find the last successful line in `run-log.md` and
  start from the next phase whose gate is satisfied.
- Re-running Phase 03 replaces each agent's `raw-findings.<agent-name>.json`
  wholesale (all agents re-run); do not merge stale candidates from a previous run.

## Orchestrator Checklist

- [ ] Scope gate satisfied (scope.json exists/auto-generated).
- [ ] Each phase gate verified before starting that phase.
- [ ] Phase 03 agents given unique id prefixes.
- [ ] Every phase appends one line to `artifacts/run-log.md`.
- [ ] Empty/failure cases handled per table above (never silently skipped).
- [ ] Pipeline ends with `report.md` (the one report file) at the exact path.
