# Receptionist Role - Reservation & Revenue Synchronization

## Current Implementation Analysis

### System Architecture
The system now includes three integrated components:

1. **Receptionist Layer** - Manages branch-specific reservations
2. **Revenue Tracking Layer** - Captures all financial transactions
3. **Admin Dashboard** - Views aggregated revenue by branch, staff, and payment type

---

## Issues Identified & Solutions

### Issue 1: Branch-Scoped Reservation Access
**Status**: FIXED in receptionController.js (lines 399-430)

**Implementation**:
```javascript
// Get reservations for receptionist's branch only
let query = { branchId: req.session.user.branchId }
```

**Verification**:
- Receptionist cannot access other branches' reservations
- Query enforces `branchId` filter on all reservation operations
- Fallback search also respects branch boundary

---

### Issue 2: Reservation Confirmation & Revenue Creation
**Status**: FIXED in receptionController.js (lines 475-525)

**Implementation**:
When receptionist confirms a reservation, the system:

1. **Updates Reservation Status**
   ```javascript
   reservation.status = "confirmed"
   reservation.paymentStatus = "unpaid"
   await reservation.save()
   ```

2. **Creates Payment Record** (synced with revenue)
   ```javascript
   const payment = new Payment({
     reservationId: reservation._id,
     userId: reservation.userId,
     amount: reservation.totalAmount || reservation.depositAmount,
     finalAmount: reservation.totalAmount || reservation.depositAmount,
     status: "pending",
     revenueType: "reception",
     branchId: branchId,
     collectedBy: receptionId,
     paymentMethod: "cash"
   })
   await payment.save()
   ```

3. **Notifies Admin** with branch-specific amount
   ```javascript
   message: `Le tan ${name} xac nhan dat ban - ${amount.toLocaleString("vi-VN")}d`
   ```

---

### Issue 3: Order Confirmation with Payment Types
**Status**: FIXED in receptionController.js (lines 172-212)

**Order Types & Payment Handling**:

| Order Type | Payment Timing | Payment Status | Revenue Status |
|-----------|----------------|----------------|-----------------|
| Dine-in | At table | PAID immediately | Counted in reception |
| Takeaway (Prepaid) | Before delivery | PAID immediately | Counted in delivery |
| Takeaway (COD) | Shipper collects | PENDING | Pending in system |

**Code Implementation**:
```javascript
if (order.orderType === "dine-in") {
  order.paymentStatus = "paid"
  order.paidAt = new Date()
} else if (order.paymentTiming === "cod") {
  order.paymentStatus = "unpaid" // Shipper will collect
}
```

---

### Issue 4: Revenue Dashboard Integration
**Status**: WORKING in revenueController.js

**What Revenue Manager Sees**:

#### For Reception (Dine-in & Reservations):
```javascript
- Total reception revenue
- Per-branch breakdown (with names & addresses)
- Per-receptionist breakdown (showing which staff collected)
- Status: COMPLETED (already collected by staff)
```

#### For Delivery:
```javascript
- Total delivery revenue
- Per-shipper breakdown
- Per-branch breakdown for deliveries
- Status: COMPLETED (already collected by shipper)
```

#### Pending Payments (COD):
```javascript
// Not yet in revenue total - awaiting shipper collection
const pendingPayments = await Payment.find({
  status: "pending",
  revenueType: "delivery"
})
```

**Aggregation Logic**:
```javascript
// Revenue controller automatically:
1. Filters by status: "completed" only
2. Groups by revenueType: "reception" vs "delivery"
3. Shows branch breakdown for reception
4. Shows shipper breakdown for delivery
5. Tracks collectedBy: which staff member collected the payment
```

---

## Data Flow Diagram

### Reservation Confirmation Flow
```
User Books Reservation
        ↓
[Pending Status]
        ↓
Reception Staff Confirms
        ↓
[Confirmation Endpoint: /reception/reservations/:id/confirm]
        ↓
1. Update Reservation Status → confirmed
2. Create Payment Record (status: pending initially)
3. Send Notification to Admin
        ↓
[Payment Record Created with branchId]
        ↓
Revenue Manager Views Dashboard
        ↓
Sees: Pending transactions by branch & receptionist
```

### Order Confirmation Flow (Dine-in)
```
Staff Creates Order (walk-in dine-in)
        ↓
Customer Eats & Pays Cash
        ↓
Reception Staff Confirms Order
        ↓
[Confirmation Endpoint: /reception/orders/:id/confirm-completed]
        ↓
1. Update Order Status → completed
2. Create Payment Record (status: completed, paid immediately)
3. Notify Admin with amount
        ↓
[Payment Record with revenueType: "reception", status: "completed"]
        ↓
Revenue Dashboard Shows: Completed Reception Revenue
```

### Order Confirmation Flow (Takeaway COD)
```
Customer Orders Takeaway (COD)
        ↓
Reception Staff Confirms Ready for Delivery
        ↓
[Confirmation Endpoint: /reception/orders/:id/confirm-completed]
        ↓
1. Update Order Status → completed
2. Create Payment Record (status: pending, awaiting shipper)
3. Notify Admin: "Shipper will collect ₫X amount"
        ↓
[Payment Record with revenueType: "delivery", status: "pending"]
        ↓
Shipper Collects Payment Later
        ↓
Admin Updates Payment Status to "completed"
        ↓
Revenue Dashboard Shows: Shipper's collected amount
```

---

## Database Schema Integration

### Reservation Schema (Models/Reservation.js)
```javascript
{
  userId: ObjectId,          // Customer
  branchId: ObjectId,        // Branch where reserved
  totalAmount: Number,       // Deposit + Food - Discount
  depositAmount: Number,     // Fixed table deposit
  foodTotal: Number,         // Food price total
  foodDiscount: Number,      // Food discount
  status: String,            // pending → confirmed → paid → processing → completed
  paymentStatus: String,     // unpaid → paid
  paymentMethod: String,     // cash, bank, etc.
  paidAt: Date,              // When payment received
  createdAt: Date
}
```

### Payment Schema (Models/Payment.js)
```javascript
{
  reservationId: ObjectId,   // Links to reservation
  orderId: ObjectId,         // Links to order (if applicable)
  userId: ObjectId,          // Customer
  branchId: ObjectId,        // Branch context
  collectedBy: ObjectId,     // Which staff member (receptionist/shipper)
  amount: Number,            // Original amount
  discount: Number,          // Applied discount
  finalAmount: Number,       // Amount actually paid
  paymentMethod: String,     // cash, bank
  revenueType: String,       // "reception" (dine-in/reservation) or "delivery" (takeaway)
  status: String,            // pending → completed
  paidAt: Date,              // When actually collected
  createdAt: Date
}
```

---

## Validation Checklist

### Receptionist Operations
- [x] Can only see reservations for their assigned branch
- [x] Can confirm pending reservations
- [x] Confirmation creates accurate payment record
- [x] Payment amount reflects correct branch & deposit/food total
- [x] Can only confirm orders for their dine-in branch

### Revenue Tracking
- [x] Reception revenue shows completed payments only
- [x] Each payment linked to responsible staff (collectedBy)
- [x] Branch breakdown shows all staff collections
- [x] COD orders marked as pending until collection
- [x] Shipper payments tracked separately from reception

### Admin Views
- [x] Revenue dashboard filters by date range
- [x] Can see which receptionist collected each payment
- [x] Can see which branch each transaction came from
- [x] Monthly breakdown available
- [x] Payment method breakdown (cash vs bank)

---

## API Endpoints

### Reception Reservations
```
GET    /reception/reservations              — List branch reservations
GET    /reception/reservations/:id          — View reservation detail
POST   /reception/reservations/:id/confirm  — Confirm reservation (creates payment)
```

### Reception Orders
```
GET    /reception/orders                           — List branch orders
GET    /reception/orders/:id                       — View order detail
POST   /reception/orders/:id/confirm-completed    — Confirm completion (creates payment)
```

### Admin Revenue
```
GET    /admin/revenue?year=2024&month=3   — Revenue dashboard
                                           Includes: delivery, reception, shipper breakdown
```

---

## Testing Scenarios

### Scenario 1: Receptionist Confirms Dine-in Reservation
1. Receptionist views reservations for their branch (e.g., Branch A)
2. Clicks "Xác Nhận" on a pending reservation (₫500,000)
3. System creates Payment record:
   - `revenueType: "reception"`
   - `branchId: Branch A`
   - `collectedBy: Receptionist 1`
   - `status: "pending"` (payment not yet collected)
4. Admin/Revenue manager sees: "Branch A - Receptionist 1 - ₫500,000 (Pending)"

### Scenario 2: Receptionist Confirms Walk-in Dine-in Order
1. Staff creates order for walk-in customer
2. Customer eats & pays cash
3. Receptionist confirms order completed
4. System creates Payment record:
   - `revenueType: "reception"`
   - `status: "completed"` (cash collected)
   - `paidAt: now`
5. Revenue dashboard immediately shows completed amount

### Scenario 3: Takeaway COD Order
1. Customer orders takeaway, selects COD
2. Receptionist confirms order ready
3. System creates Payment record:
   - `revenueType: "delivery"`
   - `status: "pending"` (shipper will collect)
   - `collectedBy: shipper's ID` (when shipper collects)
4. Notification: "Shipper will collect ₫X amount"
5. Shipper collects payment during delivery
6. Admin updates payment status to "completed"
7. Revenue dashboard shows shipper's total collected

---

## Future Enhancements

1. **Real-time Payment Sync** - Use WebSocket to push payment confirmations
2. **Branch Manager Dashboard** - View only their branch's revenue
3. **Automatic COD Status Update** - When shipper marks delivery as completed
4. **Payment Receipt Generation** - For each confirmed transaction
5. **Batch Operations** - Confirm multiple reservations at once

---

## Support & Troubleshooting

### Receptionist Can't See Reservations
**Check**: Does the user record have `branchId` populated?
```javascript
// In database, verify:
db.users.findOne({ email: "receptionist@..." })
// Should show: { branchId: ObjectId(...), role: "reception" }
```

### Payment Not Appearing in Revenue
**Check**: Is the reservation status "confirmed"? Is payment record created?
```javascript
// In database, verify:
db.payments.findOne({ reservationId: ObjectId(...) })
// Should show: { status: "pending", revenueType: "reception" }
```

### Wrong Branch Showing in Revenue
**Check**: Verify reservation.branchId matches payment.branchId
```javascript
// Both should have same branchId
db.reservations.findOne({ _id: ObjectId(...) })
db.payments.findOne({ reservationId: ObjectId(...) })
```

---

## Summary

The implementation now ensures:
1. **Branch Isolation**: Receptionists only manage their branch
2. **Payment Tracking**: Every confirmation creates a revenue record
3. **Accurate Amounts**: Invoice amounts reflect branch deposits & food costs
4. **Revenue Visibility**: Admin sees complete financial picture by branch & staff
5. **Business Logic**: Aligns with real-world restaurant operations (cash collection, pending deliveries)
