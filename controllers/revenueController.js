const Payment = require("../models/Payment");
const User = require("../models/User");
const Branch = require("../models/Branch");

// Get revenue statistics — split into delivery, reception, and total
exports.getRevenue = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : null;

    let startDate, endDate, viewType;

    if (currentMonth) {
      viewType = "monthly";
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    } else {
      viewType = "yearly";
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    // Fetch all completed payments in date range
    const payments = await Payment.find({
      status: "completed",
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("userId", "name email")
      .populate("collectedBy", "name email")
      .populate("branchId", "name address")
      .populate("orderId")
      .populate("reservationId")
      .sort({ createdAt: -1 });

    // ── Delivery Revenue ────────────────────────────────────────────────────
    const deliveryPayments = payments.filter((p) => p.revenueType === "delivery");
    const deliveryTotal = deliveryPayments.reduce((s, p) => s + (p.finalAmount || p.amount || 0), 0);

    // Per-shipper breakdown
    const shipperMap = {};
    deliveryPayments.forEach((p) => {
      const id = p.collectedBy ? p.collectedBy._id.toString() : "unknown";
      const name = p.collectedBy ? p.collectedBy.name : "Khong xac dinh";
      const email = p.collectedBy ? p.collectedBy.email : "";
      if (!shipperMap[id]) shipperMap[id] = { name, email, total: 0, count: 0 };
      shipperMap[id].total += p.finalAmount || p.amount || 0;
      shipperMap[id].count += 1;
    });
    const shipperBreakdown = Object.values(shipperMap).sort((a, b) => b.total - a.total);

    // Per-branch breakdown for delivery
    const deliveryBranchMap = {};
    deliveryPayments.forEach((p) => {
      const id = p.branchId ? p.branchId._id.toString() : "unknown";
      const name = p.branchId ? p.branchId.name : "Khong xac dinh";
      if (!deliveryBranchMap[id]) deliveryBranchMap[id] = { name, total: 0, count: 0 };
      deliveryBranchMap[id].total += p.finalAmount || p.amount || 0;
      deliveryBranchMap[id].count += 1;
    });
    const deliveryBranchBreakdown = Object.values(deliveryBranchMap).sort((a, b) => b.total - a.total);

    // ── Reception Revenue ───────────────────────────────────────────────────
    const receptionPayments = payments.filter((p) => p.revenueType === "reception");
    const receptionTotal = receptionPayments.reduce((s, p) => s + (p.finalAmount || p.amount || 0), 0);

    // Per-branch breakdown
    const branchMap = {};
    receptionPayments.forEach((p) => {
      const id = p.branchId ? p.branchId._id.toString() : "unknown";
      const name = p.branchId ? p.branchId.name : "Chi nhanh khong xac dinh";
      const address = p.branchId ? p.branchId.address : "";
      if (!branchMap[id]) branchMap[id] = { name, address, total: 0, count: 0 };
      branchMap[id].total += p.finalAmount || p.amount || 0;
      branchMap[id].count += 1;
    });
    const branchBreakdown = Object.values(branchMap).sort((a, b) => b.total - a.total);

    // ── Per-receptionist breakdown ────────────────────────────────────────────
    const receptionistMap = {};
    receptionPayments.forEach((p) => {
      const id = p.collectedBy ? p.collectedBy._id.toString() : "unknown";
      const name = p.collectedBy ? p.collectedBy.name : "Khong xac dinh";
      const email = p.collectedBy ? p.collectedBy.email : "";
      const branchName = p.branchId ? p.branchId.name : "Khong xac dinh";
      if (!receptionistMap[id]) receptionistMap[id] = { name, email, branchName, total: 0, count: 0 };
      receptionistMap[id].total += p.finalAmount || p.amount || 0;
      receptionistMap[id].count += 1;
    });
    const receptionistBreakdown = Object.values(receptionistMap).sort((a, b) => b.total - a.total);

    // ── Uncategorised (legacy payments with no revenueType) ─────────────────
    const uncatPayments = payments.filter((p) => !p.revenueType);
    const uncatTotal = uncatPayments.reduce((s, p) => s + (p.finalAmount || p.amount || 0), 0);

    // ── Total System Revenue ────────────────────────────────────────────────
    const systemTotal = deliveryTotal + receptionTotal + uncatTotal;
    const totalDiscount = payments.reduce((s, p) => s + (p.discount || 0), 0);
    
    // ── Daily average ────────────────────────────────────────────────────────
    const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const dailyAverage = Math.round(systemTotal / daysDiff);
    
    // ── Order count stats ────────────────────────────────────────────────────
    const totalTransactions = payments.length;
    const avgTransactionValue = totalTransactions > 0 ? Math.round(systemTotal / totalTransactions) : 0;

    // ── Payment method breakdown ────────────────────────────────────────────
    const paymentMethods = { bank: 0, cash: 0 };
    payments.forEach((p) => {
      const m = p.paymentMethod || "cash";
      if (paymentMethods.hasOwnProperty(m)) paymentMethods[m] += p.finalAmount || p.amount || 0;
      else paymentMethods.cash += p.finalAmount || p.amount || 0;
    });

    // ── Monthly chart data ──────────────────────────────────────────────────
    let monthlyDelivery = Array(12).fill(0);
    let monthlyReception = Array(12).fill(0);
    if (viewType === "yearly") {
      deliveryPayments.forEach((p) => {
        monthlyDelivery[new Date(p.createdAt).getMonth()] += p.finalAmount || p.amount || 0;
      });
      receptionPayments.forEach((p) => {
        monthlyReception[new Date(p.createdAt).getMonth()] += p.finalAmount || p.amount || 0;
      });
    }

    res.render("admin/revenue/index", {
      title: "Thong Ke Doanh Thu",
      currentYear,
      currentMonth,
      viewType,
      // delivery
      deliveryTotal,
      deliveryPayments,
      shipperBreakdown,
      deliveryBranchBreakdown,
      // reception
      receptionTotal,
      receptionPayments,
      branchBreakdown,
      // uncategorised
      uncatTotal,
      uncatPayments,
      // reception per-person
      receptionistBreakdown,
      // system total
      systemTotal,
      totalDiscount,
      dailyAverage,
      totalTransactions,
      avgTransactionValue,
      // helpers
      paymentMethods,
      monthlyDelivery,
      monthlyReception,
      payments, // full list for transaction log
    });
  } catch (error) {
    console.error("[restaurant] Revenue error:", error);
    res.status(500).render("error", {
      error: "Loi khi tai thong ke doanh thu: " + error.message,
      layout: false,
    });
  }
};
