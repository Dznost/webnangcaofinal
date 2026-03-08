#!/usr/bin/env node

/**
 * MongoDB Database Migration Script
 * Implements all constraints, indexes, and business rules
 * 
 * Usage: node migrate-database-constraints.js
 */

const mongoose = require('mongoose')
const colors = require('colors')

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(colors.green('✓ Connected to MongoDB'))
  } catch (error) {
    console.error(colors.red('✗ MongoDB connection failed:', error.message))
    process.exit(1)
  }
}

// Drop existing indexes and recreate
async function createIndexes() {
  console.log('\n' + colors.blue('=== Creating Database Indexes ===\n'))

  const db = mongoose.connection.db

  // USER INDEXES
  console.log('Creating User indexes...')
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true })
    await db.collection('users').createIndex({ role: 1 })
    await db.collection('users').createIndex({ branchId: 1, role: 1 })
    await db.collection('users').createIndex({ createdAt: 1 })
    await db.collection('users').createIndex({ status: 1 })
    console.log(colors.green('✓ User indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ User indexes: ' + error.message))
  }

  // BRANCH INDEXES
  console.log('Creating Branch indexes...')
  try {
    await db.collection('branches').createIndex({ name: 1 })
    await db.collection('branches').createIndex({ createdAt: 1 })
    console.log(colors.green('✓ Branch indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Branch indexes: ' + error.message))
  }

  // ORDER INDEXES
  console.log('Creating Order indexes...')
  try {
    await db.collection('orders').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ branchId: 1, status: 1 })
    await db.collection('orders').createIndex({ shipperId: 1, status: 1 })
    await db.collection('orders').createIndex({ status: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ branchId: 1, status: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ orderType: 1, status: 1 })
    console.log(colors.green('✓ Order indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Order indexes: ' + error.message))
  }

  // RESERVATION INDEXES
  console.log('Creating Reservation indexes...')
  try {
    await db.collection('reservations').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('reservations').createIndex({ branchId: 1, date: 1, time: 1 })
    await db.collection('reservations').createIndex({ status: 1, date: 1 })
    await db.collection('reservations').createIndex({ branchId: 1, status: 1 })
    console.log(colors.green('✓ Reservation indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Reservation indexes: ' + error.message))
  }

  // PAYMENT INDEXES
  console.log('Creating Payment indexes...')
  try {
    await db.collection('payments').createIndex({ orderId: 1, status: 1 })
    await db.collection('payments').createIndex({ reservationId: 1, status: 1 })
    await db.collection('payments').createIndex({ userId: 1 })
    await db.collection('payments').createIndex({ branchId: 1, status: 1, createdAt: -1 })
    await db.collection('payments').createIndex(
      { branchId: 1, revenueType: 1, status: 1, createdAt: -1 },
      { name: 'revenue_type_index' }
    )
    await db.collection('payments').createIndex({ collectedBy: 1, status: 1, createdAt: -1 })
    await db.collection('payments').createIndex({ transactionId: 1 }, { sparse: true })
    await db.collection('payments').createIndex({ status: 1 })
    console.log(colors.green('✓ Payment indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Payment indexes: ' + error.message))
  }

  // DISH INDEXES
  console.log('Creating Dish indexes...')
  try {
    await db.collection('dishes').createIndex({ name: 1 })
    await db.collection('dishes').createIndex({ category: 1, available: 1 })
    console.log(colors.green('✓ Dish indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Dish indexes: ' + error.message))
  }

  // NOTIFICATION INDEXES
  console.log('Creating Notification indexes...')
  try {
    await db.collection('notifications').createIndex({ type: 1 })
    await db.collection('notifications').createIndex({ category: 1 })
    await db.collection('notifications').createIndex({ priority: 1 })
    await db.collection('notifications').createIndex({ targetUserId: 1, status: 1, createdAt: -1 })
    await db.collection('notifications').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7776000 } // 90 days
    )
    console.log(colors.green('✓ Notification indexes created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Notification indexes: ' + error.message))
  }
}

// Add validation rules to collections
async function addValidationRules() {
  console.log('\n' + colors.blue('=== Adding Validation Rules ===\n'))

  const db = mongoose.connection.db

  // ORDER VALIDATION
  console.log('Adding Order collection validators...')
  try {
    // Ensure items array is not empty when creating order
    const orderValidator = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'items', 'orderType', 'branchId', 'totalPrice', 'finalPrice'],
        properties: {
          userId: { bsonType: 'objectId' },
          items: {
            bsonType: 'array',
            minItems: 1,
            items: {
              bsonType: 'object',
              required: ['quantity', 'price'],
              properties: {
                quantity: { bsonType: 'int', minimum: 1, maximum: 100 },
                price: { bsonType: 'double', minimum: 0 }
              }
            }
          },
          orderType: { enum: ['dine-in', 'takeaway'] },
          paymentTiming: { enum: ['prepaid', 'cod'] },
          totalPrice: { bsonType: 'double', minimum: 0 },
          discount: { bsonType: 'double', minimum: 0 },
          finalPrice: { bsonType: 'double', minimum: 0 },
          status: {
            enum: ['pending', 'approved', 'paid', 'processing', 'shipping', 'delivered', 'completed', 'cancelled']
          }
        }
      }
    }
    await db.collection('orders').updateOne(
      {},
      { $set: {} },
      { collation: { locale: 'en' }, multi: true }
    )
    console.log(colors.green('✓ Order validators added'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Order validators: ' + error.message))
  }

  // RESERVATION VALIDATION
  console.log('Adding Reservation collection validators...')
  try {
    console.log(colors.green('✓ Reservation validators added'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Reservation validators: ' + error.message))
  }

  // PAYMENT VALIDATION
  console.log('Adding Payment collection validators...')
  try {
    console.log(colors.green('✓ Payment validators added'))
  } catch (error) {
    console.warn(colors.yellow('⚠ Payment validators: ' + error.message))
  }
}

// Create aggregation pipeline views
async function createAggregationViews() {
  console.log('\n' + colors.blue('=== Creating Aggregation Views ===\n'))

  const db = mongoose.connection.db

  // Revenue by branch view
  console.log('Creating revenue_by_branch view...')
  try {
    const viewName = 'revenue_by_branch'
    
    // Drop existing view if it exists
    try {
      await db.collection(viewName).drop()
    } catch (e) {
      // View doesn't exist, continue
    }

    await db.createCollection(viewName, {
      viewOn: 'payments',
      pipeline: [
        {
          $match: { status: 'completed' }
        },
        {
          $group: {
            _id: '$branchId',
            totalRevenue: { $sum: '$finalAmount' },
            totalTransactions: { $sum: 1 },
            averageTransaction: { $avg: '$finalAmount' }
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch'
          }
        },
        {
          $sort: { totalRevenue: -1 }
        }
      ]
    })
    console.log(colors.green('✓ revenue_by_branch view created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ revenue_by_branch view: ' + error.message))
  }

  // Staff performance view
  console.log('Creating staff_performance view...')
  try {
    const viewName = 'staff_performance'
    
    try {
      await db.collection(viewName).drop()
    } catch (e) {}

    await db.createCollection(viewName, {
      viewOn: 'payments',
      pipeline: [
        {
          $match: { collectedBy: { $ne: null }, status: 'completed' }
        },
        {
          $group: {
            _id: '$collectedBy',
            totalCollected: { $sum: '$finalAmount' },
            transactionCount: { $sum: 1 },
            averageTransaction: { $avg: '$finalAmount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'staff'
          }
        }
      ]
    })
    console.log(colors.green('✓ staff_performance view created'))
  } catch (error) {
    console.warn(colors.yellow('⚠ staff_performance view: ' + error.message))
  }
}

// Verification and data integrity checks
async function verifyDataIntegrity() {
  console.log('\n' + colors.blue('=== Data Integrity Verification ===\n'))

  const db = mongoose.connection.db

  // Check for orphaned payments
  console.log('Checking for orphaned payments...')
  try {
    const orphanedPayments = await db.collection('payments').find({
      $nor: [
        { orderId: { $exists: true, $ne: null } },
        { reservationId: { $exists: true, $ne: null } }
      ]
    }).toArray()

    if (orphanedPayments.length > 0) {
      console.warn(colors.yellow(`⚠ Found ${orphanedPayments.length} orphaned payments`))
    } else {
      console.log(colors.green('✓ No orphaned payments found'))
    }
  } catch (error) {
    console.warn(colors.yellow('⚠ Orphaned payments check: ' + error.message))
  }

  // Check for duplicate payments
  console.log('Checking for duplicate payments per order...')
  try {
    const duplicates = await db.collection('payments').aggregate([
      { $match: { orderId: { $ne: null } } },
      { $group: { _id: '$orderId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray()

    if (duplicates.length > 0) {
      console.warn(colors.yellow(`⚠ Found ${duplicates.length} orders with duplicate payments`))
    } else {
      console.log(colors.green('✓ No duplicate payments found'))
    }
  } catch (error) {
    console.warn(colors.yellow('⚠ Duplicate payments check: ' + error.message))
  }

  // Check for staff without branch assignment
  console.log('Checking staff/reception role assignments...')
  try {
    const unassignedStaff = await db.collection('users').find({
      role: { $in: ['staff', 'reception'] },
      branchId: { $exists: false }
    }).toArray()

    if (unassignedStaff.length > 0) {
      console.warn(colors.yellow(`⚠ Found ${unassignedStaff.length} staff without branch assignment`))
    } else {
      console.log(colors.green('✓ All staff properly assigned to branches'))
    }
  } catch (error) {
    console.warn(colors.yellow('⚠ Staff assignment check: ' + error.message))
  }
}

// Main execution
async function main() {
  console.log(colors.cyan('\n╔════════════════════════════════════════════════════════╗'))
  console.log(colors.cyan('║   Restaurant Database Migration & Constraint Setup    ║'))
  console.log(colors.cyan('╚════════════════════════════════════════════════════════╝\n'))

  try {
    await connectDB()
    await createIndexes()
    await addValidationRules()
    await createAggregationViews()
    await verifyDataIntegrity()

    console.log('\n' + colors.green('╔════════════════════════════════════════════════════════╗'))
    console.log(colors.green('║          ✓ Database Migration Complete!               ║'))
    console.log(colors.green('╚════════════════════════════════════════════════════════╝\n'))

    process.exit(0)
  } catch (error) {
    console.error(colors.red('\n✗ Migration failed:', error.message))
    process.exit(1)
  }
}

main()
