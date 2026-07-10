# Domain Profile: CMS / Content Management System

**Auto-detection signals:**
- Endpoints: `/admin`, `/wp-admin`, `/wp-json`, `/api/content`, `/pages`, `/posts`, `/media`, `/plugins`, `/themes`
- Keywords: publish, draft, author, editor, content, media, slug, taxonomy, widget
- Common: WordPress, Drupal, Joomla, Ghost, Strapi, Directus

---

## Critical Endpoints (P0 Priority)

### Admin Panel Access
- `/admin`, `/wp-admin`, `/administrator`, `/backend`
  - **Test:** Auth bypass, default credentials, forced browsing
  - **Test:** Session fixation, missing logout invalidation
  - **Impact:** Full site takeover

### User Roles & Permissions
- `/users/{id}/role`, `/api/users/{id}`
  - **Test:** Mass assignment (subscriber → editor → admin)
  - **Test:** IDOR (change other users' roles)
  - **Test:** Privilege escalation via capabilities field
  - **Impact:** Admin takeover

### Content Publishing
- `/posts`, `/pages`, `/api/content/{id}/publish`
  - **Test:** IDOR (publish/edit others' drafts)
  - **Test:** Stored XSS in post content, title, custom fields
  - **Test:** Authorization bypass (subscriber publishing posts)
  - **Impact:** Defacement, malware injection

### File Upload (Media Library)
- `/media/upload`, `/wp-admin/upload.php`, `/api/files`
  - **Test:** Unrestricted file upload (PHP, PHTML, JSP, ASPX)
  - **Test:** Path traversal (upload to /themes/ or /plugins/)
  - **Test:** SVG with embedded JavaScript → stored XSS
  - **Test:** Double extension bypass (.php.jpg)
  - **Impact:** RCE, persistent backdoor

### Plugin/Theme Management
- `/plugins/install`, `/themes/upload`, `/api/extensions`
  - **Test:** Arbitrary plugin/theme upload (malicious ZIP)
  - **Test:** Plugin activation without admin privilege
  - **Test:** Theme editor access (edit PHP templates)
  - **Impact:** RCE, full compromise

---

## High Priority (P1)

### REST API Exposure
- `/wp-json/wp/v2/users`, `/api/v1/*`
  - **Test:** Unauthenticated user enumeration
  - **Test:** Missing auth on write endpoints (create/update/delete)
  - **Test:** IDOR on posts, pages, media
  - **Test:** Mass assignment on sensitive fields

### Authentication
- `/wp-login.php`, `/api/auth/login`
  - **Test:** Username enumeration (differential responses)
  - **Test:** Weak password policy, no rate limiting
  - **Test:** XML-RPC brute force amplification
  - **Test:** Auth token predictability (WordPress nonces)

### Comments
- `/comments`, `/wp-comments-post.php`
  - **Test:** Stored XSS in comment author, URL, content
  - **Test:** Comment spam without CAPTCHA/rate-limit
  - **Test:** Self-approve comments, bypass moderation

### Custom Fields / Meta
- `/posts/{id}/meta`, `/api/content/{id}`
  - **Test:** Stored XSS in custom fields (serialized data)
  - **Test:** PHP object injection in serialized meta
  - **Test:** SQL injection in meta queries

---

## Medium Priority (P2)

### Search
- `/search`, `/?s=`
  - **Test:** SQLi in search query
  - **Test:** Reflected XSS in search term

### Taxonomy (Categories, Tags)
- `/categories`, `/tags`
  - **Test:** XSS in category name/description
  - **Test:** IDOR (edit/delete categories as non-admin)

### Revisions & Autosave
- `/posts/{id}/revisions`
  - **Test:** IDOR (read draft revisions of private posts)
  - **Test:** Restore old revision to bypass moderation

---

## Business Logic Code Patterns to Check

1. **Privilege Escalation**
   - Check whether role-update handlers (subscriber->contributor->
     editor->admin) bind the `role`/capabilities field from client input
     without an allow-list restricted to admin-only callers.
   - Check whether the theme/plugin editor route requires the same
     admin-only guard as other admin functions (an editor reaching it is RCE).

2. **Persistent Backdoor Surface**
   - Check plugin/theme upload handlers for content-type/extension validation
     on the ZIP contents, not just the outer file.
   - Check whether template-file edit endpoints are restricted to admin and
     whether the upload directory (`/uploads/`) has any executable-handler
     mapping (`.htaccess`/server config allowing PHP execution there).

3. **Content Injection**
   - Check whether post-edit/publish handlers verify authorship/ownership
     before allowing edits to high-traffic or others' posts (IDOR).
   - Check output encoding on post content/custom fields per `xss-agent`.

4. **Data Exfiltration**
   - Check whether the REST user-listing endpoint (`/wp-json/wp/v2/users` or
     equivalent) requires authentication and whether it's paginated with
     per-page authz.
   - Check whether bulk export (posts/pages/media) endpoints carry the same
     authorization guard as the interactive admin views.

5. **WordPress-Specific**
   - Check whether XML-RPC is enabled in config and, if so, whether
     `system.multicall` is disabled or rate-limited (amplification risk) —
     cite the config, don't send pingback requests.
   - Check whether application-password generation requires 2FA/re-auth.
   - Check whether the author-archive route (`/?author=1`) leaks the
     username via redirect — trace the redirect-building code.

---

## Authorization Patterns to Test

- **Post visibility:** draft, private, published → who can see/edit each state?
- **Capabilities:** publish_posts, edit_others_posts, delete_posts, manage_options
- **Media ownership:** can user A delete user B's uploaded files?
- **Plugin/theme:** install/activate/edit restricted to admin only?

---

## Sample High-Impact Findings

- "Unrestricted PHP upload in media library → RCE" → Critical
- "Mass assignment allows subscriber to become administrator" → Critical
- "REST API allows unauthenticated post creation/modification" → Critical
- "Stored XSS in post custom field affects all viewers" → High
- "XML-RPC pingback brute force with no rate limit" → High
- "Theme editor accessible to non-admin users → arbitrary PHP execution" → Critical
- "IDOR allows reading/editing any draft post" → High
- "Plugin upload/activation possible without admin privilege" → Critical