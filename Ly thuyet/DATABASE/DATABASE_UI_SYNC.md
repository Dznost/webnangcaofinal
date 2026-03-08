# Database & UI Synchronization - Latest Implementation

## Overview
This document consolidates all recent database schema updates, UI changes, and ensures proper synchronization between backend models and frontend views.

## Latest Database Schema Updates

### 1. User Model Enhancements
**File:** `/models/User.js`
**New Fields:**
- `branchId` - Reference to assigned branch for staff/reception roles
- `pendingBranchId` - For pending branch change requests
- `branchChangeStatus` - Tracks branch change workflow

**Impact on UI:**
- Reception staff dashboard filters by `branchId`
- Sidebar shows branch name for context
- Admin can view staff assignments by branch

---

### 2. Order Model - COD Payment Support
**File:** `/models/Order.js`
**Key Fields for COD Handling:**
- `paymentTiming` - Enum: "prepaid" (default) or "cod"
- `paymentStatus` - "unpaid" for COD orders until shipper collects
- `confirmedBy` - Reception staff who confirmed the order
- `confirmedAt` - Timestamp of confirmation

**Business Logic:**
- Dine-in orders: Payment status = "paid" immediately (cash at table)
- Takeaway COD: Payment status = "unpaid" (shipper collects later)
- Prepaid: Payment status = "paid" before order is confirmed

**UI Updates Needed:**
- Reception view shows payment method clearly
- For COD: Display "Shipper will collect" badge
- Revenue dashboard shows pending COD payments separately

---

### 3. Reservation Model - Branch & Invoice Integration
**File:** `/models/Reservation.js`
**Updated Fields:**
- `branchId` - Links reservation to specific branch (required)
- `depositAmount` - Fixed table reservation deposit
- `foodTotal` - Sum of pre-ordered food items
- `foodDiscount` - Applied discounts on food
- `totalAmount` - Final invoice amount (deposit + food - discount)
- `orderItems` - Array of pre-ordered dishes with quantities/prices
- `status` - Lifecycle: pending → confirmed → paid → completed
- `paymentStatus` - Unpaid/paid tracking

**Reception View Display:**
```
RESERVATION INVOICE
├─ Customer: [Name]
├─ Branch: [Branch Name]
├─ Table Deposit: 500,000đ
├─ Food Items:
│  ├─ Dish 1 (qty) - Price
│  ├─ Dish 2 (qty) - Price
│  └─ Subtotal: 1,200,000đ
├─ Discount Applied: -100,000đ
└─ TOTAL INVOICE: 1,600,000đ
   Payment Status: [Pending/Paid]
```

---

### 4. Payment Model - Revenue Tracking
**File:** `/models/Payment.js`
**Critical Fields for Revenue Management:**
- `branchId` - Essential for branch-specific revenue reports
- `revenueType` - "delivery" (shipper) or "reception" (dine-in/reservation)
- `collectedBy` - Staff member who collected payment (for accountability)
- `status` - "pending" (awaiting collection), "completed" (collected)
- `finalAmount` - Exact amount that was paid

**Automatic Creation Workflow:**
```
Reception Confirms Order/Reservation
  ↓
System Creates Payment Record:
  - Links to order/reservation
  - Sets branch from order/reservation.branchId
  - Records collectedBy as reception staff ID
  - For COD: status = "pending"
  - For cash/prepaid: status = "completed"
  ↓
Admin Sees in Revenue Dashboard:
  - By Branch: Chi Nhanh A, Chi Nhanh B
  - By Staff: Le Tan A, Le Tan B
  - By Payment Method: Cash, Bank
```

---

### 5. Branch Model - Table Management
**File:** `/models/Branch.js`
**Fields:**
- `totalTables` - Maximum table capacity
- `availableTables` - Currently available tables

**Auto-Update Logic:**
- When dine-in order confirmed: availableTables -= 1
- When dine-in order completed: availableTables += 1
- When reservation confirmed: availableTables -= 1

---

### 6. Notification Model - Event Tracking
**File:** `/models/Notification.js`
**Auto-Created Events:**
- `order_cod_pending` - When COD order confirmed
- `reservation_confirmed` - When reservation confirmed by reception
- All include branch context and amount

---

## UI Component Updates Required

### Reception Dashboard (`/views/reception/dashboard.ejs`)
**Must Display:**
- Branch name and location
- Only orders/reservations for assigned branch
- Pending COD payments awaiting shipper collection

**Query Filter:**
```javascript
// Only show orders/reservations for receptionist's branch
{ branchId: req.session.user.branchId }
```

---

### Reception Reservation Management (`/views/reception/reservations/index.ejs`)
**Features:**
- Search/filter by status, guest name, date
- Branch-scoped (only show reservations for this branch)
- Sort by date/time
- Quick action buttons: View Detail, Confirm, Cancel

**Data Flow:**
```
GET /reception/reservations
  ↓ (filtered by branchId)
Shows List of:
  - Customer Name
  - Date & Time
  - Guest Count
  - Status Badge
  - Actions Menu
```

---

### Reservation Detail & Confirmation (`/views/reception/reservations/detail.ejs`)
**Display Invoice Breakdown:**
1. Customer Information
2. Branch Information
3. Reservation Details (date, time, guests)
4. Invoice Section:
   - Deposit Amount
   - Pre-ordered Food Items with prices
   - Subtotal
   - Discounts Applied
   - **TOTAL AMOUNT (in large, prominent display)**
5. Payment Status (Paid/Unpaid)
6. Confirmation Button (for pending status only)

**Confirmation Action:**
```javascript
POST /reception/reservations/:id/confirm
  ↓
Updates:
  - reservation.status = "confirmed"
  - reservation.paymentStatus = "unpaid"
  ↓
Creates:
  - Payment record with:
    - amount = reservation.totalAmount
    - branchId = reservation.branchId
    - collectedBy = reception staff ID
    - status = "pending"
  ↓
Notifies:
  - Admin receives notification with amount & branch
```

---

### Admin Revenue Dashboard (`/views/admin/revenue/index.ejs`)
**Must Show:**
1. Revenue by Branch (Chi Nhanh A: 5M, Chi Nhanh B: 3M, etc.)
2. Revenue by Staff (Le Tan A: 2M, Le Tan B: 3M)
3. Pending Payments:
   - COD orders awaiting shipper collection
   - Reservations awaiting confirmation payment
4. Payment Methods: Cash vs Bank
5. Time-based filters: Daily, Weekly, Monthly

**Key Metrics:**
- Total Revenue (completed payments only)
- Pending Revenue (awaiting collection)
- By Revenue Type: Reception, Delivery

---

## Data Consistency Checks

### Before going live, verify:

1. **Branch Assignment**
   ```javascript
   // Check: All reception staff have branchId
   db.users.find({ role: "reception", branchId: { $exists: false } })
   // Should return: 0 records
   ```

2. **Reservation Completeness**
   ```javascript
   // Check: All reservations have branchId
   db.reservations.find({ branchId: { $exists: false } })
   // Should return: 0 records
   ```

3. **Payment Tracking**
   ```javascript
   // Check: All confirmed orders have payment records
   db.orders.find({ status: "confirmed" }).count() == 
   db.payments.find({ orderId: { $exists: true } }).count()
   ```

4. **COD Payment Status**
   ```javascript
   // Check: All COD orders have unpaid status until shipper collects
   db.orders.find({ paymentTiming: "cod", status: "completed" })
   // paymentStatus should be "pending" or "paid" (if collected)
   ```

---

## API Endpoint Updates

### Reception Endpoints (IMPLEMENTED)
- `GET /reception/reservations` - List branch-scoped reservations
- `GET /reception/reservations/:id` - View detail with invoice
- `POST /reception/reservations/:id/confirm` - Confirm and create payment record
- `GET /reception/orders` - List branch-scoped orders
- `POST /reception/orders/:id/confirm-completed` - Confirm order with COD handling

### Admin Revenue Endpoints
- `GET /admin/revenue` - Dashboard with filters
- `GET /admin/revenue/by-branch` - Revenue breakdown by branch
- `GET /admin/revenue/by-staff` - Revenue breakdown by staff
- `GET /admin/revenue/pending` - Pending payments awaiting collection

---

## Sidebar Navigation Updates

**Status:** ✅ Fixed and Enhanced
- Fixed blog route: `/admin/blog` → `/admin/blogs`
- Improved visual hierarchy and spacing
- Added gradient background
- Better color contrast and hover states

**Sections:**
1. Business Operations (Orders, Reservations, Shipping)
2. Products & Venues (Dishes, Branches, Events)
3. Users & Staff (Users, Blog)

---

## Implementation Checklist

- [x] User model supports branchId for staff/reception
- [x] Order model supports COD payment handling
- [x] Reservation model includes full invoice fields
- [x] Payment model links to branch and collecting staff
- [x] Reception controller filters by branch
- [x] Reception views display invoice amounts clearly
- [x] Admin sidebar fixed and improved
- [x] Notification system tracks confirmations
- [ ] Revenue dashboard fully integrated
- [ ] Admin reports by branch and staff
- [ ] Testing with multiple branches
- [ ] Production deployment

---

## Testing Scenarios

### Scenario 1: Receptionist confirms reservation
1. Reception staff logs in (branchId = Branch A)
2. Views only reservations for Branch A
3. Clicks "Confirm" on a 1,600,000đ reservation
4. System creates Payment record with:
   - amount: 1,600,000
   - branchId: Branch A ID
   - collectedBy: Reception staff ID
5. Admin sees in revenue dashboard: "+1,600,000đ - Reception - Branch A"

### Scenario 2: Takeaway COD order
1. Reception confirms COD order for 2,500,000đ
2. System creates Payment with status="pending"
3. Admin sees: "2,500,000đ - Pending - Shipper will collect"
4. When shipper collects: Payment.status = "completed"
5. Revenue shows: "+2,500,000đ - Delivery - Collected"

### Scenario 3: Multi-branch admin view
1. Admin views revenue dashboard
2. Filters by date range and branch
3. Sees breakdown:
   - Chi Nhanh A: 15M (Reception: 10M, Delivery: 5M)
   - Chi Nhanh B: 8M (Reception: 8M)
   - Pending: 3M (2 COD orders awaiting shipper)

---

## Notes
- All timestamps use `createdAt` and `paidAt` for audit trails
- Branch filtering is critical for data isolation
- Payment status must stay accurate for revenue reporting
- Receptionist access is controlled at the query level (branchId)
