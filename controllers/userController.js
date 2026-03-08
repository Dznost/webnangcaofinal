const User = require("../models/User");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");
const Branch = require("../models/Branch");
const bcrypt = require("bcryptjs");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const roleFilter = req.query.role || "";

    let query = {};
    if (roleFilter) query.role = roleFilter;
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).populate("branchId", "name");

    // Count orders and reservations for each user
    var usersWithStats = [];
    for (var i = 0; i < users.length; i++) {
      var u = users[i].toObject();
      u.orderCount = await Order.countDocuments({ userId: u._id });
      u.reservationCount = await Reservation.countDocuments({ userId: u._id });
      usersWithStats.push(u);
    }

    res.render("admin/users/index", {
      title: "Quan Ly Nguoi Dung",
      users: usersWithStats,
      searchQuery,
      roleFilter,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    console.error("[restaurant] Error in getUsers:", error);
    res.redirect("/admin");
  }
};

// Get user detail with full activity
exports.getUserDetail = async (req, res) => {
  try {
    var user = await User.findById(req.params.id).populate("branchId", "name address").populate("pendingBranchId", "name address");
    if (!user) return res.redirect("/admin/users?error=Khong tim thay nguoi dung");

    var branches = await Branch.find().select("name address");

    var orders = await Order.find({ userId: req.params.id })
      .populate("branchId")
      .sort({ createdAt: -1 });

    var reservations = await Reservation.find({ userId: req.params.id })
      .populate("branchId")
      .sort({ createdAt: -1 });

    var orderIds = orders.map(function(o) { return o._id; });
    var reservationIds = reservations.map(function(r) { return r._id; });

    var payments = await Payment.find({
      $or: [
        { orderId: { $in: orderIds } },
        { reservationId: { $in: reservationIds } }
      ]
    }).sort({ createdAt: -1 });

    // Calculate totals
    var totalSpent = 0;
    for (var i = 0; i < payments.length; i++) {
      if (payments[i].status === "completed") {
        totalSpent += payments[i].finalAmount || 0;
      }
    }
    
    res.render("admin/users/detail", { 
      title: "Chi Tiet Nguoi Dung", 
      user: user,
      orders: orders,
      reservations: reservations,
      payments: payments,
      branches: branches,
      totalSpent: totalSpent,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/users");
  }
};

// Admin change user password
exports.changeUserPassword = async (req, res) => {
  try {
    var userId = req.params.id;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;

    if (!newPassword || newPassword.length < 6) {
      return res.redirect("/admin/users/" + userId + "?error=Mat khau phai co it nhat 6 ky tu");
    }

    if (newPassword !== confirmPassword) {
      return res.redirect("/admin/users/" + userId + "?error=Mat khau xac nhan khong khop");
    }

    var user = await User.findById(userId);
    if (!user) {
      return res.redirect("/admin/users?error=Khong tim thay nguoi dung");
    }

    user.password = newPassword;
    await user.save();

    res.redirect("/admin/users/" + userId + "?success=Doi mat khau thanh cong");
  } catch (error) {
    console.error("[restaurant] Admin change password error:", error);
    res.redirect("/admin/users/" + req.params.id + "?error=Loi khi doi mat khau");
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/users?success=Xoa nguoi dung thanh cong");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/users");
  }
};

// Change user role (user <-> shipper)
exports.changeUserRole = async (req, res) => {
  try {
    var userId = req.params.id;
    var newRole = req.body.role;

    // Only allow switching between user, shipper, staff, and reception
    if (newRole !== "user" && newRole !== "shipper" && newRole !== "staff" && newRole !== "reception") {
      return res.redirect("/admin/users/" + userId + "?error=Role khong hop le");
    }

    // Cannot change own role
    if (userId === req.session.user.id) {
      return res.redirect("/admin/users/" + userId + "?error=Khong the doi role cua chinh minh");
    }

    var user = await User.findById(userId);
    if (!user) {
      return res.redirect("/admin/users?error=Khong tim thay nguoi dung");
    }

    // Cannot change admin role
    if (user.role === "admin") {
      return res.redirect("/admin/users/" + userId + "?error=Khong the doi role cua admin");
    }

    var oldRole = user.role;
    user.role = newRole;
    
    // If changing to a non-branch role (user), clear branchId
    if (newRole === 'user') {
      user.branchId = undefined;
      user.pendingBranchId = undefined;
      user.branchChangeStatus = 'none';
    }
    
    await user.save();

    // Create notification for role change
    var Notification = require("../models/Notification");
    var roleLabels = { user: 'Nguoi dung', shipper: 'Shipper', staff: 'Nhan vien', reception: 'Le tan' };
    await Notification.create({
      type: "role_change",
      category: "user",
      priority: "normal",
      userId: req.session.user.id,
      targetUserId: user._id,
      message: user.name + " da doi role tu " + (roleLabels[oldRole] || oldRole) + " sang " + (roleLabels[newRole] || newRole),
      details: "Admin da thay doi quyen truy cap cua nguoi dung",
    });

    console.log("[restaurant] User role changed:", userId, oldRole, "->", newRole);
    res.redirect("/admin/users/" + userId + "?success=Doi role thanh " + newRole + " thanh cong");
  } catch (error) {
    console.error("[restaurant] Change role error:", error);
    res.redirect("/admin/users/" + req.params.id + "?error=Loi khi doi role");
  }
};

// Approve branch change request
exports.approveBranchChange = async (req, res) => {
  try {
    var userId = req.params.id;
    var user = await User.findById(userId);
    if (!user || user.branchChangeStatus !== "pending") {
      return res.redirect("/admin/users/" + userId + "?error=Khong co yeu cau doi chi nhanh");
    }

    user.branchId = user.pendingBranchId;
    user.pendingBranchId = undefined;
    user.branchChangeStatus = "approved";
    await user.save();

    res.redirect("/admin/users/" + userId + "?success=Da duyet yeu cau doi chi nhanh");
  } catch (error) {
    console.error("[restaurant] Approve branch change error:", error);
    res.redirect("/admin/users/" + req.params.id + "?error=Loi khi duyet");
  }
};

// Reject branch change request
exports.rejectBranchChange = async (req, res) => {
  try {
    var userId = req.params.id;
    var user = await User.findById(userId);
    if (!user || user.branchChangeStatus !== "pending") {
      return res.redirect("/admin/users/" + userId + "?error=Khong co yeu cau doi chi nhanh");
    }

    user.pendingBranchId = undefined;
    user.branchChangeStatus = "rejected";
    await user.save();

    res.redirect("/admin/users/" + userId + "?success=Da tu choi yeu cau doi chi nhanh");
  } catch (error) {
    console.error("[restaurant] Reject branch change error:", error);
    res.redirect("/admin/users/" + req.params.id + "?error=Loi khi tu choi");
  }
};

// Admin directly set user branch (shipper / staff / reception)
exports.setUserBranch = async (req, res) => {
  try {
    var userId = req.params.id;
    var branchId = req.body.branchId;

    var user = await User.findById(userId).populate("branchId", "name");
    if (!user) {
      return res.redirect("/admin/users?error=Khong tim thay nguoi dung");
    }

    var oldBranchName = user.branchId ? user.branchId.name : "Chua gan";
    var oldBranchId = user.branchId ? user.branchId._id : null;

    user.branchId = branchId || undefined;
    user.pendingBranchId = undefined;
    user.branchChangeStatus = "none";
    await user.save();

    // Create notification for branch transfer
    var Notification = require("../models/Notification");
    var newBranch = branchId ? await Branch.findById(branchId).select("name").lean() : null;
    var newBranchName = newBranch ? newBranch.name : "Chua gan";

    var roleLabel = user.role === 'reception' ? 'Le tan' : user.role === 'staff' ? 'Nhan vien' : user.role === 'shipper' ? 'Shipper' : user.role;

    await Notification.create({
      type: "role_change",
      category: "user",
      priority: "normal",
      userId: req.session.user.id,
      targetUserId: user._id,
      branchId: branchId || oldBranchId,
      message: roleLabel + " " + user.name + " da duoc chuyen chi nhanh",
      details: "Tu: " + oldBranchName + " -> Den: " + newBranchName,
    });

    res.redirect("/admin/users/" + userId + "?success=Da gan chi nhanh thanh cong");
  } catch (error) {
    console.error("[restaurant] Set user branch error:", error);
    res.redirect("/admin/users/" + req.params.id + "?error=Loi khi gan chi nhanh");
  }
};

// Keep old name as alias for backwards compatibility
exports.setShipperBranch = exports.setUserBranch;
