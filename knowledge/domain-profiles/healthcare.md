# Domain Profile: Healthcare / EMR / Telemedicine

**Auto-detection signals:**
- Endpoints: `/patients`, `/records`, `/prescriptions`, `/appointments`, `/diagnoses`, `/lab-results`, `/consultations`
- Keywords: patient, diagnosis, prescription, dosage, ICD, medical record, physician, allergy, insurance/BPJS claim

---

## Critical Endpoints (P0 Priority)

### Patient Records
- `/patients/{id}`, `/patients/{id}/records`, `/records/{id}`
  - **Test:** IDOR (read/edit any patient's full medical history by id)
  - **Test:** Missing consent/scope check (provider access outside their care team)
  - **Test:** Mass PII exposure via search/export endpoints
  - **Impact:** Mass exposure of protected health information (PHI) — highest-sensitivity data class in any domain

### Prescriptions
- `/prescriptions/{id}`, `/patients/{id}/prescriptions`
  - **Test:** IDOR (view/edit any patient's prescriptions)
  - **Test:** Mass assignment (dosage, refill count, controlled-substance flag)
  - **Test:** Missing prescriber-authorization check (non-physician role issuing/editing)
  - **Impact:** Prescription fraud, controlled-substance diversion, patient harm

### Lab Results & Diagnoses
- `/lab-results/{id}`, `/diagnoses/{id}`
  - **Test:** IDOR (read others' results before physician review/release)
  - **Test:** Result tampering (edit values after finalization without audit trail)
  - **Impact:** Diagnosis fraud, delayed/incorrect treatment

### Appointments & Consultations
- `/appointments/{id}`, `/consultations/{id}/notes`, `/consultations/{id}/recording`
  - **Test:** IDOR (read others' consultation notes, video recordings, chat transcripts)
  - **Test:** BFLA (patient role calling physician-only note-write endpoints)
  - **Impact:** Confidential consultation content exposure

### Insurance / Claims
- `/claims/{id}`, `/insurance/verify`
  - **Test:** IDOR (view/submit claims for another patient's policy)
  - **Test:** Claim amount/procedure-code tampering
  - **Impact:** Insurance fraud, financial loss

---

## High Priority (P1)

### Provider/Staff Access
- `/staff/{id}/role`, `/care-teams/{id}/members`
  - **Test:** Mass assignment (nurse -> physician -> admin role)
  - **Test:** IDOR (add self to any patient's care team, granting record access)

### Messaging / Chat
- `/messages`, `/patients/{id}/messages`
  - **Test:** IDOR (read patient-provider messages belonging to others)
  - **Test:** Stored XSS in message body (hits provider dashboard)

### File Attachments (scans, PDFs)
- `/attachments/{id}`, `/records/{id}/upload`
  - **Test:** IDOR on attachment download (predictable/sequential ids)
  - **Test:** Malicious file upload (scan/PDF handler -> RCE or stored XSS)

### Audit Log Access
- `/audit-logs`
  - **Test:** IDOR/BFLA (non-admin reading access logs, or logs missing entirely for PHI access — check whether every record-read is actually logged in code)

---

## Medium Priority (P2)

### Search
- `/patients/search`
  - **Test:** SQLi in search params
  - **Test:** Enumeration (search returns match by NIK/insurance-id without authz check)

### Notifications / Reminders
- `/notifications`
  - **Test:** IDOR (appointment reminders leaking another patient's visit reason)

---

## Business Logic Code Patterns to Check

1. **Care-Team Scoping (the core control in this domain)**
   - Check whether every patient-record read handler verifies the requesting
     provider is an active member of that patient's care team (or the
     patient themself), not just "any authenticated staff account." This is
     the single highest-yield check in a healthcare app — trace it first.
   - Check whether care-team membership is re-verified per-request, not
     cached/assumed from a session flag set at login.

2. **Prescription Authorization**
   - Check whether prescription-write handlers verify the caller's role is
     a licensed prescriber (not just "staff"), and whether controlled
     substances have an additional check (e.g. DEA-equivalent number).

3. **Result Finalization / Immutability**
   - Check whether lab results and diagnosis records become read-only in
     code once finalized/released to the patient, with edits requiring a
     versioned addendum rather than in-place mutation.

4. **Consent & Break-Glass Access**
   - Check whether "emergency access" (break-glass) code paths that bypass
     normal care-team scoping are logged/audited and time-limited, not a
     permanent bypass flag.

5. **Audit Trail Completeness**
   - Check whether every PHI read (not just writes) triggers an audit-log
     write in the handler — many apps only log writes, leaving read-access
     to sensitive records completely untracked.

---

## Authorization Patterns to Test

- **Care-team scoping:** provider sees only their assigned patients' records
- **Patient self-access:** patient sees only their own records/results/messages
- **Role hierarchy:** patient < nurse < physician < admin, with distinct
  write permissions (e.g. only physician issues prescriptions)
- **Break-glass/emergency override:** should be logged and time-boxed
- **Guardian/dependent access:** parent access to a minor's records should
  itself be scoped and revocable at a defined age

---

## Sample High-Impact Findings

- "IDOR on `/patients/{id}/records` exposes any patient's full medical history" → Critical
- "Prescription endpoint allows any staff role to issue controlled substances" → Critical
- "Lab results readable before physician review/release via sequential id" → Critical
- "Consultation video recordings downloadable by any authenticated user" → Critical
- "Mass assignment allows nurse account to self-promote to physician" → High
- "PHI reads are not written to the audit log — no record of who accessed what" → High
- "Claims endpoint allows submitting claims against another patient's policy" → High
- "Stored XSS in patient-to-provider messaging" → Medium
