# Domain Profile: Logistics / Ride-Hailing / Delivery

**Auto-detection signals:**
- Endpoints: `/trips`, `/rides`, `/deliveries`, `/drivers`, `/couriers`, `/tracking`, `/fare`, `/orders/{id}/status`
- Keywords: pickup, dropoff, ETA, fare, driver, courier, geolocation/coordinates, proof-of-delivery, rating

---

## Critical Endpoints (P0 Priority)

### Live Location & Tracking
- `/trips/{id}/location`, `/tracking/{id}`
  - **Test:** IDOR (track another user's live trip/delivery location by id —
    reveals real-time physical whereabouts of driver and/or passenger)
  - **Test:** Location-sharing token not expiring after trip completion
  - **Impact:** Real-time physical safety risk — stalking, robbery targeting

### Fare / Pricing
- `/trips/{id}/fare`, `/fare/estimate`
  - **Test:** Client-supplied fare/distance instead of server-recalculated
    from actual GPS trace or route
  - **Test:** Surge-pricing multiplier tampering
  - **Impact:** Revenue loss, fraud at scale

### Trip / Order Details
- `/trips/{id}`, `/orders/{id}`
  - **Test:** IDOR (view another user's trip/order: pickup/dropoff address,
    payment method, phone number, driver identity)
  - **Impact:** PII exposure, physical-safety risk (home/work address leak)

### Driver/Courier Identity & Documents
- `/drivers/{id}/documents`, `/drivers/{id}/verification`
  - **Test:** IDOR (view another driver's license, vehicle registration, background-check status)
  - **Test:** Verification-status mass assignment (self-mark as "verified"/"background-checked")
  - **Impact:** Unvetted drivers reaching passengers — direct safety risk

### Payments & Payouts
- `/payments/{id}`, `/driver-payouts/{id}`
  - **Test:** IDOR (view another user's payment method or driver's payout/earnings)
  - **Test:** Fare/tip amount tampering after trip completion

---

## High Priority (P1)

### Ratings & Feedback
- `/trips/{id}/rate`
  - **Test:** IDOR (submit a rating for a trip you weren't part of)
  - **Test:** Rating manipulation (rate own trips from a second account to inflate average)

### Chat Between Rider and Driver
- `/trips/{id}/chat`
  - **Test:** IDOR (read another trip's in-app chat — may contain address/phone details)

### Promo Codes / Wallet Credits
- `/promo/apply`, `/wallet/balance`
  - **Test:** Promo-code abuse (reusable/unlimited stacking; server doesn't
    check per-user usage limit)
  - **Test:** IDOR (view/transfer another user's wallet balance)

### Order/Delivery Status Updates
- `/orders/{id}/status`
  - **Test:** BFLA (customer account marking their own order "delivered"/"paid" without the courier's action)

---

## Medium Priority (P2)

### Search / Nearby Drivers
- `/drivers/nearby`
  - **Test:** Excess precision/PII in nearby-driver responses (exact home address instead of approximate location when idle)

### Support / Dispute Tickets
- `/support/tickets/{id}`
  - **Test:** IDOR reading another user's support ticket (may contain trip PII)

---

## Business Logic Code Patterns to Check

1. **Fare Integrity**
   - Check whether the final fare is computed server-side from the actual
     recorded route/distance/duration and current pricing rules, never
     accepted as a client-supplied total at trip completion.
   - Check whether surge multipliers are read from a server-controlled
     pricing service, not a client-supplied field.

2. **Location Access Scoping**
   - Check whether live-location endpoints verify the caller is either the
     trip's rider, the assigned driver, or an authorized emergency-share
     contact for that specific trip id — and that access is revoked the
     moment the trip ends (not indefinitely valid).

3. **Trip/Order Party Authorization**
   - Check whether trip-detail, chat, and rating endpoints all independently
     verify caller-is-a-party-to-this-trip, since these are commonly
     implemented as separate handlers that can drift out of sync.

4. **Promo/Wallet Abuse Prevention**
   - Check whether promo-code redemption enforces a per-user usage count
     server-side (not just a global code-validity flag), and whether wallet
     credit transfers require ownership + sufficient-balance checks atomically.

5. **Driver Verification Gate**
   - Check whether the matching/dispatch algorithm excludes drivers whose
     verification/background-check status is not "approved" — trace where
     that status is read and whether it can be client-influenced.

---

## Authorization Patterns to Test

- **Trip party scoping:** only the rider and assigned driver (and support
  staff, audited) can access trip details/location/chat
- **Time-bound location sharing:** expires immediately at trip completion
- **Role hierarchy:** rider/customer < driver/courier < support < admin
- **Payout ownership:** a driver sees only their own earnings/payout history

---

## Sample High-Impact Findings

- "IDOR on `/tracking/{id}` allows tracking any active trip's live GPS location" → Critical
- "Fare accepted from client at checkout, enabling near-zero-cost rides" → Critical
- "Trip details IDOR exposes pickup/dropoff address and rider phone number" → Critical
- "Driver verification status settable by the driver's own account (mass assignment)" → Critical
- "Location-sharing link remains valid and trackable after trip completion" → High
- "Promo code has no per-user redemption limit, redeemable unlimited times" → High
- "Order-status endpoint lets the customer self-mark delivery as complete before it happens" → High
- "In-trip chat readable by IDOR, exposing addresses shared during the trip" → High
