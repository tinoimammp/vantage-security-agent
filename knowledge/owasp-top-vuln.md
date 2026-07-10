# OWASP Top Vuln — Reference Library for Agents (2025)

Quick-reference dictionary for the current **OWASP Top 10:2025** edition.
Each entry maps the risk to what to test and which agent owns it.

When recording a finding, set `category` and add the matching OWASP ID plus
CWE refs to `references[]`. Example: `OWASP A01:2025` / `CWE-639`.

---

## Categories (2025 order)

### A01:2025 — Broken Access Control
**Owner:** authorization-agent, api-agent, injection-agent (SSRF)
IDOR/BOLA, vertical/horizontal priv-esc, forced browsing, missing function-level
authorization, CORS misconfig, JWT/role tampering. **Also absorbs SSRF**
(URL params, webhooks, import-by-url, renderers reaching internal/metadata).
**Highest yield — test first.**
- CWE-639, CWE-284, CWE-862, CWE-863, CWE-918 (SSRF).

### A02:2025 — Security Misconfiguration
**Owner:** recon-agent, api-agent
Default creds, verbose errors/stack traces, open admin/debug endpoints, missing
security headers, exposed `.env`/`.git`, directory listing, unnecessary features,
permissive CORS, insecure cloud/container/IaC config.
- CWE-16, CWE-548, CWE-1032.

### A03:2025 — Software Supply Chain Failures  **NEW**
**Owner:** dependency-agent, recon-agent
Known-vuln libraries/frameworks via SCA of manifests/lockfiles (CVE-matched,
reachability-confirmed). Broad scope beyond components: dependency integrity,
build systems, CI/CD pipelines, package registries, and distribution
infrastructure. Highest avg exploit/impact scores in the dataset.
- CWE-1104, CWE-937, CWE-1357, CWE-494, CWE-829.

### A04:2025 — Cryptographic Failures
**Owner:** secrets-agent, auth-agent, recon-agent
Weak/absent TLS, sensitive data in transit/at rest, weak hashing (MD5/SHA1 for
passwords), broken ciphers (DES/RC4/ECB), hardcoded secrets/keys/IVs, secrets in JS,
predictable tokens, weak JWT secrets, disabled TLS verification.
- CWE-327, CWE-331, CWE-326, CWE-798.

### A05:2025 — Injection
**Owner:** sqli-agent, xss-agent, injection-agent
SQLi, NoSQLi, command injection, XSS (reflected/stored/DOM), template injection (SSTI),
code injection, LDAP/XPath injection. (Command/SSTI/Code/LDAP/XXE -> injection-agent;
SQL/NoSQL -> sqli-agent; XSS -> xss-agent.)
- CWE-89, CWE-79, CWE-78, CWE-94, CWE-90, CWE-611.

### A06:2025 — Insecure Design
**Owner:** business-logic-agent
Missing rate limits by design, lack of segmentation, flawed workflows, missing
abuse-case controls, business-logic flaws (race, price/state tampering).
- CWE-209, CWE-256, CWE-501, CWE-840.

### A07:2025 — Authentication Failures
**Owner:** auth-agent
Weak credentials, missing MFA, session fixation, predictable session ids, missing
logout/password-change invalidation, credential stuffing exposure, weak reset flows.
- CWE-287, CWE-384, CWE-613.

### A08:2025 — Software or Data Integrity Failures
**Owner:** injection-agent, api-agent, upload-agent
Insecure deserialization (-> injection-agent), unsigned/unverified updates, CI/CD
trust issues, mass assignment.
- CWE-502, CWE-345, CWE-915.

### A09:2025 — Security Logging & Alerting Failures
**Owner:** business-logic-agent (observational), recon-agent
Lack of audit trails for security events; insufficient alerting on attacks; sensitive
data logged. Note where statically detectable.
- CWE-778, CWE-532.

### A10:2025 — Mishandling of Exceptional Conditions  **NEW**
**Owner:** business-logic-agent, injection-agent (observational)
Improper error handling, logic errors, and **fail-open** behavior — systems that grant
access or skip checks when an unexpected/abnormal condition occurs. Includes swallowed
exceptions around auth/authz, default-allow on error, and inconsistent error states.
> Mostly an **Insecure Design / logic** concern; flag where code fails open on errors.
- CWE-755, CWE-754, CWE-636, CWE-280.

---

## Usage
When recording a finding, set `category` and add the matching OWASP A0X:2025 ID
and CWE refs to `references[]`. Map back to this file in reports for coverage
demonstration.
