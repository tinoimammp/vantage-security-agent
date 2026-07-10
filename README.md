# Vantage

AI SAST framework for web & mobile apps, shipped as a **Claude Code plugin**.
Agents read your source code and produce a validated, evidence-backed
vulnerability report — no running the app, no network requests. An optional
separate step can then apply the fix directly to your code.

> **SAST only during scanning.** Static code analysis, never execution. The
> one exception is the explicit fix step below — see 🔒 Safety.

---

## Install & Run

```bash
# Local dev/testing
git clone https://github.com/tinoimammp/vantage.git
claude --plugin-dir /path/to/vantage

# Once this repo is public on GitHub
/plugin marketplace add tinoimammp/vantage
/plugin install vantage@vantage
```

Then, from the repo you want scanned:

```
/vantage:scan-web        # web app — full pipeline
/vantage:scan-mobile     # Android/iOS/React Native/Flutter — full pipeline
```

Or just ask in natural language: *"Security-review this repo for SQL
injection and IDOR."* — the skill auto-triggers and infers the platform.

**Fast incremental check** — scan just the files changed in one commit or
PR/MR, instead of the whole repo:

```
/vantage:scan-diff          # HEAD (your latest commit)
/vantage:scan-diff a1b2c3d  # a specific commit hash
/vantage:scan-diff 42       # PR #42 (GitHub) or MR !42 (GitLab)
```

Reports results directly in chat, with a PoC (`artifacts/commit-scans/<id>/poc/`)
for manual test steps — no `report.md` for this fast path. Fix a finding it
surfaces with `/vantage:fix-diff <commit-scan-id> <finding-id>`. A clean
result only means the diff is clean, not the whole app; run a full scan for
that.

Output lands in `./.vantage/artifacts/reports/report.md` in **your** target
repo (not inside the plugin). See 📖 [START-HERE.md](START-HERE.md) for the
full pipeline detail.

**Not using Claude Code?** Clone this repo next to the project you want
scanned (or copy it inside as its own folder), then have any AI coding tool
read each phase's `agents/*.md` file in order and follow it as a checklist —
see [MANUAL-USAGE.md](MANUAL-USAGE.md) for full setup + copy-paste prompts.

---

## What It Tests

**Web — OWASP Top 10:2025:** broken access control (IDOR/BOLA/BFLA),
authentication, injection (SQLi/XSS/command/SSTI/SSRF/XXE), API security
(JWT/GraphQL/mass assignment), business logic, file upload, vulnerable
dependencies, secrets & crypto, misconfiguration.

**Mobile — OWASP Mobile Top 10 (2024):** M1 credential usage, M2 supply
chain, M3 auth, M4 input/output validation, M5 communication, M6 privacy,
M7 binary protection, M8 misconfiguration, M9 data storage, M10 cryptography.

**Domain-aware prioritization** — auto-detects one of 14 domains (e-commerce,
HRIS, forum, CMS, banking, LMS, healthcare, SaaS/multi-tenant, social media,
real estate, logistics/ride-hailing, government, recruitment, ticketing) from
the code and forces the money/data endpoints (checkout, payroll, transfer,
patient records, tenant isolation, etc.) to top priority. Unknown domains
still get impact-first analysis from the app's own code (no generic no-op
fallback). See `knowledge/domain-profiles/`.

---

## How It Works

Six phases, artifact-driven (agents only talk to each other through files —
no shared memory, so a run is resumable across sessions):

```
Recon → Mapping → Testing (10 parallel agents) → Validation → PoC → Report
```

| Phase | Reads | Writes | What happens |
|---|---|---|---|
| Recon | `scope.json` | `recon.json`, `endpoints.json` | Parses source for routes, tech stack, auth patterns, domain type, and the app's critical assets — pure inventory, no prioritization yet. |
| Mapping | `recon.json`, `endpoints.json` | `attack-surface.json` | Prioritizes every endpoint (P0-P3) by domain-aware impact and assigns each to the right testing agent(s). |
| Testing | `attack-surface.json` (+ `recon.json`) | `raw-findings.<agent>.json` ×10 | 10 agents in parallel, each scoped to one vuln class (auth, authorization, injection, upload, ...); a shared per-stack search cheat sheet locates the relevant code fast before each agent applies its methodology. |
| Validation | `raw-findings.*.json` | `validated-findings.json` | `validator-agent` re-traces every candidate against the source itself, confirms no missed mitigation, drops false positives, assigns final IDs. |
| PoC | `validated-findings.json` | `poc/F-*.md` | Manual test steps per Medium-Critical finding, for a human to verify — never auto-executed. |
| Report | `validated-findings.json`, `poc/*.md` | `report.md` | Executive summary, risk matrix, and findings index, with an explicit "verify before acting" disclaimer. |

Every finding must pass `validator-agent` (confidence ≥ 0.6, re-traced
independently) before it reaches a PoC or the report — false positives are
filtered, not just flagged. Cross-phase gates/parallelism: `workflow/orchestration.md`.

---

## Output

One `report.md` per scan: executive summary, risk matrix, and a dense
findings index (one row per finding, linking out for full detail — nothing
duplicated). Per-finding detail lives in `artifacts/poc/<id>.md` and
`artifacts/findings/validated-findings.json`.

See `examples/sample-report.md` (web) / `examples/sample-mobile-report.md`
(mobile) for complete examples.

---

## Fixing Findings

```
/vantage:fix-issue F-001     # fix one finding
/vantage:fix                 # fix every validated finding, one at a time
```

This is the **only** part of the framework that edits your source code.
`fix-agent` re-locates the vulnerable pattern (it may have moved since the
scan), applies the smallest edit that implements the finding's remediation,
and writes `artifacts/fixes/<id>.md`. It never runs a build or test suite —
**always review `git diff` and run your own tests before committing.**

---

## 🔒 Safety

- Scanning is read-only: no HTTP requests, no running/installing the app, no
  dynamic testing. `/vantage:fix-*` is the sole, explicit exception, and is
  never triggered automatically by a scan.
- For authorized testing only — see [SECURITY.md](SECURITY.md).

---

## Structure

```
vantage/                       (plugin install dir)
├── commands/                  6 slash commands
├── skills/pentest-sast/       orchestration skill
├── agents/web/                12 web agents
├── agents/mobile/             12 mobile agents
├── agents/others/             4 shared agents (validate, PoC, report, fix)
├── knowledge/                 OWASP/severity reference, domain profiles
├── schemas/, templates/, examples/
├── workflow/orchestration.md   cross-phase control
└── START-HERE.md              full entry point for agents
```

Works with any web stack (Node, Python, PHP, Java, .NET, Ruby...) or mobile
stack (Android, iOS, React Native, Flutter, Ionic, MAUI) — no dependencies,
nothing to configure.

---

## License

[MIT License](LICENSE). Authorized security testing only — see
[SECURITY.md](SECURITY.md).
