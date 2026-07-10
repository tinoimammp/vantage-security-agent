# Domain Profile: Banking / Financial Services / Fintech

**Auto-detection signals:**
- Endpoints: `/accounts`, `/transactions`, `/transfer`, `/balance`, `/cards`, `/loans`, `/investments`
- Keywords: balance, transfer, debit, credit, account_number, swift, iban, amount, currency

---

## Critical Endpoints (P0 Priority)

### Money Transfer
- `/transfer`, `/transactions/create`, `/payments/send`
  - **Test:** Amount manipulation (client-supplied amount, negative amounts)
  - **Test:** Race condition (double-spend, insufficient balance bypass)
  - **Test:** Transaction replay (reuse signed/authorized transaction)
  - **Test:** Currency manipulation (send $1 as USD, receive as cents)
  - **Test:** Rounding errors exploitation (0.001 x 1M transactions)
  - **Impact:** Direct financial theft, fraud at scale

### Account Balance
- `/accounts/{id}/balance`, `/accounts/{id}`
  - **Test:** IDOR (view any account balance, transaction history)
  - **Test:** Balance manipulation via mass assignment
  - **Impact:** Privacy breach, account enumeration, fraud

### Transaction History
- `/transactions`, `/accounts/{id}/transactions`
  - **Test:** IDOR (read other users' transaction history)
  - **Test:** Missing pagination authz (export all transactions)
  - **Test:** SQLi in date/amount filters
  - **Impact:** Financial data leak, PII exposure

### Authentication & Authorization
- `/login`, `/oauth/authorize`, `/mfa/verify`
  - **Test:** Auth bypass, MFA bypass (skip step, OTP reuse)
  - **Test:** Session fixation, token not invalidated on logout
  - **Test:** Account takeover via password reset (token predictability)
  - **Impact:** Full account compromise

### Cards & Payment Methods
- `/cards`, `/cards/{id}`, `/payment-methods`
  - **Test:** IDOR (view/modify others' card details, CVV)
  - **Test:** Card data stored unencrypted or weakly encrypted
  - **Test:** PCI-DSS violations (CVV stored, full PAN exposed)
  - **Impact:** Payment fraud, PCI compliance breach

---

## High Priority (P1)

### Beneficiary / Payee Management
- `/beneficiaries`, `/payees/{id}`
  - **Test:** IDOR (add transfer to attacker's beneficiary list)
  - **Test:** Beneficiary verification bypass
  - **Test:** Mass assignment (trusted/verified flags)

### Loan & Credit Applications
- `/loans/apply`, `/loans/{id}/approve`
  - **Test:** Approval workflow bypass (self-approve loan)
  - **Test:** Amount tampering in loan request
  - **Test:** Credit score manipulation via mass assignment
  - **Impact:** Fraud, financial loss

### Investment & Trading
- `/investments`, `/trades/execute`
  - **Test:** Race condition (buy/sell order timing)
  - **Test:** Price manipulation (client-supplied price)
  - **Test:** Insider trading detection bypass

### Statements & Reports
- `/statements/{id}`, `/accounts/{id}/statement.pdf`
  - **Test:** IDOR (download any account's statements)
  - **Test:** Path traversal in document generation
  - **Impact:** Financial history leak

---

## Medium Priority (P2)

### Profile & KYC Data
- `/users/{id}/kyc`, `/profile`
  - **Test:** IDOR (access others' KYC docs, ID scans, addresses)
  - **Test:** PII leak via verbose responses

### Notifications & Alerts
- `/notifications`, `/alerts/preferences`
  - **Test:** IDOR (read others' transaction alerts)
  - **Test:** Notification tampering (disable fraud alerts)

### Limits & Restrictions
- `/accounts/{id}/limits`
  - **Test:** Transaction limit bypass (remove daily/monthly caps)
  - **Test:** Mass assignment (increase withdrawal limits)

---

## Business Logic Code Patterns to Check

1. **Double-Spend / Race Condition**
   - Check whether the balance-check (read) and debit (write) happen in the
     same DB transaction with a row lock, or as separate non-atomic
     statements — the latter is a race-condition candidate: concurrent
     transfer requests could each pass the check before either writes the debit.

2. **Amount Manipulation**
   - Check for missing sign/bounds validation on the transfer-amount field
     (negative amount reaching the debit/credit logic reversed).
   - Check whether fractional/rounding logic is consistently applied on both
     the debit and credit side of a transfer.
   - Check whether currency conversion is applied consistently (same rate/unit)
     on both sides of a cross-currency transfer.

3. **Transaction Replay**
   - Check whether the transfer handler enforces a nonce/idempotency key so
     the same authorized request can't be resubmitted to execute twice.
   - Check whether OTP/2FA tokens are marked consumed after first use in code.

4. **Rounding & Precision Errors**
   - Check whether balance/amount fields use a fixed-point/integer-cents type
     versus floating point, and whether the debit and credit amounts are
     always computed from the same rounding function.

5. **Approval Workflow Bypass**
   - Check whether high-value transaction handlers enforce maker-checker
     (creator id != approver id) server-side.
   - Check whether loan-approval and transaction-status handlers validate the
     current state before transitioning (e.g., disallow `pending ->
     completed` without an approval record) rather than accepting any
     client-supplied status.

6. **Account Enumeration**
   - Check whether account numbers/ids are sequential and whether the account
     endpoint enforces ownership before returning any data (an IDOR here
     doubles as an enumeration oracle).

---

## Authorization Patterns to Test

- **Account ownership:** user can only view/transfer from own accounts
- **Transaction authorization:** sender must approve, receiver must be valid
- **Maker-checker:** high-value ops need dual approval
- **Role separation:** teller vs manager vs admin privileges
- **Cross-account:** joint accounts, corporate accounts with multiple signers

---

## Regulatory Considerations

- **PCI-DSS:** CVV must not be stored, full PAN must be masked, encryption at rest
- **PSD2 (EU):** Strong Customer Authentication (SCA) for transactions >€30
- **KYC/AML:** verify beneficiary, flag suspicious patterns
- **Audit trail:** all transactions must be logged immutably

---

## Sample High-Impact Findings

- "Race condition allows double-spending on insufficient balance" → Critical
- "IDOR exposes any user's full transaction history and balance" → Critical
- "Transfer amount tampered client-side, server trusts client value" → Critical
- "Negative transfer amount deposits money into sender account" → Critical
- "Transaction replay: reuse signed payload to transfer funds multiple times" → Critical
- "MFA bypass: OTP reused across multiple transactions" → Critical
- "Card CVV and full PAN exposed in API response" → Critical (PCI violation)
- "Self-approve high-value loan via status field manipulation" → Critical
- "Account numbers sequential and predictable (IDOR at scale)" → High
- "Float precision error: $0.009 transfer rounds to $0 but debits $0.009" → High