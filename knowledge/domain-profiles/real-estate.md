# Domain Profile: Real Estate / Property Listing & Booking

**Auto-detection signals:**
- Endpoints: `/listings`, `/properties`, `/bookings`, `/reservations`, `/agents`, `/viewings`, `/leases`
- Keywords: listing, property, landlord, tenant, booking, check-in/check-out, commission, deposit

---

## Critical Endpoints (P0 Priority)

### Bookings & Payments
- `/bookings/{id}`, `/bookings/{id}/pay`
  - **Test:** IDOR (view/modify/cancel another user's booking by id)
  - **Test:** Price tampering (client-supplied nightly rate/total instead of
    server-recalculated from the listing + dates)
  - **Test:** Double-booking / date-overlap not enforced server-side
  - **Impact:** Financial loss, booking fraud, guest PII exposure

### Listing Ownership & Management
- `/listings/{id}/edit`, `/listings/{id}/delete`, `/listings/{id}/publish`
  - **Test:** IDOR/BFLA (edit or unpublish another agent/owner's listing)
  - **Test:** Mass assignment (price, availability, "verified"/"featured" flag)
  - **Impact:** Listing sabotage, fraud (fake price manipulation), unfair featured placement

### Payments / Deposits / Payouts
- `/payments/{id}`, `/payouts/{id}`, `/deposits/{id}/refund`
  - **Test:** IDOR (view another user's payment/payout details)
  - **Test:** Refund-amount tampering, or refund issued without a corresponding cancelled booking
  - **Impact:** Direct financial fraud

### Messaging Between Parties
- `/conversations/{id}` (agent/landlord ↔ tenant/buyer)
  - **Test:** IDOR (read another pair's negotiation thread — leaks offer
    amounts, personal contact info, lease terms)

### Identity / Document Verification
- `/verification/documents`, `/agents/{id}/license`
  - **Test:** IDOR (view another user's uploaded ID/proof-of-income documents)
  - **Test:** Verification-status mass assignment (self-mark as "verified agent")

---

## High Priority (P1)

### Viewing / Tour Scheduling
- `/viewings/{id}`
  - **Test:** IDOR (view/cancel another user's scheduled property viewing —
    leaks home address + visitor identity)

### Reviews & Ratings
- `/listings/{id}/reviews`
  - **Test:** IDOR (edit/delete another user's review)
  - **Test:** Review-bombing not rate-limited; fake review from a non-booked account

### Saved Searches / Favorites
- `/favorites`, `/saved-searches`
  - **Test:** IDOR (read another user's saved searches — can reveal PII if
    tied to a name/location search history)

### Lease / Contract Documents
- `/leases/{id}`
  - **Test:** IDOR (download another tenant's signed lease, containing PII
    and financial terms)

---

## Medium Priority (P2)

### Search & Filtering
- `/listings/search`
  - **Test:** SQLi in filters (price range, location, amenities)

### Notifications
- `/notifications`
  - **Test:** IDOR reading another user's booking/price-alert notifications

---

## Business Logic Code Patterns to Check

1. **Price Integrity**
   - Check whether booking-total calculation happens server-side from the
     listing's current price × date range, never trusting a client-supplied
     total/subtotal field.
   - Check whether price changes to a listing after a booking is placed
     don't retroactively affect that booking's already-agreed total.

2. **Availability / Double-Booking**
   - Check whether the booking-create handler performs an atomic
     date-range-overlap check against existing bookings for that listing
     (ideally inside a DB transaction/lock), not a check-then-insert race.

3. **Ownership Scoping**
   - Check whether listing edit/delete/publish handlers verify the caller
     is the listing's owner or an authorized co-agent, not just "any
     authenticated agent account."

4. **Deposit / Refund Logic**
   - Check whether refunds are computed from the cancellation policy and
     booking record server-side, and whether a refund requires a matching
     cancelled/disputed booking state rather than being callable standalone.

5. **Document Access**
   - Check whether uploaded ID/income-verification documents are served
     through an authorization-checked endpoint (owner + relevant
     counterparty only) rather than a predictable static file URL.

---

## Authorization Patterns to Test

- **Listing ownership:** only the listing's agent/owner (or platform admin)
  can edit/unpublish/delete
- **Booking parties:** guest and host/agent can view a booking; no one else
- **Document visibility:** verification documents visible only to the
  uploader and the specific counterparty/admin who needs them for that deal
- **Role hierarchy:** guest/tenant < agent/landlord < platform admin

---

## Sample High-Impact Findings

- "Booking total is accepted from the client, allowing near-zero-cost reservations" → Critical
- "IDOR on `/bookings/{id}` exposes any guest's booking, payment, and contact info" → Critical
- "Listing edit endpoint lacks ownership check — any agent can alter competitors' prices" → Critical
- "Refund endpoint callable without a corresponding cancelled booking" → Critical
- "Lease documents downloadable via sequential id with no tenant/landlord check" → High
- "Viewing-schedule IDOR leaks home addresses and visitor identities" → High
- "Double-booking possible due to non-atomic availability check" → High
- "Verification documents served from a predictable static URL" → High
