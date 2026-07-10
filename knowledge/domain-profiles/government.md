# Domain Profile: Government / Public Service Portal

**Auto-detection signals:**
- Endpoints: `/citizens`, `/permits`, `/applications`, `/documents`, `/retribusi`, `/pajak`, `/layanan`, `/pengajuan`
- Keywords: NIK, KTP, KK, NPWP, permohonan, verifikasi, dukcapil, retribusi, pajak, layanan publik, applicant, citizen id

---

## Critical Endpoints (P0 Priority)

### Citizen Identity Data (NIK/KTP/KK)
- `/citizens/{nik}`, `/citizens/{id}/documents`
  - **Test:** IDOR (look up any citizen's identity record by NIK/id —
    exposes full name, address, family card, date of birth at national scale)
  - **Test:** Enumeration (sequential/guessable NIK returns valid records,
    confirming existence + PII without authorization)
  - **Impact:** Mass PII breach of national identity data — highest-scale
    impact of any domain profile in this framework

### Application / Permit Submission (Pengajuan)
- `/applications/{id}`, `/permits/{id}`, `/pengajuan/{id}`
  - **Test:** IDOR (view/edit another applicant's submission — leaks
    identity docs, addresses, reasons for application)
  - **Test:** Status tampering (client-supplied "approved" status instead of
    officer-only server-side transition)
  - **Impact:** Fraudulent permit approval, PII exposure, corruption vector

### Document Upload / Verification
- `/documents/{id}`, `/verification/{id}`
  - **Test:** IDOR (download another citizen's uploaded KTP/KK/certificate scan)
  - **Test:** Verification-status mass assignment (self-mark documents "verified")
  - **Impact:** Identity-document leak enabling identity theft/fraud

### Payments (Retribusi / Pajak / Fees)
- `/retribusi/{id}/pay`, `/pajak/{id}`, `/payments/{id}`
  - **Test:** Amount tampering (client-supplied fee/tax amount instead of
    server-calculated from the applicable regulation/tariff table)
  - **Test:** IDOR (view/pay another citizen's tax/fee record)
  - **Impact:** Public revenue loss, payment fraud

### Officer / Admin Portal
- `/officer/applications/{id}/approve`, `/admin/citizens/{id}`
  - **Test:** BFLA (citizen-role account calling officer-only approve/reject/edit endpoints)
  - **Test:** IDOR (an officer at one agency/region approving applications outside their jurisdiction)
  - **Impact:** Unauthorized approvals, jurisdiction bypass, corruption vector

---

## High Priority (P1)

### Complaint / Report Submission (Pengaduan)
- `/complaints/{id}`, `/pengaduan/{id}`
  - **Test:** IDOR (read another citizen's complaint — may name individuals,
    contain sensitive allegations)
  - **Test:** Anonymous-complaint flag not actually anonymizing the stored submitter identity

### Appointment / Queue Booking
- `/appointments/{id}`, `/queue/{id}`
  - **Test:** IDOR (view/cancel another citizen's service appointment)
  - **Test:** Queue-number manipulation (skip the line via client-supplied position)

### Public Data / Open Data Endpoints
- `/public/data`, `/opendata/{dataset}`
  - **Test:** Endpoint intended for aggregate/anonymized public data instead
    returns row-level PII when queried with specific filters

### Notification / SMS-Gateway Integration
- `/notifications/send`
  - **Test:** BFLA (non-admin triggering mass notification/SMS blast, cost and spam risk)

---

## Medium Priority (P2)

### Search
- `/citizens/search`, `/applications/search`
  - **Test:** SQLi in search filters
  - **Test:** Search returns more PII fields than the requesting role should see

### Audit / Activity Log
- `/audit-log`
  - **Test:** IDOR/BFLA on log access; or officer actions on citizen data not logged at all

---

## Business Logic Code Patterns to Check

1. **Identity-Lookup Authorization (the core control in this domain)**
   - Check whether any endpoint that accepts a NIK/citizen-id as input
     verifies the caller is either that citizen or an officer with a
     legitimate, logged reason/case reference — never an open lookup
     available to any authenticated session.
   - Check rate-limiting/anti-enumeration on identity-lookup endpoints
     specifically, since NIK space is large but structured (checking for
     brute-force/enumeration protection at the code level: attempt counters,
     lockout, CAPTCHA triggers).

2. **Approval Workflow Integrity**
   - Check whether status transitions (submitted -> under review -> approved
     / rejected) are only writable by an officer role via a dedicated
     endpoint, with the citizen-facing endpoint being strictly read-only for
     status.
   - Check whether jurisdiction/region scoping is enforced for officers —
     an officer for Region A should not be able to approve/edit Region B's
     applications.

3. **Fee/Tax Calculation**
   - Check whether the payable amount is computed server-side from a
     regulation/tariff table keyed by application type + citizen data, never
     accepted as a client-supplied value.

4. **Document Storage & Access**
   - Check whether uploaded identity documents are served via an
     authorization-checked endpoint scoped to (citizen-owner + assigned
     officer), not a predictable static file path.

5. **Audit Trail for PII Access**
   - Check whether every officer read of a citizen's identity data writes
     an audit-log entry including the officer id and stated reason — this
     is often the only after-the-fact control against insider misuse in
     government systems.

---

## Authorization Patterns to Test

- **Citizen self-access:** citizens see/edit only their own applications/documents
- **Officer jurisdiction scoping:** officers act only within their assigned
  region/agency, never globally by default
- **Role hierarchy:** citizen < front-office officer < approving officer < admin
- **Approval separation of duties:** the officer who reviews should ideally
  differ from the one who approves for high-value permits (check if code
  enforces this or just relies on process)

---

## Sample High-Impact Findings

- "IDOR on `/citizens/{nik}` exposes any citizen's full identity record" → Critical
- "No rate limiting on NIK lookup enables mass enumeration of the citizen database" → Critical
- "Application status can be set to 'approved' via a client-writable field" → Critical
- "Fee/tax amount accepted from client instead of server-calculated tariff" → Critical
- "Officer endpoints callable by citizen-role accounts (missing BFLA check)" → Critical
- "Officer from Region A can approve applications filed in Region B" → High
- "Identity document scans downloadable via predictable/sequential URL" → High
- "PII access by officers is not written to any audit log" → High
- "Open-data endpoint returns row-level citizen PII instead of aggregates" → High
