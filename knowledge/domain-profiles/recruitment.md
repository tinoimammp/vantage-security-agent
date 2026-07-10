# Domain Profile: Job Board / Recruitment Platform

**Auto-detection signals:**
- Endpoints: `/jobs`, `/applications`, `/candidates`, `/resumes`, `/employers`, `/interviews`, `/offers`
- Keywords: applicant, resume/CV, job posting, employer, recruiter, interview, salary offer, applicant tracking

---

## Critical Endpoints (P0 Priority)

### Candidate Applications & Resumes
- `/applications/{id}`, `/candidates/{id}/resume`
  - **Test:** IDOR (view another candidate's application/resume — leaks
    full PII, salary history, contact details, sometimes ID scans)
  - **Test:** Employer access not scoped to only applicants who applied to
    *their* postings (cross-employer candidate data leak)
  - **Impact:** Mass candidate PII exposure across employers

### Job Posting Management
- `/jobs/{id}/edit`, `/jobs/{id}/close`
  - **Test:** IDOR/BFLA (edit/close a competitor employer's job posting)
  - **Test:** Mass assignment ("featured"/"verified employer" flag, salary
    range shown publicly vs. internal)
  - **Impact:** Competitive sabotage, fraud

### Interview Scheduling & Feedback
- `/interviews/{id}`, `/interviews/{id}/feedback`
  - **Test:** IDOR (read another candidate's interview feedback/scorecard —
    often contains blunt, sensitive internal assessments)
  - **Test:** Candidate account able to read interviewer-only feedback
    intended to stay internal to the employer
  - **Impact:** Sensitive internal HR assessment leak, legal exposure (candidates seeing biased/discriminatory notes)

### Offer Letters & Compensation
- `/offers/{id}`
  - **Test:** IDOR (view another candidate's offer — salary, equity, start date)
  - **Test:** Offer-amount tampering client-side before acceptance is recorded
  - **Impact:** Compensation data breach, offer fraud

### Employer Account / Billing
- `/employers/{id}/billing`, `/employers/{id}/job-credits`
  - **Test:** IDOR (view another employer's billing/job-post-credit balance)
  - **Test:** Job-credit balance mass assignment (post unlimited jobs for free)

---

## High Priority (P1)

### Candidate Profile / Search (Employer-Facing)
- `/candidates/search`
  - **Test:** Search exposes candidates who marked their profile
    "not searchable"/private (visibility flag checked client-side only)

### Messaging Between Recruiter and Candidate
- `/messages/{id}`
  - **Test:** IDOR (read another candidate-recruiter conversation)

### References
- `/references/{id}`
  - **Test:** IDOR (view another candidate's reference-check responses,
    which are typically meant to stay confidential from the candidate)

### Background Check Integration
- `/background-checks/{id}`
  - **Test:** IDOR (view another candidate's background-check result/report)

---

## Medium Priority (P2)

### Saved Jobs / Job Alerts
- `/saved-jobs`, `/job-alerts`
  - **Test:** IDOR reading another user's saved searches (can leak career-move intent tied to identity)

### Company Reviews
- `/companies/{id}/reviews`
  - **Test:** IDOR (edit/delete another user's review); fake reviews from non-verified employees

---

## Business Logic Code Patterns to Check

1. **Employer-Candidate Scoping (the core control in this domain)**
   - Check whether an employer's access to a candidate's application/resume
     is scoped to "this candidate applied to one of *my* postings" — verify
     the check joins through the specific application record, not just
     "any authenticated employer account can view any candidate."

2. **Feedback Visibility Boundary**
   - Check whether interview-feedback/scorecard read endpoints explicitly
     exclude the candidate role, since this content is designed to be
     internal-only — confirm there isn't a shared endpoint serving both
     candidate-facing status and internal feedback without a role branch.

3. **Reference-Check Confidentiality**
   - Check whether reference responses are excluded from any endpoint the
     candidate role can reach, by design (references are typically given in
     confidence).

4. **Job-Credit / Billing Enforcement**
   - Check whether job-posting creation verifies and decrements a
     server-tracked credit balance atomically, not trusting a client-supplied "has_credits" flag.

5. **Offer Integrity**
   - Check whether offer amount/terms are read from the stored offer record
     created by the employer, never re-derived from client input at
     acceptance time.

---

## Authorization Patterns to Test

- **Application scoping:** an employer sees only applications submitted to
  their own postings, not the full candidate database
- **Feedback/reference confidentiality:** never exposed to the candidate role
- **Job posting ownership:** only the posting employer (or platform admin)
  can edit/close it
- **Candidate visibility opt-out:** "not searchable" must be enforced at the
  query layer, not just hidden in the UI

---

## Sample High-Impact Findings

- "IDOR on `/candidates/{id}/resume` exposes any candidate's resume and PII" → Critical
- "Employer can view applications submitted to a different employer's postings" → Critical
- "Interview feedback endpoint is readable by the candidate role" → Critical
- "Offer endpoint IDOR exposes another candidate's salary and start date" → Critical
- "Job-posting edit lacks ownership check, allowing competitor sabotage" → High
- "Search returns candidates who opted out of being searchable" → High
- "Reference-check responses readable by the candidate they're about" → High
- "Job-credit balance can be mass-assigned via the employer profile update endpoint" → High
