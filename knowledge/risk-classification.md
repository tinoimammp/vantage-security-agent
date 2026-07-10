# Risk Classification

How to translate a technical finding into a business risk rating consistently.
Used by validator-agent (re-scoring) and report-agent (presentation).

---

## 1. Risk = Likelihood x Impact

### Likelihood factors
| Factor | Higher likelihood | Lower likelihood |
|--------|-------------------|------------------|
| Privileges required | None | Admin |
| Authentication | Unauthenticated | Authenticated + special role |
| User interaction | None | Heavy/social-engineered |
| Discoverability | Obvious/public | Obscure/internal |
| Exploit complexity | Trivial (one request) | Complex chain |
| Detectability of preconditions | Always present | Rare state |

### Impact factors
| Factor | Higher impact | Lower impact |
|--------|---------------|--------------|
| Confidentiality | Mass PII/secrets | Non-sensitive |
| Integrity | Money/state tampering | Cosmetic |
| Availability | Service outage | None |
| Scope | All users/tenants | Single attacker account |
| Regulatory | PCI/PHI/PII | None |
| Reputational | Public, headline-worthy | Internal only |

---

## 2. Rating Grid

```
              IMPACT
            Low    Medium   High
L  High      Med     High    Critical
I  Medium    Low     Med     High
K  Low       Info    Low     Med
E
```

---

## 3. Data Sensitivity Tiers
| Tier | Examples | Default impact |
|------|----------|----------------|
| T0 Crown jewels | Credentials, payment data, tokens, PHI | High |
| T1 PII | Names+emails+addresses, order history | High/Medium |
| T2 Internal | Config, non-public business data | Medium |
| T3 Public | Marketing content, public profiles | Low/Info |

---

## 4. Mapping to Severity Labels
- **Critical**: High likelihood + High impact, OR any unauth full-compromise.
- **High**: High impact with realistic likelihood, OR priv-esc to admin.
- **Medium**: Medium impact or conditional exploitation.
- **Low**: Limited impact, requires significant preconditions.
- **Info**: No direct risk; hardening/defense-in-depth.

---

## 5. Special Rules
- **Chained findings**: rate the chain by its end impact, but document each link.
- **Aggregate exposure**: many Low findings indicating systemic weakness may
  warrant a Medium "systemic" finding.
- **Compensating controls**: WAF/monitoring may lower likelihood but never zero
  it; note residual risk.
- **Regulated data** automatically raises confidentiality impact at least one tier.

---

## 6. Consistency Check
Before finalizing, ask:
- Would an attacker realistically do this? (likelihood)
- What do they actually gain? (impact)
- Does the CVSS vector match the label? (sanity)
If the answers conflict, re-score honestly.