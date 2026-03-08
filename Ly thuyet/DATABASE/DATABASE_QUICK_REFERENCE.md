# Database Schema Quick Reference

## Critical Business Rules At a Glance

### ORDER CREATION & PROCESSING
```
✓ totalPrice = SUM(items[*].price × items[*].quantity)
✓ finalPrice = totalPrice - discount
✓ discount ≤ totalPrice
✓ If dine-in: reduce branch.availableTables by 1
✓ If takeaway: require deliveryAddress
✓ If paymentTiming='prepaid': require payment before shipping
✓ If paymentTiming='cod': payment can be pending after completion
```

### RESERVATION BOOKING
```
✓ date must be future date
✓ time must be 10:00-22:00 (business hours)
✓ guests ≤ available tables at that time
✓ totalAmount = deposit + (foodTotal - foodDiscount)
✓ foodDiscount ≤ foodTotal
✓ No duplicate date/time slots per user/branch
✓ On confirmation: auto-create Payment record
```

### PAYMENT TRACKING
```
✓ Every Order needs exactly 1 Payment (auto-created on completion)
✓ Every Reservation needs exactly 1 Payment (auto-created on confirmation)
✓ finalAmount = amount - discount
✓ Must reference Order OR Reservation (never both, never neither)
✓ Reception payments: collectedBy staff ID is REQUIRED
✓ Status flow: pending → (completed OR failed)
```

### BRANCH MANAGEMENT
```
✓ availableTables ≤ totalTables (always)
✓ All staff/reception users MUST have branchId
✓ Dine-in table increment/decrement on order status changes
```

---

## Schema Field Reference

### User Collection

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | String | YES | 2-100 chars |
| email | String | YES | Unique, lowercase |
| password | String | YES | 8+ chars, hashed |
| phone | String | NO | 10-11 digits |
| role | String | YES | Enum: [user,admin,shipper,staff,reception] |
| branchId | ObjectId | CONDITIONAL | Required if role=[staff,reception] |
| status | String | NO | Enum: [active,inactive,suspended] |
| createdAt | Date | AUTO | Immutable |

### Order Collection

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| userId | ObjectId | YES | Ref: User |
| items | Array | YES | Min 1 item, each with quantity & price |
| orderType | String | YES | Enum: [dine-in,takeaway] |
| branchId | ObjectId | YES | Ref: Branch |
| paymentTiming | String | NO | Enum: [prepaid,cod] Default: prepaid |
| totalPrice | Number | YES | Calculated = SUM items |
| discount | Number | NO | ≤ totalPrice |
| finalPrice | Number | YES | = totalPrice - discount |
| deliveryAddress | String | CONDITIONAL | Required if orderType=takeaway |
| paymentStatus | String | NO | Enum: [unpaid,paid] |
| status | String | NO | 8-state enum |
| confirmedBy | ObjectId | NO | Ref: User (who confirmed) |
| createdAt | Date | AUTO | Immutable |

### Reservation Collection

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| userId | ObjectId | YES | Ref: User |
| branchId | ObjectId | YES | Ref: Branch |
| date | Date | YES | Future date |
| time | String | YES | HH:MM format, 10-22 hours |
| guests | Number | YES | 1-200, ≤ available tables |
| orderItems | Array | NO | Pre-ordered food items |
| depositAmount | Number | NO | ≥ 0 |
| foodTotal | Number | NO | ≥ 0 |
| foodDiscount | Number | NO | ≤ foodTotal |
| totalAmount | Number | NO | = deposit + (foodTotal - foodDiscount) |
| status | String | NO | 6-state enum |
| paymentStatus | String | NO | Enum: [unpaid,paid] |
| createdAt | Date | AUTO | Immutable |

### Payment Collection

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| orderId | ObjectId | CONDITIONAL | Ref: Order |
| reservationId | ObjectId | CONDITIONAL | Ref: Reservation |
| userId | ObjectId | YES | Ref: User |
| amount | Number | YES | > 0 |
| discount | Number | NO | ≤ amount |
| finalAmount | Number | YES | = amount - discount |
| paymentMethod | String | YES | Enum: [bank,cash] |
| status | String | NO | Enum: [pending,completed,failed] |
| revenueType | String | YES | Enum: [delivery,reception,dine-in] |
| branchId | ObjectId | YES | Ref: Branch |
| collectedBy | ObjectId | CONDITIONAL | Required if revenueType=reception |
| paidAt | Date | NO | Set when status=completed |
| createdAt | Date | AUTO | Immutable |

---

## Database Indexes (For Performance)

### Essential Indexes
```javascript
// Authentication
users: { email: 1 } [unique]

// Revenue reports
payments: { branchId: 1, revenueType: 1, status: 1, createdAt: -1 }

// Booking availability
reservations: { branchId: 1, date: 1, time: 1 }

// Order by branch & status
orders: { branchId: 1, status: 1, createdAt: -1 }

// Staff performance
payments: { collectedBy: 1, status: 1, createdAt: -1 }
```

---

## Common Queries

### Revenue by Branch (Daily)
```javascript
db.payments.aggregate([
  {
    $match: {
      branchId: ObjectId("..."),
      status: "completed",
      createdAt: { $gte: ISODate("2024-01-01"), $lt: ISODate("2024-01-02") }
    }
  },
  {
    $group: {
      _id: "$revenueType",
      total: { $sum: "$finalAmount" },
      count: { $sum: 1 }
    }
  }
])
```

### Available Tables at Time
```javascript
db.reservations.aggregate([
  {
    $match: {
      branchId: ObjectId("..."),
      date: ISODate("2024-01-01"),
      time: "19:00",
      status: { $in: ["pending", "confirmed"] }
    }
  },
  {
    $group: {
      _id: null,
      guestsBooked: { $sum: "$guests" }
    }
  }
])
```

### Orders Pending Payment
```javascript
db.orders.find({
  branchId: ObjectId("..."),
  paymentTiming: "cod",
  paymentStatus: "unpaid",
  status: "completed"
}).limit(10)
```

### Staff Collection Performance
```javascript
db.payments.aggregate([
  {
    $match: {
      collectedBy: ObjectId("..."),
      status: "completed",
      createdAt: { $gte: ISODate("2024-01-01") }
    }
  },
  {
    $group: {
      _id: null,
      totalCollected: { $sum: "$finalAmount" },
      transactionCount: { $sum: 1 },
      avgTransaction: { $avg: "$finalAmount" }
    }
  }
])
```

---

## Migration Checklist

- [ ] Backup current database
- [ ] Run migration script: `node scripts/migrate-database-constraints.js`
- [ ] Verify all indexes created
- [ ] Run data integrity checks
- [ ] Test order creation → payment creation
- [ ] Test reservation → payment creation
- [ ] Test COD payment workflow
- [ ] Test reception payment collection
- [ ] Verify revenue reports calculate correctly
- [ ] Monitor logs for constraint violations

---

## Troubleshooting

### Payment Not Created
**Check:** Order/Reservation saved with `status='completed'` or `status='confirmed'`?
- Pre-save hook creates Payment automatically
- Verify Payment has required fields

### Duplicate Payment Error
**Check:** Multiple confirmations of same Order/Reservation?
- Database constraint prevents duplicates
- Safe to retry: won't create duplicate

### Branch Table Mismatch
**Check:** availableTables > totalTables?
- Schema validation prevents this
- Check dine-in order completion logic

### Invalid Reservation Time
**Check:** Time outside 10 AM - 10 PM?
- Schema validation enforces business hours
- Update time to valid range

---

## Support Documents

- **Full Guide:** `DATABASE_INTEGRITY_GUIDE.md`
- **Migration Script:** `scripts/migrate-database-constraints.js`
- **Schema Reference:** `scripts/database-schema-complete.js`
- **UI Integration:** `DATABASE_UI_SYNC.md`
