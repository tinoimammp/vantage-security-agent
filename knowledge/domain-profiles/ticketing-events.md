# Domain Profile: Ticketing / Events Platform

**Auto-detection signals:**
- Endpoints: `/events`, `/tickets`, `/bookings`, `/seats`, `/check-in`, `/qr`, `/refunds`, `/organizers`
- Keywords: ticket, seat, venue, QR code, check-in, e-ticket, box office, organizer, refund/exchange

---

## Critical Endpoints (P0 Priority)

### Ticket Ownership & QR Codes
- `/tickets/{id}`, `/tickets/{id}/qr`
  - **Test:** IDOR (view/download another user's ticket and its QR/barcode —
    enables ticket theft: check in using someone else's valid ticket)
  - **Test:** QR/ticket code predictable or sequential (not a signed/random token)
  - **Impact:** Ticket fraud/theft, unauthorized event entry, revenue loss via cloned tickets

### Checkout / Payment
- `/checkout/{id}`, `/orders/{id}/pay`
  - **Test:** Price tampering (client-supplied ticket price/quantity instead
    of server-recalculated from the event's tier pricing)
  - **Test:** Quantity-limit bypass (buy more than the per-user cap on
    limited/high-demand tickets)
  - **Impact:** Revenue loss, scalping enablement, unfair access to limited tickets

### Check-In / Scanning
- `/check-in/{ticket_id}`
  - **Test:** Re-entry/reuse not prevented (same ticket scanned "valid"
    multiple times instead of being marked used atomically)
  - **Test:** BFLA (non-staff account able to call the check-in endpoint)
  - **Impact:** Venue capacity/safety risk, revenue loss from duplicate entries

### Refunds / Exchanges
- `/refunds/{id}`, `/tickets/{id}/transfer`
  - **Test:** IDOR (request a refund for another user's ticket)
  - **Test:** Refund-amount tampering; refund without a corresponding valid cancellation
  - **Test:** Ticket-transfer completing without the original owner's confirmation
  - **Impact:** Financial fraud, ticket theft via forced transfer

### Organizer / Event Management
- `/events/{id}/edit`, `/organizers/{id}/payouts`
  - **Test:** IDOR/BFLA (edit another organizer's event, or view their payout/revenue data)
  - **Impact:** Competitive sabotage, financial data leak

---

## High Priority (P1)

### Seat Selection
- `/events/{id}/seats`
  - **Test:** Race condition on seat reservation (two users assigned the
    same seat due to non-atomic hold-then-confirm)
  - **Test:** Reserved-seat status tampering (mark any seat as available/held via client request)

### Guest List / Attendee Data
- `/events/{id}/attendees`
  - **Test:** IDOR/BFLA (non-organizer viewing the full attendee list — PII
    of everyone who bought a ticket)

### Promo Codes / Discounts
- `/promo/validate`
  - **Test:** Reusable beyond intended limit; stacking multiple codes when only one should apply

### Waitlist
- `/events/{id}/waitlist`
  - **Test:** IDOR (view/manipulate another user's waitlist position)

---

## Medium Priority (P2)

### Reviews / Event Ratings
- `/events/{id}/reviews`
  - **Test:** Review from an account that never held a valid ticket (fake review)

### Notifications
- `/notifications`
  - **Test:** IDOR reading another user's purchase/event notifications

---

## Business Logic Code Patterns to Check

1. **Ticket Validity & Single-Use Enforcement (the core control in this domain)**
   - Check whether check-in marks the ticket "used" atomically (DB
     transaction/lock) at scan time, and whether every subsequent scan
     attempt of the same ticket id is rejected — this is the highest-yield
     check in this domain, since a race here directly enables duplicate
     entry.
   - Check whether the QR/ticket code is a signed or cryptographically
     random token tied server-side to the specific ticket record, not a
     predictable sequential id.

2. **Pricing & Quantity Integrity**
   - Check whether the checkout handler recalculates the total server-side
     from the event's current tier pricing and applies the per-user
     quantity cap at the database level (not just a client-side form limit).

3. **Seat Reservation Race Conditions**
   - Check whether seat-hold-then-purchase is implemented as an atomic
     operation (e.g. a unique constraint or row lock on seat+event), rather
     than a check-then-write pattern vulnerable to concurrent requests.

4. **Refund/Transfer Authorization**
   - Check whether refund/transfer handlers verify the caller owns the
     ticket and that a transfer requires an explicit acceptance step from
     the recipient, not a one-sided completion.

5. **Organizer Scoping**
   - Check whether event-management and payout endpoints verify the caller
     is the event's organizer (or a platform admin), not just "any
     authenticated organizer-role account."

---

## Authorization Patterns to Test

- **Ticket ownership:** only the buyer (or an explicitly-completed transfer
  recipient) can view/use a given ticket
- **Check-in role:** only venue staff/scanner accounts for that specific
  event, not any authenticated user
- **Organizer scoping:** an organizer manages only their own events/payouts
- **Attendee-list confidentiality:** visible only to the event's organizer/staff

---

## Sample High-Impact Findings

- "Ticket QR codes are sequential integers, enabling ticket cloning/theft" → Critical
- "Same ticket can be scanned valid multiple times due to non-atomic check-in" → Critical
- "Checkout accepts client-supplied ticket price, enabling near-free purchases" → Critical
- "Refund endpoint has no ownership check, allowing refunds on others' tickets" → Critical
- "Per-user ticket quantity cap enforced client-side only, enabling scalping" → High
- "Seat-hold race condition allows two buyers to be assigned the same seat" → High
- "Attendee list endpoint callable by any authenticated user, not just the organizer" → High
- "Ticket transfer completes without recipient confirmation, enabling forced transfer fraud" → High
