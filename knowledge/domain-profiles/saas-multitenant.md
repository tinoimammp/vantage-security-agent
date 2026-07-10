# Domain Profile: SaaS / Multi-Tenant B2B Platform

**Auto-detection signals:**
- Endpoints: `/organizations`, `/workspaces`, `/tenants`, `/teams`, `/billing`, `/api-keys`, `/webhooks`, `/invites`
- Keywords: organization_id, workspace_id, tenant_id, subscription, plan, seat, member, invite token

---

## Critical Endpoints (P0 Priority)

### Cross-Tenant Data Access (the defining risk of this domain)
- Any resource endpoint scoped by `org_id`/`tenant_id`/`workspace_id`
  (e.g. `/orgs/{org_id}/projects`, `/workspaces/{id}/documents`)
  - **Test:** IDOR/BOLA — swap `org_id` while authenticated as a member of a
    *different* org and see if the resource is still returned
  - **Test:** Whether the tenant-scope check happens on every query or only
    at the outer route level while a nested resource fetch skips it
  - **Impact:** Full cross-customer data breach — the single most damaging
    class of bug in a multi-tenant product

### Billing & Subscription
- `/billing/subscription`, `/billing/payment-methods`, `/billing/invoices/{id}`
  - **Test:** IDOR (view/download another org's invoices, payment methods)
  - **Test:** Mass assignment / price tampering (plan tier, seat count, discount code applied client-side)
  - **Test:** Downgrade/cancellation not enforced server-side (still granted premium feature access)
  - **Impact:** Revenue loss, exposure of other customers' billing/payment data

### API Keys & Secrets
- `/api-keys`, `/api-keys/{id}`, `/webhooks/{id}/secret`
  - **Test:** IDOR (list/rotate/reveal another org's API key or webhook secret)
  - **Test:** Newly created key returned with excessive scope by default
  - **Impact:** Full API takeover of another tenant

### Team Invites & Membership
- `/invites/{token}`, `/orgs/{id}/members`, `/orgs/{id}/members/{user_id}/role`
  - **Test:** Invite-token guessability/reuse (join an org you weren't invited to)
  - **Test:** Mass assignment (member -> admin -> owner role via the update-role endpoint)
  - **Test:** IDOR (remove/demote another org's members from a different org's session)
  - **Impact:** Unauthorized org takeover, privilege escalation

### SSO / SCIM Provisioning
- `/sso/config`, `/scim/v2/Users`
  - **Test:** SSO config endpoint allows setting an attacker-controlled IdP
    metadata URL, enabling auth bypass for that tenant
  - **Test:** SCIM endpoint provisions/deprovisions users across tenants
    instead of being scoped to the calling tenant's directory

---

## High Priority (P1)

### Usage & Analytics Export
- `/orgs/{id}/usage`, `/orgs/{id}/export`
  - **Test:** IDOR (export another org's usage data or full data dump)

### Custom Domains / White-labeling
- `/orgs/{id}/domains`
  - **Test:** Domain verification bypass — claiming a domain another tenant already owns

### Audit Logs
- `/orgs/{id}/audit-log`
  - **Test:** IDOR (read another org's audit log — leaks who-did-what across tenants)

### Integrations / OAuth Apps
- `/integrations/{id}/connect`
  - **Test:** OAuth state/callback not bound to the initiating tenant, allowing
    a connected integration to attach to the wrong org

---

## Medium Priority (P2)

### Notification Preferences
- `/orgs/{id}/notification-settings`
  - **Test:** IDOR reading/writing another org's settings

### Public Status/Shareable Links
- `/share/{token}`
  - **Test:** Shareable-link tokens not scoped to intended resource only,
    or not revocable/expirable

---

## Business Logic Code Patterns to Check

1. **Tenant-Scope Enforcement (check this before anything else)**
   - Find the data-access layer (ORM query, repository method) for each
     resource type and check whether `org_id`/`tenant_id` is part of the
     `WHERE` clause on **every** query path, not just the primary list
     endpoint — nested/related-resource fetches are the most common place
     this check is silently dropped.
   - Check whether tenant scope is derived from the authenticated session
     (server-side) rather than trusted from a request parameter/header
     (`X-Org-Id`) the client can set.

2. **Billing Enforcement**
   - Check whether feature-gating (seat limits, premium features) is
     re-verified server-side per-request rather than cached at login/in a
     JWT claim that persists after a downgrade.
   - Check whether discount/coupon application happens server-side against
     a validated code, not a client-supplied discount amount.

3. **Role Hierarchy Within a Tenant**
   - Check whether role-update endpoints prevent a non-owner from granting
     themselves or others the `owner` role, and prevent removing the last
     remaining owner.

4. **Invite Token Handling**
   - Check whether invite tokens are single-use, expiring, and bound to a
     specific email/org — not a reusable static link.

5. **API Key Scope**
   - Check whether newly generated keys default to least-privilege scope
     and whether scope is enforced per-request, not just at creation time.

---

## Authorization Patterns to Test

- **Tenant isolation:** a member of Org A must never read/write Org B's data,
  regardless of resource type or nesting depth
- **Role hierarchy within a tenant:** member < admin < owner, with owner-only
  actions (billing, deleting the org, transferring ownership)
- **Cross-tenant admin (platform staff):** internal support/admin tooling
  should have its own elevated-access audit trail, distinct from tenant roles
- **Seat/plan enforcement:** feature access must match the *current* paid
  plan, re-checked per request

---

## Sample High-Impact Findings

- "IDOR allows reading any organization's documents by changing `org_id` in the URL" → Critical
- "Billing endpoint exposes another tenant's payment methods and invoices" → Critical
- "API key rotation endpoint allows reading another org's key by id" → Critical
- "Invite-accept endpoint doesn't validate the token belongs to the target org" → Critical
- "Mass assignment on member-role update allows self-promotion to owner" → Critical
- "SSO config endpoint accepts an arbitrary IdP metadata URL, enabling auth bypass" → Critical
- "Nested resource fetch (`/projects/{id}/tasks`) skips the org-scope check applied at `/projects`" → High
- "Downgraded plan still grants premium API access (feature flag cached in JWT)" → High
- "Audit log endpoint returns entries across all tenants, not just the caller's" → High
