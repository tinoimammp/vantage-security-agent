# Domain Profile: LMS / E-Learning / Online Course Platform

**Auto-detection signals:**
- Endpoints: `/courses`, `/lessons`, `/quizzes`, `/grades`, `/assignments`, `/enrollments`, `/certificates`
- Keywords: enroll, grade, quiz, assignment, submission, score, certificate, instructor, student

---

## Critical Endpoints (P0 Priority)

### Grade Tampering
- `/grades/{id}`, `/assignments/{id}/grade`, `/quizzes/{id}/score`
  - **Test:** IDOR (edit own or others' grades)
  - **Test:** Mass assignment (score, max_score, passed fields)
  - **Test:** Grade calculation bypass (client-supplied final grade)
  - **Impact:** Academic fraud, certificate fraud

### Quiz & Exam
- `/quizzes/{id}/submit`, `/quizzes/{id}/answers`
  - **Test:** Answer key exposure (API leaks correct answers)
  - **Test:** Time limit bypass (submit after deadline)
  - **Test:** Multiple submission (retake quiz until correct)
  - **Test:** IDOR (view others' quiz answers)
  - **Impact:** Cheating at scale

### Enrollment & Access Control
- `/courses/{id}/enroll`, `/courses/{id}/content`
  - **Test:** Paid course access without payment
  - **Test:** Enrollment bypass (access without enrolling)
  - **Test:** IDOR (access any course content regardless of enrollment)
  - **Impact:** Revenue loss, unauthorized access

### Certificates
- `/certificates/{id}`, `/courses/{id}/certificate`
  - **Test:** IDOR (generate/download others' certificates)
  - **Test:** Certificate forgery (tamper name, course, grade)
  - **Test:** Certificate issuance without course completion
  - **Impact:** Credential fraud

### Instructor/Admin Privilege
- `/users/{id}/role`, `/courses/{id}/instructors`
  - **Test:** Mass assignment (student → instructor → admin)
  - **Test:** IDOR (assign self as instructor to any course)
  - **Test:** BFLA (student calling instructor-only endpoints)
  - **Impact:** Platform takeover, grade tampering at scale

---

## High Priority (P1)

### Assignment Submission
- `/assignments/{id}/submit`, `/submissions/{id}`
  - **Test:** IDOR (view/edit others' submissions)
  - **Test:** Late submission bypass (tamper timestamp)
  - **Test:** File upload → RCE (executable in submission)
  - **Test:** Stored XSS in submission feedback (hits instructor)
  - **Impact:** Cheating, XSS, RCE

### Course Content
- `/courses/{id}/lessons`, `/lessons/{id}/video`
  - **Test:** IDOR (access premium/locked content without payment)
  - **Test:** Direct video URL exposure (bypass paywall)
  - **Test:** Content download without DRM/authorization
  - **Impact:** Content piracy, revenue loss

### Discussion Forums
- `/courses/{id}/discussions`, `/posts/{id}`
  - **Test:** Stored XSS in forum posts (hits all course students)
  - **Test:** IDOR (delete/edit others' posts)
  - **Test:** Privilege escalation (post as instructor)

### User Profiles
- `/users/{id}`, `/users/{id}/achievements`
  - **Test:** IDOR (view/edit others' profiles, emails, progress)
  - **Test:** Mass assignment (verified, instructor, badges)

---

## Medium Priority (P2)

### Progress Tracking
- `/courses/{id}/progress`, `/lessons/{id}/complete`
  - **Test:** Progress manipulation (mark all lessons complete)
  - **Test:** Time-on-task bypass (fast-forward video completion)

### Search & Filtering
- `/courses/search`, `/users/search`
  - **Test:** SQLi in search/filter params
  - **Test:** User enumeration via search

### Notifications
- `/notifications`
  - **Test:** IDOR (read others' notifications, grade alerts)
  - **Test:** Stored XSS in notification messages

---

## Business Logic Code Patterns to Check

1. **Grade Tampering**
   - Check whether the grade-update handler verifies the caller is the
     course's instructor (not the student themself) before writing
     `score`/`max_score`/`passed`, and whether those fields are bound via
     allow-list.
   - Check whether quiz-attempt code enforces a max-attempts limit
     server-side, not just recording the highest score client-side.

2. **Enrollment Bypass**
   - Check whether the course-content handler verifies an active enrollment
     record before serving content, independent of any frontend gating.
   - Check whether refund handlers revoke the enrollment/access record.
   - Check whether the enrollment handler ties the payment token to the
     authenticated user, not a client-supplied user id.

3. **Quiz Cheating**
   - Check whether the quiz API response includes `correct_answers[]` before
     or independent of submission — the answer key should never be in a
     pre-submission response payload (trace the serializer).
   - Check whether the time limit is enforced server-side (submission
     timestamp vs start timestamp) rather than only via a frontend JS timer.
   - Check whether the submission-view endpoint scopes results to the
     caller's own submission, preventing early access to others' answers.
   - Check whether the submission is locked (read-only) server-side once
     graded/answers are revealed.

4. **Certificate Fraud**
   - Check whether the certificate-download handler verifies ownership
     before generating/serving a certificate for a given student id.
   - Check whether certificate generation reads the completion status from
     the DB record versus a client-supplied parameter.

5. **Privilege Escalation**
   - Check role-assignment handlers (student->instructor->admin) for an
     allow-list restricted to admin-only callers — see the Mass Assignment
     pattern in `${CLAUDE_PLUGIN_ROOT}/agents/web/api-agent.md`.

6. **Content Piracy**
   - Check whether video/content URLs require an authenticated,
     per-request signed URL versus a static shareable link.
   - Check whether lesson-content endpoints enforce the same enrollment
     check as the course-content handler above, endpoint by endpoint.

---

## Authorization Patterns to Test

- **Enrollment-based access:** only enrolled students see course content
- **Payment-based access:** free vs paid courses, subscription tiers
- **Lesson progression:** must complete Lesson 1 before accessing Lesson 2
- **Role hierarchy:** student < instructor < admin (per-course roles)
- **Submission ownership:** students see only their own submissions
- **Grade visibility:** students see own grades, instructors see all in their courses

---

## Sample High-Impact Findings

- "IDOR allows students to edit their own final grades" → Critical
- "Quiz API exposes correct answers before submission" → Critical
- "Paid course content accessible without enrollment or payment" → Critical
- "Mass assignment enables student → instructor privilege escalation" → Critical
- "IDOR on certificates allows forging credentials with any name/grade" → Critical
- "Assignment file upload accepts PHP → RCE on server" → Critical
- "Time limit on quiz enforced client-side only (JS timer)" → High
- "IDOR allows viewing all students' quiz submissions before taking quiz" → High
- "Late submission bypass via timestamp tampering" → High
- "Video URLs not authenticated, can be shared publicly" → High
- "Progress tracking trusts client (mark lessons complete without watching)" → Medium