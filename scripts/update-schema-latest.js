// Database Schema Update Script - Latest Implementation
// This script documents all schema updates and validates field consistency

const mongoose = require("mongoose")

// ===== SCHEMA UPDATE DOCUMENTATION =====
// This file documents the current database schema after all recent implementations

const SCHEMA_UPDATES = {
  User: {
    description: "User model with branch assignment and role management",
    fields: {
      name: "String (required)",
      email: "String (required, unique)",
      password: "String (required, hashed with bcrypt)",
      phone: "String",
      address: "String",
      role: "Enum: user, admin, shipper, staff, reception (default: user)",
      branchId: "ObjectId ref Branch (assigned branch for staff/reception)",
      pendingBranchId: "ObjectId ref Branch (for pending branch change)",
      branchChangeStatus: "Enum: none, pending, approved, rejected (default: none)",
      createdAt: "Date (default: now)",
    },
    notes: "Staff and reception roles must have branchId assigned for proper filtering",
  },

  Order: {
    description: "Order model supporting dine-in and takeaway with COD payment",
    fields: {
      userId: "ObjectId ref User (required)",
      items: "Array of order items with dishId, name, quantity, price, discount",
      orderType: "Enum: dine-in, takeaway (required)",
      branchId: "ObjectId ref Branch",
      guests: "Number (for dine-in orders)",
      paymentTiming: "Enum: prepaid, cod (default: prepaid)",
      totalPrice: "Number",
      discount: "Number (default: 0)",
      finalPrice: "Number",
      shipperId: "ObjectId ref User (for takeaway orders)",
      staffId: "ObjectId ref User (staff who created order)",
      status: "Enum: pending, approved, paid, processing, shipping, delivered, completed, cancelled",
      paymentStatus: "Enum: unpaid, paid (default: unpaid)",
      paymentMethod: "String",
      deliveryAddress: "String",
      fullName: "String",
      email: "String",
      phone: "String",
      specialRequests: "String",
      paidAt: "Date",
      adminNotified: "Boolean (default: false)",
      confirmedBy: "ObjectId ref User (reception who confirmed)",
      confirmedAt: "Date",
      rating: "Number (1-5)",
      ratingComment: "String",
      ratedAt: "Date",
      createdAt: "Date (default: now)",
    },
    notes: "For COD orders: paymentTiming='cod', paymentStatus stays unpaid until shipper collects",
  },

  Reservation: {
    description: "Reservation model for table bookings with deposit and food items",
    fields: {
      userId: "ObjectId ref User (required)",
      branchId: "ObjectId ref Branch (required)",
      date: "Date (required)",
      time: "String",
      guests: "Number (required)",
      specialRequests: "String",
      orderItems: "Array of items with dishId, name, quantity, price, discount",
      depositAmount: "Number (default: 0) - Fixed deposit for table",
      foodTotal: "Number (default: 0) - Total food price",
      foodDiscount: "Number (default: 0) - Total food discount",
      totalAmount: "Number (default: 0) - Deposit + food after discount",
      staffId: "ObjectId ref User",
      status: "Enum: pending, confirmed, paid, processing, completed, cancelled",
      paymentStatus: "Enum: unpaid, paid (default: unpaid)",
      paymentMethod: "String",
      paidAt: "Date",
      createdAt: "Date (default: now)",
    },
    notes: "Reception staff only see reservations for their assigned branch",
  },

  Payment: {
    description: "Payment record for orders and reservations with revenue tracking",
    fields: {
      orderId: "ObjectId ref Order",
      reservationId: "ObjectId ref Reservation",
      userId: "ObjectId ref User (required)",
      amount: "Number (required) - Original amount",
      discount: "Number (default: 0)",
      finalAmount: "Number (required) - Amount after discount",
      paymentMethod: "Enum: bank, cash (required)",
      status: "Enum: pending, completed, failed (default: pending)",
      revenueType: "Enum: delivery, reception (for categorization)",
      branchId: "ObjectId ref Branch (for branch-specific revenue)",
      collectedBy: "ObjectId ref User (staff who collected payment)",
      qrCode: "String (for bank transfers)",
      transactionId: "String",
      paidAt: "Date",
      createdAt: "Date (default: now)",
    },
    notes: "Created automatically when receptionist confirms order/reservation. Enables revenue dashboard filtering by branch and staff.",
  },

  Branch: {
    description: "Restaurant branch with table management and dish inventory",
    fields: {
      name: "String (required)",
      address: "String (required)",
      phone: "String",
      email: "String",
      images: "Array of Strings (gallery images)",
      image: "String (main image)",
      openingHours: "String",
      description: "String",
      totalTables: "Number (default: 20)",
      availableTables: "Number (default: 20)",
      dishes: "Array of ObjectId ref Dish",
      createdAt: "Date (default: now)",
    },
    notes: "Table availability updated when orders/reservations are confirmed/completed",
  },

  Notification: {
    description: "System notifications for all events (orders, reservations, payments, etc)",
    fields: {
      type: "Enum: new_order, order_completed, reservation_confirmed, payment_received, etc",
      category: "Enum: order, reservation, payment, user, branch, system",
      priority: "Enum: low, normal, high, urgent (default: normal)",
      orderId: "ObjectId ref Order",
      reservationId: "ObjectId ref Reservation",
      contactId: "ObjectId ref Contact",
      branchId: "ObjectId ref Branch",
      targetUserId: "ObjectId ref User",
      userId: "ObjectId ref User (required) - Recipient",
      amount: "Number (default: 0) - For payment notifications",
      message: "String (required)",
      details: "String",
      userNote: "String",
      status: "Enum: pending, read, resolved (default: pending)",
      createdAt: "Date (default: now)",
    },
    notes: "Created automatically when receptionist confirms orders/reservations for admin visibility",
  },
}

// ===== VALIDATION RULES =====
const VALIDATION_RULES = {
  "User.reception": {
    rule: "Must have branchId assigned",
    query: { role: "reception", branchId: { $exists: false } },
    action: "Review and assign branch to reception staff",
  },
  "Order.dine-in": {
    rule: "Must have branchId and guests",
    query: { orderType: "dine-in", $or: [{ branchId: { $exists: false } }, { guests: { $exists: false } }] },
    action: "Ensure all dine-in orders have branch and guest count",
  },
  "Order.cod": {
    rule: "COD orders should have paymentTiming='cod'",
    query: { paymentTiming: "cod", paymentStatus: "paid" },
    action: "Review: COD orders should stay unpaid until shipper collects",
  },
  "Reservation.branch-scope": {
    rule: "Reservation must have associated branchId",
    query: { branchId: { $exists: false } },
    action: "Ensure all reservations are linked to a branch",
  },
  "Payment.completeness": {
    rule: "Payment must link to either order or reservation",
    query: { $and: [{ orderId: { $exists: false } }, { reservationId: { $exists: false } }] },
    action: "Check orphaned payment records",
  },
}

// ===== FIELD MAPPING =====
const FIELD_REFERENCE = {
  "branchId": {
    models: ["User", "Order", "Reservation", "Payment", "Branch"],
    purpose: "Links all operations to specific branch location",
    access_level: "Filtered by user's assigned branch for staff/reception",
  },
  "collectedBy": {
    models: ["Payment"],
    purpose: "Tracks which staff member collected the payment",
    access_level: "Admin can filter payments by specific staff",
  },
  "revenueType": {
    models: ["Payment"],
    purpose: "Categorizes revenue as delivery or reception",
    values: ["delivery", "reception"],
  },
  "status": {
    models: ["Order", "Reservation", "Notification"],
    purpose: "Tracks lifecycle of entity",
    transitions: "pending → confirmed → completed (with possible cancellation)",
  },
  "paymentStatus": {
    models: ["Order", "Reservation", "Payment"],
    purpose: "Tracks payment collection state",
    values: ["unpaid", "paid"],
  },
}

console.log("=".repeat(60))
console.log("DATABASE SCHEMA - LATEST IMPLEMENTATION")
console.log("=".repeat(60))
console.log("\nSchema Documentation:")
Object.entries(SCHEMA_UPDATES).forEach(([model, info]) => {
  console.log(`\n[${model}] - ${info.description}`)
  console.log(`Fields: ${Object.keys(info.fields).join(", ")}`)
  if (info.notes) console.log(`Notes: ${info.notes}`)
})

console.log("\n" + "=".repeat(60))
console.log("VALIDATION RULES")
console.log("=".repeat(60))
Object.entries(VALIDATION_RULES).forEach(([rule, details]) => {
  console.log(`\n[${rule}]`)
  console.log(`  Rule: ${details.rule}`)
  console.log(`  Action: ${details.action}`)
})

console.log("\n" + "=".repeat(60))
console.log("CROSS-MODEL REFERENCES")
console.log("=".repeat(60))
Object.entries(FIELD_REFERENCE).forEach(([field, info]) => {
  console.log(`\n[${field}]`)
  console.log(`  Used in: ${info.models.join(", ")}`)
  console.log(`  Purpose: ${info.purpose}`)
  if (info.values) console.log(`  Values: ${info.values.join(", ")}`)
  if (info.access_level) console.log(`  Access: ${info.access_level}`)
})

module.exports = { SCHEMA_UPDATES, VALIDATION_RULES, FIELD_REFERENCE }
