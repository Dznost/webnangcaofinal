# Database Integrity & Constraints Complete Guide

## Overview

This document provides a comprehensive reference for all database constraints, validation rules, business logic triggers, and integrity checks implemented in the restaurant management system.

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Data Validation Rules](#data-validation-rules)
3. [Business Logic Constraints](#business-logic-constraints)
4. [Pre/Post Save Hooks](#prepost-save-hooks)
5. [Database Indexes](#database-indexes)
6. [Integrity Verification](#integrity-verification)
7. [Migration Instructions](#migration-instructions)

---

## Schema Overview

### 10 Core Collections

#### 1. Users
- Authentication and role management
- Staff/Reception branch assignment
- Password hashing with bcrypt
- Status tracking (active/inactive/suspended)

#### 2. Branches
- Multi-location management
- Table inventory tracking
- Dish associations per branch
- Opening hours and contact info

#### 3. Orders
- Complete order lifecycle (pending → completed/cancelled)
- Dine-in and takeaway support
- Payment timing options (prepaid/COD)
- Shipper and staff assignment
- Rating and feedback system

#### 4. Reservations
- Table booking with pre-ordered items
- Deposit and food item pricing
- Date/time and guest validation
- Invoice calculation with discounts

#### 5. Payments
- Transaction tracking for Orders and Reservations
- Revenue type classification (delivery/reception/dine-in)
- Staff/Shipper collection tracking
- Multi-status workflow (pending → completed/failed)

#### 6. Dishes
- Menu items with pricing and discounts
- Category classification
- Availability flags
- Event associations

#### 7. Notifications
- Event-based alerting system
- 25+ notification types
- Priority-based routing
- Auto-expiration after 90 days

#### 8. Contacts
- Feedback, applications, and inquiries
- Status tracking (new → read → replied/approved/rejected)
- User and branch associations

#### 9. Events
- Time-limited promotions and special dishes
- Date range management

#### 10. Blogs
- Content management system
- Author and publish tracking

---

## Data Validation Rules

### User Schema Validation

```
✓ name: string (2-100 chars, required, indexed)
✓ email: string (required, unique, lowercase, valid email format)
✓ password: string (8+ chars, hashed, never returned in queries)
✓ phone: string (10-11 digits validation)
✓ role: enum ['user','admin','shipper','staff','reception'] (required, indexed)
✓ branchId: ObjectId (REQUIRED if role is 'staff' or 'reception')
✓ status: enum ['active','inactive','suspended'] (indexed)
```

**Constraints:**
- Email must be globally unique
- Staff/Reception roles MUST have valid branchId
- Password must be hashed before storage

### Order Schema Validation

```
✓ userId: ObjectId (required, indexed)
✓ items: Array (minimum 1 item required)
  ├─ quantity: number (1-100, required)
  ├─ price: number (>= 0, required)
  └─ discount: number (<= price)
✓ orderType: enum ['dine-in','takeaway'] (required, indexed)
✓ branchId: ObjectId (required, indexed)
✓ paymentTiming: enum ['prepaid','cod'] (default: prepaid)
✓ totalPrice: number (= SUM(items.price * items.quantity))
✓ discount: number (<= totalPrice)
✓ finalPrice: number (= totalPrice - discount)
✓ paymentStatus: enum ['unpaid','paid']
✓ status: enum [8 states]
```

**Constraints:**
- totalPrice calculated from items, cannot be manually set
- discount cannot exceed totalPrice
- finalPrice must equal totalPrice - discount
- Takeaway orders require deliveryAddress
- Prepaid orders must be paid before shipping
- COD payments can remain unpaid after delivery

### Reservation Schema Validation

```
✓ userId: ObjectId (required, indexed)
✓ branchId: ObjectId (required, indexed)
✓ date: Date (required, must be future date)
✓ time: string (HH:MM format, 10:00-22:00 business hours)
✓ guests: number (1-200, required)
✓ orderItems: Array (0 or more pre-ordered items)
✓ depositAmount: number (>= 0, default: 0)
✓ foodTotal: number (= SUM(items.price * items.quantity), >= 0)
✓ foodDiscount: number (<= foodTotal)
✓ totalAmount: number (= deposit + (foodTotal - foodDiscount))
✓ status: enum [6 states]
```

**Constraints:**
- Date must be future date
- Time must be within business hours (10 AM - 10 PM)
- Guests cannot exceed available tables at booking time
- No duplicate reservations per date/time slot
- totalAmount must match calculated value exactly
- foodDiscount cannot exceed foodTotal

### Payment Schema Validation

```
✓ orderId: ObjectId (ref: Order)
✓ reservationId: ObjectId (ref: Reservation)
  ↳ Must have EITHER orderId OR reservationId (not both, not neither)
✓ userId: ObjectId (required, indexed)
✓ amount: number (> 0, required)
✓ discount: number (<= amount)
✓ finalAmount: number (= amount - discount)
✓ paymentMethod: enum ['bank','cash'] (required)
✓ status: enum ['pending','completed','failed'] (indexed)
✓ revenueType: enum ['delivery','reception','dine-in']
✓ branchId: ObjectId (required, indexed)
✓ collectedBy: ObjectId (REQUIRED if revenueType='reception')
```

**Constraints:**
- Either orderId or reservationId must be set
- amount must be > 0
- finalAmount = amount - discount
- Reception payments must have collectedBy staff ID
- No duplicate payments for same order/reservation
- Status transitions: pending → (completed OR failed)

---

## Business Logic Constraints

### Order Processing Rules

| Rule | Description | Implementation |
|------|-------------|-----------------|
| **R1** | Total price must match sum of items | Pre-save calculation |
| **R2** | Discount cannot exceed total price | Schema validation |
| **R3** | Dine-in orders reduce available tables | Pre-save hook |
| **R4** | Dine-in completion restores tables | Post-save hook |
| **R5** | Takeaway requires delivery address | Schema validation |
| **R6** | Prepaid must be paid before shipping | Pre-save validation |
| **R7** | COD orders allow pending payments | Status-dependent logic |
| **R8** | Cannot rate incomplete orders | Schema validation |
| **R9** | Shipper required if status=shipping | Pre-save validation |

### Reservation Processing Rules

| Rule | Description | Implementation |
|------|-------------|-----------------|
| **R1** | Date must be future | Schema validation |
| **R2** | Time must be in business hours (10-22) | Schema validation |
| **R3** | Guests ≤ available tables | Pre-save validation |
| **R4** | Total amount = deposit + (food - discount) | Schema validation |
| **R5** | No duplicate date/time slots | Pre-save check |
| **R6** | Food discount ≤ food total | Schema validation |
| **R7** | Confirmation creates Payment record | Post-save hook |
| **R8** | Payment record required on confirm | Business logic |

### Payment Processing Rules

| Rule | Description | Implementation |
|------|-------------|-----------------|
| **R1** | Every Order needs exactly 1 Payment | Auto-creation on confirm |
| **R2** | Every Reservation needs exactly 1 Payment | Auto-creation on confirm |
| **R3** | Must reference Order OR Reservation | Schema validation |
| **R4** | finalAmount = amount - discount | Calculation |
| **R5** | Reception payments track collector | Required field validation |
| **R6** | Status: pending → (completed OR failed) | Workflow constraint |
| **R7** | No orphaned payments | Data integrity check |
| **R8** | Duplicate detection per order | Pre-save validation |

### Branch Rules

| Rule | Description | Implementation |
|------|-------------|-----------------|
| **R1** | availableTables ≤ totalTables | Schema validation |
| **R2** | Cannot reduce totalTables below current usage | Pre-update validation |
| **R3** | All staff assigned to branch | User validation |

---

## Pre/Post Save Hooks

### Order Model Hooks

```javascript
// PRE-SAVE HOOKS
pre('save', async function() {
  // 1. Calculate totalPrice from items
  this.totalPrice = this.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0)
  
  // 2. Validate discount <= totalPrice
  if (this.discount > this.totalPrice) {
    throw new Error('Discount cannot exceed total price')
  }
  
  // 3. Calculate finalPrice
  this.finalPrice = this.totalPrice - this.discount
  
  // 4. Validate payment timing
  if (this.paymentTiming === 'prepaid' && 
      this.status === 'shipping' && 
      this.paymentStatus !== 'paid') {
    throw new Error('Prepaid orders must be paid before shipping')
  }
  
  // 5. Handle dine-in table availability
  if (this.orderType === 'dine-in') {
    const branch = await Branch.findById(this.branchId)
    if (!branch) throw new Error('Branch not found')
    if (branch.availableTables <= 0) throw new Error('No tables available')
    
    if (this.isNew) {
      branch.availableTables -= 1
      await branch.save()
    }
  }
})

// POST-SAVE HOOKS
post('save', async function() {
  // 1. Create Payment record if missing
  const existingPayment = await Payment.findOne({ 
    orderId: this._id 
  })
  if (!existingPayment && this.status === 'completed') {
    await Payment.create({
      orderId: this._id,
      userId: this.userId,
      amount: this.finalPrice,
      discount: this.discount,
      finalAmount: this.finalPrice,
      paymentMethod: this.paymentMethod || 'cash',
      status: this.paymentStatus === 'paid' ? 'completed' : 'pending',
      revenueType: this.orderType === 'dine-in' ? 'reception' : 'delivery',
      branchId: this.branchId,
      collectedBy: this.confirmedBy
    })
  }
  
  // 2. Create Notification for critical status changes
  if (this.status === 'completed' && this.orderType === 'dine-in') {
    // Release table
    const branch = await Branch.findById(this.branchId)
    if (branch) {
      branch.availableTables = Math.min(
        branch.availableTables + 1,
        branch.totalTables
      )
      await branch.save()
    }
  }
  
  // 3. Notify admin if large order (> 100M)
  if (this.finalPrice > 100000000) {
    await Notification.create({
      type: 'large_order',
      category: 'order',
      priority: 'high',
      orderId: this._id,
      userId: adminUserId,
      amount: this.finalPrice,
      message: `Large order detected: ${this.finalPrice.toLocaleString()}đ`
    })
  }
})
```

### Reservation Model Hooks

```javascript
// PRE-SAVE HOOKS
pre('save', async function() {
  // 1. Validate totalAmount calculation
  const calculated = this.depositAmount + 
    (this.foodTotal - this.foodDiscount)
  if (Math.abs(this.totalAmount - calculated) > 0.01) {
    throw new Error('Total amount calculation error')
  }
  
  // 2. Validate future date
  if (this.date < new Date()) {
    throw new Error('Reservation date must be in the future')
  }
  
  // 3. Validate time format and business hours
  const [hour] = this.time.split(':').map(Number)
  if (hour < 10 || hour > 22) {
    throw new Error('Reservation must be within business hours')
  }
  
  // 4. Check available tables for given slot
  const existingReservations = await Reservation.countDocuments({
    branchId: this.branchId,
    date: this.date,
    time: this.time,
    status: { $in: ['pending', 'confirmed', 'processing'] }
  })
  
  const branch = await Branch.findById(this.branchId)
  const availableForSlot = branch.totalTables - existingReservations
  
  if (this.guests > availableForSlot) {
    throw new Error(`Not enough tables available. 
                      Max: ${availableForSlot}, Requested: ${this.guests}`)
  }
  
  // 5. Check for duplicate
  const duplicate = await Reservation.findOne({
    userId: this.userId,
    branchId: this.branchId,
    date: this.date,
    time: this.time,
    status: { $ne: 'cancelled' }
  })
  if (duplicate && !this._id.equals(duplicate._id)) {
    throw new Error('You already have a reservation for this time slot')
  }
})

// POST-SAVE HOOKS
post('save', async function() {
  // 1. Create Payment record on confirmation
  if (this.status === 'confirmed') {
    const existingPayment = await Payment.findOne({
      reservationId: this._id
    })
    if (!existingPayment) {
      await Payment.create({
        reservationId: this._id,
        userId: this.userId,
        amount: this.totalAmount,
        discount: this.foodDiscount,
        finalAmount: this.totalAmount,
        paymentMethod: this.paymentMethod || 'cash',
        status: this.paymentStatus === 'paid' ? 'completed' : 'pending',
        revenueType: 'reception',
        branchId: this.branchId,
        collectedBy: this.staffId
      })
    }
  }
  
  // 2. Create notification for staff
  await Notification.create({
    type: this.status === 'pending' ? 'new_reservation' : `reservation_${this.status}`,
    category: 'reservation',
    priority: this.guests > 50 ? 'high' : 'normal',
    reservationId: this._id,
    userId: staffUserId,
    amount: this.totalAmount,
    message: `Reservation: ${this.guests} guests - ${this.totalAmount.toLocaleString()}đ`
  })
})
```

### Payment Model Hooks

```javascript
// PRE-SAVE HOOKS
pre('save', async function() {
  // 1. Validate either orderId or reservationId
  if (!this.orderId && !this.reservationId) {
    throw new Error('Payment must reference either Order or Reservation')
  }
  
  // 2. Validate finalAmount calculation
  const calculated = this.amount - this.discount
  if (Math.abs(this.finalAmount - calculated) > 0.01) {
    throw new Error('Final amount calculation error')
  }
  
  // 3. Validate reception payments have collector
  if (this.revenueType === 'reception' && !this.collectedBy) {
    throw new Error('Reception payments must specify who collected')
  }
  
  // 4. Check for duplicate payments
  const query = {}
  if (this.orderId) query.orderId = this.orderId
  if (this.reservationId) query.reservationId = this.reservationId
  
  const existing = await Payment.findOne(query)
  if (existing && !this._id.equals(existing._id)) {
    throw new Error('Payment already exists for this order/reservation')
  }
})

// POST-SAVE HOOKS
post('save', async function() {
  // 1. Update Order/Reservation payment status
  if (this.orderId && this.status === 'completed') {
    await Order.findByIdAndUpdate(this.orderId, {
      paymentStatus: 'paid',
      paidAt: new Date()
    })
  }
  
  if (this.reservationId && this.status === 'completed') {
    await Reservation.findByIdAndUpdate(this.reservationId, {
      paymentStatus: 'paid',
      paidAt: new Date()
    })
  }
  
  // 2. Create notification for admin
  await Notification.create({
    type: this.status === 'completed' ? 'payment_received' : 'payment_failed',
    category: 'payment',
    priority: this.finalAmount > 50000000 ? 'high' : 'normal',
    userId: adminUserId,
    amount: this.finalAmount,
    message: `Payment ${this.status}: ${this.finalAmount.toLocaleString()}đ`
  })
})
```

---

## Database Indexes

### Performance-Critical Indexes

```javascript
// REVENUE ANALYSIS
db.payments.createIndex({
  branchId: 1,
  revenueType: 1,
  status: 1,
  createdAt: -1
})

// ORDER TIMELINE BY BRANCH
db.orders.createIndex({
  branchId: 1,
  status: 1,
  createdAt: -1
})

// STAFF PERFORMANCE TRACKING
db.payments.createIndex({
  collectedBy: 1,
  status: 1,
  createdAt: -1
})

// RESERVATION BOOKING AVAILABILITY
db.reservations.createIndex({
  branchId: 1,
  date: 1,
  time: 1
})

// USER AUTHENTICATION
db.users.createIndex({
  email: 1
}, { unique: true })

// SHIPPER ORDER ASSIGNMENT
db.orders.createIndex({
  shipperId: 1,
  status: 1
})
```

---

## Integrity Verification

### Data Consistency Checks

Before deployment, verify:

1. **No Orphaned Payments**
```javascript
db.payments.find({
  $nor: [
    { orderId: { $exists: true, $ne: null } },
    { reservationId: { $exists: true, $ne: null } }
  ]
})
// Should return 0 results
```

2. **No Duplicate Payments**
```javascript
db.payments.aggregate([
  { $group: { _id: '$orderId', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
// Should return 0 results
```

3. **No Unassigned Staff**
```javascript
db.users.find({
  role: { $in: ['staff', 'reception'] },
  branchId: { $exists: false }
})
// Should return 0 results
```

4. **All References Valid**
```javascript
// Check Order references
db.orders.find({
  branchId: { $exists: true }
}).forEach(order => {
  if (!db.branches.findOne({ _id: order.branchId })) {
    print('Invalid branch reference: ' + order._id)
  }
})
```

---

## Migration Instructions

### Step 1: Backup Database
```bash
mongodump --uri="mongodb://localhost:27017/restaurant" \
          --out="./backup-$(date +%Y%m%d-%H%M%S)"
```

### Step 2: Run Migration Script
```bash
node scripts/migrate-database-constraints.js
```

### Step 3: Verify Migration
```bash
# Check all indexes
db.getCollectionNames().forEach(col => {
  print(`Collection: ${col}`)
  db[col].getIndexes().forEach(idx => print(`  - ${JSON.stringify(idx)}`))
})

# Verify data integrity
db.runCommand({ dbStats: 1 })
```

### Step 4: Test Critical Workflows
- Create order → verify Payment creation
- Create reservation → verify Payment creation
- Update order status → verify payment status sync
- Test COD payment flow
- Test reception payment collection

---

## Summary of Constraints

### Total Validation Rules: 45+
### Total Indexes: 25+
### Total Business Rules: 35+

All constraints are enforced at multiple levels:
1. **Schema validation** - MongoDB schema validators
2. **Pre-save hooks** - Application logic before persistence
3. **Post-save hooks** - Cascading operations after save
4. **Application code** - Controller-level validation
5. **Database queries** - Aggregation pipeline rules

This multi-layer approach ensures data integrity even if constraints fail at one level.
