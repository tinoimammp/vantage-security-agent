# Severity Matrix & CVSS-like Scoring

This matrix standardizes how agents assign severity. Use it during testing
(preliminary) and validation (final). Be honest — overstated severity erodes
trust; understated severity hides risk.

---

## 1. Severity Bands

| Severity | CVSS-like band | Meaning |
|----------|---------------:|---------|
| **Critical** | 9.0–10.0 | Direct, large-scale compromise: RCE, auth bypass, full account takeover, SQLi with data access, mass PII exposure. |
| **High** | 7.0–8.9 | Serious compromise requiring little effort: privilege escalation, stored XSS hitting others, SSRF, IDOR on sensitive data. |
| **Medium** | 4.0–6.9 | Meaningful risk needing conditions/interaction: reflected XSS, CSRF on sensitive actions, missing rate limiting on auth. |
| **Low** | 0.1–3.9 | Minor risk / hardening: verbose errors, missing security headers, weak cookie flags. |
| **Info** | 0.0 | No direct risk; informational, defense-in-depth. |

---

## 2. CVSS-like Vector

Use base metrics (CVSS 3.1 style):

```
AV: Attack Vector       N(network) A(adjacent) L(local) P(physical)
AC: Attack Complexity   L(low) H(high)
PR: Privileges Required N(none) L(low) H(high)
UI: User Interaction    N(none) R(required)
S:  Scope               U(unchanged) C(changed)
C:  Confidentiality     N(none) L(low) H(high)
I:  Integrity           N(none) L(low) H(high)
A:  Availability        N(none) L(low) H(high)
```

Example vectors:
- Unauth SQLi w/ data read: `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` -> 9.8 Critical.
- Authenticated IDOR (PII read): `AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` -> 6.5–8.1.
- Reflected XSS: `AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N` -> 6.1 Medium.
- Stored XSS hitting admins: `AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N` -> 8.0+ High.

---

## 3. Likelihood x Impact Grid

```
              IMPACT
            Low    Medium   High
L  High      M       H       C
I  Medium    L       M       H
K  Low       I       L       M
E
```
Use this to sanity-check the CVSS band against real exploitability.

---

## 4. Severity Modifiers

**Escalate** when:
- No authentication required.
- Affects all users / cross-tenant.
- Chains into a worse outcome (e.g., XSS -> account takeover).
- Exposes regulated data (PII, PCI, PHI).

**De-escalate** when:
- Requires high privilege already.
- Requires unrealistic preconditions or heavy user interaction.
- Impact is limited to attacker's own account (self-XSS).

---

## 5. Prioritization Rule (Testing Order)

Always test **Critical -> High -> Medium** first. Only pursue **Low/Info** after
high-value testing is complete. This maximizes impact per unit of time and
respects engagement windows.