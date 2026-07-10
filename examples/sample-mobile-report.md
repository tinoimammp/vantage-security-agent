# Mobile Application Penetration Test — Report

**Engagement:** AcmeBank Mobile (Android) Pentest 2025-02
**Prepared by:** AI Pentest Framework (multi-agent ensemble)
**Date:** 2025-02-05
**Version:** 1.0
**Classification:** Confidential

---

## 1. Executive Summary
We statically analyzed the AcmeBank Android app's source repository over a
one-week window using an artifact-driven, impact-first SAST methodology
against the OWASP Mobile Top 10 (2024). The assessment identified **2
Critical** and **1 Low (informational)** issue. The most serious would let an
attacker with device access extract a live session token, and let a
malicious app on the same device trigger the password-reset flow. These
should be remediated immediately.

**Overall Risk Rating: Critical.**

> These findings come from static code analysis, cross-checked by an
> independent validation pass — not from testing the live system. Treat them
> as high-confidence candidates, not confirmed exploits. Have your security
> team verify each finding's PoC (`artifacts/poc/`) before remediation
> sign-off, disclosure, or compliance reporting.

## 2. Scope & Methodology

### 2.1 In Scope (SAST target)
- Repository: `acmebank-android` (Android app), `app/src/main/java/`,
  `app/src/main/res/`, `app/src/main/AndroidManifest.xml`
- Excluded: `build/`, generated code, test fixtures

### 2.2 Out of Scope
- Any code outside the paths above. No third-party binaries decompiled. No
  device, emulator install, or live network capture was performed by any agent.

### 2.3 Analysis Window
- Start: 2025-02-03 — End: 2025-02-05

### 2.4 Approach
Artifact-driven multi-agent **static analysis** pipeline: Recon -> Mapping ->
Testing -> Validation -> PoC -> Reporting, using the mobile pipeline's
recon/mapping agents and the 10 M1-M10 testing agents. Every phase read
source/manifest/build-config only; no agent installed, ran, or instrumented
the app. Testing prioritized Critical/High before Low/Info. Manual
verification of the PoCs in `artifacts/poc/` on a test device, if performed,
is a separate, human-executed step after this report.

### 2.5 Coverage
OWASP Mobile Top 10 (2024) M1–M10 (see
`${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-mobile-top10.md`). No backend API was
in scope for this engagement, so web/WSTG coverage is not applicable.

### 2.6 Limitations
Static analysis only — findings reflect code/manifest/config-level patterns;
exploitability on a live device is unconfirmed until a human runs the PoC's
manual verification steps. No agent installed, ran, or instrumented the app,
and no device/emulator was used to produce this report.

## 3. Risk Matrix

| Severity | Count |
|----------|------:|
| Critical | 2 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Info | 1 (rejected as standalone finding; noted in Appendix) |
| **Total** | **2** |

### Likelihood x Impact
```
            IMPACT
           Low   Med   High
High        -     -    F-101,F-102
Med         -     -     -
Low         -     -     -
```

## 4. Findings Index
> Full description, evidence, impact, and remediation for each finding live
> in its linked PoC — this table is an index, not a re-narration.

| ID | Sev | Conf. | Title | Affected | Detail |
|----|-----|------:|-------|----------|--------|
| F-101 | Critical | 0.90 | Auth token (JWT) stored in plaintext SharedPreferences (M9:2024) | `AuthManager.java` (component) | `artifacts/poc/F-101.md` |
| F-102 | Critical | 0.88 | Unguarded exported DeepLinkActivity allows triggering password reset (M8:2024) | `.DeepLinkActivity` (component) | `artifacts/poc/F-102.md` |

## 5. Remediation Roadmap

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0 | F-101 | Migrate token storage to EncryptedSharedPreferences/Keystore | S |
| P0 | F-102 | Move to App Links + Digital Asset Links; server-side token re-validation | M |

## 6. Appendix

### 6.1 Endpoint / Component Inventory
See `artifacts/recon/mobile-recon.json`: 2 exported components, 1 WebView
(same-origin only, no findings), 2 local storage locations, 1 weak-crypto
usage site, 2 third-party SDKs.

### 6.2 Technology Fingerprint
Android (Java), Retrofit for networking, one third-party ad/analytics SDK
with broader permission access than its function requires (tracked
separately as an M6 Inadequate Privacy Controls observation, not escalated
to a standalone Critical/High finding this cycle).

### 6.3 Informational — Not Escalated to a Finding
- `network_security_config.xml` permits cleartext traffic to
  `legacy-metrics.acmebank.example`, but that domain only receives anonymous,
  non-sensitive analytics counters today. Recommend removing the cleartext
  exception as hardening, but not scored as a standalone finding this cycle
  (see `artifacts/findings/validated-findings.json` → `rejected[]`, F-118).

### 6.4 Roles/Accounts Referenced in PoCs (for manual verification)
- The test account and device referenced in `artifacts/poc/` are
  prerequisites for the human tester's manual verification step — no agent
  in this pipeline installed, ran, or authenticated into the app.

### 6.5 References
OWASP Mobile Top 10 (2024), CWE. See `knowledge/` for the full reference set.
