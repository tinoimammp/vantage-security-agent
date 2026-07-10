# Domain Profile: Forum / Community / Discussion Board

**Auto-detection signals:**
- Endpoints: `/threads`, `/posts`, `/users/{id}/posts`, `/categories`, `/moderator`, `/admin`
- Keywords: thread, post, reply, upvote, downvote, moderator, ban, sticky, lock

---

## Critical Endpoints (P0 Priority)

### Privilege Escalation (User → Mod → Admin)
- `/users/{id}/role`, `/users/{id}/permissions`, `/moderator/promote`
  - **Test:** Mass assignment (grant self moderator/admin role)
  - **Test:** IDOR (change another user's role to admin)
  - **Test:** API bypasses (call admin-only endpoints as regular user)
  - **Impact:** Full forum takeover, mass content manipulation

### Moderation Actions
- `/posts/{id}/delete`, `/users/{id}/ban`, `/threads/{id}/lock`
  - **Test:** BFLA (regular users calling mod-only actions)
  - **Test:** Mass ban/delete without authorization
  - **Test:** Delete admin/moderator posts as regular user
  - **Impact:** Content destruction, user suppression

### User Accounts
- `/users/{id}`, `/users/{id}/profile`
  - **Test:** IDOR (read/edit other users' emails, IPs, private messages)
  - **Test:** Account takeover via profile update (email change without verification)
  - **Impact:** Account compromise, PII leak

---

## High Priority (P1)

### Posts & Threads
- `/posts/create`, `/threads/{id}/reply`, `/posts/{id}/edit`
  - **Test:** Stored XSS in post content, title, signature (hits all viewers)
  - **Test:** IDOR (edit/delete others' posts)
  - **Test:** HTML/BBCode injection bypassing sanitization
  - **Impact:** Mass XSS → session theft, phishing, defacement

### Private Messages / DMs
- `/messages`, `/messages/{id}`
  - **Test:** IDOR (read others' private conversations)
  - **Test:** Stored XSS in DM content (targets specific users)
  - **Impact:** Privacy breach

### Voting & Reputation
- `/posts/{id}/upvote`, `/users/{id}/reputation`
  - **Test:** Vote manipulation (unlimited upvotes, vote on own posts)
  - **Test:** Reputation tampering via mass assignment
  - **Test:** Race condition (vote multiple times)
  - **Impact:** Reputation fraud, content ranking manipulation

### File Uploads (Avatars, Attachments)
- `/users/{id}/avatar`, `/posts/{id}/attachments`
  - **Test:** Upload executable (PHP, JSP, ASPX) → RCE
  - **Test:** SVG with XSS, HTML with stored XSS
  - **Test:** Path traversal (overwrite config files)
  - **Impact:** RCE, stored XSS at scale

---

## Medium Priority (P2)

### Search
- `/search?q=`, `/threads/search`
  - **Test:** SQLi in search query, filters (author, date, category)
  - **Test:** Reflected XSS in search results page

### Reporting & Flags
- `/posts/{id}/report`
  - **Test:** Report spam/abuse (DOS moderators with fake reports)
  - **Test:** Stored XSS in report reason (hits moderator dashboard)

### Categories & Tags
- `/categories`, `/tags`
  - **Test:** IDOR (modify/delete categories as non-admin)
  - **Test:** XSS in category name/description

---

## Business Logic Code Patterns to Check

1. **Privilege Escalation Chain**
   - Check role-assignment handlers (user->moderator->admin) for an
     allow-list restricted to admin-only callers, at each step of the chain.

2. **Mass Content/Moderation Actions**
   - Check whether post edit/delete, thread sticky/lock, and user-ban
     handlers verify moderator/admin role server-side, and whether they
     verify the target isn't a higher-privileged user (mod editing admin content).
   - Check whether bulk-action endpoints (mass ban/delete) carry the same
     guard as single-item actions.

3. **Reputation Gaming**
   - Check whether the upvote/downvote handler enforces one vote per
     user per post server-side (unique constraint) and blocks self-voting.
   - Check whether the vote check-then-record is atomic (race-condition
     candidate if not — see `${CLAUDE_PLUGIN_ROOT}/agents/web/business-logic-agent.md`).

4. **Stored XSS Surface**
   - Check output encoding on post content, signature, and DM fields per
     `${CLAUDE_PLUGIN_ROOT}/agents/web/xss-agent.md` — a signature field renders on every page the user
     posts on, and a DM XSS could target admins/mods specifically, so weight
     severity accordingly.

5. **Account Takeover**
   - Check whether email-change handlers require re-verification (not just
     an authenticated session) and whether they're scoped to the caller's
     own account (IDOR check).
   - Check session-regeneration-on-login and password-reset-token handling
     per `${CLAUDE_PLUGIN_ROOT}/agents/web/auth-agent.md`.

---

## Authorization Patterns to Test

- **Post ownership:** users can edit/delete only their own posts
- **Thread ownership:** thread creator can lock/sticky (or only mods?)
- **Moderation boundary:** mods can't touch admin content/settings
- **Category permissions:** some categories admin-only, mod-only, or invite-only
- **Private sections:** VIP/paid sections not accessible by free users

---

## Sample High-Impact Findings

- "Mass assignment allows any user to grant themselves admin role" → Critical
- "Stored XSS in post content affects all thread viewers" → High/Critical
- "IDOR allows reading any user's private messages" → Critical
- "Regular users can delete any post via /posts/{id}/delete" → High
- "Executable PHP upload via avatar → RCE" → Critical
- "Unlimited upvotes via race condition manipulates post ranking" → Medium
- "IDOR on user profile allows email takeover without verification" → Critical