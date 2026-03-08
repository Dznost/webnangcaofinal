# System Verification & Testing Checklist

## Pre-Deployment Verification

### 1. User Role Setup Verification

**Objective**: Ensure receptionists are properly assigned to branches

```bash
# Database Queries to Run

# Check all receptionists and their branch assignments:
db.users.find({ role: "reception" }).pretty()

# Expected output:
[
  {
    _id: ObjectId(...),
    name: "Le Tan A",
    email: "letan.a@restaurant.com",
    role: "reception",
    branchId: ObjectId("chi-nhanh-001"),  ← MUST have branchId
    createdAt: ISODate(...)
  },
  {
    _id: ObjectId(...),
    name: "Le Tan B",
    email: "letan.b@restaurant.com",
    role: "reception",
    branchId: ObjectId("chi-nhanh-002"),  ← Different branch
    createdAt: ISODate(...)
  }
]

# ✅ If all receptionists have branchId: PASS
# ❌ If any receptionist missing branchId: FAIL
#    → Admin must assign branch before receptionist can access system
```

### 2. Branch Data Verification

```bash
# Verify all branches have proper structure:
db.branches.find({}).pretty()

# Expected:
[
  {
    _id: ObjectId("chi-nhanh-001"),
    name: "Chi Nhanh Trung Tam",
    address: "...",
    phone: "...",
    totalTables: 20,
    availableTables: 15,
    createdAt: ISODate(...)
  }
]

# ✅ All branches present: PASS
```

### 3. Reservation Schema Verification

```bash
# Check a sample reservation record:
db.reservations.findOne({ status: "pending" })

# Expected fields to exist:
{
  _id: ObjectId(...),
  userId: ObjectId(...),
  branchId: ObjectId(...),        ← CRITICAL: Must exist
  date: ISODate(...),
  time: "19:00",
  guests: 4,
  depositAmount: 500000,          ← CRITICAL: For invoice
  foodTotal: 340000,              ← CRITICAL: For invoice
  foodDiscount: 40000,            ← CRITICAL: For invoice
  totalAmount: 800000,            ← CRITICAL: Invoice total
  status: "pending",
  paymentStatus: "unpaid",
  orderItems: [...],
  createdAt: ISODate(...)
}

# ✅ If all critical fields present: PASS
# ❌ If missing depositAmount/totalAmount: FAIL
#    → Cannot calculate proper invoice amounts
```

### 4. Payment Schema Verification

```bash
# Check if Payment model is properly structured:
db.payments.findOne({})

# Expected fields:
{
  _id: ObjectId(...),
  orderId: ObjectId(...),         ← Links to order (if applicable)
  reservationId: ObjectId(...),   ← Links to reservation (if applicable)
  userId: ObjectId(...),          ← Customer
  branchId: ObjectId(...),        ← CRITICAL: Which branch
  collectedBy: ObjectId(...),     ← CRITICAL: Which receptionist
  amount: 800000,                 ← Original amount
  discount: 40000,                ← Applied discount
  finalAmount: 800000,            ← Total to collect
  paymentMethod: "cash",
  revenueType: "reception",       ← CRITICAL: reception or delivery
  status: "pending",              ← CRITICAL: pending or completed
  paidAt: ISODate(...),           ← When paid
  createdAt: ISODate(...)
}

# ✅ If fields present: PASS
```

---

## Functional Testing

### Test 1: Receptionist Branch-Scoped Access

**Objective**: Verify receptionist can ONLY see their branch reservations

**Setup**:
1. Create 2 test receptionists (R1, R2)
2. Assign R1 to Branch A, R2 to Branch B
3. Create 3 reservations: 2 for Branch A, 1 for Branch B

**Test Steps**:
```
1. Login as R1 (Branch A receptionist)
2. Navigate to /reception/reservations
3. Expected: See 2 reservations (both for Branch A)
4. Logout, Login as R2 (Branch B receptionist)
5. Navigate to /reception/reservations
6. Expected: See 1 reservation (for Branch B only)
```

**Verification**:
```javascript
// In browser console, check network request:
// GET /reception/reservations

// Should include filter: { branchId: "chi-nhanh-A" }
// Response should ONLY include Branch A reservations
```

**Result**:
- ✅ PASS: R1 sees only Branch A, R2 sees only Branch B
- ❌ FAIL: Either sees all reservations or wrong branch

---

### Test 2: Invoice Amount Calculation

**Objective**: Verify reservation invoice shows correct total amount

**Setup**:
1. Create test reservation:
   - depositAmount: 500,000
   - foodTotal: 340,000
   - foodDiscount: 40,000
   - totalAmount: 800,000 (500k + 340k - 40k)

**Test Steps**:
```
1. Login as receptionist
2. Navigate to /reception/reservations/:id
3. View "HOA DON CHI TIET" section
4. Verify amounts displayed:
   - Tien Coc Ban: 500,000đ
   - Tong Mon An: 340,000đ
   - Khuyen Mai: -40,000đ
   - TONG TIEN HOA DON: 800,000đ
```

**Verification in Database**:
```bash
# Check reservation record:
db.reservations.findOne({ _id: ObjectId(...) })

# Verify:
- depositAmount === 500000
- foodTotal === 340000
- foodDiscount === 40000
- totalAmount === 800000

# ✅ PASS: All amounts match
# ❌ FAIL: Amounts don't add up correctly
```

**Result**:
- ✅ PASS: Invoice shows correct total
- ❌ FAIL: Amounts incorrect or missing

---

### Test 3: Reservation Confirmation & Payment Creation

**Objective**: Verify that confirming reservation creates accurate payment record

**Setup**:
1. Have pending reservation with ID: res-test-123
2. Receptionist ID: rec-test-456
3. Branch ID: branch-test-789

**Test Steps**:
```
1. Login as receptionist
2. Navigate to /reception/reservations/res-test-123
3. Click "XAC NHAN DAT BAN"
4. Verify: Page shows success message
5. Check reservation status changed to "confirmed"
```

**Verification in Database**:
```bash
# After confirmation, verify:

# 1. Reservation status updated:
db.reservations.findOne({ _id: ObjectId("res-test-123") })
# Should show: { status: "confirmed", paymentStatus: "unpaid" }

# 2. Payment record created:
db.payments.findOne({ reservationId: ObjectId("res-test-123") })
# Should show:
{
  reservationId: ObjectId("res-test-123"),
  userId: ObjectId(...),
  branchId: ObjectId("branch-test-789"),  ← Matches reservation branch
  collectedBy: ObjectId("rec-test-456"),  ← Matches receptionist
  amount: 800000,                         ← Matches invoice total
  discount: 40000,
  finalAmount: 800000,
  revenueType: "reception",
  status: "pending",                      ← Not yet "completed"
  createdAt: ISODate(new Date())
}
```

**Result**:
- ✅ PASS: Reservation confirmed, payment record created with correct amounts
- ❌ FAIL: Payment record missing or amounts incorrect

---

### Test 4: Revenue Dashboard Shows Payment

**Objective**: Verify admin can see newly confirmed payment in revenue dashboard

**Setup**:
1. Have just confirmed reservation (from Test 3)
2. Amount: 800,000đ
3. Branch: "Chi Nhanh Test"
4. Receptionist: "Le Tan Test"

**Test Steps**:
```
1. Login as admin
2. Navigate to /admin/revenue
3. Filter to current month
4. Look for "RECEPTION REVENUE" section
5. Verify: "Chi Nhanh Test" shows 800,000đ
6. Verify: "Le Tan Test" shows 800,000đ in receptionist breakdown
```

**Verification in Database**:
```bash
# Admin queries payments:
db.payments.find({
  branchId: ObjectId("branch-test-789"),
  createdAt: { $gte: new Date("2024-03-01"), $lte: new Date("2024-03-31") }
})

# Should return payment with 800,000đ
```

**Result**:
- ✅ PASS: Admin sees correct branch and amount in revenue
- ❌ FAIL: Payment doesn't appear or shows wrong amount/branch

---

### Test 5: Order Confirmation (Dine-in)

**Objective**: Verify walk-in dine-in order creates completed payment

**Setup**:
1. Receptionist creates walk-in dine-in order
2. Amount: 250,000đ
3. Customer pays cash at table

**Test Steps**:
```
1. Receptionist navigates to /reception/orders/:id
2. Clicks "Confirm Order Completed"
3. System marks as completed
4. Verify payment record created with status: "completed"
```

**Verification in Database**:
```bash
db.payments.findOne({ orderId: ObjectId(...) })

# Should show:
{
  status: "completed",         ← Immediately completed, not "pending"
  paidAt: ISODate(...)         ← Timestamp set
  revenueType: "reception",
  amount: 250000
}
```

**Result**:
- ✅ PASS: Payment shows as "completed" immediately
- ❌ FAIL: Payment stuck as "pending"

---

### Test 6: Order Confirmation (COD Takeaway)

**Objective**: Verify COD takeaway order creates pending payment

**Setup**:
1. Customer orders takeaway with COD payment
2. Amount: 350,000đ
3. Shipper will collect during delivery

**Test Steps**:
```
1. Receptionist navigates to /reception/orders/:id
2. Clicks "Confirm Order Completed"
3. System marks as completed but payment as pending
4. Admin sees notification: "Shipper will collect ₫350,000"
```

**Verification in Database**:
```bash
db.payments.findOne({ orderId: ObjectId(...) })

# Should show:
{
  status: "pending",           ← Awaiting shipper collection
  revenueType: "delivery",     ← Treated as delivery
  amount: 350000,
  paidAt: null                 ← Not yet paid
}
```

**Result**:
- ✅ PASS: Payment shows as "pending", awaiting shipper
- ❌ FAIL: Payment marked as "completed" when should be pending

---

## Integration Testing

### Test 7: Complete Workflow - Reservation to Revenue

**Objective**: Full end-to-end test of entire system

**Steps**:

1. **Setup**:
   - Create receptionist "R1" assigned to "Chi Nhanh A"
   - Create customer "C1"
   - Create reservation for C1 at Chi Nhanh A:
     - deposit: 500k
     - food: 340k
     - discount: 40k
     - total: 800k

2. **Receptionist Action**:
   ```
   Login as R1
   View /reception/reservations
   Click on pending reservation
   Verify invoice shows 800,000đ
   Click "Xac Nhan Dat Ban"
   See success message
   ```

3. **Database Verification**:
   ```
   Reservation status: pending → confirmed
   Payment record created with:
   - branchId: Chi Nhanh A
   - collectedBy: R1
   - amount: 800,000
   ```

4. **Admin Verification**:
   ```
   Login as admin
   View /admin/revenue
   Verify under "Chi Nhanh A": 800,000đ (1 transaction)
   Verify under "Le Tan R1": 800,000đ (1 transaction)
   ```

**Result**:
- ✅ PASS: All steps complete, amounts match throughout
- ❌ FAIL: Any step fails or amounts don't match

---

## Security Testing

### Test 8: Cross-Branch Access Prevention

**Objective**: Verify receptionist CANNOT access another branch's data

**Setup**:
1. Receptionist R1 assigned to Branch A
2. Receptionist R2 assigned to Branch B
3. Create reservation for Branch B

**Test Steps**:
```
1. Login as R1 (Branch A)
2. Try to manually navigate to:
   /reception/reservations/reservation-from-branch-b
3. Expected: 404 Not Found or access denied
4. Try API call directly with different branchId
5. Expected: Query returns empty (no data)
```

**Result**:
- ✅ PASS: R1 cannot access Branch B data
- ❌ FAIL: R1 can see or modify Branch B data

---

### Test 9: Payment Amount Integrity

**Objective**: Verify payment amounts cannot be manipulated

**Setup**:
1. Create reservation with totalAmount: 800,000đ
2. Receptionist confirms it

**Test Steps**:
```
1. Directly try to modify payment amount in database
2. Admin should not be able to change amount from frontend
3. Amount should always match reservation.totalAmount
```

**Verification**:
```bash
# Payment created from reservation should have:
db.payments.findOne({ reservationId: ObjectId(...) })

# finalAmount MUST equal reservation.totalAmount
db.reservations.findOne({ _id: ObjectId(...) })

# Both should be: 800,000
```

**Result**:
- ✅ PASS: Payment amounts immutable once created
- ❌ FAIL: Amounts can be changed after creation

---

## Performance Testing

### Test 10: Query Performance

**Objective**: Verify queries execute quickly even with many records

**Test with Data**:
```
- 1,000 reservations total
- 500 for Branch A, 500 for Branch B
- 2,000 payment records

Test Receptionist Query:
db.reservations.find({ branchId: ObjectId("chi-nhanh-a") })

Expected: < 100ms
Verify: Index exists on branchId
```

**Command**:
```bash
db.reservations.getIndexes()
# Should show index on branchId: [[ "branchId", 1 ]]
```

**Result**:
- ✅ PASS: Queries return in < 100ms
- ❌ FAIL: Slow queries, need indexing

---

## Sign-Off Checklist

Before deploying to production:

- [ ] All 10 tests pass
- [ ] No receptionist can cross-branch access
- [ ] Invoice amounts always match reservation totals
- [ ] Payment records create on confirmation
- [ ] Revenue dashboard shows all payments by branch
- [ ] COD payments marked as pending (not completed)
- [ ] Dine-in payments marked as completed immediately
- [ ] Database indexes verified for performance
- [ ] Admin notifications working
- [ ] All amounts correctly formatted (currency)
- [ ] No data integrity issues
- [ ] Security tests pass

---

## Post-Deployment Monitoring

### Daily Checks

```bash
# Check for unmatched payments (data integrity):
db.payments.aggregate([
  {
    $lookup: {
      from: "reservations",
      localField: "reservationId",
      foreignField: "_id",
      as: "reservation"
    }
  },
  {
    $match: {
      "reservation.branchId": { $ne: "$branchId" }
    }
  }
])

# Should return: 0 results
# If returns results: Data integrity issue!
```

### Weekly Reports

```bash
# Weekly revenue verification:
db.payments.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date("2024-03-04"), $lte: new Date("2024-03-10") },
      status: "completed"
    }
  },
  {
    $group: {
      _id: "$branchId",
      total: { $sum: "$finalAmount" },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { total: -1 }
  }
])

# Compare with admin dashboard totals
# Numbers should match exactly
```

---

## Troubleshooting Common Issues

### Issue: Payment Amounts Don't Match

```
Diagnosis:
SELECT p.finalAmount, r.totalAmount 
FROM payments p 
JOIN reservations r ON p.reservationId = r._id
WHERE p.finalAmount != r.totalAmount

If returns results: Data corrupted
Action: Investigate which payment was created incorrectly
```

### Issue: Receptionist Sees All Branches

```
Check: receptionController.getReservations line 416
Verify: const query = { branchId: req.session.user.branchId }
If missing: Add it back!

Check: User record has branchId populated
If missing: Assign branch to user
```

### Issue: Revenue Not Updating

```
Check: Payment records being created? 
db.payments.find({ createdAt: { $gte: new Date(Date.now() - 3600000) } })

Check: revenueController querying with status: "completed"?
Verify: Payment status is "completed" or "pending"
Expected: "completed" payments show in revenue
         "pending" payments NOT in totals
```

---

## Success Indicators

Once all tests pass:

✅ Receptionist can only see their branch  
✅ Invoice amounts calculated correctly  
✅ Confirmations create accurate payment records  
✅ Revenue dashboard shows all payments grouped by branch  
✅ Amounts match from reservation → payment → revenue  
✅ COD orders tracked separately as pending  
✅ System is audit-traceable  
✅ No cross-branch data leakage  
✅ All queries performant  

System is ready for production!
