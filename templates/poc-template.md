# PoC: [F-XXX] <Finding Title>

| | |
|---|---|
| **Finding ID** | F-XXX |
| **Severity** | Critical / High / Medium / Low / Info |
| **CVSS** | 9.1 — `AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N` |
| **Category** | IDOR / Authorization / ... |
| **Platform** | web / mobile |
| **Affected Endpoint/Component** | `GET /api/v1/orders/{id}` (web) or `.DeepLinkActivity` / `AuthManager.java` (mobile) |
| **Non-destructive** | Yes |

---

## 1. Summary
One paragraph: what the vulnerability is and what it lets an attacker do.

## 2. Code Evidence (SAST — confirmed statically)
**File:** `path/to/file.js` **Line:** NN **Function:** `handlerName`
```js
// 5-10 lines showing the vulnerable pattern, carried over from the
// validated finding's evidence.code_snippet
```
**Data flow:** `<user_input_source> -> ... -> <sink>`

> Everything below this line is written for a **human** to execute manually
> against a live/staging instance. The agent that produced this PoC did not
> send any of these requests — see `START-HERE.md` §0.

## 3. Prerequisites
- Accounts/roles required (e.g., two regular users `userA`, `userB`).
- Required state (e.g., userB has an existing order with id `1002`).
- Tooling: `curl` or Burp Suite.

## 4. Manual Test Steps (human-executed)

One numbered list. Each step is an action; where the step sends a request or
runs a device command, put that command/exchange directly under it — do not
also re-narrate it in a separate section afterward. Pick the web or mobile
form per the finding's platform.

**Web / API-backed finding:**
1. Authenticate as **userB** and note an object id you own (e.g., order `1002`).
2. Authenticate as **userA** and capture the bearer token.
3. As **userA**, request **userB's** object id:
   ```http
   GET /api/v1/orders/1002 HTTP/1.1
   Host: api.acme.example
   Authorization: Bearer REDACTED_USER_A_TOKEN
   ```
   ```bash
   curl -i 'https://api.acme.example/api/v1/orders/1002' -H 'Authorization: Bearer REDACTED_USER_A_TOKEN'
   ```
4. Observe userB's data returned to userA — confirms the bug:
   ```http
   HTTP/1.1 200 OK
   Content-Type: application/json

   {"id": 1002, "owner_id": 77, "customer": "userB", "total": 129.00}
   ```

**Mobile finding (no backend call)** — e.g. Insecure Data Storage (M9):
1. Install the debug/staging build on a test device or emulator.
2. Perform the in-app action that writes the sensitive value (e.g. log in).
3. Pull the storage location and inspect it:
   ```bash
   adb shell run-as com.acme.app cat /data/data/com.acme.app/shared_prefs/auth.xml
   ```
4. Observe the sensitive value (e.g. auth token) in plaintext.

For an exported-component (M8) finding, trigger the component directly
instead of pulling storage: `adb shell am start -n com.acme.app/.DeepLinkActivity -d "myapp://reset-password?token=x"`.

## 5. Impact
State the concrete impact: e.g., any authenticated user can read any other
user's orders by incrementing the id, exposing PII and order history at scale.

## 6. Remediation
Concrete, code/config-level guidance. Example:
```
Enforce object ownership on every object-by-id route:
  if (order.owner_id !== req.user.id && !req.user.isAdmin) return res.status(404).end();
Add automated authorization tests covering cross-user access.
```

## 7. References
- OWASP A01:2025 — Broken Access Control
- CWE-639
- `${CLAUDE_PLUGIN_ROOT}/knowledge/owasp-wstg.md` (WSTG-ATHZ-04)