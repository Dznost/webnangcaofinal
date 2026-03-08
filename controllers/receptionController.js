const Order = require("../models/Order")
const Reservation = require("../models/Reservation")
const User = require("../models/User")
const Branch = require("../models/Branch")
const Dish = require("../models/Dish")
const Payment = require("../models/Payment")
const Notification = require("../models/Notification")

// Dashboard — scoped to the receptionist's assigned branch
exports.getDashboard = async (req, res) => {
  try {
    const branchId = req.session.user.branchId

    if (!branchId) {
      return res.render("reception/dashboard", {
        title: "Trang Le Tan",
        noBranch: true,
        processingOrders: 0,
        completedOrders: 0,
        processingReservations: 0,
        completedReservations: 0,
        branchRevenue: 0,
        activeOrders: [],
        activeReservations: [],
        branch: null,
      })
    }

    const branch = await Branch.findById(branchId).select("name address availableTables totalTables")

    const processingOrders = await Order.countDocuments({ branchId, orderType: "dine-in", status: "processing" })
    const completedOrders = await Order.countDocuments({ branchId, orderType: "dine-in", status: "completed" })

    const processingReservations = await Reservation.countDocuments({
      branchId,
      status: { $in: ["confirmed", "paid", "processing"] },
    })
    const completedReservations = await Reservation.countDocuments({ branchId, status: "completed" })

    // Branch revenue from ALL completed payments linked to this branch
    const revenueResult = await Payment.aggregate([
      { $match: { branchId: branch._id, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ])
    const branchRevenue = revenueResult[0]?.total || 0

    const activeOrders = await Order.find({ branchId, orderType: "dine-in", status: "processing" })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(5)

    const activeReservations = await Reservation.find({
      branchId,
      status: { $in: ["confirmed", "paid", "processing"] },
    })
      .populate("userId", "name email phone")
      .sort({ date: 1 })
      .limit(5)

    res.render("reception/dashboard", {
      title: "Trang Le Tan",
      noBranch: false,
      processingOrders,
      completedOrders,
      processingReservations,
      completedReservations,
      branchRevenue,
      activeOrders,
      activeReservations,
      branch,
    })
  } catch (error) {
    console.error("[restaurant] Reception dashboard error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Orders list — scoped to branch, dine-in only, with search + filter
exports.getOrders = async (req, res) => {
  try {
    const branchId = req.session.user.branchId

    if (!branchId) {
      return res.render("reception/orders/index", {
        title: "Don Hang Tai Quan",
        orders: [],
        statusFilter: "all",
        searchQuery: "",
        noBranch: true,
      })
    }

    const statusFilter = req.query.status || "all"
    const searchQuery = req.query.q || ""

    let query = { branchId, orderType: "dine-in" }
    if (statusFilter === "processing") query.status = "processing"
    else if (statusFilter === "completed") query.status = "completed"

    if (searchQuery) {
      query.$or = [
        { fullName: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
      ]
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .populate("branchId", "name")
      .sort({ createdAt: -1 })

    // If searchQuery did not match on embedded fields, also try userId reference
    let finalOrders = orders
    if (searchQuery && orders.length === 0) {
      const users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { phone: { $regex: searchQuery, $options: "i" } },
        ],
      }).select("_id")
      const userIds = users.map((u) => u._id)
      const baseQuery = { branchId, orderType: "dine-in" }
      if (statusFilter === "processing") baseQuery.status = "processing"
      else if (statusFilter === "completed") baseQuery.status = "completed"
      baseQuery.userId = { $in: userIds }
      finalOrders = await Order.find(baseQuery)
        .populate("userId", "name email phone")
        .populate("branchId", "name")
        .sort({ createdAt: -1 })
    }

    res.render("reception/orders/index", {
      title: "Don Hang Tai Quan",
      orders: finalOrders,
      statusFilter,
      searchQuery,
      noBranch: false,
    })
  } catch (error) {
    console.error("[restaurant] Reception orders error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Order detail — must belong to the receptionist's branch
exports.getOrderDetail = async (req, res) => {
  try {
    const branchId = req.session.user.branchId

    const query = { _id: req.params.id }
    if (branchId) query.branchId = branchId

    const order = await Order.findOne(query)
      .populate("userId", "name email phone address")
      .populate("branchId", "name address")

    if (!order) {
      return res.status(404).render("404", { layout: false })
    }

    res.render("reception/orders/detail", {
      title: "Chi Tiet Don Hang",
      order,
      success: req.query.success || null,
    })
  } catch (error) {
    console.error("[restaurant] Reception order detail error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Confirm order completed — handles both cash payment and COD (shipper payment)
exports.confirmOrderCompleted = async (req, res) => {
  try {
    const branchId = req.session.user.branchId
    const receptionId = req.session.user.id
    const { confirmCode } = req.body

    if (confirmCode !== "CONFIRMED") {
      return res.redirect(`/reception/orders/${req.params.id}?success=false`)
    }

    const query = { _id: req.params.id, status: "processing" }
    if (branchId) query.branchId = branchId

    const order = await Order.findOne(query)
    if (!order) {
      return res.status(404).render("404", { layout: false })
    }

    order.status = "completed"
    order.confirmedBy = receptionId
    order.confirmedAt = new Date()
    
    // For dine-in orders: payment is cash and marked as paid immediately
    if (order.orderType === "dine-in") {
      order.paymentStatus = "paid"
      order.paidAt = new Date()
    } else if (order.orderType === "takeaway") {
      // For takeaway: if COD, mark as pending (shipper will collect)
      if (order.paymentTiming === "cod") {
        order.paymentStatus = "unpaid" // Shipper will collect payment
      } else {
        order.paymentStatus = "paid"
        order.paidAt = new Date()
      }
    }
    
    await order.save()

    // Create payment record for revenue tracking
    const existing = await Payment.findOne({ orderId: order._id })
    if (!existing) {
      const paymentStatus = order.paymentStatus === "paid" ? "completed" : "pending"
      const payment = new Payment({
        orderId: order._id,
        userId: order.userId,
        amount: order.finalPrice || order.totalPrice,
        discount: order.discount || 0,
        finalAmount: order.finalPrice || order.totalPrice,
        paymentMethod: order.paymentMethod || "cash",
        status: paymentStatus,
        revenueType: order.orderType === "dine-in" ? "reception" : "delivery",
        branchId: order.branchId,
        collectedBy: receptionId,
        paidAt: order.paidAt || null,
      })
      await payment.save()
    }

    // Restore table availability for dine-in orders
    if (order.orderType === "dine-in" && order.branchId) {
      const branch = await Branch.findById(order.branchId)
      if (branch) {
        branch.availableTables = Math.min((branch.availableTables || 0) + 1, branch.totalTables || 999)
        await branch.save()
      }
    }

    // Notify admin/revenue manager if COD
    if (order.paymentTiming === "cod" && order.orderType === "takeaway") {
      const admin = await User.findOne({ role: "admin" })
      if (admin) {
        const notification = new Notification({
          type: "order_cod_pending",
          orderId: order._id,
          userId: admin._id,
          branchId: branchId,
          amount: order.finalPrice || order.totalPrice,
          message: `Don hang giao tại nhà #${order._id.toString().slice(-6).toUpperCase()} cho ${order.fullName || "Khach hang"} - ${(order.finalPrice || order.totalPrice).toLocaleString("vi-VN")}d (Shipper thu tien)`,
          category: "payment",
        })
        await notification.save()
      }
    }

    res.redirect(`/reception/orders/${req.params.id}?success=completed`)
  } catch (error) {
    console.error("[restaurant] Reception confirm order error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// ── CREATE WALK-IN ORDER ─────────────────────────────────────────────────
// Show the order creation form for walk-in customers
exports.getCreateOrderForm = async (req, res) => {
  try {
    const branchId = req.session.user.branchId
    if (!branchId) {
      return res.redirect("/reception?error=Ban chua duoc gan chi nhanh")
    }

    const branch = await Branch.findById(branchId).populate("dishes")
    // If branch has no linked dishes, fall back to all available dishes
    let dishes = branch && branch.dishes && branch.dishes.length > 0
      ? branch.dishes.filter(d => d.available)
      : await Dish.find({ available: true }).sort({ category: 1, name: 1 })

    res.render("reception/orders/create", {
      title: "Tao Don Hang Tai Quan",
      branch,
      dishes,
      success: req.query.success || null,
      error: req.query.error || null,
    })
  } catch (error) {
    console.error("[restaurant] Reception create order form error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Process the walk-in order creation
exports.createOrder = async (req, res) => {
  try {
    const branchId = req.session.user.branchId
    const receptionId = req.session.user.id
    if (!branchId) {
      return res.redirect("/reception?error=Ban chua duoc gan chi nhanh")
    }

    const { customerName, customerPhone, customerEmail, guests, specialRequests, items, paymentMethod } = req.body

    // Parse items - format: [{dishId, quantity}]
    let parsedItems = []
    if (typeof items === "string") {
      try { parsedItems = JSON.parse(items) } catch(e) { parsedItems = [] }
    } else if (Array.isArray(items)) {
      parsedItems = items
    }

    if (!parsedItems || parsedItems.length === 0) {
      return res.redirect("/reception/orders/create?error=Vui long chon it nhat 1 mon")
    }

    // Fetch dish data and calculate totals
    const dishIds = parsedItems.map(i => i.dishId)
    const dishDocs = await Dish.find({ _id: { $in: dishIds } })
    const dishMap = {}
    dishDocs.forEach(d => { dishMap[d._id.toString()] = d })

    let orderItems = []
    let totalPrice = 0

    parsedItems.forEach(item => {
      const dish = dishMap[item.dishId]
      if (dish) {
        const qty = parseInt(item.quantity) || 1
        const discountedPrice = dish.discount > 0 ? dish.price * (1 - dish.discount / 100) : dish.price
        orderItems.push({
          dishId: dish._id,
          name: dish.name,
          quantity: qty,
          price: discountedPrice,
          discount: dish.discount || 0,
        })
        totalPrice += discountedPrice * qty
      }
    })

    if (orderItems.length === 0) {
      return res.redirect("/reception/orders/create?error=Khong tim thay mon an hop le")
    }

    // The receptionist is the userId for walk-in orders (no registered customer account)
    // We use a special approach: userId = receptionId but mark as walkin
    const order = new Order({
      userId: receptionId,
      items: orderItems,
      orderType: "dine-in",
      branchId: branchId,
      guests: parseInt(guests) || 1,
      paymentTiming: "cod",
      totalPrice: totalPrice,
      discount: 0,
      finalPrice: totalPrice,
      status: "processing",
      paymentStatus: "unpaid",
      paymentMethod: paymentMethod || "cash",
      fullName: customerName || "Khach vang lai",
      email: customerEmail || "",
      phone: customerPhone || "",
      specialRequests: specialRequests || "",
      staffId: receptionId,
    })

    await order.save()

    // Reduce available tables
    const branch = await Branch.findById(branchId)
    if (branch && branch.availableTables > 0) {
      branch.availableTables -= 1
      await branch.save()
    }

    // Notify admin
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const notification = new Notification({
        type: "walkin_order",
        orderId: order._id,
        userId: admin._id,
        branchId: branchId,
        amount: totalPrice,
        message: `Le tan ${req.session.user.name} tao don tai quan cho ${customerName || "Khach vang lai"} - ${totalPrice.toLocaleString("vi-VN")}d`,
        category: "order",
      })
      await notification.save()
    }

    res.redirect(`/reception/orders/${order._id}?success=walkin`)
  } catch (error) {
    console.error("[restaurant] Reception create order error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// ── RESERVATIONS (branch-scoped) ────────────────────────────────────────
// Get reservations for the receptionist's branch only
exports.getReservations = async (req, res) => {
  try {
    const branchId = req.session.user.branchId

    if (!branchId) {
      return res.render("reception/reservations/index", {
        title: "Dat Ban Tai Chi Nhanh",
        reservations: [],
        statusFilter: "all",
        searchQuery: "",
        noBranch: true,
      })
    }

    const statusFilter = req.query.status || "all"
    const searchQuery = req.query.q || ""

    let query = { branchId }
    if (statusFilter === "pending") query.status = "pending"
    else if (statusFilter === "confirmed") query.status = { $in: ["confirmed", "paid", "processing"] }
    else if (statusFilter === "completed") query.status = "completed"

    if (searchQuery) {
      query.$or = [
        { userId: { $regex: searchQuery, $options: "i" } },
      ]
    }

    let reservations = await Reservation.find(query)
      .populate("userId", "name email phone")
      .populate("branchId", "name")
      .sort({ date: -1 })

    // Fallback search by user name/phone
    if (searchQuery && reservations.length === 0) {
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { phone: { $regex: searchQuery, $options: "i" } },
        ],
      }).select("_id")
      const userIds = matchedUsers.map((u) => u._id)
      const fallbackQuery = { branchId, userId: { $in: userIds } }
      if (statusFilter === "pending") fallbackQuery.status = "pending"
      else if (statusFilter === "confirmed") fallbackQuery.status = { $in: ["confirmed", "paid", "processing"] }
      else if (statusFilter === "completed") fallbackQuery.status = "completed"
      
      reservations = await Reservation.find(fallbackQuery)
        .populate("userId", "name email phone")
        .populate("branchId", "name")
        .sort({ date: -1 })
    }

    res.render("reception/reservations/index", {
      title: "Dat Ban Tai Chi Nhanh",
      reservations,
      statusFilter,
      searchQuery,
      noBranch: false,
    })
  } catch (error) {
    console.error("[restaurant] Reception reservations error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Get reservation detail for the receptionist's branch
exports.getReservationDetail = async (req, res) => {
  try {
    const branchId = req.session.user.branchId

    const query = { _id: req.params.id }
    if (branchId) query.branchId = branchId

    const reservation = await Reservation.findOne(query)
      .populate("userId", "name email phone address")
      .populate("branchId", "name address")
      .populate("orderItems.dishId", "name price")

    if (!reservation) {
      return res.status(404).render("404", { layout: false })
    }

    res.render("reception/reservations/detail", {
      title: "Chi Tiet Dat Ban",
      reservation,
      success: req.query.success || null,
    })
  } catch (error) {
    console.error("[restaurant] Reception reservation detail error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Confirm reservation — updates status and creates payment record
exports.confirmReservation = async (req, res) => {
  try {
    const branchId = req.session.user.branchId
    const receptionId = req.session.user.id
    const { confirmCode } = req.body

    if (confirmCode !== "CONFIRMED") {
      return res.redirect(`/reception/reservations/${req.params.id}?success=false`)
    }

    const query = { _id: req.params.id, status: "pending" }
    if (branchId) query.branchId = branchId

    const reservation = await Reservation.findOne(query)
    if (!reservation) {
      return res.status(404).render("404", { layout: false })
    }

    // Update reservation status to confirmed
    reservation.status = "confirmed"
    reservation.paymentStatus = "unpaid"
    await reservation.save()

    // Create payment record for revenue tracking
    const existingPayment = await Payment.findOne({ reservationId: reservation._id })
    if (!existingPayment) {
      const paymentAmount = reservation.totalAmount || (reservation.depositAmount + reservation.foodTotal - (reservation.foodDiscount || 0))
      const payment = new Payment({
        reservationId: reservation._id,
        userId: reservation.userId,
        amount: paymentAmount,
        discount: reservation.foodDiscount || 0,
        finalAmount: paymentAmount,
        paymentMethod: reservation.paymentMethod || "cash",
        status: "pending", // Receptionist confirmed; awaiting actual payment collection
        revenueType: "reception",
        branchId: reservation.branchId,
        collectedBy: receptionId,
        createdAt: new Date(),
      })
      await payment.save()
    }

    // Create notification for admin/revenue tracker
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const notification = new Notification({
        type: "reservation_confirmed",
        reservationId: reservation._id,
        userId: admin._id,
        branchId: branchId,
        amount: reservation.totalAmount || reservation.depositAmount,
        message: `Le tan ${req.session.user.name} xac nhan dat ban cho ${reservation.userId?.name || "Khach hang"} - ${(reservation.totalAmount || reservation.depositAmount).toLocaleString("vi-VN")}d`,
        category: "reservation",
      })
      await notification.save()
    }

    res.redirect(`/reception/reservations/${req.params.id}?success=confirmed`)
  } catch (error) {
    console.error("[restaurant] Reception confirm reservation error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
}

// Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id)
      .populate("branchId", "name address")
      .populate("pendingBranchId", "name address")
    if (!user) return res.redirect("/auth/logout")

    const branches = await Branch.find().select("name address")

    res.render("reception/profile", {
      title: "Ho So Le Tan",
      profile: user,
      branches,
      success: req.query.success || null,
      error: req.query.error || null,
    })
  } catch (error) {
    console.error("[restaurant] Reception profile error:", error)
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
    if (!isMatch) return res.redirect("/reception/profile?error=Mat khau hien tai khong dung")

    if (newPassword !== confirmPassword) return res.redirect("/reception/profile?error=Mat khau moi khong khop")

    if (newPassword.length < 6) return res.redirect("/reception/profile?error=Mat khau phai co it nhat 6 ky tu")

    user.password = newPassword
    await user.save()

    res.redirect("/reception/profile?success=Doi mat khau thanh cong")
  } catch (error) {
    console.error("[restaurant] Reception change password error:", error)
    res.redirect("/reception/profile?error=Loi he thong")
  }
}

// Request branch change
exports.requestBranchChange = async (req, res) => {
  try {
    const { newBranchId } = req.body
    const user = await User.findById(req.session.user.id)

    if (!user) return res.redirect("/auth/logout")

    const branch = await Branch.findById(newBranchId)
    if (!branch) return res.redirect("/reception/profile?error=Chi nhanh khong ton tai")

    if (user.branchId && user.branchId.toString() === newBranchId) {
      return res.redirect("/reception/profile?error=Ban da o chi nhanh nay roi")
    }

    if (user.branchChangeStatus === "pending") {
      return res.redirect("/reception/profile?error=Ban da co yeu cau dang cho duyet")
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
        message: `Le tan ${user.name} yeu cau doi chi nhanh sang ${branch.name}`,
      })
      await notification.save()
    }

    res.redirect("/reception/profile?success=Da gui yeu cau doi chi nhanh. Vui long cho admin duyet.")
  } catch (error) {
    console.error("[restaurant] Reception request branch change error:", error)
    res.redirect("/reception/profile?error=Loi he thong")
  }
}
