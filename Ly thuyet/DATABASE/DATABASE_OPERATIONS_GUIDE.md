# MongoDB Database Operations Guide
## Comprehensive Summary of All Database Operations

---

## 📑 Table of Contents
1. [Data Models Overview](#data-models-overview)
2. [CREATE Operations](#create-operations)
3. [READ Operations](#read-operations)
4. [UPDATE Operations](#update-operations)
5. [DELETE Operations](#delete-operations)
6. [FILTER & QUERY Conditions](#filter--query-conditions)
7. [AGGREGATION Operations](#aggregation-operations)
8. [Custom Hooks & Pre-save Methods](#custom-hooks--pre-save-methods)

---

## Data Models Overview

### 1. **User Model** (`/models/User.js`)
**Collection**: `users`

**Fields**:
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required) - hashed with bcrypt
- `phone` (String)
- `address` (String)
- `role` (String, enum: "user", "admin", "shipper", "staff", "reception")
- `branchId` (ObjectId, ref: "Branch")
- `pendingBranchId` (ObjectId, ref: "Branch")
- `branchChangeStatus` (String, enum: "none", "pending", "approved", "rejected")
- `createdAt` (Date, default: current date)

**Indexes**: 
- Unique index on `email`

---

### 2. **Dish Model** (`/models/Dish.js`)
**Collection**: `dishes`

**Fields**:
- `name` (String)
- `description` (String)
- `price` (Number)
- `image` (String)
- `category` (String)
- `discount` (Number)
- `createdAt` (Date)

---

### 3. **Branch Model** (`/models/Branch.js`)
**Collection**: `branches`

**Fields**:
- `name` (String)
- `address` (String)
- `phone` (String)
- `email` (String)
- `image` (String)
- `images` (Array of Strings)
- `openingHours` (String)
- `description` (String)
- `totalTables` (Number)
- `availableTables` (Number)
- `dishes` (Array of ObjectIds, ref: "Dish")
- `createdAt` (Date)

---

### 4. **Order Model** (`/models/Order.js`)
**Collection**: `orders`

**Fields**:
- `userId` (ObjectId, ref: "User", required)
- `items` (Array)
  - `dishId` (ObjectId, ref: "Dish")
  - `name` (String)
  - `quantity` (Number)
  - `price` (Number)
  - `discount` (Number)
- `orderType` (String, enum: ["dine-in", "takeaway"], required)
- `branchId` (ObjectId, ref: "Branch")
- `guests` (Number)
- `paymentTiming` (String, enum: ["prepaid", "cod"], default: "prepaid")
- `totalPrice` (Number)
- `discount` (Number)
- `finalPrice` (Number)
- `shipperId` (ObjectId, ref: "User")
- `staffId` (ObjectId, ref: "User")
- `status` (String, enum: ["pending", "approved", "paid", "processing", "shipping", "delivered", "completed", "cancelled"])
- `paymentStatus` (String, enum: ["unpaid", "paid"])
- `paymentMethod` (String)
- `deliveryAddress` (String)
- `fullName` (String)
- `email` (String)
- `phone` (String)
- `specialRequests` (String)
- `paidAt` (Date)
- `adminNotified` (Boolean, default: false)
- `largeOrderNote` (String)
- `confirmedBy` (ObjectId, ref: "User")
- `confirmedAt` (Date)
- `rating` (Number, 1-5)
- `ratingComment` (String)
- `ratedAt` (Date)
- `createdAt` (Date)

---

### 5. **Reservation Model** (`/models/Reservation.js`)
**Collection**: `reservations`

**Fields**:
- `userId` (ObjectId, ref: "User")
- `branchId` (ObjectId, ref: "Branch")
- `date` (Date)
- `time` (String)
- `guests` (Number)
- `guestName` (String)
- `phone` (String)
- `email` (String)
- `status` (String, enum: ["pending", "confirmed", "cancelled"])
- `notes` (String)
- `createdAt` (Date)

---

### 6. **Event Model** (`/models/Event.js`)
**Collection**: `events`

**Fields**:
- `title` (String)
- `description` (String)
- `image` (String)
- `discount` (Number)
- `startDate` (Date)
- `endDate` (Date)
- `discountScope` (String, enum: ["global", "branch", "dish"])
- `branches` (Array of ObjectIds, ref: "Branch")
- `dishes` (Array of ObjectIds, ref: "Dish")
- `createdAt` (Date)

---

### 7. **Blog Model** (`/models/Blog.js`)
**Collection**: `blogs`

**Fields**:
- `title` (String)
- `content` (String)
- `image` (String)
- `author` (String)
- `createdAt` (Date)

---

### 8. **Contact Model** (`/models/Contact.js`)
**Collection**: `contacts`

**Fields**:
- `name` (String)
- `email` (String)
- `phone` (String)
- `subject` (String)
- `message` (String)
- `type` (String)
- `status` (String, enum: ["new", "read", "replied"])
- `reply` (String)
- `createdAt` (Date)
- `updatedAt` (Date)

---

### 9. **Payment Model** (`/models/Payment.js`)
**Collection**: `payments`

**Fields**:
- `userId` (ObjectId, ref: "User")
- `orderId` (ObjectId, ref: "Order")
- `reservationId` (ObjectId, ref: "Reservation")
- `amount` (Number)
- `finalAmount` (Number)
- `discount` (Number)
- `paymentMethod` (String)
- `status` (String, enum: ["pending", "completed", "failed"])
- `revenueType` (String, enum: ["delivery", "dine-in", "reservation"])
- `paidAt` (Date)
- `createdAt` (Date)

---

### 10. **Notification Model** (`/models/Notification.js`)
**Collection**: `notifications`

**Fields**:
- `type` (String)
- `category` (String)
- `priority` (String, enum: ["normal", "high", "urgent"])
- `title` (String)
- `message` (String)
- `status` (String, enum: ["pending", "read"])
- `userId` (ObjectId, ref: "User")
- `relatedId` (ObjectId)
- `createdAt` (Date)

---

## CREATE Operations

### User Creation
```javascript
// Route: POST /auth/register
const user = new User({ 
  name, 
  email, 
  password,  // Will be hashed by pre-save hook
  phone, 
  address,
  role: "user"  // Default role
})
await user.save()
```

### Dish Creation
```javascript
// Route: POST /admin/dish
const dish = new Dish({ 
  name, 
  description, 
  price, 
  image, 
  category, 
  discount 
})
await dish.save()
```

### Branch Creation
```javascript
// Route: POST /admin/branch
const branch = new Branch({ 
  name, 
  address, 
  phone, 
  email, 
  image, 
  images: imagesArray,
  openingHours, 
  description,
  totalTables: totalTables || 20,
  availableTables: totalTables || 20,
  dishes: dishesArray
})
await branch.save()
```

### Order Creation
```javascript
// Route: POST /user/order
const order = new Order({
  userId,
  items: [...],
  orderType,
  branchId,
  guests,
  paymentTiming,
  totalPrice,
  discount,
  finalPrice,
  status: "pending",
  paymentStatus: "unpaid",
  deliveryAddress,
  fullName,
  email,
  phone,
  specialRequests
})
await order.save()
```

### Reservation Creation
```javascript
// Route: POST /user/reservation
const reservation = new Reservation({
  userId,
  branchId,
  date,
  time,
  guests,
  guestName,
  phone,
  email,
  status: "pending",
  notes
})
await reservation.save()
```

### Event Creation
```javascript
// Route: POST /admin/event
const event = new Event({
  title,
  description,
  image,
  discount,
  startDate,
  endDate,
  discountScope,
  branches: branchesArray,
  dishes: dishesArray
})
await event.save()
```

### Blog Creation
```javascript
// Route: POST /admin/blog
const blog = new Blog({
  title,
  content,
  image,
  author
})
await blog.save()
```

### Contact/Feedback Creation
```javascript
// Route: POST /public/contact
const contact = new Contact({
  name,
  email,
  phone,
  subject,
  message,
  type,
  status: "new"
})
await contact.save()
```

### Payment Creation
```javascript
// Route: POST /user/payment
const payment = new Payment({
  userId,
  orderId,
  reservationId,
  amount,
  finalAmount,
  discount,
  paymentMethod,
  status: "pending",
  revenueType
})
await payment.save()
```

---

## READ Operations

### Count Operations
```javascript
// Get total counts
const dishCount = await Dish.countDocuments()
const branchCount = await Branch.countDocuments()
const userCount = await User.countDocuments({ role: "user" })
const eventCount = await Event.countDocuments()
const reservationCount = await Reservation.countDocuments()
const orderCount = await Order.countDocuments()
const blogCount = await Blog.countDocuments()

// Count by filters
const todayOrders = await Order.countDocuments({ 
  createdAt: { $gte: today, $lt: tomorrow } 
})
const pendingOrders = await Order.countDocuments({ status: "pending" })
const shippingOrders = await Order.countDocuments({ status: "shipping" })
const pendingReservations = await Reservation.countDocuments({ status: "pending" })
const newContacts = await Contact.countDocuments({ status: "new" })
```

### Find All Operations
```javascript
const dishes = await Dish.find()
const branches = await Branch.find()
const events = await Event.find()
const blogs = await Blog.find().sort({ createdAt: -1 })
const users = await User.find({ role: "user" }).sort({ createdAt: -1 })
const orders = await Order.find().sort({ createdAt: -1 })
  .populate("userId")
  .populate("items.dishId")
const reservations = await Reservation.find().sort({ createdAt: -1 })
  .populate("userId")
  .populate("branchId")
const contacts = await Contact.find().sort({ createdAt: -1 })
```

### Find One Operations
```javascript
// By ID
const dish = await Dish.findById(req.params.id)
const branch = await Branch.findById(req.params.id).populate("dishes")
const order = await Order.findById(req.params.id)
  .populate("userId")
  .populate("items.dishId")
const user = await User.findById(req.params.id)

// By custom field
const userByEmail = await User.findOne({ email })
```

### Find with Limits and Sorting
```javascript
// Recent orders (last 5)
const recentOrders = await Order.find()
  .sort({ createdAt: -1 })
  .limit(5)
  .populate("userId")

// Recent reservations (last 5)
const recentReservations = await Reservation.find()
  .sort({ createdAt: -1 })
  .limit(5)
  .populate("userId")
  .populate("branchId")

// Home page featured dishes (first 6)
const dishes = await Dish.find().limit(6)
```

### Find with Population/Relationships
```javascript
const branchWithDishes = await Branch.findById(id).populate("dishes")
const orderWithItems = await Order.findById(id)
  .populate("userId")
  .populate("items.dishId")
const eventWithBranches = await Event.findById(id)
  .populate("branches")
  .populate("dishes")
```

---

## UPDATE Operations

### Dish Update
```javascript
// Route: POST /admin/dish/:id
await Dish.findByIdAndUpdate(req.params.id, { 
  name, 
  description, 
  price, 
  image, 
  category, 
  discount 
})
```

### Branch Update
```javascript
// Route: POST /admin/branch/:id
await Branch.findByIdAndUpdate(req.params.id, { 
  name, 
  address, 
  phone, 
  email, 
  image,
  images: imagesArray,
  openingHours, 
  description,
  totalTables,
  availableTables,
  dishes: dishesArray
})
```

### Event Update
```javascript
// Route: POST /admin/event/:id
await Event.findByIdAndUpdate(req.params.id, { 
  title, 
  description, 
  image, 
  discount, 
  startDate, 
  endDate,
  discountScope,
  branches: branchesArray,
  dishes: dishesArray
})
```

### Blog Update
```javascript
// Route: POST /admin/blog/:id
await Blog.findByIdAndUpdate(req.params.id, { 
  title, 
  content, 
  image, 
  author 
})
```

### Order Status Update
```javascript
// Route: POST /admin/order/:id/status
await Order.findByIdAndUpdate(req.params.id, { status })
```

### Order Payment Confirmation (COD)
```javascript
// Route: POST /admin/order/:id/complete-cod
const order = await Order.findById(req.params.id)
if (order.paymentTiming === "cod") {
  order.status = "completed"
  order.paymentStatus = "paid"
  order.paymentMethod = "cash"
  order.paidAt = new Date()
  await order.save()
}
```

### Reservation Status Update
```javascript
// Route: POST /admin/reservation/:id/status
await Reservation.findByIdAndUpdate(req.params.id, { status })
```

### Contact Reply
```javascript
// Route: POST /admin/contact/:id/reply
await Contact.findByIdAndUpdate(req.params.id, { 
  reply, 
  status: "replied" 
})
```

### Notification Status Update
```javascript
// Mark notification as read
await Notification.findByIdAndUpdate(req.params.id, { status: "read" })
```

### Contact Status Update (to read)
```javascript
// Mark contact as read
if (contact.status === "new") {
  contact.status = "read"
  await contact.save()
}
```

---

## DELETE Operations

### Dish Deletion
```javascript
// Route: GET /admin/dish/:id/delete
await Dish.findByIdAndDelete(req.params.id)
```

### Branch Deletion
```javascript
// Route: GET /admin/branch/:id/delete
await Branch.findByIdAndDelete(req.params.id)
```

### Event Deletion
```javascript
// Route: GET /admin/event/:id/delete
await Event.findByIdAndDelete(req.params.id)
```

### Blog Deletion
```javascript
// Route: GET /admin/blog/:id/delete
await Blog.findByIdAndDelete(req.params.id)
```

### User Deletion
```javascript
// Route: GET /admin/user/:id/delete
await User.findByIdAndDelete(req.params.id)
```

### Contact Deletion
```javascript
// Route: GET /admin/contact/:id/delete
await Contact.findByIdAndDelete(req.params.id)
```

---

## FILTER & QUERY Conditions

### User Filters
```javascript
// By role
User.find({ role: "user" })
User.find({ role: "shipper" })
User.find({ role: "staff" })
User.find({ role: "reception" })
User.find({ role: "admin" })

// By email
User.findOne({ email })

// By branch
User.find({ branchId: branchId })

// Pending branch changes
User.find({ branchChangeStatus: "pending" })
```

### Order Filters
```javascript
// By status
Order.find({ status: "pending" })
Order.find({ status: "shipping" })
Order.find({ status: "completed" })
Order.find({ $in: ["pending", "confirmed", "processing", "shipping"] })

// By date range
Order.find({ 
  createdAt: { $gte: startDate, $lte: endDate } 
})

// By payment timing
Order.find({ paymentTiming: "cod" })
Order.find({ paymentTiming: "prepaid" })

// By shipping status with shipper
Order.find({ 
  status: "shipping", 
  shipperId: { $ne: null } 
})

// By user
Order.find({ userId: userId })

// Completed COD orders
Order.find({
  paymentTiming: "cod",
  status: "completed",
  paidAt: { $gte: startDate, $lte: endDate }
})
```

### Reservation Filters
```javascript
// By status
Reservation.find({ status: "pending" })
Reservation.find({ status: "confirmed" })
Reservation.find({ status: "cancelled" })

// By user
Reservation.find({ userId: userId })

// By date range
Reservation.find({ 
  createdAt: { $gte: startDate, $lte: endDate } 
})

// By branch
Reservation.find({ branchId: branchId })
```

### Event Filters
```javascript
// Active events for a branch
Event.find({
  branchId: { $in: [branchId] },
  startDate: { $lte: now },
  endDate: { $gte: now }
})

// Future events
Event.find({
  startDate: { $gt: now }
})
```

### Contact Filters
```javascript
// By status
Contact.find({ status: "new" })
Contact.find({ status: "read" })
Contact.find({ status: "replied" })

// By type
Contact.find({ type: "shipper_application" })
Contact.find({ type: "staff_application" })

// By date range
Contact.find({
  createdAt: { $gte: startDate, $lte: endDate }
})
```

### Payment Filters
```javascript
// Completed payments
Payment.find({
  status: "completed",
  paidAt: { $gte: startDate, $lte: endDate }
})
  .populate("orderId")
  .populate("reservationId")
  .populate("userId")

// By user
Payment.find({ userId: userId })

// By order
Payment.find({ orderId: orderId })

// By payment method
Payment.find({ paymentMethod: "bank" })
Payment.find({ paymentMethod: "cash" })

// By revenue type
Payment.find({ revenueType: "delivery" })
Payment.find({ revenueType: "dine-in" })
Payment.find({ revenueType: "reservation" })
```

---

## AGGREGATION Operations

### Top Shippers by Revenue (Monthly)
```javascript
// Route: GET /admin/revenue (dashboard)
const topShippers = await Payment.aggregate([
  { 
    $match: { 
      revenueType: "delivery", 
      status: "completed", 
      createdAt: { $gte: monthStart } 
    } 
  },
  {
    $group: {
      _id: "$shipperId",
      total: { $sum: "$finalAmount" }
    }
  },
  { $sort: { total: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "shipper"
    }
  }
])
```

---

## Custom Hooks & Pre-save Methods

### User Password Hashing Hook
**File**: `/models/User.js`

```javascript
// Pre-save hook: Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Method: Compare password for authentication
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}
```

**Usage**:
```javascript
// Registration
const user = new User({ name, email, password })
await user.save()  // Hook automatically hashes password

// Login
const user = await User.findOne({ email })
const isPasswordValid = await user.comparePassword(inputPassword)
```

---

## Index Definitions

### Unique Indexes
- `users.email` - Ensures email uniqueness across users

### Time-based Queries (for optimization)
- `orders.createdAt` - For sorting and filtering by date
- `reservations.createdAt` - For recent data queries
- `contacts.createdAt` - For activity tracking
- `payments.paidAt` - For revenue calculations

---

## Summary of Database Operations

| Operation Type | Count | Collections Affected |
|---|---|---|
| CREATE | 8 | User, Dish, Branch, Order, Reservation, Event, Blog, Contact, Payment |
| READ (Find) | 15+ | All collections |
| READ (Count) | 12+ | All collections |
| UPDATE | 8 | Dish, Branch, Event, Blog, Order, Reservation, Contact, Notification |
| DELETE | 6 | Dish, Branch, Event, Blog, User, Contact |
| FILTER | 20+ | Order, Reservation, User, Event, Contact, Payment |
| AGGREGATION | 1 | Payment (with relationship to User) |
| HOOKS | 2 | User (password hashing) |

---

## Query Performance Tips

1. **Always use `.populate()` when needed** - Reduces N+1 query problems
2. **Use `.sort({ createdAt: -1 })` for recent items** - Ensures latest data first
3. **Use `.limit()` for large datasets** - Improves response time
4. **Use conditional filters** with `$in` operator for multiple status checks
5. **Cache frequently accessed data** - Like dish counts, user roles
6. **Use date range queries** with `$gte` and `$lte` for time-based data

---

## Date Range Query Pattern
```javascript
const startDate = new Date(year, month - 1, 1)  // First day of month
const endDate = new Date(year, month, 0, 23, 59, 59)  // Last day of month

// Query with date range
const data = await Collection.find({
  createdAt: { $gte: startDate, $lte: endDate }
})
```

---

Generated: 2026
Last Updated: Database Schema v1.0
