## RESTAURANT MANAGEMENT SYSTEM - FINAL DATABASE GUIDE

---

## 📁 DATABASE ORGANIZATION STRUCTURE

The database files and documentation are organized as follows:

```
/scripts/
├── database-final-update.js          # Complete schema with all constraints
├── triggers-and-procedures.js        # All triggers and stored procedures
└── [Other database migration files]

/models/
├── User.js                           # User schema with role & branch
├── Order.js                          # Order schema with items & pricing
├── Reservation.js                    # Reservation with deposits & food
├── Payment.js                        # Payment tracking by branch & staff
├── Branch.js                         # Branch with table management
├── Dish.js                           # Menu items with categories
├── Notification.js                   # System notifications
├── Contact.js                        # Contact forms & applications
├── Blog.js                           # Blog posts
└── Event.js                          # Special events

Documentation Files:
├── DATABASE_FINAL_GUIDE.md           # This file
├── COMPREHENSIVE_SYSTEM_MAP.md       # Full system overview
└── SYSTEM_DATA_INDEX.md              # Quick reference index
```

---

## 🗄️ COMPLETE DATA MODELS (10 COLLECTIONS)

### 1. **USER MODEL**
**Purpose**: Authentication, role management, branch assignment

**Core Fields**:
- name (String, required, 2-100 chars)
- email (String, required, unique, validated)
- password (String, required, min 8 chars, hashed)
- phone (String, validated Vietnam format)
- address (String, max 200 chars)
- role (Enum: user, admin, shipper, staff, reception)
- branchId (Reference to Branch - required for staff roles)
- pendingBranchId (For branch change requests)
- branchChangeStatus (none, pending, approved, rejected)
- status (active, inactive, suspended)

**Constraints**:
- Email must be unique and valid format
- Staff roles MUST have branchId
- Password min 8 characters, auto-hashed with bcrypt
- Phone must match Vietnam format: (+84|0)[0-9]{9,10}

**Triggers**:
- Pre-save: Hash password if modified
- Pre-save: Validate role-branch relationship

---

### 2. **BRANCH MODEL**
**Purpose**: Multi-location management, table tracking, revenue

**Core Fields**:
- name (String, required, unique)
- address (String, required)
- phone (String, validated)
- email (String, validated)
- image, images (Gallery)
- openingHours (String)
- description (String)
- totalTables (Number: 1-1000)
- availableTables (Number: 0-totalTables)
- totalRevenue (Number, auto-calculated)
- monthlyRevenue (Number, auto-calculated)
- dishes (Array ref to Dish)

**Constraints**:
- availableTables must be <= totalTables
- availableTables must be >= 0
- totalTables minimum 1, maximum 1000

**Triggers**:
- Post-save: Validate table constraints
- Auto-update: Monthly revenue recalculation
- Notification: Alert when tables < 20%

---

### 3. **ORDER MODEL**
**Purpose**: Track food orders (dine-in, takeaway, delivery)

**Core Fields**:
- userId (Reference, required)
- items[] (Array: dishId, name, quantity, price, discount)
- orderType (Enum: dine-in, takeaway)
- branchId (Reference, required)
- guests (Number)
- paymentTiming (Enum: prepaid, cod)
- totalPrice (Number, min 0)
- discount (Number, 0-100%)
- finalPrice (Number: totalPrice - discount)
- paymentStatus (unpaid, paid)
- paymentMethod (cash, bank, card, online)
- deliveryAddress (String, for takeaway)
- shipperId, staffId (References)
- status (pending → approved → paid → processing → shipping → delivered → completed → cancelled)
- rating (1-5), ratingComment
- confirmedBy, confirmedAt (who confirmed, when)

**Constraints**:
- Items array must have >= 1 item
- finalPrice = totalPrice - discount (auto-calculated)
- quantity: 1-999 per item
- COD only for takeaway (not dine-in)
- Price >= 0

**Validation Rules**:
- Email format validation
- Phone format validation (Vietnam)
- Quantity bounds checking

**Triggers**:
- Pre-save: Auto-calculate finalPrice
- Post-save: Create Payment record automatically
- Post-confirm: Decrease table availability (dine-in)
- Post-confirm: Update branch revenue
- Post-confirm: Create notification

---

### 4. **RESERVATION MODEL**
**Purpose**: Table reservations with pre-ordered food

**Core Fields**:
- userId (Reference, required)
- branchId (Reference, required)
- date (DateTime, must be future)
- time (String: HH:MM format)
- guests (Number: 1-100)
- specialRequests (String)
- orderItems[] (Array: dishId, name, quantity, price, discount)
- depositAmount (Number: >= 0)
- foodTotal (Number: >= 0)
- foodDiscount (Number: >= 0)
- totalAmount (Number: deposit + food - discount)
- staffId (Reference)
- status (pending → confirmed → paid → processing → completed → cancelled)
- paymentStatus (unpaid, paid)
- paymentMethod (cash, bank, card, online)

**Constraints**:
- Date must be in future
- Time format: HH:MM (24-hour)
- Guests: 1-100
- totalAmount = depositAmount + foodTotal - foodDiscount (auto-calc)
- All numeric fields >= 0

**Triggers**:
- Pre-save: Auto-calculate totalAmount
- Pre-save: Validate date is future
- Post-confirm: Create Payment record
- Post-confirm: Create notification
- Post-cancel: Release table availability

---

### 5. **PAYMENT MODEL**
**Purpose**: Revenue tracking, payment management, financial reports

**Core Fields**:
- orderId (Reference, optional)
- reservationId (Reference, optional)
- userId (Reference, required)
- amount (Number, required, >= 0)
- discount (Number, >= 0)
- finalAmount (Number: amount - discount)
- paymentMethod (bank, cash, card, online)
- status (pending, completed, failed)
- revenueType (delivery, reception, dine-in)
- branchId (Reference)
- collectedBy (Reference to User who collected)
- qrCode, transactionId (Optional tracking)
- paidAt (Date when payment completed)

**Constraints**:
- finalAmount = amount - discount (auto-calculated)
- Must have either orderId OR reservationId
- finalAmount >= 0
- revenueType must match source

**Triggers**:
- Pre-save: Auto-calculate finalAmount
- Post-save (status='completed'): Update branch revenue
- Post-save: Create notification to admin

---

### 6. **DISH MODEL**
**Purpose**: Menu management

**Core Fields**:
- name (String, required, max 100)
- description (String, max 500)
- price (Number, required, 0-999999999)
- image (String)
- category (Enum: appetizer, main, dessert, beverage)
- discount (Number: 0-100%)
- available (Boolean, default true)
- event (Reference to Event)

**Constraints**:
- Price >= 0
- Discount 0-100%
- Name max 100 chars
- Category must be one of 4 types

---

### 7. **BRANCH MODEL**
**Purpose**: Branch information and table management

**Fields**: (See Branch section above)

---

### 8. **NOTIFICATION MODEL**
**Purpose**: Real-time alerts and notifications

**Core Fields**:
- type (35+ types: new_order, order_shipping, payment_received, etc.)
- category (order, reservation, payment, user, branch, system)
- priority (low, normal, high, urgent)
- userId (Reference, required - who receives)
- targetUserId (Reference - who triggered it)
- orderId, reservationId, contactId, branchId (References)
- amount (Number)
- message (String, required)
- details (String, optional)
- status (pending, read, resolved)

---

### 9. **CONTACT MODEL**
**Purpose**: Customer feedback, staff applications

**Core Fields**:
- name (String, required, max 100)
- email (String, required, validated)
- phone (String, validated)
- message (String, required, max 1000)
- type (Enum: feedback, shipper_application, staff_application)
- userId (Reference, optional)
- branchId (Reference, optional)
- status (new, read, replied, approved, rejected)
- reply (String, optional)

---

### 10. **OTHER MODELS**
- **Blog**: Blog posts with content
- **Event**: Special events and promotions

---

## 🔒 CONSTRAINTS & VALIDATION RULES

### Field Validation
- **Email**: Must match pattern: `^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$`
- **Phone**: Vietnam format: `^(\+84|0)[0-9]{9,10}$`
- **Time**: HH:MM format: `^([0-1][0-9]|2[0-3]):[0-5][0-9]$`

### Numeric Constraints
- Prices: >= 0 (automatically validated)
- Quantities: 1-999 per item
- Guests: 1-100 per reservation
- Discount: 0-100%
- Rating: 1-5 stars

### Referential Integrity
- Staff roles MUST have branchId (no null)
- Payment must have orderId XOR reservationId
- Orders must have >= 1 item
- All references must point to existing documents

### Business Logic Constraints
- COD payment only for takeaway orders
- Dine-in orders must have branchId
- Reservation date must be in future
- Available tables <= total tables
- finalPrice = totalPrice - discount (auto-enforced)
- totalAmount = deposit + food - discount (auto-enforced)

---

## ⚙️ TRIGGERS & STORED PROCEDURES

### Trigger 1: Auto-Create Payment on Order Confirm
```
When: Order confirmed
Action: Auto-create Payment record with exact amounts
Ensures: Revenue tracking matches order confirmation
```

### Trigger 2: Auto-Create Payment on Reservation Confirm
```
When: Reservation confirmed
Action: Auto-create Payment record
Ensures: Reservation amounts tracked for revenue
```

### Trigger 3: Update Table Availability
```
When: Dine-in order/reservation confirmed/cancelled
Action: Decrease/increase availableTables
Ensures: Real-time table tracking accuracy
```

### Trigger 4: Auto-Create Notifications
```
When: Important status changes (payment, order, reservation)
Action: Create notification for admin/staff
Ensures: Real-time alerts for business operations
```

### Trigger 5: Update Branch Revenue
```
When: Payment marked as completed
Action: Recalculate totalRevenue, monthlyRevenue
Ensures: Financial data always current
```

### Trigger 6: Validate Order Totals
```
When: Order saved
Action: Verify total = sum(items), final = total - discount
Ensures: No calculation errors in orders
```

### Trigger 7: Validate Reservation Totals
```
When: Reservation saved
Action: Verify total = deposit + food - discount
Ensures: No calculation errors in reservations
```

### Stored Procedure 1: Get Branch Revenue Report
```
Returns: Total revenue, breakdown by staff, by payment type, date range
Used for: Financial reporting, performance analysis
```

### Stored Procedure 2: Get Staff Performance
```
Returns: Money collected, transaction count, avg transaction, by branch
Used for: Staff KPI, incentive calculation
```

### Stored Procedure 3: Check Data Integrity
```
Returns: Any mismatches, orphaned records, calculation errors
Used for: Daily/weekly data quality checks
```

---

## 🔍 QUICK REFERENCE

### Key Relationships
```
User
├── branchId → Branch
├── (Orders as userId)
├── (Reservations as userId)
└── (Payments as collectedBy/userId)

Branch
├── ← Staff, Shipper, Reception (via branchId)
├── dishes[] → Dish
├── (Orders via branchId)
├── (Reservations via branchId)
└── (Payments via branchId)

Order
├── userId → User
├── items[].dishId → Dish
├── branchId → Branch
├── shipperId → User
├── staffId → User
├── confirmedBy → User
└── (Payment created with orderId)

Reservation
├── userId → User
├── branchId → Branch
├── orderItems[].dishId → Dish
├── staffId → User
└── (Payment created with reservationId)

Payment
├── orderId → Order
├── reservationId → Reservation
├── userId → User
├── branchId → Branch
└── collectedBy → User
```

### Status Flow Diagrams

**Order Status**:
```
pending → approved → paid → processing → shipping → delivered → completed
    ↓                                                              ↓
    └─ cancelled ───────────────────────────────────────────────→ X
```

**Reservation Status**:
```
pending → confirmed → paid → processing → completed
   ↓                                          ↓
   └─ cancelled ─────────────────────────────→ X
```

**Payment Status**:
```
pending → completed
   ↓
   └─ failed
```

---

## 📊 INDEX STRATEGIES

Create these indexes for performance:

```javascript
// User indexes
db.users.createIndex({ email: 1 })
db.users.createIndex({ branchId: 1 })
db.users.createIndex({ role: 1 })

// Order indexes
db.orders.createIndex({ userId: 1 })
db.orders.createIndex({ branchId: 1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: 1 })
db.orders.createIndex({ branchId: 1, createdAt: -1 })

// Reservation indexes
db.reservations.createIndex({ userId: 1 })
db.reservations.createIndex({ branchId: 1 })
db.reservations.createIndex({ date: 1 })
db.reservations.createIndex({ branchId: 1, date: 1 })

// Payment indexes
db.payments.createIndex({ userId: 1 })
db.payments.createIndex({ branchId: 1 })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ paidAt: 1 })
db.payments.createIndex({ branchId: 1, status: 1, paidAt: 1 })

// Notification indexes
db.notifications.createIndex({ userId: 1 })
db.notifications.createIndex({ status: 1 })
db.notifications.createIndex({ createdAt: -1 })
```

---

## 🚀 IMPLEMENTATION CHECKLIST

- [x] All 10 models with complete validation
- [x] 45+ field-level validation rules
- [x] 35+ business logic constraints
- [x] 7 trigger implementations
- [x] 3 stored procedures
- [x] Referential integrity enforced
- [x] Auto-calculation triggers
- [x] Revenue tracking integration
- [x] Payment auto-creation
- [x] Table availability management
- [x] Data integrity checks

---

## 📖 DOCUMENT FILES

See also:
- `/scripts/database-final-update.js` - Complete model definitions
- `/scripts/triggers-and-procedures.js` - All trigger and procedure code
- `/COMPREHENSIVE_SYSTEM_MAP.md` - Full system architecture
- `/SYSTEM_DATA_INDEX.md` - Quick reference index
