# Master Testing Checklist

Work top to bottom **within each priority tier**. Complete Critical/High tiers
before Low/Info. Check items off in the run-log or a working artifact.

---

## Tier P0/P1 — Critical & High (do first)

### Authorization (authorization-agent / api-agent)
- [ ] IDOR on every object-by-id endpoint (read)
- [ ] IDOR write/update/delete across users
- [ ] BOLA on nested objects (`/users/{id}/cards/{cardId}`)
- [ ] Horizontal priv-esc (cross-user same level)
- [ ] Cross-tenant isolation breaks
- [ ] Vertical priv-esc (low-priv -> admin endpoints)
- [ ] Role/permission editable via update payload (mass assignment)
- [ ] Forced browsing to admin/internal routes
- [ ] HTTP method tampering to bypass authz

### Authentication (auth-agent)
- [ ] Authentication bypass
- [ ] Account takeover via password reset (token entropy/reuse/poisoning)
- [ ] MFA bypass
- [ ] OAuth redirect_uri / state / code-reuse / account linking
- [ ] Session fixation; logout/password-change invalidation

### Injection (sqli-agent / xss-agent)
- [ ] SQLi (error/boolean/time/UNION) on query/filter/sort/id params
- [ ] NoSQL operator injection (auth bypass)
- [ ] Stored XSS in persisted fields
- [ ] Reflected XSS across contexts
- [ ] DOM XSS (source->sink in JS)

### API (api-agent)
- [ ] JWT: alg:none, RS256->HS256, claim tampering, exp/nbf, kid injection
- [ ] BFLA on privileged functions
- [ ] Mass assignment of sensitive fields
- [ ] GraphQL introspection + field-level authz + batching

### File Upload (upload-agent)
- [ ] Executable upload -> RCE
- [ ] SVG/HTML upload -> stored XSS
- [ ] Path traversal / overwrite
- [ ] SSRF via processing

### Business Logic (business-logic-agent)
- [ ] Race conditions (coupons, balance, inventory)
- [ ] Price/quantity manipulation (negative, tampered, overflow)
- [ ] Workflow/step bypass
- [ ] State transition abuse (refund/ship/approve)
- [ ] Self-approval / maker-checker bypass

### Server-Side Injection (injection-agent)
- [ ] OS command injection (exec/system/spawn with user input) -> RCE
- [ ] SSTI (render_template_string / template compiled from user input) -> RCE
- [ ] Code injection / unsafe deserialization (eval, pickle, unserialize, readObject)
- [ ] Path/directory traversal + LFI/RFI (user-controlled file path, no containment)
- [ ] SSRF (URL params, webhooks, import-by-url, renderers -> internal/metadata)
- [ ] XXE (XML parser with external entities/DTD on user input)
- [ ] LDAP injection (user input in LDAP filter)

### Vulnerable Dependencies — SCA (dependency-agent)
- [ ] Lockfile packages matched against known CVEs (direct + transitive)
- [ ] Reachability confirmed (vulnerable API actually used / shipped at runtime)
- [ ] RCE/deserialization/prototype-pollution/SSRF/auth-bypass CVEs in use
- [ ] Fixed version identified for remediation

### Hardcoded Secrets & Crypto (secrets-agent)
- [ ] Live cloud/provider keys, DB creds, private keys committed to repo
- [ ] JWT/session/encryption secrets hardcoded in source
- [ ] Hardcoded crypto key/IV protecting sensitive data
- [ ] Weak algo (MD5/SHA1 for passwords, DES/RC4/ECB) on sensitive data
- [ ] Disabled TLS verification on sensitive outbound calls

> The three sections above are **Medium–Critical only**. Low/Info variants
> (placeholders, outdated-but-safe libs, non-sensitive crypto nits) are dropped.

---

## Tier P2 — Medium (after P0/P1)
- [ ] CSRF on sensitive state-changing actions
- [ ] Missing rate limiting on auth/OTP
- [ ] Reflected XSS requiring interaction
- [ ] Open redirect
- [ ] CORS misconfiguration
- [ ] Sensitive data in responses/logs

---

## Tier P3 — Low & Info (LAST)
- [ ] Missing security headers (CSP, HSTS, X-Content-Type-Options)
- [ ] Weak cookie flags (Secure/HttpOnly/SameSite)
- [ ] Verbose error messages / stack traces
- [ ] Version/tech disclosure
- [ ] Directory listing
- [ ] Clickjacking (missing frame-ancestors)

---

## Per-Finding Done Criteria
- [ ] File path, line number, and function/handler cited
- [ ] Code snippet showing the vulnerable pattern captured
- [ ] User input source and source-to-sink data flow documented
- [ ] Missing check (what should exist but doesn't) stated
- [ ] Preliminary severity + confidence set
- [ ] `validated:false` until validator confirms