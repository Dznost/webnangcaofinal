# Reception Role - Reservations & Payment Management

## Overview
This implementation ensures that reception staff only see reservations for their assigned branch and properly integrates with the revenue tracking system.

## Changes Made

### 1. Reception Routes (`/routes/reception.js`)
Added three new endpoints for reservation management:

```javascript
// Reservations (branch-scoped)
router.get("/reservations", receptionController.getReservations)
router.get("/reservations/:id", receptionController.getReservationDetail)
router.post("/reservations/:id/confirm", receptionController.confirmReservation)
```

### 2. Reception Controller (`/controllers/receptionController.js`)

#### A. Get Reservations (Branch-Scoped)
```javascript
exports.getReservations = async (req, res) => {
  // Only shows reservations for the receptionist's assigned branch
  // Filters by status: pending, confirmed, completed
  // Supports search by customer name/phone
}
```

**Key Features:**
- Filters all queries by `branchId` from `req.session.user.branchId`
- Returns 404 if trying to access another branch's reservations
- Status filters: pending (awaiting confirmation), confirmed (paid/processing), completed

#### B. Get Reservation Detail
```javascript
exports.getReservationDetail = async (req, res) => {
  // Displays full reservation information
  // Confirms branch ownership before rendering
  // Shows order items, totals, and payment status
}
```

#### C. Confirm Reservation
```javascript
exports.confirmReservation = async (req, res) => {
  // Updates reservation status from 'pending' to 'confirmed'
  // Creates Payment record for revenue tracking
  // Notifies admin/revenue manager
  // Sends notification for auditing purposes
}
```

**Key Logic:**
```
Reservation Confirmation Flow:
1. Reception staff views pending reservation
2. Confirms it with button click (requires confirmation code)
3. Status changes to 'confirmed'
4. Payment record created with status 'pending' or 'completed'
5. Admin/revenue manager receives notification
6. Revenue dashboard updated automatically
```

### 3. Order Confirmation Updated (`/controllers/receptionController.js`)

The `confirmOrderCompleted` method now handles different payment scenarios:

#### Dine-In Orders
- Payment marked as **PAID** immediately (cash payment at table)
- Table availability restored
- Payment status: `completed`

#### Takeaway Orders (COD - Shipper Payment)
- Payment marked as **UNPAID** (shipper will collect)
- Payment status: `pending`
- Admin receives notification: "Shipper thu tien" (Shipper will collect)
- Revenue manager tracks this for reconciliation

#### Code Flow:
```javascript
if (order.orderType === "dine-in") {
  // Dine-in = immediate payment
  order.paymentStatus = "paid"
  paymentStatus = "completed"
} else if (order.paymentTiming === "cod") {
  // Takeaway with COD = shipper payment
  order.paymentStatus = "unpaid"
  paymentStatus = "pending"
}
```

### 4. Revenue Integration

#### Payment Record Creation
When confirmation happens, a Payment record is created with:

```javascript
const payment = new Payment({
  orderId: order._id,           // Links to order
  reservationId: reservation._id, // For reservations
  userId: user._id,
  amount: totalAmount,
  finalAmount: totalAmount,
  paymentMethod: "cash" || "card",
  status: "completed" || "pending", // Completed for dine-in, pending for COD
  revenueType: "reception" || "delivery",
  branchId: branchId,
  collectedBy: receptionId,
  paidAt: date || null
})
```

#### Revenue Dashboard Updates
The revenue controller (`revenueController.js`) automatically aggregates:

```javascript
// Tracks pending payments (awaiting shipper collection)
const pendingPayments = payments.filter(p => p.status === "pending")

// Tracks completed payments (collected)
const completedPayments = payments.filter(p => p.status === "completed")

// Per-branch breakdown
// Per-receptionist/shipper breakdown
```

### 5. Admin Notifications

When reservations/orders are confirmed, admin receives notifications:

```javascript
// For reservations
const notification = new Notification({
  type: "reservation_confirmed",
  reservationId: reservation._id,
  message: `Le tan ... xac nhan dat ban cho ... - 500000d`,
  category: "reservation"
})

// For COD orders
const notification = new Notification({
  type: "order_cod_pending",
  message: `Don hang giao tại nhà #ABC123 cho Khach hang - 300000d (Shipper thu tien)`,
  category: "payment"
})
```

## User Flow

### Reception Staff - Confirming a Reservation
1. Navigate to `/reception/reservations`
2. See only reservations for their branch
3. Click on a pending reservation
4. Review details (customer, date, items, total)
5. Click "Xac Nhan Dat Ban" button
6. System creates payment record
7. Admin receives notification
8. Revenue dashboard updated

### Reception Staff - Confirming a Dine-In Order
1. Navigate to `/reception/orders`
2. See only dine-in orders for their branch
3. Click on a processing order
4. Click "Xac Nhan Hoan Thanh"
5. System marks as PAID (cash payment)
6. Revenue marked as COMPLETED
7. Table availability restored

### Reception Staff - Confirming a Takeaway Order (COD)
1. Navigate to `/reception/orders`
2. See takeaway orders with payment timing "cod"
3. Confirm order completion
4. System marks payment as PENDING
5. Admin notified: "Shipper will collect payment"
6. Revenue marked as PENDING
7. When shipper confirms payment → Revenue marked COMPLETED

### Admin/Revenue Manager
- Views `/admin/revenue` dashboard
- Sees pending payments awaiting shipper collection
- Sees completed payments from receptionists
- Can filter by branch, staff, date range
- Reconciles actual collections vs. pending

## Database Schema Changes

### Payment Model Fields (Relevant)
- `status`: "pending" | "completed" — Pending = awaiting collection
- `paymentMethod`: "cash" | "card"
- `revenueType`: "reception" | "delivery"
- `collectedBy`: Reference to User (reception staff or shipper)
- `paidAt`: Date when payment was received
- `orderId`: Links to Order for tracking
- `reservationId`: Links to Reservation for booking tracking

### Order Model Fields (Relevant)
- `paymentTiming`: "prepaid" | "cod"
- `paymentStatus`: "unpaid" | "paid"
- `orderType`: "dine-in" | "takeaway"
- `confirmedBy`: Who confirmed the order
- `confirmedAt`: When it was confirmed

### Reservation Model Fields (Relevant)
- `status`: "pending" → "confirmed" → "completed"
- `paymentStatus`: "unpaid" | "paid"
- `totalAmount`: Full amount due (deposit + food after discount)

## Business Logic Summary

### Order Payment Logic
| Order Type | Payment Timing | Status After Confirm | Revenue Status | Notes |
|---|---|---|---|---|
| Dine-in | COD | paid | completed | Cash payment at table |
| Takeaway | Prepaid | paid | completed | Online payment done |
| Takeaway | COD | unpaid | pending | Shipper collects payment |

### When Reception Confirms
1. Order status → `completed`
2. Payment status determined by order type
3. Payment record created with appropriate status
4. Admin notified for pending payments
5. Revenue dashboard updated in real-time

## Testing Checklist

- [ ] Reception can only see reservations for their branch
- [ ] Confirmation creates Payment record
- [ ] Revenue dashboard shows pending payments
- [ ] Dine-in orders marked as completed (paid)
- [ ] COD orders marked as pending (awaiting shipper)
- [ ] Admin receives notifications
- [ ] Revenue breakdown by branch/staff is accurate
- [ ] Revenue reconciliation possible (pending vs completed)

## Files Changed
1. `/routes/reception.js` — Added 3 new routes
2. `/controllers/receptionController.js` — Added 3 methods + updated confirmOrderCompleted
3. `/views/reception/reservations/index.ejs` — New reservation list view
4. `/views/reception/reservations/detail.ejs` — New reservation detail view

## Next Steps
1. Test reception staff can only access their branch data
2. Verify Payment records created on confirmation
3. Check admin notifications appear
4. Validate revenue dashboard aggregation
5. Test shipper payment collection flow
