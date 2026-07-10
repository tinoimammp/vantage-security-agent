# AI Pentest Framework — START HERE

> An artifact-driven, multi-agent web application penetration testing workspace
> designed for autonomous coding agents (Claude Code, Codex, OpenAI Agents,
> Cursor Agents, etc.).

---

## 0. What This Framework Is

This is a **production-ready, artifact-driven SAST (Static Application Security Testing)**
framework. Agents analyze **source code, configuration files, and application architecture**
to identify security vulnerabilities — **WITHOUT running the application**. Multiple AI
agents collaborate **only through artifacts** (JSON + Markdown files written to
`artifacts/`). No agent assumes shared memory or live state. Every agent:

1. **Reads** the artifacts produced by previous phases.
2. **Performs** its specialized task.
3. **Writes** a new artifact that conforms to a schema in `schemas/`.

This makes the workflow resumable, auditable, parallelizable, and deterministic.

### How This Framework Is Meant To Be Used (read this to avoid ambiguity)

This framework runs in **two distinct stages with two distinct actors**:

1. **Automated stage — SAST by AI agents (Phases 01–06).**
   Agents only **read and analyze source code**. They do **not** run the app, send
   HTTP requests, or exploit anything. Their evidence is **code-based**: file paths,
   line numbers, and source-to-sink data flows. The pipeline produces validated
   findings and, for every Medium–Critical finding, a **PoC document**.

2. **Manual stage — human verification (after Phase 05/06).**
   A **human tester** takes each generated PoC and **runs it manually** against a
   live/staging instance to confirm exploitability. This is the only point where
   actual HTTP requests are issued — and it is done **by a person, not an agent**.

> In short: **agents find & document statically; a human proves it manually using the PoC.**
> Therefore every PoC for a Medium–Critical finding must contain BOTH the
> **code evidence** (SAST) AND **concrete manual test steps** (HTTP requests the
> human can execute). See `${CLAUDE_PLUGIN_ROOT}/agents/others/poc-agent.md`.

---

## 1. Golden Rules (Non-Negotiable)

1. **Artifacts are the single source of truth.** Never assume state. Always read
   the relevant artifact before acting.
2. **Validate before reporting.** No finding leaves the pipeline without passing
   through `validator-agent`. Unvalidated findings are *candidates*, not findings.
3. **Prioritize impact.** Test for **Critical → High → Medium** first. Only test
   Low/Informational after high-value testing is complete.
4. **Stay in scope.** Test the **repository codebase and local dev environment only**.
   Read `artifacts/recon/scope.json` for target configuration. Never test live production
   systems, third-party services, or external APIs without explicit authorization.
5. **Evidence or it didn't happen.** Every finding carries **code-based evidence**
   (file path, line numbers, source-to-sink data flow) and a confidence score.
   Live HTTP request/response evidence is produced **later, by a human** during
   manual verification of the PoC — not by agents.
6. **No placeholders.** Every artifact must contain real, actionable content.
7. **Non-destructive by default.** Prefer read-only PoCs. Never run mass
   exploitation, data exfiltration at scale, or denial-of-service tests.
8. **One deliberate exception: `fix-agent`.** Every agent above is read-only
   against the target repository. `fix-agent` (invoked only by
   `/vantage:fix-issue` or `/vantage:fix`, never automatically as part of
   Phases 01-06) is the sole agent allowed to edit the target repository's
   source code, and only to implement an already-validated finding's
   remediation. See §9.

---

## 2. Testing Scope (READ FIRST)

**This framework performs SAST (Static Application Security Testing).**

### What Agents Do:
- ✅ **Static code analysis** — parse source files for vulnerabilities
- ✅ **Route/endpoint extraction** — map application attack surface from code
- ✅ **Configuration review** — find secrets, misconfigs, exposed endpoints
- ✅ **Architecture analysis** — trace auth flows, data flows, business logic
- ✅ **Dependency analysis** — identify vulnerable libraries
- ✅ **Pattern matching** — detect SQL injection, XSS, IDOR, auth bypass patterns

### What Agents DO NOT Do:
- ❌ **Run the application** — no servers started, no requests sent
- ❌ **Dynamic testing** — no live traffic, no fuzzing, no exploitation
- ❌ **Network scanning** — no port scans, no service enumeration
- ❌ **Credential testing** — no login attempts, no brute force

**This is pure code analysis.** Findings are based on code patterns, not live exploitation.

**If `artifacts/recon/scope.json` does NOT exist:**
1. Copy the plugin asset `${CLAUDE_PLUGIN_ROOT}/artifacts/recon/scope.json.template`
   → your project's `./.vantage/artifacts/recon/scope.json`
2. Replace all `<PLACEHOLDERS>` with actual values (see `${CLAUDE_PLUGIN_ROOT}/TIMESTAMPS.md` for dates)
3. If target/authorization unknown, use defaults: `<ABSOLUTE_PATH_TO_REPO>` for the
   repository path and `security@target.example` for authorization.
4. **NEVER block the pipeline to ask the user.** Auto-generate with placeholders.

Example scope.json structure (this is a **SAST / repository** target — no URLs):

```json
{
  "engagement": "ACME WebApp Security Assessment 2024-Q3",
  "authorized_by": "security@acme.example",
  "target_type": "repository",
  "platform": "web",
  "repository_path": "<ABSOLUTE_PATH_TO_REPO>",
  "analysis_scope": {
    "code_only": true,
    "no_execution": true,
    "note": "SAST mode - analyze source code, do not run application or send requests",
    "include_paths": ["src/", "app/", "lib/", "routes/", "controllers/", "config/"],
    "exclude_paths": ["node_modules/", "vendor/", "dist/", "build/", "*.min.js", "tests/fixtures/"]
  },
  "started_at": "<CURRENT_TIMESTAMP>",
  "constraints": {
    "read_only": true,
    "no_secret_exfiltration": true,
    "redact_secrets_in_artifacts": true
  }
}
```

> Note: actual HTTP testing happens **later, manually by a human** against a
> live/staging instance using the generated PoCs. The SAST pipeline itself only
> reads source code — it does not send requests.

**If scope.json missing, auto-generate from template.** Use system timestamps and
placeholder values. Document assumptions in the `engagement` field. Never block.

**`platform` field:** `"web"` (default) and `"mobile"` (Android/iOS, OWASP
Mobile Top 10 2024) are both fully wired end-to-end. The `vantage` skill
and the `/vantage:scan-web` / `/vantage:scan-mobile` commands each force
their platform and route Phases 01-03 to the matching agent set — see
`${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md` "Platform Routing".
`${CLAUDE_PLUGIN_ROOT}/agents/web/recon-agent.md` itself still refuses to run
against `"mobile"` scope (defense in depth, in case it's ever dispatched
directly instead of via the skill/commands) and points to
`${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-recon-agent.md` instead.

### Code-Based Evidence Format (SAST)

Every finding carries code evidence, not HTTP traffic. Minimum fields:

```json
{
  "file": "src/controllers/orders.controller.js",
  "line": 42,
  "function": "getOrder",
  "evidence": {
    "code_snippet": "const order = await Order.findById(req.params.id);\nres.json(order);",
    "user_input_source": "req.params.id",
    "data_flow": "req.params.id → Order.findById() → res.json() (no ownership check)",
    "missing_check": "if (order.user_id !== req.user.id) return res.status(404).end();"
  }
}
```

### What SAST Cannot Prove (defer to the human PoC step)

SAST finds the *pattern*; it cannot confirm runtime exploitability. The following
require manual verification of the PoC by a human:

- ❌ Whether a vulnerability is actually exploitable at runtime
- ❌ Complex business-logic flaws requiring live state
- ❌ Race conditions (need concurrency)
- ❌ Authentication bypass (needs real credentials)
- ❌ Actual data exfiltration (needs network observation)

> Therefore every Medium–Critical PoC must pair **code evidence** with **manual
> test steps** a human can execute (see `${CLAUDE_PLUGIN_ROOT}/agents/others/poc-agent.md`).

---

## 3. The Pipeline

```
[1] RECON        recon-agent                  -> artifacts/recon/endpoints.json
                                                 artifacts/recon/recon.json
[2] MAPPING      mapper-agent                 -> artifacts/mapping/attack-surface.json
[3] TESTING      auth/authz/api/sqli/xss/...  -> artifacts/findings/raw-findings.<agent>.json (parallel, one file/agent)
[4] VALIDATION   validator-agent              -> artifacts/findings/validated-findings.json
[5] POC          poc-agent                    -> artifacts/poc/*.md
[6] REPORTING    report-agent                 -> artifacts/reports/report.md
```

**CRITICAL:** All output paths are EXACT and REQUIRED. Do NOT create files with
different names (e.g., SAST-REPORT.md, pentest-report.md). Use the paths shown above.

Each phase's methodology (entry criteria, steps, exit criteria, artifact
contract) lives entirely inside that phase's own `agents/*.md` file — there is
no separate phase file to read. Cross-phase control — dependency gates,
parallelism, failure/empty handling, and resume — is defined in
`${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md`.

---

## 4. Directory Map

This framework ships as a Claude Code plugin. Two different roots matter — do
not confuse them:

- **Plugin assets** (`START-HERE.md`, `workflow/`, `agents/`, `schemas/`,
  `templates/`, `knowledge/`, `examples/`) live in the plugin's own install
  directory, `${CLAUDE_PLUGIN_ROOT}`. Every reference to these directories
  elsewhere in this framework is written as `${CLAUDE_PLUGIN_ROOT}/<path>` —
  resolve it against the plugin install path, never against the target
  project's working directory.
- **Artifacts** (everything under `artifacts/`) are per-engagement output and
  are always relative to the **target project's current working directory**,
  under `./.vantage/artifacts/...`. Any bare `artifacts/...` path in this
  framework (with no `${CLAUDE_PLUGIN_ROOT}` prefix) means
  `<target-project-cwd>/.vantage/artifacts/...`.

| Path | Purpose |
|------|---------|
| `${CLAUDE_PLUGIN_ROOT}/START-HERE.md` | This file. The orchestration entrypoint. |
| `${CLAUDE_PLUGIN_ROOT}/workflow/orchestration.md` | Cross-phase control: gates, parallelism, resume, failure handling. |
| `${CLAUDE_PLUGIN_ROOT}/agents/` | Per-agent role definitions, methodology, decision trees. |
| `${CLAUDE_PLUGIN_ROOT}/schemas/` | JSON Schemas all artifacts must validate against. |
| `${CLAUDE_PLUGIN_ROOT}/templates/` | Markdown templates for findings, PoCs, and reports. |
| `${CLAUDE_PLUGIN_ROOT}/knowledge/` | Severity matrix, OWASP refs, methodology, checklists. |
| `<project-cwd>/.vantage/artifacts/` | **All agent output lives here.** |
| `${CLAUDE_PLUGIN_ROOT}/examples/` | Realistic reference artifacts. |

---

## 5. How An Agent Should Operate (Universal Loop)

```
1. Identify your role        -> read ${CLAUDE_PLUGIN_ROOT}/agents/<your-agent>.md
   (this file is self-contained: role, methodology, decision tree, output contract)
2. Load prior artifacts      -> read artifacts/<phase>/*.json
3. Load knowledge as needed  -> read ${CLAUDE_PLUGIN_ROOT}/knowledge/*.md
4. Execute your methodology  -> respect scope.json constraints
5. Emit artifact             -> validate against ${CLAUDE_PLUGIN_ROOT}/schemas/*.json
6. Update run-log            -> append to artifacts/run-log.md
```

### Run Log
Every agent appends a single line to `artifacts/run-log.md`:

```
[2024-07-01 #01] recon-agent | endpoints.json | 142 endpoints, 9 APIs | OK
```

No agent has clock access (no `Bash` tool, by design — see Golden Rule #1),
so don't fabricate an hour/minute/second. Use `[DATE #SEQ]`: the date copied
from `scope.json`, plus a sequence number (count existing run-log lines + 1).
Full format and rationale: `${CLAUDE_PLUGIN_ROOT}/TIMESTAMPS.md`.

**Keep the summary clause short** — a few words or a compact count (e.g.
`3 candidates: 2 Critical, 1 High`), never a multi-clause paragraph. The log
is an index for a human scanning run history, not a narrative — full detail
already lives in the artifact itself (`raw-findings.*.json`,
`validated-findings.json`, etc.). One line per agent, no exceptions.

---

## 6. Domain-Aware Testing & Prioritization

**Domain Auto-Detection:**
The framework automatically detects application type (onlineshop, hris, forum,
cms, banking, lms) during recon. When detected with confidence ≥ 0.6, agents
load domain-specific knowledge from `${CLAUDE_PLUGIN_ROOT}/knowledge/domain-profiles/<type>.md` to:
- Prioritize critical endpoints for that domain (e.g., `/checkout` for shops)
- Apply domain-specific attack patterns (e.g., price manipulation, grade tampering)
- Focus on high-impact findings relevant to the business model

**Generic Prioritization (if no domain match):**
Use `${CLAUDE_PLUGIN_ROOT}/knowledge/severity-matrix.md` and `${CLAUDE_PLUGIN_ROOT}/knowledge/risk-classification.md`.
Testing order is strictly **impact-first**:

1. **Critical**: RCE, auth bypass, full account takeover, SQLi w/ data access, IDOR exposing PII at scale.
2. **High**: Stored XSS, privilege escalation, sensitive data exposure, SSRF.
3. **Medium**: Reflected XSS, CSRF on sensitive actions, missing rate limiting on auth.
4. **Low/Info**: Verbose errors, missing headers, version disclosure — ONLY after the above.

---

## 7. Quickstart for a Fresh Agent

```text
You are an agent in the AI Pentest Framework (vantage plugin).
1. Read ${CLAUDE_PLUGIN_ROOT}/START-HERE.md (this file).
2. Read ${CLAUDE_PLUGIN_ROOT}/TIMESTAMPS.md for dynamic date handling.
3. Read ${CLAUDE_PLUGIN_ROOT}/agents/<role>.md to assume your role.
4. Confirm/create scope at ./.vantage/artifacts/recon/scope.json (use system timestamps).
5. Read the workflow playbook for your phase.
6. Produce ONLY artifacts that validate against the relevant schema.
7. Always inject current system timestamp into date fields (discovered_at, generated_at, etc).
8. Never report a finding that has not passed validator-agent.
```

---

## 8. Quality Bar

- Findings must be reproducible by a third party using only the artifact.
- PoCs (Medium–Critical) must contain code evidence (file:line + data flow) AND
  concrete manual test steps with the raw HTTP request(s) and expected response a
  human runs to verify — the agent writes them, the human executes them.
- Reports must map every finding to severity, impact, and remediation.
- False positives must be filtered before reporting.
- **JSON artifacts are written minified** (no indentation/pretty-printing) —
  `endpoints.json`, `recon.json`, `attack-surface.json`, `raw-findings.*.json`,
  and `validated-findings.json`
  are machine-to-machine context for downstream agents, not for direct human
  reading. Markdown artifacts (PoC `.md` files, `report.md`) stay
  human-readable — this rule is JSON-only.

---

## 9. Fixing Findings (Optional, Separate From Phases 01-06)

After a report exists, a human may ask to actually **fix** a finding —
`fix-agent` (`${CLAUDE_PLUGIN_ROOT}/agents/others/fix-agent.md`) handles this,
invoked only via `/vantage:fix-issue <id>` or `/vantage:fix`. It is never
triggered automatically.

- Reads the validated finding + remediation, re-locates the vulnerable
  pattern in the **current** source (it may have moved since discovery), and
  applies the minimal targeted edit — the only Edit access to target source
  anywhere in this framework.
- Writes a record to `artifacts/fixes/<id>.md` (before/after, or a
  `not_auto_fixable` reason) — this file's existence is also the "already
  handled" marker so `/vantage:fix` never double-applies a fix.
- Never runs a build, test suite, or the application to verify the fix —
  always tell the human to review `git diff` and run their own tests.

## 10. Fast Incremental Check (Optional, Separate From Phases 01-06)

`/vantage:scan-diff [commit-hash | PR/MR number]`
(`${CLAUDE_PLUGIN_ROOT}/commands/scan-diff.md`) scans only the files changed
in one commit or PR/MR — not the full repo. Useful before merging a change
without re-running the whole pipeline. Writes results under
`artifacts/commit-scans/<id>/` (raw findings, `validated-findings.json`,
PoCs) and reports directly in chat — no `report.md` for this fast path. Fix
a finding it surfaces with
`/vantage:fix-diff <commit-scan-id> <finding-id>`
(`${CLAUDE_PLUGIN_ROOT}/commands/fix-diff.md`) — never `fix-issue`/`fix`,
which only look at the main pipeline's `validated-findings.json`. A clean
result only means that diff is clean, not the whole app — it does not
replace a full `/vantage:scan-web`/`scan-mobile` run.

Proceed to `${CLAUDE_PLUGIN_ROOT}/agents/web/recon-agent.md` (web) or
`${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-recon-agent.md` (mobile) to begin scanning.