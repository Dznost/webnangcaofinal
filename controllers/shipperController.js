const Order = require("../models/Order")
const User = require("../models/User")
const Branch = require("../models/Branch")
const Payment = require("../models/Payment")
const Notification = require("../models/Notification")
const bcrypt = require("bcryptjs")

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const shipperId = req.session.user.id

    const processingCount = await Order.countDocuments({ shipperId, status: { $in: ["processing", "shipping"] } })
    const completedCount = await Order.countDocuments({ shipperId, status: "completed" })

    const activeOrders = await Order.find({ shipperId, status: { $in: ["processing", "shipping"] } })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(10)

    res.render("shipper/dashboard", {
      title: "Trang Shipper",
      processingCount,
      completedCount,
      activeOrders,
    })
  } catch (error) {
    console.error("[restaurant] Shipper dashboard error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Orders list
exports.getOrders = async (req, res) => {
  try {
    const shipperId = req.session.user.id
    const statusFilter = req.query.status || "all"

    let query = { shipperId }
    if (statusFilter === "processing") query.status = { $in: ["processing", "shipping"] }
    else if (statusFilter === "completed") query.status = "completed"

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })

    res.render("shipper/orders/index", {
      title: "Don Hang Giao",
      orders,
      statusFilter,
    })
  } catch (error) {
    console.error("[restaurant] Shipper orders error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Order detail
exports.getOrderDetail = async (req, res) => {
  try {
    const shipperId = req.session.user.id
    const order = await Order.findOne({ _id: req.params.id, shipperId, status: { $in: ["processing", "shipping", "completed"] } })
      .populate("userId", "name email phone address")
      .populate("branchId", "name address")

    if (!order) {
      return res.status(404).render("404", { layout: false })
    }

    res.render("shipper/orders/detail", {
      title: "Chi Tiet Don Hang",
      order,
      success: req.query.success || null,
    })
  } catch (error) {
    console.error("[restaurant] Shipper order detail error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Confirm order completed (shipper confirms customer received the order)
exports.confirmCompleted = async (req, res) => {
  try {
    const shipperId = req.session.user.id
    const { confirmCode } = req.body

    if (confirmCode !== "CONFIRMED") {
      return res.redirect(`/shipper/orders/${req.params.id}?success=false`)
    }

    const order = await Order.findOne({ _id: req.params.id, shipperId, status: { $in: ["processing", "shipping"] } })
    if (!order) {
      return res.status(404).render("404", { layout: false })
    }

    order.status = "completed"
    order.paymentStatus = "paid"
    order.confirmedBy = shipperId
    order.confirmedAt = new Date()
    await order.save()

    // Create a delivery payment record so revenue is tracked per shipper
    const existing = await Payment.findOne({ orderId: order._id, status: "completed" })
    if (!existing) {
      const shipper = await User.findById(shipperId).select("branchId")
      const payment = new Payment({
        orderId: order._id,
        userId: order.userId,
        amount: order.finalPrice || order.totalPrice,
        discount: order.discount || 0,
        finalAmount: order.finalPrice || order.totalPrice,
        paymentMethod: order.paymentMethod || "cash",
        status: "completed",
        revenueType: "delivery",
        branchId: order.branchId || (shipper ? shipper.branchId : null),
        collectedBy: shipperId,
        paidAt: new Date(),
      })
      await payment.save()
    }

    res.redirect(`/shipper/orders/${req.params.id}?success=completed`)
  } catch (error) {
    console.error("[restaurant] Shipper confirm completed error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).populate("branchId", "name address").populate("pendingBranchId", "name address")
    if (!user) {
      return res.redirect("/auth/logout")
    }

    const branches = await Branch.find().select("name address")

    res.render("shipper/profile", {
      title: "Ho So Shipper",
      profile: user,
      branches,
      success: req.query.success || null,
      error: req.query.error || null,
    })
  } catch (error) {
    console.error("[restaurant] Shipper profile error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const user = await User.findById(req.session.user.id)

    if (!user) return res.redirect("/auth/logout")

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) return res.redirect("/shipper/profile?error=Mat khau hien tai khong dung")

    if (newPassword !== confirmPassword) return res.redirect("/shipper/profile?error=Mat khau moi khong khop")

    if (newPassword.length < 6) return res.redirect("/shipper/profile?error=Mat khau phai co it nhat 6 ky tu")

    user.password = newPassword
    await user.save()

    res.redirect("/shipper/profile?success=Doi mat khau thanh cong")
  } catch (error) {
    console.error("[restaurant] Shipper change password error:", error)
    res.redirect("/shipper/profile?error=Loi he thong")
  }
}

// Request branch change
exports.requestBranchChange = async (req, res) => {
  try {
    const { newBranchId } = req.body
    const user = await User.findById(req.session.user.id)

    if (!user) return res.redirect("/auth/logout")

    const branch = await Branch.findById(newBranchId)
    if (!branch) return res.redirect("/shipper/profile?error=Chi nhanh khong ton tai")

    if (user.branchId && user.branchId.toString() === newBranchId) {
      return res.redirect("/shipper/profile?error=Ban da o chi nhanh nay roi")
    }

    if (user.branchChangeStatus === "pending") {
      return res.redirect("/shipper/profile?error=Ban da co yeu cau dang cho duyet")
    }

    user.pendingBranchId = newBranchId
    user.branchChangeStatus = "pending"
    await user.save()

    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const notification = new Notification({
        type: "branch_change_request",
        userId: admin._id,
        amount: 0,
        message: `Shipper ${user.name} yeu cau doi chi nhanh sang ${branch.name}`,
      })
      await notification.save()
    }

    res.redirect("/shipper/profile?success=Da gui yeu cau doi chi nhanh. Vui long cho admin duyet.")
  } catch (error) {
    console.error("[restaurant] Request branch change error:", error)
    res.redirect("/shipper/profile?error=Loi he thong")
  }
}
