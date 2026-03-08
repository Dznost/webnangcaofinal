// ==========================================
// DATABASE TRIGGERS AND PROCEDURES
// Complete implementation guide
// ==========================================

/**
 * ========================================
 * TRIGGER 1: AUTO-CREATE PAYMENT ON ORDER
 * ========================================
 * When an order is confirmed, automatically create a Payment record
 */
const createPaymentTriggerOnOrderConfirm = async (orderId) => {
  const Order = require('../models/Order');
  const Payment = require('../models/Payment');
  
  try {
    const order = await Order.findById(orderId);
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId: orderId });
    if (existingPayment) {
      console.log(`[TRIGGER] Payment already exists for order ${orderId}`);
      return;
    }
    
    // Create new payment record
    const payment = new Payment({
      orderId: order._id,
      userId: order.userId,
      amount: order.totalPrice,
      discount: order.discount,
      finalAmount: order.finalPrice,
      paymentMethod: order.paymentMethod || 'cash',
      status: order.paymentStatus === 'paid' ? 'completed' : 'pending',
      revenueType: order.orderType === 'dine-in' ? 'reception' : 'delivery',
      branchId: order.branchId,
      collectedBy: order.confirmedBy,
      paidAt: order.paidAt || null
    });
    
    await payment.save();
    console.log(`[TRIGGER] Payment created for order ${orderId}`);
  } catch (error) {
    console.error(`[TRIGGER ERROR] Failed to create payment for order ${orderId}:`, error);
  }
};

/**
 * ========================================
 * TRIGGER 2: AUTO-CREATE PAYMENT ON RESERVATION CONFIRM
 * ========================================
 * When a reservation is confirmed, automatically create a Payment record
 */
const createPaymentTriggerOnReservationConfirm = async (reservationId) => {
  const Reservation = require('../models/Reservation');
  const Payment = require('../models/Payment');
  
  try {
    const reservation = await Reservation.findById(reservationId);
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ reservationId: reservationId });
    if (existingPayment) {
      console.log(`[TRIGGER] Payment already exists for reservation ${reservationId}`);
      return;
    }
    
    // Create new payment record
    const payment = new Payment({
      reservationId: reservation._id,
      userId: reservation.userId,
      amount: reservation.totalAmount,
      discount: reservation.foodDiscount,
      finalAmount: reservation.totalAmount,
      paymentMethod: reservation.paymentMethod || 'cash',
      status: reservation.paymentStatus === 'paid' ? 'completed' : 'pending',
      revenueType: 'reception',
      branchId: reservation.branchId,
      collectedBy: reservation.staffId,
      paidAt: reservation.paidAt || null
    });
    
    await payment.save();
    console.log(`[TRIGGER] Payment created for reservation ${reservationId}`);
  } catch (error) {
    console.error(`[TRIGGER ERROR] Failed to create payment for reservation ${reservationId}:`, error);
  }
};

/**
 * ========================================
 * TRIGGER 3: UPDATE TABLE AVAILABILITY
 * ========================================
 * When order/reservation is confirmed, decrease available tables
 * When order/reservation is cancelled, increase available tables
 */
const updateTableAvailabilityTrigger = async (branchId, action) => {
  const Branch = require('../models/Branch');
  
  try {
    const branch = await Branch.findById(branchId);
    
    if (action === 'occupy') {
      // Decrease available tables
      if (branch.availableTables > 0) {
        branch.availableTables -= 1;
      } else {
        console.warn(`[TRIGGER WARNING] No available tables at branch ${branchId}`);
      }
    } else if (action === 'release') {
      // Increase available tables
      if (branch.availableTables < branch.totalTables) {
        branch.availableTables += 1;
      }
    }
    
    await branch.save();
    console.log(`[TRIGGER] Table availability updated for branch ${branchId}. Available: ${branch.availableTables}/${branch.totalTables}`);
  } catch (error) {
    console.error(`[TRIGGER ERROR] Failed to update table availability for branch ${branchId}:`, error);
  }
};

/**
 * ========================================
 * TRIGGER 4: AUTO-CREATE NOTIFICATION
 * ========================================
 * When order/reservation status changes, create notification
 */
const createNotificationTrigger = async (type, targetUserId, details) => {
  const Notification = require('../models/Notification');
  const User = require('../models/User');
  
  try {
    // Find admin users
    const admins = await User.find({ role: 'admin' });
    
    // Create notification for each admin
    for (const admin of admins) {
      const notification = new Notification({
        type: type,
        userId: admin._id,
        targetUserId: targetUserId || null,
        message: details.message,
        amount: details.amount || 0,
        category: details.category,
        priority: details.priority || 'normal',
        orderId: details.orderId || null,
        reservationId: details.reservationId || null,
        branchId: details.branchId || null
      });
      
      await notification.save();
    }
    
    console.log(`[TRIGGER] Notification created for type: ${type}`);
  } catch (error) {
    console.error(`[TRIGGER ERROR] Failed to create notification for type ${type}:`, error);
  }
};

/**
 * ========================================
 * TRIGGER 5: BRANCH REVENUE AUTO-UPDATE
 * ========================================
 * When payment is completed, update branch revenue
 */
const updateBranchRevenueTrigger = async (branchId, amount) => {
  const Branch = require('../models/Branch');
  
  try {
    const branch = await Branch.findById(branchId);
    
    branch.totalRevenue = (branch.totalRevenue || 0) + amount;
    
    // Calculate monthly revenue (current month only)
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const Payment = require('../models/Payment');
    const monthlyPayments = await Payment.find({
      branchId: branchId,
      status: 'completed',
      paidAt: { $gte: currentMonth }
    });
    
    const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.finalAmount, 0);
    branch.monthlyRevenue = monthlyTotal;
    
    await branch.save();
    console.log(`[TRIGGER] Branch revenue updated. Total: ${branch.totalRevenue}, Monthly: ${branch.monthlyRevenue}`);
  } catch (error) {
    console.error(`[TRIGGER ERROR] Failed to update branch revenue for branch ${branchId}:`, error);
  }
};

/**
 * ========================================
 * TRIGGER 6: VALIDATE ORDER TOTALS
 * ========================================
 * Before saving, verify order calculation is correct
 */
const validateOrderTotalsTrigger = (order) => {
  // Calculate expected total from items
  const calculatedTotal = order.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  if (Math.abs(calculatedTotal - order.totalPrice) > 0.01) {
    throw new Error(
      `[VALIDATION ERROR] Order total mismatch. ` +
      `Calculated: ${calculatedTotal}, Provided: ${order.totalPrice}`
    );
  }
  
  // Verify final price calculation
  const calculatedFinal = calculatedTotal - order.discount;
  if (Math.abs(calculatedFinal - order.finalPrice) > 0.01) {
    throw new Error(
      `[VALIDATION ERROR] Final price mismatch. ` +
      `Calculated: ${calculatedFinal}, Provided: ${order.finalPrice}`
    );
  }
  
  console.log(`[VALIDATION] Order totals verified successfully`);
  return true;
};

/**
 * ========================================
 * TRIGGER 7: VALIDATE RESERVATION TOTALS
 * ========================================
 * Before saving, verify reservation calculation is correct
 */
const validateReservationTotalsTrigger = (reservation) => {
  // Calculate food total from items
  const calculatedFoodTotal = reservation.orderItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  if (Math.abs(calculatedFoodTotal - reservation.foodTotal) > 0.01) {
    throw new Error(
      `[VALIDATION ERROR] Food total mismatch. ` +
      `Calculated: ${calculatedFoodTotal}, Provided: ${reservation.foodTotal}`
    );
  }
  
  // Verify total amount calculation
  const calculatedTotal = reservation.depositAmount + reservation.foodTotal - reservation.foodDiscount;
  if (Math.abs(calculatedTotal - reservation.totalAmount) > 0.01) {
    throw new Error(
      `[VALIDATION ERROR] Total amount mismatch. ` +
      `Calculated: ${calculatedTotal}, Provided: ${reservation.totalAmount}`
    );
  }
  
  console.log(`[VALIDATION] Reservation totals verified successfully`);
  return true;
};

/**
 * ========================================
 * STORED PROCEDURE 1: GET BRANCH REVENUE REPORT
 * ========================================
 */
const getBranchRevenueReport = async (branchId, startDate, endDate) => {
  const Payment = require('../models/Payment');
  const Order = require('../models/Order');
  const Reservation = require('../models/Reservation');
  
  try {
    // Get payments in date range
    const payments = await Payment.find({
      branchId: branchId,
      status: 'completed',
      paidAt: { $gte: startDate, $lte: endDate }
    }).populate('collectedBy', 'name role');
    
    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.finalAmount, 0);
    const totalDiscount = payments.reduce((sum, p) => sum + p.discount, 0);
    
    // Group by staff
    const byStaff = {};
    for (const payment of payments) {
      const staff = payment.collectedBy?.name || 'Unknown';
      if (!byStaff[staff]) {
        byStaff[staff] = { count: 0, amount: 0 };
      }
      byStaff[staff].count += 1;
      byStaff[staff].amount += payment.finalAmount;
    }
    
    // Group by type
    const byType = {
      delivery: 0,
      reception: 0,
      'dine-in': 0
    };
    
    for (const payment of payments) {
      if (byType[payment.revenueType] !== undefined) {
        byType[payment.revenueType] += payment.finalAmount;
      }
    }
    
    return {
      period: { startDate, endDate },
      totalRevenue,
      totalDiscount,
      transactionCount: payments.length,
      byStaff,
      byType
    };
  } catch (error) {
    console.error('[PROCEDURE ERROR] Failed to generate revenue report:', error);
    throw error;
  }
};

/**
 * ========================================
 * STORED PROCEDURE 2: GET STAFF PERFORMANCE
 * ========================================
 */
const getStaffPerformance = async (staffId, startDate, endDate) => {
  const Payment = require('../models/Payment');
  const Order = require('../models/Order');
  
  try {
    // Get payments collected by staff
    const payments = await Payment.find({
      collectedBy: staffId,
      status: 'completed',
      paidAt: { $gte: startDate, $lte: endDate }
    }).populate('branchId', 'name');
    
    const totalCollected = payments.reduce((sum, p) => sum + p.finalAmount, 0);
    const transactionCount = payments.length;
    const averageTransaction = transactionCount > 0 ? totalCollected / transactionCount : 0;
    
    // Get orders confirmed by staff
    const orders = await Order.find({
      confirmedBy: staffId,
      confirmedAt: { $gte: startDate, $lte: endDate }
    });
    
    return {
      staffId,
      period: { startDate, endDate },
      totalCollected,
      transactionCount,
      averageTransaction,
      ordersConfirmed: orders.length,
      byBranch: payments.reduce((acc, p) => {
        const branch = p.branchId?.name || 'Unknown';
        acc[branch] = (acc[branch] || 0) + p.finalAmount;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('[PROCEDURE ERROR] Failed to get staff performance:', error);
    throw error;
  }
};

/**
 * ========================================
 * STORED PROCEDURE 3: CHECK DATA INTEGRITY
 * ========================================
 */
const checkDataIntegrity = async () => {
  const Order = require('../models/Order');
  const Reservation = require('../models/Reservation');
  const Payment = require('../models/Payment');
  
  const issues = [];
  
  try {
    console.log('[INTEGRITY CHECK] Starting data integrity verification...');
    
    // Check 1: Orders with mismatched totals
    const orders = await Order.find();
    for (const order of orders) {
      const calculated = Math.max(0, order.totalPrice - order.discount);
      if (Math.abs(calculated - order.finalPrice) > 0.01) {
        issues.push({
          type: 'ORDER_TOTAL_MISMATCH',
          orderId: order._id,
          expected: calculated,
          actual: order.finalPrice
        });
      }
    }
    
    // Check 2: Reservations with mismatched totals
    const reservations = await Reservation.find();
    for (const res of reservations) {
      const calculated = res.depositAmount + res.foodTotal - res.foodDiscount;
      if (Math.abs(calculated - res.totalAmount) > 0.01) {
        issues.push({
          type: 'RESERVATION_TOTAL_MISMATCH',
          reservationId: res._id,
          expected: calculated,
          actual: res.totalAmount
        });
      }
    }
    
    // Check 3: Orphaned payments (no order or reservation)
    const orphanPayments = await Payment.find({
      orderId: null,
      reservationId: null
    });
    
    if (orphanPayments.length > 0) {
      issues.push({
        type: 'ORPHAN_PAYMENTS',
        count: orphanPayments.length,
        paymentIds: orphanPayments.map(p => p._id)
      });
    }
    
    return {
      timestamp: new Date(),
      issueCount: issues.length,
      issues: issues,
      status: issues.length === 0 ? 'CLEAN' : 'ISSUES_FOUND'
    };
  } catch (error) {
    console.error('[INTEGRITY CHECK ERROR]:', error);
    throw error;
  }
};

module.exports = {
  createPaymentTriggerOnOrderConfirm,
  createPaymentTriggerOnReservationConfirm,
  updateTableAvailabilityTrigger,
  createNotificationTrigger,
  updateBranchRevenueTrigger,
  validateOrderTotalsTrigger,
  validateReservationTotalsTrigger,
  getBranchRevenueReport,
  getStaffPerformance,
  checkDataIntegrity
};
