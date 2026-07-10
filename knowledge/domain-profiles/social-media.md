# Domain Profile: Social Media / Social Network

**Auto-detection signals:**
- Endpoints: `/posts`, `/feed`, `/friends`, `/followers`, `/messages`, `/stories`, `/likes`, `/blocks`, `/privacy-settings`
- Keywords: follow, like, share, story, DM, mutual, block, mention, tag, privacy (public/friends-only/private)

---

## Critical Endpoints (P0 Priority)

### Direct Messages
- `/messages/{id}`, `/conversations/{id}`
  - **Test:** IDOR (read another user's DM thread by conversation/message id)
  - **Test:** Missing participant check on message-send (send into a conversation you're not part of)
  - **Impact:** Mass private-message exposure — highest-sensitivity data in this domain

### Privacy Settings / Audience Control
- `/posts/{id}/audience`, `/privacy-settings`, `/profile/{id}/visibility`
  - **Test:** Private/friends-only content readable by non-friends via direct
    object access (the privacy flag is checked in the UI, not the API)
  - **Test:** Blocked user can still view/interact with the blocking user's
    content via a different endpoint (block not enforced app-wide)
  - **Impact:** Bypasses the core privacy promise of the platform

### Account Takeover Surfaces
- `/account/email`, `/account/password`, `/account/recovery`
  - **Test:** IDOR/mass assignment on account-update endpoints (change
    another user's email/password/recovery phone by id)
  - **Test:** Session/token not invalidated on password change
  - **Impact:** Full account takeover

### Blocking / Reporting
- `/blocks`, `/reports`
  - **Test:** Block list readable by the blocked user (reveals who blocked them, or leaks the full block list via IDOR)
  - **Test:** Report content visible to the reported user (retaliation risk)

### Admin / Moderation Tools
- `/admin/users/{id}/suspend`, `/admin/content/{id}/remove`
  - **Test:** BFLA (regular user account calling moderation-only endpoints)
  - **Impact:** Platform-wide abuse (mass suspensions, censorship)

---

## High Priority (P1)

### Friend/Follow Relationships
- `/friends/requests/{id}`, `/followers/{id}`
  - **Test:** IDOR (accept/reject another user's pending friend request)
  - **Test:** Follow/unfollow another user's account from a spoofed session

### Stories / Ephemeral Content
- `/stories/{id}`
  - **Test:** "Expired" stories still fetchable directly by id after the
    claimed expiry (expiry enforced client-side only)
  - **Test:** Viewer-list IDOR (see who viewed a story you don't own)

### Comments & Reactions
- `/posts/{id}/comments`, `/comments/{id}`
  - **Test:** Stored XSS in comment body (hits every viewer of the post)
  - **Test:** IDOR (edit/delete another user's comment)

### Tagging / Mentions
- `/posts/{id}/tags`
  - **Test:** Tag a private-account user without their consent, exposing
    their identity on a public post (tag-approval bypass)

---

## Medium Priority (P2)

### Search & Discovery
- `/search/users`
  - **Test:** Enumeration of private/deactivated accounts via search
  - **Test:** SQLi in search filters

### Notifications
- `/notifications`
  - **Test:** IDOR reading another user's notification feed (leaks who
    liked/commented/messaged them)

---

## Business Logic Code Patterns to Check

1. **Audience/Privacy Enforcement (the core control in this domain)**
   - Find the content-read handler for posts/profile fields and check
     whether it re-evaluates the audience setting (public/friends/private)
     against the *requesting* user's relationship to the owner on **every**
     read — not just at creation time or in the feed-generation query while
     the direct-by-id endpoint skips it.
   - Check whether "friends-only" is computed from a live, bidirectional
     friendship/follow-back record, not a one-directional follow.

2. **Block Enforcement**
   - Check whether a block record is consulted by every interaction path
     (view profile, comment, message, tag, mention) — not only the message
     endpoint — since partial enforcement is the most common real-world gap.

3. **DM Participant Authorization**
   - Check whether conversation read/send handlers verify the caller is a
     current participant of that specific conversation id, re-checked per
     request (not cached from conversation-creation time, so removed
     participants lose access immediately).

4. **Ephemeral Content Expiry**
   - Check whether story/ephemeral-content read handlers enforce the expiry
     window server-side (compare stored timestamp vs. now) rather than
     relying on the client to stop requesting it.

5. **Account-Recovery Flow**
   - Check whether email/password/recovery-contact changes require
     re-authentication (current password) and invalidate existing sessions.

---

## Authorization Patterns to Test

- **Audience scoping:** public / friends-only / private, re-checked per read
- **Block enforcement:** app-wide, not just on the messaging surface
- **Friendship state:** pending vs. accepted vs. blocked, affecting visibility
- **Content ownership:** only the author (or admin) can edit/delete a post/comment
- **Moderation role:** regular user < moderator < admin, with audit trail

---

## Sample High-Impact Findings

- "Private profile's posts are readable via direct post id despite privacy setting" → Critical
- "IDOR on `/messages/{id}` exposes any user's direct message thread" → Critical
- "Blocked users can still send messages by hitting the send endpoint directly" → Critical
- "Account email-change endpoint has no ownership check, enabling takeover" → Critical
- "Moderation endpoint (`/admin/users/{id}/suspend`) callable by regular users" → High
- "Story viewer-list endpoint leaks views on stories you don't own" → High
- "Stored XSS in post comments executes for every viewer" → High
- "Friend-request accept endpoint doesn't verify the request targets the caller" → High
