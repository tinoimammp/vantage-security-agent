# Application Security Assessment (SAST) — Report

> Title reflects the target: "Web Application Security Assessment (SAST)" or
> "Mobile Application Security Assessment (SAST)" (or both, if the engagement
> covered both pipelines) — set per the finding set's `platform`. Do not call
> this a "Penetration Test": no live system was accessed, see §2.2.

**Engagement:** <name>
**Prepared by:** <team / agent ensemble>
**Date:** <YYYY-MM-DD>
**Version:** 1.0
**Classification:** Confidential

---

## 1. Executive Summary
Plain-language risk posture, top 3-5 risks, business impact, remediation
priorities, overall risk rating. A few short paragraphs — readable standalone
without the rest of this file (not a separate file).

> These findings come from **static code analysis**, cross-checked by an
> independent validation pass — not from testing the live system. Treat them
> as high-confidence candidates, not confirmed exploits. Have your security
> team verify each finding's PoC (`artifacts/poc/`) before remediation
> sign-off, disclosure, or compliance reporting.

## 2. Scope & Methodology

### 2.1 In Scope (SAST target)
- Repository: `<repository_path from scope.json>`
- Analyzed paths: `<include_paths>` (excluding `<exclude_paths>`)

### 2.2 Out of Scope
- Any code outside `include_paths`/`repository_path`. No third-party assets.
- No live/staging/production system was accessed by any agent in this pipeline.

### 2.3 Analysis Window
- Start: <ISO> — End: <ISO>

### 2.4 Approach
Artifact-driven multi-agent **static analysis** methodology: Recon -> Mapping
-> Testing -> Validation -> PoC -> Reporting. Every phase reads source code
only; no agent runs the application or sends a request. Impact-first
prioritization (Critical/High before Low/Info). Manual verification of the
generated PoCs against a live/staging instance, if performed, is done by a
human after this report — see §2.6.

### 2.5 Coverage
- **Web findings:** OWASP Top 10:2025 A01–A10 (see
  `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-top-vuln.md`); OWASP WSTG categories
  (see `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-wstg.md`), mapped to their
  code-level equivalent where the WSTG describes a dynamic test.
- **Mobile findings:** OWASP Mobile Top 10 (2024): M1–M10 (see
  `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-mobile-top10.md`).
- Omit whichever coverage list has zero findings for this engagement.

### 2.6 Limitations
- **Static analysis only.** Findings reflect code-level patterns; runtime-only
  issues (e.g., infrastructure/network config, WAF behavior) are out of scope.
- Reachability and impact are assessed from code; **exploitability on a live
  system is unconfirmed** until a human executes the PoC's manual test steps
  (`artifacts/poc/`).
- Non-destructive by design: no exploitation, DoS, or live traffic was ever
  generated to produce this report.

## 3. Risk Matrix

| Severity | Count |
|----------|------:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Info | 0 |
| **Total** | **0** |

### Likelihood x Impact
```
            IMPACT
           Low   Med   High
LIKELY High  M    H     C
       Med   L    M     H
       Low   I    L     M
```

## 4. Findings Index
> Ordered Critical -> High -> Medium -> Low -> Info. One row per finding —
> full description/evidence/impact/remediation lives in the linked Detail
> source, not here.

| ID | Sev | Conf. | Title | Affected | Detail |
|----|-----|------:|-------|----------|--------|
| F-001 | Critical | 0.95 | Missing object-level authorization on order lookup | `GET /api/v1/orders/{id}` | `artifacts/poc/F-001.md` |
| F-006 | Low | 0.70 | Session cookie missing Secure/HttpOnly/SameSite | all session-bearing routes | `artifacts/findings/validated-findings.json#F-006` |

*(One row per validated finding, in severity order.)*

## 5. Remediation Roadmap

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0 | F-001 | Enforce object-level authorization | M |
| P1 | F-002 | ... | S |

## 6. Appendix

### 6.1 Endpoint / Component Inventory
Web: reference `artifacts/recon/endpoints.json`. Mobile: reference
`artifacts/recon/mobile-recon.json` (permissions, exported components,
WebViews, third-party SDKs, etc.).

### 6.2 Technology Fingerprint
Web: reference `artifacts/recon/recon.json`. Mobile: reference the platform/
framework fields in `artifacts/recon/mobile-recon.json`.

### 6.3 Roles Referenced in PoCs (for manual verification)
- The accounts/roles named in `artifacts/poc/` (e.g. userA/userB/admin) are
  **prerequisites for the human tester's manual verification step** — no
  agent in this pipeline authenticated as or used any account.

### 6.4 Glossary & References
- See `knowledge/` for severity matrix, OWASP, methodology.
