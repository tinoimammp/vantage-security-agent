# Finding Template

> Copy this structure into `artifacts/findings/*.json` as a JSON object
> (per `${CLAUDE_PLUGIN_ROOT}/schemas/finding.schema.json`). This markdown version documents the
> required fields and provides authoring guidance.

---

## [F-XXX] <Concise, specific title>

| Field | Value |
|-------|-------|
| **ID** | F-XXX |
| **Category** | Authorization / IDOR / SQL Injection / ... |
| **Severity** | Critical / High / Medium / Low / Info |
| **CVSS** | 9.1 — `AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N` |
| **Platform** | web / mobile |
| **Endpoint / Component** | `GET /api/v1/orders/{id}` (web) or `.DeepLinkActivity` (mobile) |
| **Confidence** | 0.0–1.0 |
| **Validated** | true / false |
| **Discovered by** | authorization-agent |

### Description
Explain the vulnerability clearly: what the flaw is, where it lives, and why the
application's behavior is incorrect. Be specific about the conditions.

### Impact
What does an attacker gain? Quantify where possible (records exposed, money,
privilege level, persistence). Tie to business risk.

### Evidence (code-based — SAST)
**File:** `src/controllers/orders.controller.js`
**Line:** 42
**Function:** `getOrder`

```js
async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  return res.json(order); // no ownership check
}
```

**User input source:** `req.params.id`
**Data flow:** `req.params.id -> Order.findById(id) -> res.json(order)`
**Missing check:** `if (order.owner_id !== req.user.id && !req.user.isAdmin) return res.status(404).end();`

> Live HTTP request/response evidence is NOT captured here — it belongs to the
> PoC (`${CLAUDE_PLUGIN_ROOT}/templates/poc-template.md`), written for a human to run manually.

### Remediation
Provide a concrete fix: enforce object-level ownership checks server-side;
validate `order.owner_id == session.user_id` before returning data; add
authorization tests.

### References
- OWASP A01:2025 Broken Access Control
- CWE-639 Authorization Bypass Through User-Controlled Key
- See `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-top-vuln.md`, `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-wstg.md`

### Validation Notes
(Filled by validator-agent: reproduction result, stability, confidence rationale.)