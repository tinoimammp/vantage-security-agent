# Domain Profile: Generic (Fallback — Derive the Domain from Code)

**When to use this profile:**
- `domain_confidence < 0.6`, OR
- `domain_type: generic`, OR
- the app clearly does not match onlineshop / hris / forum / cms / banking / lms.

> This is **not** a "give up and use defaults" profile. It is an **active analysis
> protocol**: when no predefined domain matches, the agent must **read the codebase to
> figure out what the application actually does**, identify its **critical assets
> (crown jewels)**, and derive prioritization from those assets. Stay 100% static
> (SAST) — read code, never run it, never ask the user.

---

## Step 1 — Determine "What Is This Application About?" (from code)

Build an evidence-based understanding of the app's purpose by reading:

1. **Project metadata** — `README.md`, `package.json`/`composer.json`/`pyproject.toml`
   (`name`, `description`, `keywords`), repo name, `/docs`, `openapi.yaml` `info.title`.
2. **Domain vocabulary** — recurring nouns in model/entity/table names, route segments,
   directory names, and DB schema/migrations (e.g. `Invoice`, `Patient`, `Ticket`,
   `Shipment`, `Subscription`, `Device`, `Booking`, `Claim`).
3. **Core entities & relationships** — ORM models / migrations reveal the data model
   and which objects are central (most-referenced tables, foreign-key hubs).
4. **Primary user roles** — from auth/role definitions (admin, staff, customer, vendor,
   patient, etc.) — tells you the trust boundaries that matter.
5. **External integrations** — payment, messaging, storage, third-party APIs in config
   and dependency manifests — hints at sensitive data flows.
6. **Money / regulated-data signals** — fields like `amount`, `balance`, `ssn`, `nik`,
   `medical`, `salary`, `card`, `token` indicate high-impact assets even without a
   known domain.

**Output:** a 1–3 sentence `app_purpose` statement + a detected `domain_label`
(free-text, e.g. "ticketing/helpdesk", "healthcare/EMR", "logistics/shipment",
"IoT device management", "subscription SaaS"). Record `domain_confidence` for it.

---

## Step 2 — Identify Critical Assets (Crown Jewels)

For the derived domain, enumerate what an attacker would most want or what would hurt
most if compromised. For each asset capture: **what it is, where it lives in code
(models/endpoints), why it's sensitive, and the worst-case impact.**

Classify each asset by type:
- **Sensitive data** — PII, credentials, financial, health, government IDs, secrets.
- **Money / value movement** — payments, balances, payouts, credits, billing.
- **Trust & access control** — roles, permissions, account ownership, tenant isolation.
- **Integrity-critical records** — audit logs, official documents, grades/scores,
  approvals, status that drives downstream actions.
- **Availability-critical flows** — core business workflow the app exists to perform.
- **Infrastructure reach** — file system, internal services, cloud metadata, command exec.

Rank assets by **business impact** (Critical → Low). The top-ranked assets define P0.

---

## Step 3 — Derive Prioritization from Assets (P0–P3)

Map each critical asset to the endpoints/code that read or mutate it, then assign:

- **P0** — unauth or low-priv access to a Critical asset, or any state change to
  money/access-control/integrity-critical assets. Examples (domain-agnostic):
  - object-by-id endpoints exposing sensitive records → IDOR/BOLA
  - any endpoint that changes ownership, role, balance, or approval status
  - admin/privileged functions lacking server-side authorization
- **P1** — privilege escalation paths, sensitive authenticated operations on High assets,
  stored XSS where sensitive viewers exist.
- **P2** — medium-sensitivity authenticated endpoints, injection in
  search/filter/sort, SSRF-prone params.
- **P3** — low-value/informational surfaces (tested last).

Force-promote to P0 any endpoint touching a Critical asset, even if it requires auth —
mirroring how named profiles force `/checkout` or `/transfer` to P0.

---

## Step 4 — Asset-Driven Test Focus (route to testing agents)

| Asset type | Primary attacks | Owning agents |
|------------|-----------------|---------------|
| Sensitive data records | IDOR/BOLA, missing authz, info disclosure | authorization-agent, api-agent |
| Money / value | price/amount tampering, race, workflow bypass | business-logic-agent |
| Trust & access control | priv-esc, mass assignment, BFLA | authorization-agent, api-agent |
| Integrity records | unauthorized state change, tampering, fail-open | business-logic-agent, injection-agent |
| Infra reach | CmdInj, SSTI, path traversal, SSRF, XXE | injection-agent |
| Secrets / crypto | hardcoded secrets, weak crypto | secrets-agent |
| Dependencies | known-CVE components (SCA) | dependency-agent |

---

## Step 5 — Record for Downstream Agents

Write into `recon.json` (see recon-agent):
```json
{
  "domain_type": "generic",
  "domain_label": "ticketing/helpdesk",
  "domain_confidence": 0.4,
  "app_purpose": "Internal helpdesk where staff manage customer support tickets, attachments, and SLA status.",
  "critical_assets": [
    {
      "asset": "Support tickets (customer PII + attachments)",
      "type": "sensitive_data",
      "evidence": "models/Ticket.js, routes /api/tickets/{id}",
      "impact": "Critical",
      "why": "Contains customer PII and uploaded files; cross-user read = mass PII exposure"
    },
    {
      "asset": "Agent role assignment",
      "type": "access_control",
      "evidence": "models/User.role, PUT /api/users/{id}",
      "impact": "Critical",
      "why": "Mass assignment of role escalates any user to admin"
    }
  ]
}
```

Mapper-agent consumes `critical_assets` to force-rank P0 endpoints; testing agents use
them for severity calibration.

---

## Guardrails
- **SAST only** — derive everything from reading code/config. No execution, no requests,
  no asking the user.
- **Be specific, not generic** — "tickets containing customer PII" beats "user data".
  Always cite the file/model/endpoint evidence for each asset.
- **Impact-first** — if uncertain about the domain, still rank by asset sensitivity so
  the highest-impact code is tested first.
- If a **named profile** turns out to fit after deeper reading (confidence rises ≥ 0.6),
  switch to it and note the correction in the run-log.
