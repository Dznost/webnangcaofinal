// COMPREHENSIVE DATABASE SCHEMA WITH CONSTRAINTS, TRIGGERS & INTEGRITY RULES
// ============================================================================

/**
 * This file documents the complete MongoDB schema with all:
 * - Data validation rules
 * - Business logic constraints
 * - Referential integrity
 * - Pre/post save hooks
 * - Index strategies
 * - Aggregation pipelines
 */

// ============================================================================
// USER SCHEMA - Core authentication and role management
// ============================================================================

const userSchema = {
  _id: "ObjectId",
  name: {
    type: "String",
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    index: true
  },
  email: {
    type: "String",
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    sparse: true,
    index: true
  },
  password: {
    type: "String",
    required: true,
    minlength: 8,
    select: false // Never return password in queries by default
  },
  phone: {
    type: "String",
    validate: {
      validator: (v) => !v || /^[0-9]{10,11}$/.test(v),
      message: "Invalid phone number"
    }
  },
  address: "String",
  role: {
    type: "String",
    enum: ["user", "admin", "shipper", "staff", "reception"],
    default: "user",
    index: true
  },
  branchId: {
    type: "ObjectId",
    ref: "Branch",
    validate: {
      // If staff/reception, branchId must be set
      validator: function(v) {
        if (["staff", "reception"].includes(this.role)) {
          return v != null;
        }
        return true;
      },
      message: "Staff and reception must have a branch assigned"
    }
  },
  pendingBranchId: {
    type: "ObjectId",
    ref: "Branch"
  },
  branchChangeStatus: {
    type: "String",
    enum: ["none", "pending", "approved", "rejected"],
    default: "none"
  },
  status: {
    type: "String",
    enum: ["active", "inactive", "suspended"],
    default: "active",
    index: true
  },
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  },
  lastLoginAt: "Date",

  // HOOKS:
  // pre('save'): Hash password if modified
  // pre('findOneAndUpdate'): Hash password if updated
  // post('save'): Log user creation in audit trail
  
  // INDEXES:
  // Compound: { email: 1, role: 1 } - Fast auth lookups
  // Compound: { branchId: 1, role: 1 } - Branch staff queries
  // Single: { createdAt: 1 } - User registration timeline
}

// ============================================================================
// BRANCH SCHEMA - Multi-location management
// ============================================================================

const branchSchema = {
  _id: "ObjectId",
  name: {
    type: "String",
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
    index: true
  },
  address: {
    type: "String",
    required: true,
    minlength: 5
  },
  phone: {
    type: "String",
    validate: {
      validator: (v) => !v || /^[0-9]{10,11}$/.test(v)
    }
  },
  email: {
    type: "String",
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  images: ["String"],
  image: "String",
  openingHours: "String",
  description: "String",
  
  // Table management
  totalTables: {
    type: "Number",
    default: 20,
    min: 1,
    max: 1000
  },
  availableTables: {
    type: "Number",
    default: 20,
    validate: {
      validator: function(v) {
        // Can't have more available than total
        return v >= 0 && v <= this.totalTables;
      },
      message: "Available tables must be between 0 and total tables"
    }
  },
  
  dishes: [{
    type: "ObjectId",
    ref: "Dish"
  }],
  
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  },

  // HOOKS:
  // pre('findOneAndUpdate'): Validate availableTables <= totalTables
  // post('save'): Cascade to notify staff if tables changed
  
  // INDEXES:
  // Single: { name: 1 } - Branch lookup
  // Single: { createdAt: 1 } - Branch timeline
}

// ============================================================================
// ORDER SCHEMA - Comprehensive order management
// ============================================================================

const orderSchema = {
  _id: "ObjectId",
  userId: {
    type: "ObjectId",
    ref: "User",
    required: true,
    index: true
  },
  items: [{
    dishId: { type: "ObjectId", ref: "Dish" },
    name: "String",
    quantity: {
      type: "Number",
      required: true,
      min: 1,
      max: 100
    },
    price: {
      type: "Number",
      required: true,
      min: 0
    },
    discount: {
      type: "Number",
      default: 0,
      min: 0,
      validate: {
        validator: function(v) {
          // Discount can't exceed item price
          return v <= this.price;
        }
      }
    }
  }],
  
  orderType: {
    type: "String",
    enum: ["dine-in", "takeaway"],
    required: true,
    index: true
  },
  
  branchId: {
    type: "ObjectId",
    ref: "Branch",
    required: true,
    index: true
  },
  
  guests: {
    type: "Number",
    validate: {
      validator: (v) => !v || (v > 0 && v <= 200),
      message: "Guests must be between 1 and 200"
    }
  },
  
  paymentTiming: {
    type: "String",
    enum: ["prepaid", "cod"],
    default: "prepaid"
  },
  
  totalPrice: {
    type: "Number",
    required: true,
    min: 0
  },
  
  discount: {
    type: "Number",
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v <= this.totalPrice;
      },
      message: "Discount cannot exceed total price"
    }
  },
  
  finalPrice: {
    type: "Number",
    required: true,
    min: 0
  },
  
  shipperId: { type: "ObjectId", ref: "User" },
  staffId: { type: "ObjectId", ref: "User" },
  
  status: {
    type: "String",
    enum: ["pending", "approved", "paid", "processing", "shipping", "delivered", "completed", "cancelled"],
    default: "pending",
    index: true
  },
  
  paymentStatus: {
    type: "String",
    enum: ["unpaid", "paid"],
    default: "unpaid",
    validate: {
      // If COD, paymentStatus can be 'unpaid' even if status is 'completed'
      // If prepaid, must be 'paid' before shipping
      validator: function(v) {
        if (this.paymentTiming === "prepaid" && this.status === "shipping") {
          return v === "paid";
        }
        return true;
      },
      message: "Prepaid orders must be paid before shipping"
    }
  },
  
  paymentMethod: {
    type: "String",
    enum: ["cash", "bank"],
    validate: {
      validator: function(v) {
        // If prepaid, paymentMethod is required
        if (this.paymentTiming === "prepaid") {
          return v != null;
        }
        return true;
      }
    }
  },
  
  deliveryAddress: {
    type: "String",
    validate: {
      validator: function(v) {
        // If takeaway, address is required
        if (this.orderType === "takeaway") {
          return v != null && v.length > 0;
        }
        return true;
      },
      message: "Delivery address required for takeaway orders"
    }
  },
  
  fullName: "String",
  email: {
    type: "String",
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: "String",
    validate: {
      validator: (v) => !v || /^[0-9]{10,11}$/.test(v)
    }
  },
  
  specialRequests: "String",
  largeOrderNote: "String", // For orders > 100M
  
  confirmedBy: { type: "ObjectId", ref: "User" },
  confirmedAt: "Date",
  paidAt: "Date",
  
  rating: {
    type: "Number",
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        // Rating only set after completed
        if (v != null && this.status !== "completed") {
          return false;
        }
        return true;
      }
    }
  },
  ratingComment: "String",
  ratedAt: "Date",
  
  adminNotified: {
    type: "Boolean",
    default: false
  },
  
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true,
    index: true
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  },

  // HOOKS:
  // pre('save'): Validate totalPrice = sum(items), validate discount
  // pre('save'): If status changes to 'shipping' and paymentTiming='prepaid', ensure payment is completed
  // pre('save'): If status='completed' and no payment record exists, create one
  // pre('save'): If orderType='dine-in', decrement branch availableTables
  // pre('save'): If orderType='dine-in' and status='completed', increment availableTables
  // post('save'): Create Notification if status changes to critical states
  // post('save'): Create Payment record if missing

  // CONSTRAINTS:
  // - items array must not be empty
  // - totalPrice must match sum of items
  // - discount cannot exceed totalPrice
  // - finalPrice = totalPrice - discount
  // - shipperId required if orderType='takeaway' and status='shipping'
  // - No duplicate payments for same order

  // INDEXES:
  // Single: { userId: 1, createdAt: -1 }
  // Single: { branchId: 1, status: 1 }
  // Single: { shipperId: 1, status: 1 }
  // Single: { status: 1, createdAt: -1 }
  // Compound: { branchId: 1, status: 1, createdAt: -1 } - Revenue queries
}

// ============================================================================
// RESERVATION SCHEMA - Table booking with pre-ordered items
// ============================================================================

const reservationSchema = {
  _id: "ObjectId",
  userId: {
    type: "ObjectId",
    ref: "User",
    required: true,
    index: true
  },
  branchId: {
    type: "ObjectId",
    ref: "Branch",
    required: true,
    index: true
  },
  date: {
    type: "Date",
    required: true,
    validate: {
      validator: (v) => v >= new Date(),
      message: "Reservation date must be in the future"
    }
  },
  time: {
    type: "String",
    required: true,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
    validate: {
      validator: function(v) {
        const [hour] = v.split(':').map(Number);
        // Business hours typically 10-22
        return hour >= 10 && hour <= 22;
      },
      message: "Reservation must be within business hours (10-22)"
    }
  },
  guests: {
    type: "Number",
    required: true,
    min: 1,
    max: 200,
    validate: {
      validator: function(v) {
        // Guests can't exceed available tables
        // Would need branch info in save hook
        return v > 0;
      }
    }
  },
  specialRequests: "String",
  
  orderItems: [{
    dishId: { type: "ObjectId", ref: "Dish" },
    name: "String",
    quantity: {
      type: "Number",
      min: 0,
      max: 100
    },
    price: {
      type: "Number",
      min: 0
    },
    discount: {
      type: "Number",
      default: 0,
      min: 0
    }
  }],
  
  depositAmount: {
    type: "Number",
    default: 0,
    min: 0
  },
  foodTotal: {
    type: "Number",
    default: 0,
    min: 0
  },
  foodDiscount: {
    type: "Number",
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v <= this.foodTotal;
      },
      message: "Food discount cannot exceed food total"
    }
  },
  totalAmount: {
    type: "Number",
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        // totalAmount = depositAmount + (foodTotal - foodDiscount)
        const calculated = this.depositAmount + (this.foodTotal - this.foodDiscount);
        return Math.abs(v - calculated) < 0.01; // Allow for floating point errors
      },
      message: "Total amount calculation error"
    }
  },
  
  staffId: { type: "ObjectId", ref: "User" },
  
  status: {
    type: "String",
    enum: ["pending", "confirmed", "paid", "processing", "completed", "cancelled"],
    default: "pending",
    index: true
  },
  
  paymentStatus: {
    type: "String",
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },
  
  paymentMethod: {
    type: "String",
    enum: ["cash", "bank"]
  },
  
  paidAt: "Date",
  
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true,
    index: true
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  },

  // HOOKS:
  // pre('save'): Validate totalAmount = depositAmount + (foodTotal - foodDiscount)
  // pre('save'): Validate no overbooking (guests <= available tables at that time)
  // pre('save'): If status='confirmed' and no Payment exists, create one
  // pre('save'): Check for duplicate reservations (same user, branch, date, time)
  // post('save'): Create Notification for branch staff
  // post('save'): Release table slot if cancelled

  // CONSTRAINTS:
  // - date must be future date
  // - time must be within business hours
  // - guests must fit available tables
  // - totalAmount must be calculated correctly
  // - no duplicate reservations per slot
  // - orderItems quantity must be >= 0

  // INDEXES:
  // Compound: { branchId: 1, date: 1, time: 1 } - Booking availability
  // Single: { userId: 1, createdAt: -1 }
  // Single: { status: 1, date: 1 }
}

// ============================================================================
// PAYMENT SCHEMA - Transaction tracking and revenue management
// ============================================================================

const paymentSchema = {
  _id: "ObjectId",
  orderId: {
    type: "ObjectId",
    ref: "Order",
    validate: {
      validator: function(v) {
        // Either orderId or reservationId must be set
        return v != null || this.reservationId != null;
      },
      message: "Either orderId or reservationId must be provided"
    }
  },
  reservationId: {
    type: "ObjectId",
    ref: "Reservation",
    validate: {
      validator: function(v) {
        // Either orderId or reservationId must be set
        return v != null || this.orderId != null;
      },
      message: "Either orderId or reservationId must be provided"
    }
  },
  userId: {
    type: "ObjectId",
    ref: "User",
    required: true,
    index: true
  },
  amount: {
    type: "Number",
    required: true,
    min: 0,
    validate: {
      validator: (v) => v > 0,
      message: "Payment amount must be greater than 0"
    }
  },
  discount: {
    type: "Number",
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v <= this.amount;
      },
      message: "Discount cannot exceed amount"
    }
  },
  finalAmount: {
    type: "Number",
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        const calculated = this.amount - this.discount;
        return Math.abs(v - calculated) < 0.01;
      },
      message: "Final amount calculation error (should be amount - discount)"
    }
  },
  paymentMethod: {
    type: "String",
    enum: ["bank", "cash"],
    required: true
  },
  status: {
    type: "String",
    enum: ["pending", "completed", "failed"],
    default: "pending",
    index: true
  },
  revenueType: {
    type: "String",
    enum: ["delivery", "reception", "dine-in"],
    required: true,
    index: true
  },
  branchId: {
    type: "ObjectId",
    ref: "Branch",
    required: true,
    index: true
  },
  collectedBy: {
    type: "ObjectId",
    ref: "User",
    validate: {
      validator: function(v) {
        // If revenueType='reception', collectedBy must be set
        if (this.revenueType === "reception") {
          return v != null;
        }
        return true;
      },
      message: "Reception payments must specify who collected"
    }
  },
  qrCode: "String",
  transactionId: {
    type: "String",
    index: true,
    sparse: true
  },
  paidAt: "Date",
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true,
    index: true
  },

  // HOOKS:
  // pre('save'): Validate either orderId or reservationId exists
  // pre('save'): Validate finalAmount = amount - discount
  // post('save'): If status='completed', update related order/reservation status
  // post('save'): Create Notification for admin
  // post('save'): Update branch revenue counters

  // CONSTRAINTS:
  // - Either orderId or reservationId must be set (but not both as primary)
  // - amount must be > 0
  // - discount must be < amount
  // - finalAmount = amount - discount
  // - status transitions: pending → completed OR pending → failed
  // - If failed, can create new Payment record
  // - collectedBy required for reception revenue type

  // INDEXES:
  // Single: { orderId: 1, status: 1 }
  // Single: { reservationId: 1, status: 1 }
  // Compound: { branchId: 1, status: 1, createdAt: -1 } - Revenue reports
  // Compound: { branchId: 1, revenueType: 1, status: 1, createdAt: -1 } - Type-specific revenue
  // Compound: { collectedBy: 1, status: 1, createdAt: -1 } - Staff performance
  // TTL: { paidAt: 1 } - Auto-archive after 1 year
}

// ============================================================================
// DISH SCHEMA - Menu items
// ============================================================================

const dishSchema = {
  _id: "ObjectId",
  name: {
    type: "String",
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    index: true
  },
  description: "String",
  price: {
    type: "Number",
    required: true,
    min: 0,
    validate: {
      validator: (v) => v > 0,
      message: "Price must be greater than 0"
    }
  },
  image: "String",
  category: {
    type: "String",
    enum: ["appetizer", "main", "dessert", "beverage"],
    required: true,
    index: true
  },
  discount: {
    type: "Number",
    default: 0,
    min: 0,
    max: 100,
    validate: {
      validator: (v) => v >= 0 && v <= 100,
      message: "Discount must be between 0 and 100%"
    }
  },
  available: {
    type: "Boolean",
    default: true,
    index: true
  },
  event: {
    type: "ObjectId",
    ref: "Event"
  },
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true
  },

  // INDEXES:
  // Single: { category: 1, available: 1 }
  // Single: { name: 1 }
}

// ============================================================================
// NOTIFICATION SCHEMA - Event tracking
// ============================================================================

const notificationSchema = {
  _id: "ObjectId",
  type: {
    type: "String",
    enum: [
      "new_order", "order_assigned", "order_confirmed", "order_shipping",
      "order_completed", "order_cancelled", "order_review",
      "new_reservation", "reservation_assigned", "reservation_confirmed",
      "reservation_completed", "reservation_cancelled",
      "payment_received", "payment_failed",
      "new_user_registration", "shipper_application", "staff_application",
      "branch_change_request", "general", "system_alert"
    ],
    required: true,
    index: true
  },
  category: {
    type: "String",
    enum: ["order", "reservation", "payment", "user", "branch", "system"],
    required: true,
    index: true
  },
  priority: {
    type: "String",
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
    index: true
  },
  orderId: { type: "ObjectId", ref: "Order" },
  reservationId: { type: "ObjectId", ref: "Reservation" },
  branchId: { type: "ObjectId", ref: "Branch" },
  targetUserId: {
    type: "ObjectId",
    ref: "User",
    required: true,
    index: true
  },
  userId: { type: "ObjectId", ref: "User" },
  amount: {
    type: "Number",
    default: 0,
    min: 0
  },
  message: {
    type: "String",
    required: true
  },
  status: {
    type: "String",
    enum: ["pending", "read", "resolved"],
    default: "pending",
    index: true
  },
  createdAt: {
    type: "Date",
    default: "Date.now",
    immutable: true,
    index: true
  },

  // HOOKS:
  // post('save'): Send real-time notification to targetUserId via WebSocket/Socket.io

  // INDEXES:
  // Compound: { targetUserId: 1, status: 1, createdAt: -1 }
  // TTL: { createdAt: 1 } - Auto-delete after 90 days
}

// ============================================================================
// CRITICAL BUSINESS RULES & VALIDATIONS
// ============================================================================

const businessRules = {
  
  // PAYMENT RULES
  payments: {
    rule_1: "Every Order must have exactly one Payment record",
    rule_2: "Every Reservation must have exactly one Payment record",
    rule_3: "COD payments can be 'pending' even after order 'completed'",
    rule_4: "Prepaid orders MUST be paid before status='shipping'",
    rule_5: "Payment.finalAmount = Payment.amount - Payment.discount",
    rule_6: "Payment.status transitions: pending → completed OR pending → failed",
  },

  // ORDER RULES
  orders: {
    rule_1: "Order.totalPrice = SUM(items[*].price * items[*].quantity)",
    rule_2: "Order.finalPrice = Order.totalPrice - Order.discount",
    rule_3: "Order.discount cannot exceed Order.totalPrice",
    rule_4: "Dine-in orders reduce branch.availableTables on confirm",
    rule_5: "Dine-in orders restore branch.availableTables on completion",
    rule_6: "Takeaway orders require valid deliveryAddress",
    rule_7: "Staff/Shipper assignment required for certain statuses",
  },

  // RESERVATION RULES
  reservations: {
    rule_1: "Reservation.totalAmount = depositAmount + (foodTotal - foodDiscount)",
    rule_2: "Reservation.date must be future date",
    rule_3: "Reservation.time must be within business hours (10-22)",
    rule_4: "Reservation.guests cannot exceed available tables at that time",
    rule_5: "No duplicate reservations per date/time slot",
    rule_6: "foodDiscount cannot exceed foodTotal",
    rule_7: "Confirmation requires Payment record creation",
  },

  // BRANCH RULES
  branches: {
    rule_1: "Branch.availableTables <= Branch.totalTables",
    rule_2: "Cannot modify totalTables to less than current reservations",
    rule_3: "All staff must have valid branchId assignment",
  },

  // USER RULES
  users: {
    rule_1: "Staff and reception users MUST have branchId",
    rule_2: "Email must be unique across system",
    rule_3: "Password must be hashed before storage",
    rule_4: "Role change requires branch reassignment for staff roles",
  },

  // DATA CONSISTENCY RULES
  consistency: {
    rule_1: "Payment references (orderId/reservationId) must exist in DB",
    rule_2: "All ObjectId references must point to existing documents",
    rule_3: "Cascade delete: Order/Reservation deletion removes associated Payments",
    rule_4: "No orphaned Payments without Order or Reservation",
    rule_5: "Branch deletion cascades to: Orders, Reservations, Payments, Users",
  }
}

module.exports = {
  userSchema,
  branchSchema,
  orderSchema,
  reservationSchema,
  paymentSchema,
  dishSchema,
  notificationSchema,
  businessRules
}
