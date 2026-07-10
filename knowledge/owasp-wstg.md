# OWASP WSTG — Testing Checklist Reference

Condensed mapping of OWASP Web Security Testing Guide categories to agents and
concrete checks. Use the WSTG ids in finding `references[]`.

---

## WSTG-INFO — Information Gathering (recon-agent)
- INFO-01 Search engine recon
- INFO-02 Fingerprint web server
- INFO-04 Enumerate apps on webserver
- INFO-05 Webpage content for info leakage (comments, metadata, JS secrets)
- INFO-06 Identify entry points (params, forms, headers)
- INFO-07 Map execution paths (crawl)
- INFO-08 Fingerprint framework
- INFO-10 Map application architecture (APIs, GraphQL, services)

## WSTG-CONF — Configuration & Deployment (recon/api-agent)
- CONF-01 Network/infra config
- CONF-02 App platform config (debug, defaults)
- CONF-04 Old/backup/unreferenced files (`.bak`, `.old`, `.git`, `.env`)
- CONF-05 Admin interfaces
- CONF-07 HSTS / TLS config

## WSTG-IDNT — Identity Management (auth-agent)
- IDNT-02 User registration process
- IDNT-04 Account enumeration
- IDNT-05 Weak/guessable usernames

## WSTG-ATHN — Authentication (auth-agent)
- ATHN-01 Credentials over encrypted channel
- ATHN-02 Default credentials
- ATHN-03 Lockout mechanism
- ATHN-04 Bypassing authentication
- ATHN-07 Weak password reset / change
- ATHN-09 Weak password change
- ATHN-10 Weaker auth in alternate channel

## WSTG-ATHZ — Authorization (authorization-agent, api-agent)
- ATHZ-01 Directory traversal / file include
- ATHZ-02 Bypassing authorization schema
- ATHZ-03 Privilege escalation
- ATHZ-04 Insecure Direct Object References (IDOR)

## WSTG-SESS — Session Management (auth-agent)
- SESS-01 Session management schema
- SESS-02 Cookie attributes (Secure/HttpOnly/SameSite)
- SESS-03 Session fixation
- SESS-06 Logout functionality
- SESS-07 Session timeout

## WSTG-INPV — Input Validation (sqli-agent, xss-agent)
- INPV-01 Reflected XSS
- INPV-02 Stored XSS
- INPV-05 SQL Injection
- INPV-06 LDAP Injection
- INPV-11 Code Injection
- INPV-12 Command Injection
- INPV-13 Format string
- INPV-19 Server-Side Request Forgery

## WSTG-BUSL — Business Logic (business-logic-agent)
- BUSL-01 Business logic data validation
- BUSL-02 Ability to forge requests
- BUSL-03 Integrity checks
- BUSL-04 Process timing (race conditions)
- BUSL-05 Circumvent workflow/function limits
- BUSL-07 Defenses against application misuse

## WSTG-CLNT — Client-Side (xss-agent)
- CLNT-01 DOM-based XSS
- CLNT-03 HTML injection
- CLNT-04 Client-side URL redirect (open redirect)
- CLNT-11 Cross-origin resource sharing (CORS)

## WSTG-APIT — API Testing (api-agent)
- APIT-01 API reconnaissance, BOLA, BFLA, mass assignment, rate limiting, JWT,
  GraphQL introspection/batching.

---

## Usage
For each finding, cite the most specific WSTG id (e.g., `WSTG-ATHZ-04`) and the
OWASP Top 10 / CWE references. Use coverage in the report's Methodology section.