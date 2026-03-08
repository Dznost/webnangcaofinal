const Order = require("../models/Order")
const Reservation = require("../models/Reservation")
const User = require("../models/User")
const Branch = require("../models/Branch")
const Notification = require("../models/Notification")
const bcrypt = require("bcryptjs")

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const staffId = req.session.user.id

    const processingOrders = await Order.countDocuments({ staffId, status: "processing" })
    const completedOrders = await Order.countDocuments({ staffId, status: "completed" })

    const processingReservations = await Reservation.countDocuments({ staffId, status: { $in: ["confirmed", "paid", "processing"] } })
    const completedReservations = await Reservation.countDocuments({ staffId, status: "completed" })

    const activeOrders = await Order.find({ staffId, status: "processing" })
      .populate("userId", "name email phone")
      .populate("branchId", "name")
      .sort({ createdAt: -1 })
      .limit(5)

    const activeReservations = await Reservation.find({ staffId, status: { $in: ["confirmed", "paid", "processing"] } })
      .populate("userId", "name email phone")
      .populate("branchId", "name")
      .sort({ date: 1 })
      .limit(5)

    res.render("staff/dashboard", {
      title: "Trang Nhan Vien",
      processingOrders,
      completedOrders,
      processingReservations,
      completedReservations,
      activeOrders,
      activeReservations,
    })
  } catch (error) {
    console.error("[restaurant] Staff dashboard error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Dine-in orders list
exports.getOrders = async (req, res) => {
  try {
    const staffId = req.session.user.id
    const statusFilter = req.query.status || "all"

    let query = { staffId }
    if (statusFilter === "processing") query.status = "processing"
    else if (statusFilter === "completed") query.status = "completed"

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .populate("branchId", "name")
      .sort({ createdAt: -1 })

    res.render("staff/orders/index", {
      title: "Don Hang Tai Quan",
      orders,
      statusFilter,
    })
  } catch (error) {
    console.error("[restaurant] Staff orders error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Order detail
exports.getOrderDetail = async (req, res) => {
  try {
    const staffId = req.session.user.id
    const order = await Order.findOne({ _id: req.params.id, staffId })
      .populate("userId", "name email phone address")
      .populate("branchId", "name address")

    if (!order) {
      return res.status(404).render("404", { layout: false })
    }

    res.render("staff/orders/detail", {
      title: "Chi Tiet Don Hang",
      order,
      success: req.query.success || null,
    })
  } catch (error) {
    console.error("[restaurant] Staff order detail error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Confirm order completed
exports.confirmOrderCompleted = async (req, res) => {
  try {
    const staffId = req.session.user.id
    const { confirmCode } = req.body

    if (confirmCode !== "CONFIRMED") {
      return res.redirect(`/staff/orders/${req.params.id}?success=false`)
    }

    const order = await Order.findOne({ _id: req.params.id, staffId, status: "processing" })
    if (!order) {
      return res.status(404).render("404", { layout: false })
    }

    order.status = "completed"
    order.paymentStatus = "paid"
    order.confirmedBy = staffId
    order.confirmedAt = new Date()
    await order.save()

    // Restore table availability when dine-in order is completed
    if (order.orderType === "dine-in" && order.branchId) {
      const Branch = require("../models/Branch")
      const branch = await Branch.findById(order.branchId)
      if (branch) {
        branch.availableTables += 1
        await branch.save()
      }
    }

    res.redirect(`/staff/orders/${req.params.id}?success=completed`)
  } catch (error) {
    console.error("[restaurant] Staff confirm order error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Reservations list
exports.getReservations = async (req, res) => {
  try {
    const staffId = req.session.user.id
    const statusFilter = req.query.status || "all"

    let query = { staffId }
    if (statusFilter === "processing") query.status = { $in: ["confirmed", "paid", "processing"] }
    else if (statusFilter === "completed") query.status = "completed"

    const reservations = await Reservation.find(query)
      .populate("userId", "name email phone")
      .populate("branchId", "name")
      .sort({ date: -1 })

    res.render("staff/reservations/index", {
      title: "Dat Ban",
      reservations,
      statusFilter,
    })
  } catch (error) {
    console.error("[restaurant] Staff reservations error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Reservation detail
exports.getReservationDetail = async (req, res) => {
  try {
    const staffId = req.session.user.id
    const reservation = await Reservation.findOne({ _id: req.params.id, staffId })
      .populate("userId", "name email phone")
      .populate("branchId", "name address")

    if (!reservation) {
      return res.status(404).render("404", { layout: false })
    }

    res.render("staff/reservations/detail", {
      title: "Chi Tiet Dat Ban",
      reservation,
      success: req.query.success || null,
    })
  } catch (error) {
    console.error("[restaurant] Staff reservation detail error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Confirm reservation completed
exports.confirmReservationCompleted = async (req, res) => {
  try {
    const staffId = req.session.user.id
    const { confirmCode } = req.body

    if (confirmCode !== "CONFIRMED") {
      return res.redirect(`/staff/reservations/${req.params.id}?success=false`)
    }

    const reservation = await Reservation.findOne({ _id: req.params.id, staffId, status: { $in: ["confirmed", "paid", "processing"] } })
    if (!reservation) {
      return res.status(404).render("404", { layout: false })
    }

    reservation.status = "completed"
    reservation.paymentStatus = "paid"
    await reservation.save()

    // Restore table availability
    if (reservation.branchId) {
      const Branch = require("../models/Branch")
      const branch = await Branch.findById(reservation.branchId)
      if (branch) {
        branch.availableTables += 1
        await branch.save()
      }
    }

    res.redirect(`/staff/reservations/${req.params.id}?success=completed`)
  } catch (error) {
    console.error("[restaurant] Staff confirm reservation error:", error)
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

    res.render("staff/profile", {
      title: "Ho So Nhan Vien",
      profile: user,
      branches,
      success: req.query.success || null,
      error: req.query.error || null,
    })
  } catch (error) {
    console.error("[restaurant] Staff profile error:", error)
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
    if (!isMatch) return res.redirect("/staff/profile?error=Mat khau hien tai khong dung")

    if (newPassword !== confirmPassword) return res.redirect("/staff/profile?error=Mat khau moi khong khop")

    if (newPassword.length < 6) return res.redirect("/staff/profile?error=Mat khau phai co it nhat 6 ky tu")

    user.password = newPassword
    await user.save()

    res.redirect("/staff/profile?success=Doi mat khau thanh cong")
  } catch (error) {
    console.error("[restaurant] Staff change password error:", error)
    res.redirect("/staff/profile?error=Loi he thong")
  }
}

// Request branch change
exports.requestBranchChange = async (req, res) => {
  try {
    const { newBranchId } = req.body
    const user = await User.findById(req.session.user.id)

    if (!user) return res.redirect("/auth/logout")

    const branch = await Branch.findById(newBranchId)
    if (!branch) return res.redirect("/staff/profile?error=Chi nhanh khong ton tai")

    if (user.branchId && user.branchId.toString() === newBranchId) {
      return res.redirect("/staff/profile?error=Ban da o chi nhanh nay roi")
    }

    if (user.branchChangeStatus === "pending") {
      return res.redirect("/staff/profile?error=Ban da co yeu cau dang cho duyet")
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
        message: `Nhan vien ${user.name} yeu cau doi chi nhanh sang ${branch.name}`,
      })
      await notification.save()
    }

    res.redirect("/staff/profile?success=Da gui yeu cau doi chi nhanh. Vui long cho admin duyet.")
  } catch (error) {
    console.error("[restaurant] Staff request branch change error:", error)
    res.redirect("/staff/profile?error=Loi he thong")
  }
}
