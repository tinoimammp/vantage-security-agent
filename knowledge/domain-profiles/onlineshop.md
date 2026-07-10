# Domain Profile: E-Commerce / Online Shop

**Auto-detection signals:**
- Endpoints: `/cart`, `/checkout`, `/payment`, `/orders`, `/products`, `/coupons`
- Keywords: price, quantity, shipping, discount, inventory, SKU, payment_method

---

## Critical Endpoints (P0 Priority)

### Payment & Pricing
- `/checkout`, `/payment/process`, `/orders/create`
  - **Test:** Price manipulation (client-supplied price, negative qty, tampered total)
  - **Test:** Race conditions (double-spend, coupon reuse, inventory bypass)
  - **Test:** Payment bypass (skip payment step, force order status to 'paid')
  - **Impact:** Direct financial loss, fraud

### Coupons & Discounts
- `/coupons/apply`, `/cart/discount`
  - **Test:** Coupon stacking, reuse of single-use codes, brute-force codes
  - **Test:** Apply expired/invalid coupons post-checkout
  - **Impact:** Revenue loss

### Order Management
- `/orders/{id}`, `/orders/{id}/invoice`, `/orders/{id}/status`
  - **Test:** IDOR (read/modify other users' orders, download invoices)
  - **Test:** Status manipulation (cancel/refund completed orders, force shipment)
  - **Impact:** PII exposure, fraud, inventory loss

### Inventory & Stock
- `/products/{id}/stock`, `/cart/add`
  - **Test:** Negative stock bypass, overselling, race on last item
  - **Impact:** Inventory discrepancies

---

## High Priority (P1)

### User Accounts
- `/users/{id}`, `/profile/update`
  - **Test:** IDOR, horizontal privilege escalation, loyalty points tampering
  - **Test:** Mass assignment (role, balance, verified, vip_status)

### Reviews & Ratings
- `/products/{id}/reviews`
  - **Test:** Stored XSS in review text/title
  - **Test:** Review manipulation (rate without purchase, delete others' reviews)

### Wishlist & Saved Items
- `/wishlist`, `/cart`
  - **Test:** IDOR (read others' wishlists/carts, price/product leakage)

---

## Medium Priority (P2)

### Search & Filters
- `/products/search`, `/products?category=`
  - **Test:** SQLi in search/sort/filter params
  - **Test:** XSS in search query reflection

### Address & Shipping
- `/addresses`, `/shipping/calculate`
  - **Test:** IDOR on addresses, SSRF via shipping webhook/callback URLs

---

## Business Logic Code Patterns to Check

1. **Price Manipulation**
   - Check whether the checkout/order handler reads `price`/`quantity`/
     `discount_percent` from the client payload and uses it directly, versus
     recomputing the total server-side from the product/DB record.
   - Check for missing bounds validation (negative quantity, overflow-prone
     total calculation).

2. **Coupon Abuse**
   - Check whether coupon redemption's check-then-act (validate, then mark
     used) is wrapped in a transaction/unique constraint (race condition
     candidate if not).
   - Check whether stacking rules are enforced server-side.
   - Check coupon-code generation/validation for weak entropy or missing
     rate-limit on the redemption endpoint — do not attempt to guess codes.

3. **Workflow Bypass**
   - Check whether the order-confirm handler verifies payment actually
     completed (server-side state), or trusts a client-supplied flag that
     lets the payment step be skipped.
   - Check whether payment tokens are marked single-use in code.
   - Check whether order-status transitions are guarded by a state machine
     (e.g., disallow `pending -> shipped` without `paid` in between) rather
     than accepting any client-supplied status.

4. **Inventory Exploits**
   - Check whether stock/availability validation happens only in frontend UI
     versus also in the server-side add-to-cart/purchase handler.
   - Check whether the stock-decrement operation is atomic (transaction/row
     lock) — a non-atomic check-then-decrement is a race condition candidate.

5. **Refund/Return Fraud**
   - Check whether the refund handler verifies the order was actually
     purchased by the requester and that its current state allows a refund.
   - Check whether refund issuance has an idempotency guard preventing the
     same order from being refunded twice.

---

## Authorization Patterns to Test

- **Object ownership:** orders, carts, addresses, payment methods, wishlist
- **Tenant isolation:** in multi-vendor marketplaces (vendor A accessing vendor B's data)
- **Guest vs authenticated:** price differences, inventory visibility

---

## Sample High-Impact Findings

- "Any user can modify any order total by tampering checkout payload" → Critical
- "IDOR allows reading any customer's order history and PII" → Critical
- "Coupon code 'SAVE50' reusable via race condition" → High
- "Price supplied client-side without server validation" → Critical
- "Negative quantity in cart adds credit to account balance" → Critical