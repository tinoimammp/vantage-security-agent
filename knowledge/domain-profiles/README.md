# Domain Profiles — Application-Specific Testing Knowledge

These profiles teach agents **what matters most** in each application type,
so they prioritize the right endpoints and attacks without asking questions.

---

## Available Profiles

| Profile | File | Auto-Detection Signals |
|---------|------|------------------------|
| **E-Commerce / Online Shop** | `onlineshop.md` | `/cart`, `/checkout`, `/payment`, `/orders`, `/coupons` |
| **HRIS / Kepegawaian** | `hris.md` | `/employees`, `/payroll`, `/attendance`, `/salary`, `/leave` |
| **Forum / Community** | `forum.md` | `/threads`, `/posts`, `/moderator`, `/upvote`, `/reputation` |
| **CMS (WordPress, etc)** | `cms.md` | `/admin`, `/wp-admin`, `/posts`, `/media`, `/plugins` |
| **Banking / Fintech** | `banking.md` | `/accounts`, `/transactions`, `/transfer`, `/balance` |
| **LMS / E-Learning** | `lms.md` | `/courses`, `/lessons`, `/quizzes`, `/grades`, `/assignments` |
| **Healthcare / EMR / Telemedicine** | `healthcare.md` | `/patients`, `/records`, `/prescriptions`, `/appointments` |
| **SaaS / Multi-Tenant B2B** | `saas-multitenant.md` | `/organizations`, `/workspaces`, `/tenants`, `/billing`, `/api-keys` |
| **Social Media / Social Network** | `social-media.md` | `/posts`, `/feed`, `/friends`, `/followers`, `/messages`, `/stories` |
| **Real Estate / Listings & Bookings** | `real-estate.md` | `/listings`, `/properties`, `/bookings`, `/agents`, `/leases` |
| **Logistics / Ride-Hailing / Delivery** | `logistics-delivery.md` | `/trips`, `/rides`, `/deliveries`, `/drivers`, `/tracking` |
| **Government / Public Service** | `government.md` | `/citizens`, `/permits`, `/applications`, `/retribusi`, `/pajak` |
| **Recruitment / Job Board** | `recruitment.md` | `/jobs`, `/applications`, `/candidates`, `/resumes`, `/interviews` |
| **Ticketing / Events** | `ticketing-events.md` | `/events`, `/tickets`, `/seats`, `/check-in`, `/qr` |
| **Generic (Fallback)** | `generic.md` | no named profile matches (`confidence < 0.6`) — derive domain + assets from code |

---

## How Agents Use Profiles

### 1. Recon Agent (Phase 01)
- After endpoint discovery, analyze paths + keywords
- Calculate confidence score per domain type (0.0–1.0)
- Set `domain_type` and `domain_confidence` in `recon.json`

### 2. Mapper Agent (Phase 02)
- Read `recon.json` → extract `domain_type`
- If `confidence >= 0.6`, load the matching profile
- Apply **domain-specific prioritization**:
  - Endpoints in profile's "Critical (P0)" → force P0
  - Tag domain-specific vuln classes (e.g., price manipulation for onlineshop)
  - Assign domain-aware test patterns

### 3. Testing Agents (Phase 03)
- Inherit prioritization from mapper
- Reference profile's "Business Logic Attack Vectors" for **which code pattern
  to look for**, not an action to perform live. A bullet like "brute-force
  short coupon codes" means: check the coupon-redemption handler for missing
  rate-limiting/lockout code and for coupon-length/entropy — never actually
  brute force anything. This pipeline never sends requests (see `START-HERE.md`
  Golden Rules); every "Test:"/attack-vector bullet in a domain profile is
  shorthand for the code-level absence of a control, confirmed by reading source.
- Follow "Sample High-Impact Findings" for severity calibration

---

## What Each Profile Contains

1. **Auto-detection signals** — endpoints, keywords, frameworks
2. **Critical Endpoints (P0)** — the money/data endpoints that matter most
3. **High/Medium Priority** — ordered by impact
4. **Business Logic Attack Vectors** — domain-specific exploit patterns
5. **Authorization Patterns** — who should/shouldn't access what
6. **Sample High-Impact Findings** — real-world examples with severity

---

## When No Profile Matches (Generic — Active Analysis, NOT a no-op)

If `domain_confidence < 0.6` or no named profile fits, agents load **`generic.md`**,
which is an active protocol — **not** a fallback to plain defaults:

1. **Recon** reads the codebase (README, manifests, models, routes, config) to derive
   `app_purpose` + a free-text `domain_label`, then enumerates **critical assets
   (crown jewels)** with evidence and impact, writing them to `recon.json`.
2. **Mapper** prioritizes endpoints from `critical_assets[]`: any endpoint touching a
   Critical-impact asset is force-promoted to P0, mirroring how named profiles force
   `/checkout` or `/transfer` to P0.
3. **Testing agents** calibrate severity against those assets.

This guarantees that even an unknown application type is tested impact-first, grounded
in what the app actually does. `severity-matrix.md` and `high-impact-prioritization.md`
still inform scoring.

---

## Adding New Profiles

To add a new domain (e.g., IoT, education-admin, insurance):

1. Create `${CLAUDE_PLUGIN_ROOT}/knowledge/domain-profiles/<name>.md` following the structure above
2. Update `recon-agent.md` → add detection rules

No code changes needed — agents read these markdown files dynamically.