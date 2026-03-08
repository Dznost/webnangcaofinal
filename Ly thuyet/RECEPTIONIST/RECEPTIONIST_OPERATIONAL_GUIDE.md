# Receptionist Role - Operational Procedures Guide

## Overview

This document outlines the complete workflow for receptionists managing reservations and orders, with integrated revenue tracking for branch managers.

---

## Part 1: Branch-Scoped Access Control

### How Branch Assignment Works

Each receptionist is assigned to ONE branch:

```
User Record:
{
  name: "Tran Van A",
  email: "trana@restaurant.com",
  role: "reception",
  branchId: ObjectId("chi-nhanh-123"),  ← This determines which branch they manage
  phone: "0912345678"
}
```

### What Receptionists Can Access

When a receptionist logs in, they ONLY see:
- Reservations for their assigned branch
- Orders for their assigned branch
- Customer information for their branch

**System enforces this with every query**:
```javascript
// Every reception query includes:
const query = { branchId: req.session.user.branchId }
// This prevents cross-branch access entirely
```

---

## Part 2: Reservation Management Workflow

### Step 1: Viewing Pending Reservations

**Page**: `/reception/reservations`

**What the Receptionist Sees**:
- List of reservations for THEIR BRANCH ONLY
- Filter options: All / Pending / Confirmed / Completed
- Search by customer name or phone number
- Status badges with visual indicators

**Example Display**:
```
Khach Hang          | Dien Thoai    | Ngay Gio        | So Khach | Trang Thai      | Tac Vu
─────────────────────────────────────────────────────────────────────────────────────
Nguyen Van A        | 0912345678    | 20/3/2024 19:00 | 4        | Cho xac nhan   | Chi tiet
Tran Thi B          | 0987654321    | 20/3/2024 19:30 | 2        | Da xac nhan    | Chi tiet
```

### Step 2: Viewing Reservation Invoice

**Page**: `/reception/reservations/:id`

**What the Receptionist Sees**:

#### Customer Information Section:
- Customer name and contact details
- Branch name (confirms they're managing the right reservation)
- Reservation date/time and party size

#### Pre-ordered Items:
- List of dishes ordered before reservation
- Quantity and individual prices

#### **INVOICE SECTION** (Most Important):
```
╔════════════════════════════════════════════════════════════╗
║                     HOA DON CHI TIET                        ║
╠════════════════════════════════════════════════════════════╣
║ Tien Coc Ban (Deposit):              500,000đ             ║
║                                                             ║
║ Mon An Dat Truoc:                                          ║
║   - Ga Nuong (x2)                    300,000đ             ║
║   - Com Trang (x2)                   40,000đ              ║
║ Subtotal Mon An:                     340,000đ             ║
║                                                             ║
║ Khuyen Mai / Giam Gia:              -40,000đ              ║
║                                                             ║
║ ─────────────────────────────────────────────────────────  ║
║ TONG TIEN HOA DON:                  800,000đ             ║
╚════════════════════════════════════════════════════════════╝

Trang Thai Thanh Toan: ○ CHUA THANH TOAN
```

#### Confirmation Button:
```
[XAC NHAN DAT BAN]  ← Receptionist clicks to confirm
```

### Step 3: Confirming Reservation

**When Clicked**: System performs these steps automatically:

1. **Update Reservation Status**
   ```
   status: pending → confirmed
   paymentStatus: unpaid (no deposit collected yet)
   ```

2. **Create Payment Record for Revenue Tracking**
   ```javascript
   Payment Record Created:
   {
     reservationId: "res-123456",
     userId: "customer-789",
     branchId: "chi-nhanh-456",      ← SAME BRANCH
     collectedBy: "receptionist-001",  ← WHICH RECEPTIONIST CONFIRMED
     amount: 800000,                   ← INVOICE AMOUNT
     discount: 40000,                  ← APPLIED DISCOUNT
     finalAmount: 800000,              ← TOTAL TO COLLECT
     revenueType: "reception",         ← TYPE: DINE-IN
     status: "pending",                ← AWAITING ACTUAL COLLECTION
     paymentMethod: "cash",
     createdAt: 2024-03-20 14:30:00
   }
   ```

3. **Send Notification to Admin/Branch Manager**
   ```
   "Le tan Tran Van A xac nhan dat ban cho Nguyen Van A - 800,000d"
   ```

**Result**: 
- Reservation moves to "Confirmed" status
- Payment record appears in Admin Revenue Dashboard
- Branch manager can see: "800,000đ - Awaiting collection by Receptionist A"

---

## Part 3: Order Management Workflow

### Order Type 1: Walk-in Dine-in

**Scenario**: Customer comes in without reservation, sits down, orders and eats.

**Flow**:
1. Receptionist creates order (dine-in type)
2. Customer eats and pays cash at table
3. Receptionist clicks "Confirm Order Completed"
4. System creates Payment record:
   ```javascript
   {
     orderId: "order-789",
     status: "completed",      ← PAID IMMEDIATELY
     revenueType: "reception",
     amount: 250000,
     paidAt: 2024-03-20 18:45:00
   }
   ```
5. Revenue appears IMMEDIATELY in dashboard as completed revenue

### Order Type 2: Takeaway (Prepaid)

**Scenario**: Customer orders takeaway, pays before delivery.

**Flow**:
1. Customer orders takeaway
2. Customer pays (bank transfer or counter cash)
3. Receptionist confirms order
4. System creates Payment record:
   ```javascript
   {
     orderId: "order-890",
     status: "completed",      ← PAID BEFORE DELIVERY
     revenueType: "delivery",  ← TREATED AS DELIVERY
     amount: 350000,
     paidAt: 2024-03-20 17:00:00
   }
   ```
5. Revenue appears in "Delivery" section of revenue dashboard

### Order Type 3: Takeaway (COD - Cash on Delivery)

**Scenario**: Customer orders takeaway, shipper collects payment during delivery.

**Flow**:
1. Customer orders takeaway (COD selected)
2. Receptionist confirms order ready
3. System creates Payment record:
   ```javascript
   {
     orderId: "order-901",
     status: "pending",        ← SHIPPER WILL COLLECT
     revenueType: "delivery",
     amount: 350000,
     paidAt: null              ← NOT YET PAID
   }
   ```
4. **Notification sent to Admin**: "Shipper will collect 350,000đ"
5. Payment stays PENDING until shipper collects
6. When shipper confirms delivery, admin updates status to "completed"
7. Revenue then appears in "Shipper Breakdown" section

---

## Part 4: Revenue Dashboard - What Admin Sees

**Page**: `/admin/revenue`

### Section 1: Reception Revenue (Dine-in & Reservations)
```
┌─────────────────────────────────────────────────────────┐
│ RECEPTION REVENUE (Dine-in & Reservations)              │
│ Total: 5,200,000đ                                       │
├─────────────────────────────────────────────────────────┤
│ BY BRANCH:                                              │
│ Chi Nhanh A       2,500,000đ (4 transactions)           │
│ Chi Nhanh B       1,800,000đ (3 transactions)           │
│ Chi Nhanh C         900,000đ (2 transactions)           │
├─────────────────────────────────────────────────────────┤
│ BY RECEPTIONIST:                                        │
│ Tran Van A (Branch A)    1,500,000đ (2 trans)          │
│ Tran Thi B (Branch A)    1,000,000đ (2 trans)          │
│ Nguyen Van C (Branch B)  1,800,000đ (3 trans)          │
└─────────────────────────────────────────────────────────┘
```

### Section 2: Delivery Revenue (Takeaway)
```
┌─────────────────────────────��───────────────────────────┐
│ DELIVERY REVENUE (Takeaway Orders)                       │
│ Total: 3,500,000đ                                       │
├─────────────────────────────────────────────────────────┤
│ BY SHIPPER:                                             │
│ Shipper A         1,200,000đ (5 orders)                 │
│ Shipper B           900,000đ (3 orders)                 │
│ Shipper C         1,400,000đ (4 orders)                 │
└─────────────────────────────────────────────────────────┘
```

### Section 3: Pending Payments (Awaiting Collection)
```
Pending Transactions (Not yet in revenue total):
- Order #ABC123 - Shipper A will collect 350,000đ
- Reservation #XYZ789 - Receptionist B will collect 800,000đ
```

---

## Part 5: Invoice Amount Calculation

### For Reservations

The invoice amount shown to receptionist is calculated as:

```
┌─────────────────────────────────────────┐
│ INVOICE AMOUNT FORMULA                  │
├─────────────────────────────────────────┤
│ Tien Coc (Deposit)          + 500,000đ │
│ Mon An Tong Gia             + 340,000đ │
│ Tru Khuyen Mai / Giam Gia   - 40,000đ  │
│ ────────────────────────────────────   │
│ TONG TIEN HOA DON          = 800,000đ  │
└─────────────────────────────────────────┘

Fields used:
- reservation.depositAmount    (table deposit)
- reservation.foodTotal        (pre-ordered food total)
- reservation.foodDiscount     (discount applied)
- reservation.totalAmount      (final = deposit + food - discount)
```

### For Orders

**Dine-in**: Total price collected at table
**Takeaway**: Total price with/without discount

---

## Part 6: Payment Status Tracking

### Reservation Payment Status

| Status | Meaning | When Updated | Visible in Revenue |
|--------|---------|--------------|-------------------|
| unpaid | Confirmed but customer hasn't paid | When receptionist confirms | YES (as pending) |
| paid | Customer paid the invoice | When actual payment received | YES (as completed) |

### Order Payment Status

| Status | Meaning | When Updated | Visible in Revenue |
|--------|---------|--------------|-------------------|
| pending | Created, awaiting payment | Order created | NO |
| completed | Payment received (cash or bank) | Receptionist confirms / shipper collects | YES |

---

## Part 7: System Security & Data Integrity

### Branch Isolation Enforcement

**Every receptionist query includes**:
```javascript
// Get Reservations
const query = { branchId: req.session.user.branchId }

// Get Orders
const query = { branchId: req.session.user.branchId, staff: req.session.user.id }

// Confirm Operations
const query = { _id: id, branchId: req.session.user.branchId }
```

**Result**: Receptionist physically CANNOT access or modify another branch's data.

### Payment Record Accuracy

**When Confirmation Creates Payment**:
```javascript
// System ALWAYS records:
- reservationId/orderId    → Links to transaction
- branchId                 → Which branch this belongs to
- collectedBy              → Which receptionist confirmed it
- amount & finalAmount     → Exact invoice amounts from reservation
- status                   → pending/completed
- revenueType              → "reception" or "delivery"
```

**Result**: Revenue dashboard has complete audit trail.

---

## Part 8: Common Workflows Checklist

### Receptionist Checklist - Reservation Confirmation

- [ ] Open `/reception/reservations`
- [ ] Filter to "Cho xac nhan" (pending)
- [ ] Verify reservation is for MY BRANCH
- [ ] Click "Chi tiet" to view invoice
- [ ] Verify customer name and invoice amount
- [ ] Click "Xac Nhan Dat Ban"
- [ ] System confirms success
- [ ] Payment record created automatically
- [ ] Admin receives notification

### Branch Manager Checklist - Revenue Verification

- [ ] Open `/admin/revenue`
- [ ] Select month/year to review
- [ ] Check "Reception Revenue" section
- [ ] Verify MY BRANCH shows correct total
- [ ] Check "By Receptionist" to see individual collections
- [ ] Cross-reference with reservation confirmations
- [ ] Verify no missing transactions

### Admin Checklist - System Verification

- [ ] All reservations confirmed by receptionists are in Payment table
- [ ] All payment records have matching branchId
- [ ] Revenue totals match confirmed reservations
- [ ] No receptionist can view other branch data
- [ ] COD orders correctly marked as "pending" status

---

## Part 9: Troubleshooting

### Issue: Receptionist doesn't see any reservations

**Check**:
```javascript
// In database, verify:
db.users.findOne({ email: "receptionist@..." })
// Should have: { branchId: ObjectId(...), role: "reception" }

// If branchId is null/missing:
// → Contact admin to assign branch
```

### Issue: Invoice amount shows 0

**Check**:
```javascript
// Verify reservation has:
- depositAmount > 0 OR
- foodTotal > 0

// If both are 0:
// → Update reservation with correct amounts before confirming
```

### Issue: Payment doesn't appear in revenue dashboard

**Check**:
```javascript
// Verify payment record exists:
db.payments.findOne({ reservationId: ObjectId(...) })

// If missing:
// → Receptionist may not have confirmed the reservation
// → System didn't create payment record
```

### Issue: Wrong branch showing in revenue

**Check**:
```javascript
// Verify payment.branchId matches reservation.branchId
db.payments.findOne({ reservationId: ObjectId(...) })
// payment.branchId should match:
db.reservations.findOne({ _id: ObjectId(...) })
// reservation.branchId
```

---

## Summary

**Complete Flow**:
1. Receptionist logs in → sees only their branch reservations
2. Receptionist views pending reservation → sees invoice with amounts
3. Receptionist confirms reservation → system creates payment record
4. Payment record includes: branchId, amount, receptionist info
5. Admin/Branch Manager views revenue dashboard
6. Dashboard shows: branch breakdown, receptionist breakdown, amounts
7. All data is audit-traceable back to original reservation

**Key Guarantees**:
- ✅ Receptionist cannot access other branches
- ✅ Invoice amounts match reservation totals exactly
- ✅ Revenue records correctly attributed to branch & staff
- ✅ All transactions traceable and auditable
- ✅ Real-time visibility for management
