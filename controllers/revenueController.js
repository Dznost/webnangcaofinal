const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");

// Get revenue statistics
exports.getRevenue = async (req, res) => {
  try {
    console.log("[restaurant] Loading revenue statistics");
    
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : null;
    
    console.log("[restaurant] Revenue filters - Year:", currentYear, "Month:", currentMonth);
    
    let startDate, endDate, viewType;
    
    if (currentMonth) {
      // Monthly view
      viewType = 'monthly';
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    } else {
      // Yearly view
      viewType = 'yearly';
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }
    
    console.log("[restaurant] Date range:", startDate, "to", endDate);
    
    const payments = await Payment.find({
      status: "completed",
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate("userId", "name email")
      .populate("orderId")
      .populate("reservationId")
      .sort({ createdAt: -1 });
    
    console.log("[restaurant] Found", payments.length, "completed payments");
    
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + (p.discount || 0), 0);
    
    const orderPayments = payments.filter(p => p.orderId);
    const orderRevenue = orderPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const orderCount = orderPayments.length;
    
    const reservationPayments = payments.filter(p => p.reservationId);
    const reservationRevenue = reservationPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const reservationCount = reservationPayments.length;
    
    const paymentMethods = {
      bank: 0,
      momo: 0,
      cash: 0
    };
    
    payments.forEach(p => {
      const method = p.paymentMethod || 'cash';
      if (paymentMethods.hasOwnProperty(method)) {
        paymentMethods[method] += p.amount || 0;
      } else {
        paymentMethods.cash += p.amount || 0;
      }
    });
    
    let monthlyData = [];
    if (viewType === 'yearly') {
      monthlyData = Array(12).fill(0);
      payments.forEach(p => {
        const month = new Date(p.createdAt).getMonth();
        monthlyData[month] += p.amount || 0;
      });
    }
    
    console.log("[restaurant] Revenue stats calculated:", {
      totalRevenue,
      totalDiscount,
      orderRevenue,
      orderCount,
      reservationRevenue,
      reservationCount,
      paymentMethods
    });
    
    res.render("admin/revenue/index", {
      title: "Thống Kê Doanh Thu",
      currentYear,
      currentMonth,
      viewType,
      totalRevenue,
      totalDiscount,
      orderRevenue,
      orderCount,
      reservationRevenue,
      reservationCount,
      paymentMethods,
      monthlyData,
      payments
    });
  } catch (error) {
    console.error("[restaurant] Revenue error:", error);
    res.status(500).render("error", {
      error: "Lỗi khi tải thống kê doanh thu: " + error.message,
      layout: false
    });
  }
};
