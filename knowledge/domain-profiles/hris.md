# Domain Profile: HRIS / Kepegawaian / Employee Management

**Auto-detection signals:**
- Endpoints: `/employees`, `/payroll`, `/attendance`, `/leave`, `/performance`, `/promotions`
- Keywords: salary, nik, nip, jabatan, gaji, cuti, absensi, kinerja, penilaian

---

## Critical Endpoints (P0 Priority)

### Payroll & Salary
- `/payroll`, `/employees/{id}/salary`, `/salary/calculate`
  - **Test:** IDOR (read other employees' salary data)
  - **Test:** Mass assignment (salary amount, bonus, allowance tampering)
  - **Test:** Salary calculation manipulation (overtime hours, deductions)
  - **Impact:** Confidential data leak, fraud, payroll manipulation

### Employee Records (PII)
- `/employees/{id}`, `/employees/{id}/documents`
  - **Test:** IDOR (access any employee's KTP, NPWP, bank account, address)
  - **Test:** Horizontal privilege escalation (regular employee accessing HR/manager data)
  - **Impact:** Mass PII exposure, identity theft

### Promotion & Job Grade
- `/promotions`, `/employees/{id}/grade`, `/employees/{id}/position`
  - **Test:** Mass assignment (promote self, change job grade/title)
  - **Test:** Approval bypass (self-approve promotion request)
  - **Impact:** Privilege escalation, organizational fraud

### Leave & Attendance
- `/attendance`, `/leave/request`, `/attendance/override`
  - **Test:** Attendance tampering (edit clock-in/out times)
  - **Test:** Leave balance manipulation (infinite leave days)
  - **Test:** Approval bypass (approve own leave, skip manager approval)
  - **Impact:** Fraud, payroll impact

---

## High Priority (P1)

### Performance Reviews
- `/performance/{id}`, `/reviews/submit`
  - **Test:** IDOR (read/modify others' reviews, KPI scores)
  - **Test:** Self-evaluation tampering post-submission
  - **Impact:** Unfair promotions, bonus manipulation

### Organizational Hierarchy
- `/employees/tree`, `/departments/{id}/staff`
  - **Test:** IDOR (enumerate entire org structure, salaries, positions)
  - **Test:** Missing authorization on manager-only views
  - **Impact:** Organizational intelligence leak

### Documents & Contracts
- `/employees/{id}/contract`, `/documents/{id}`
  - **Test:** IDOR (download others' contracts, offer letters, NDA)
  - **Test:** Path traversal in document upload/download
  - **Impact:** Confidential contract leak

### User Roles & Permissions
- `/users/{id}/roles`, `/permissions/assign`
  - **Test:** Mass assignment (grant self HR/admin role)
  - **Test:** Vertical privilege escalation (regular → manager → HR admin)
  - **Impact:** Full system compromise

---

## Medium Priority (P2)

### Search & Reports
- `/employees/search`, `/reports/payroll`, `/reports/attendance`
  - **Test:** SQLi in employee search (name, NIK, department filters)
  - **Test:** Unrestricted report access (non-HR viewing payroll reports)

### Announcements & Internal Comms
- `/announcements`, `/messages`
  - **Test:** Stored XSS in announcements (hits all employees)
  - **Test:** Mass message abuse

---

## Business Logic Code Patterns to Check

1. **Payroll Manipulation**
   - Check whether payroll update handlers bind `base_salary`,
     `overtime_hours`, `bonus` from the client payload without an allow-list
     restricting write access to HR/payroll roles.
   - Check for missing bounds validation on deduction fields (negative
     tax/insurance deduction inflating net pay).
   - Check whether payroll calculation is idempotent/versioned or whether an
     old calculation request could be resubmitted to recompute with stale
     higher values.

2. **Approval Workflow Bypass**
   - Check whether leave/promotion/salary-adjustment approval handlers
     compare the approver's identity against the requester's (blocks
     self-approval).
   - Check whether the status field can be set directly to `approved` by the
     requester's own role, bypassing the manager-approval step in code.
   - Check whether maker-checker is enforced server-side (creator id !=
     approver id) rather than only hidden in the UI.

3. **Attendance Fraud**
   - Check whether clock-in/out timestamps are set server-side (trusted
     clock) or accepted from client input (backdating candidate).
   - Check whether location-based attendance validates the submitted
     coordinates server-side or trusts an unsigned client value.
   - Check whether bulk-edit endpoints for attendance records carry the same
     authorization guard as single-record edits.

4. **Role Escalation Chain**
   - Check whether role-changing handlers (employee->manager,
     manager->HR admin) use an allow-list of who can set which role, and
     whether the mass-assignment pattern from Employee Records/Roles above
     applies at each step of the chain.

5. **Data Exfiltration**
   - Check whether NIK/employee-id lookups are sequential/enumerable and
     whether the endpoint that serves them has authorization scoped to the
     caller's own department/reports.
   - Check whether payroll/employee export (CSV/API) endpoints carry the same
     authorization guard as the interactive views, and whether they're
     paginated with per-page authz rather than allowing an unbounded dump.

---

## Authorization Patterns to Test

- **Object ownership:** employees can only view/edit their own records
- **Hierarchical:** managers see their subordinates only, not peers/superiors
- **Department isolation:** HR sees all, Finance sees payroll, IT sees accounts
- **Approval chain:** leave/promotion needs manager → HR approval (2-step)

---

## Sample High-Impact Findings

- "IDOR allows any employee to view entire organization's salary data" → Critical
- "Mass assignment enables self-promotion to HR Admin role" → Critical
- "Attendance records editable without manager approval" → High
- "Payroll calculation trusts client-supplied overtime hours" → Critical
- "Employee PII (KTP, NPWP, bank account) accessible via predictable IDs" → Critical
- "Leave approval bypass via direct status manipulation" → High