const express = require("express");
const router = express.Router();
const Dish = require("../../models/Dish");
const Branch = require("../../models/Branch");
const Event = require("../../models/Event");
const Order = require("../../models/Order");
const Reservation = require("../../models/Reservation");
const User = require("../../models/User");
const Contact = require("../../models/Contact");
const Blog = require("../../models/Blog");
const Notification = require("../../models/Notification");
const Payment = require("../../models/Payment");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).render("error", {
      error: "Ban khong co quyen truy cap trang nay. Chi admin moi co the truy cap.",
      layout: false,
    });
  }
  next();
};

// Dashboard
router.get("/", checkAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // ── COUNTS ────────────────────────────────────────────────────────────────
    const [dishCount, branchCount, eventCount, blogCount, userCount] = await Promise.all([
      Dish.countDocuments(),
      Branch.countDocuments(),
      Event.countDocuments(),
      Blog.countDocuments(),
      User.countDocuments(),
    ]);

    // ── TODAY'S STATS ─────────────────────────────────────────────────────────
    const [todayOrders, todayReservations, pendingContacts] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Reservation.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Contact.countDocuments({ status: "new" }),
    ]);

    // ── ACTIVE OPERATIONS ────────────────────────────────────────────────────
    const [activeOrders, pendingOrders, shippingOrders, pendingReservations] = await Promise.all([
      Order.countDocuments({ status: { $in: ["pending", "confirmed", "processing", "shipping"] } }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "shipping" }),
      Reservation.countDocuments({ status: "pending" }),
    ]);

    // ── STAFF ACTIVITY ────────────────────────────────────────────────────────
    const [totalShippers, totalStaff, totalReception, activeDeliveries] = await Promise.all([
      User.countDocuments({ role: "shipper" }),
      User.countDocuments({ role: "staff" }),
      User.countDocuments({ role: "reception" }),
      Order.countDocuments({ status: "shipping", shipperId: { $ne: null } }),
    ]);

    // ── PENDING ALERTS ────────────────────────────────────────────────────────
    const [shipperApplications, staffApplications, branchChangeRequests] = await Promise.all([
      Contact.countDocuments({ type: "shipper_application", status: "new" }),
      Contact.countDocuments({ type: "staff_application", status: "new" }),
      User.countDocuments({ branchChangeStatus: "pending" }),
    ]);

    // ── RECENT ACTIVITY FEED ─────────────────────────────────────────────────
    const recentOrders = await Order.find()
      .populate("userId", "name email")
      .populate("branchId", "name")
      .populate("shipperId", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentReservations = await Reservation.find()
      .populate("userId", "name email")
      .populate("branchId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    const notifications = await Notification.find({ status: "pending" })
      .populate("userId", "name email")
      .populate("orderId")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // ── TOP PERFORMING ────────────────────────────────────────────────────────
    const topShippers = await Payment.aggregate([
      { $match: { revenueType: "delivery", status: "completed", createdAt: { $gte: monthStart } } },
      { $group: { _id: "$collectedBy", total: { $sum: "$finalAmount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "shipper",
        },
      },
      { $unwind: { path: "$shipper", preserveNullAndEmptyArrays: true } },
      { $project: { name: "$shipper.name", email: "$shipper.email", total: 1, count: 1 } },
    ]);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      // counts
      dishCount,
      branchCount,
      eventCount,
      blogCount,
      userCount,
      // today
      todayOrders,
      todayReservations,
      pendingContacts,
      // operations
      activeOrders,
      pendingOrders,
      shippingOrders,
      pendingReservations,
      // staff
      totalShippers,
      totalStaff,
      totalReception,
      activeDeliveries,
      // alerts
      shipperApplications,
      staffApplications,
      branchChangeRequests,
      // feed
      recentOrders,
      recentReservations,
      notifications,
      topShippers,
    });
  } catch (error) {
    console.error("[restaurant] Dashboard error:", error);
    res.status(500).render("error", {
      error: "Loi khi tai trang quan tri: " + error.message,
      layout: false,
    });
  }
});

// Mark notification as read
router.post("/notifications/:id/read", checkAdmin, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: "read" });
    res.redirect("/admin?success=Da danh dau da doc");
  } catch (error) {
    console.error("[restaurant] Notification update error:", error);
    res.redirect("/admin");
  }
});

module.exports = router;
