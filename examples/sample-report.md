# Web Application Security Assessment (SAST) — Report

**Engagement:** ACME WebApp Security Assessment 2025-01
**Prepared by:** Vantage (multi-agent SAST ensemble)
**Date:** 2025-01-09
**Version:** 1.0
**Classification:** Confidential

---

## 1. Executive Summary
We statically analyzed the ACME web and API platform's source repository over
a two-week window using an artifact-driven, impact-first SAST methodology. The
assessment identified **2 Critical**, **1 High**, and **2 Medium** issues. The
most serious would allow any logged-in user to read other customers' data and
to escalate themselves to administrator. These should be remediated immediately.

**Overall Risk Rating: Critical.**

> These findings come from static code analysis, cross-checked by an
> independent validation pass — not from testing the live system. Treat them
> as high-confidence candidates, not confirmed exploits. Have your security
> team verify each finding's PoC (`artifacts/poc/`) before remediation
> sign-off, disclosure, or compliance reporting.

## 2. Scope & Methodology

### 2.1 In Scope (SAST target)
- Repository: `acme-webapp` (web app + API service), `src/`, `app/`, `routes/`,
  `controllers/`, `config/`
- Excluded: `node_modules/`, `dist/`, `build/`, `tests/fixtures/`

### 2.2 Out of Scope
- Any code outside the paths above. No third-party assets. No live/staging/
  production system was accessed by any agent in this pipeline.

### 2.3 Analysis Window
- Start: 2025-01-09 — End: 2025-01-23

### 2.4 Approach
Artifact-driven multi-agent **static analysis** pipeline: Recon -> Mapping ->
Testing -> Validation -> PoC -> Reporting. Every phase read source code only;
no agent ran the application or sent a request. Testing prioritized
Critical/High before Low/Info. Manual verification of the PoCs in
`artifacts/poc/` against a staging instance, if performed, is a separate,
human-executed step after this report.

### 2.5 Coverage
OWASP Top 10:2025 A01–A10 and relevant OWASP WSTG categories
(ATHN, ATHZ, SESS, INPV, BUSL, APIT, CLNT), mapped to their code-level
equivalent where WSTG describes a dynamic test.

### 2.6 Limitations
Static analysis only — findings reflect code-level patterns; exploitability on
a live system is unconfirmed until a human runs the PoC's manual test steps.
No agent executed the application, sent a request, or accessed any account.

## 3. Risk Matrix

| Severity | Count |
|----------|------:|
| Critical | 2 |
| High | 1 |
| Medium | 2 |
| Low | 0 |
| Info | 0 |
| **Total** | **5** |

### Likelihood x Impact
```
            IMPACT
           Low   Med   High
High        -     -     F-001,F-002
Med         -    F-004   F-003
Low        F-005   -      -
```

## 4. Findings Index
> Full description, evidence, impact, and remediation for each finding live
> in its linked PoC — this table is an index, not a re-narration.

| ID | Sev | Conf. | Title | Affected | Detail |
|----|-----|------:|-------|----------|--------|
| F-001 | Critical | 0.92 | IDOR — any user can read any order via sequential id | `GET /api/v1/orders/{id}`, `/invoice` | `artifacts/poc/F-001.md` |
| F-002 | Critical | 0.90 | Privilege escalation via mass assignment of `role` | `PUT /api/v1/users/{id}` | `artifacts/poc/F-002.md` |
| F-003 | High | 0.85 | Stored XSS in support ticket subject | `POST /api/v1/tickets` | `artifacts/poc/F-003.md` |
| F-004 | Medium | 0.80 | Missing rate limiting on login & OTP | `POST /api/v1/auth/login`, `/auth/otp` | `artifacts/poc/F-004.md` |
| F-005 | Medium | 0.75 | User enumeration via password reset response | `POST /api/v1/auth/reset` | `artifacts/findings/validated-findings.json#F-005` |

## 5. Remediation Roadmap

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0 | F-001 | Enforce object-level authorization on order routes | M |
| P0 | F-002 | Allow-list update fields; gate role changes | S |
| P1 | F-003 | Output encoding + CSP on admin console | M |
| P2 | F-004 | Add rate limiting/backoff/CAPTCHA | S |
| P3 | F-005 | Uniform reset responses | S |

## 6. Appendix

### 6.1 Endpoint Inventory
See `artifacts/recon/endpoints.json` (142 endpoints).

### 6.2 Technology Fingerprint
nginx, Express, React SPA, Cloudflare WAF, JWT bearer auth, GraphQL enabled.

### 6.3 Roles Referenced in PoCs (for manual verification)
- The accounts/roles named in `artifacts/poc/` (userA/userB/admin) are
  prerequisites for the human tester's manual verification step — no agent in
  this pipeline authenticated as or used any account.

### 6.4 References
OWASP Top 10:2025, OWASP WSTG, CWE. See `knowledge/`.