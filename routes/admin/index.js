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

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  console.log("[restaurant] Admin check - Session user:", req.session.user);
  
  if (!req.session.user) {
    console.log("[restaurant] No user in session, redirecting to login");
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }
  
  if (req.session.user.role !== "admin") {
    console.log("[restaurant] User is not admin, role:", req.session.user.role);
    return res.status(403).render("error", { 
      error: "Bạn không có quyền truy cập trang này. Chỉ admin mới có thể truy cập.",
      layout: false 
    });
  }
  
  console.log("[restaurant] Admin check passed");
  next();
};

// Dashboard
router.get("/", checkAdmin, async (req, res) => {
  try {
    console.log("[restaurant] Loading admin dashboard");
    
    const dishCount = await Dish.countDocuments();
    const branchCount = await Branch.countDocuments();
    const eventCount = await Event.countDocuments();
    const blogCount = await Blog.countDocuments();
    const orderCount = await Order.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const userCount = await User.countDocuments();
    const contactCount = await Contact.countDocuments({ status: "new" });
    
    const recentOrders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentReservations = await Reservation.find()
      .populate("userId", "name email")
      .populate("branchId", "name")
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log("[restaurant] Dashboard data loaded successfully");
    
    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      dishCount,
      branchCount,
      eventCount,
      blogCount,
      orderCount,
      reservationCount,
      userCount,
      contactCount,
      recentOrders,
      recentReservations
    });
  } catch (error) {
    console.error("[restaurant] Dashboard error:", error);
    res.status(500).render("error", { 
      error: "Lỗi khi tải trang quản trị: " + error.message,
      layout: false 
    });
  }
});

module.exports = router;
