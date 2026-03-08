const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Reservation = require("../models/Reservation")
const Order = require("../models/Order")
const Payment = require("../models/Payment")
const Branch = require("../models/Branch")
const Dish = require("../models/Dish")
const Event = require("../models/Event")
const Notification = require("../models/Notification")

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login")
  }
  next()
}

// Middleware to check if user is an admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.redirect("/login")
  }
  next()
}

// Profile
router.get("/profile", checkAuth, async (req, res) => {
  try {
    var user = await User.findById(req.session.user.id)
      .populate("branchId", "name address")
      .populate("pendingBranchId", "name address")
    var reservations = await Reservation.find({ userId: req.session.user.id })
      .populate("branchId")
      .populate("staffId", "name phone")
      .sort({ createdAt: -1 })
    var orders = await Order.find({ userId: req.session.user.id })
      .sort({ createdAt: -1 })
    var branches = await Branch.find().select("name address")
    res.render("user/profile/index", { 
      user: user,
      reservations: reservations, 
      orders: orders,
      branches: branches,
      success: req.query.success || null,
      error: req.query.error || null
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Update profile
router.post("/update-profile", checkAuth, async (req, res) => {
  try {
    var { name, email, phone, address } = req.body;
    var user = await User.findById(req.session.user.id);
    
    if (!user) {
      return res.redirect("/user/profile?error=Khong tim thay tai khoan");
    }

    // Check if email is already used by another user
    if (email !== user.email) {
      var existingUser = await User.findOne({ email: email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.redirect("/user/profile?error=Email nay da duoc su dung");
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    await user.save();

    // Update session
    req.session.user.name = user.name;
    req.session.user.email = user.email;
    req.session.user.phone = user.phone;

    res.redirect("/user/profile?success=Cap nhat ho so thanh cong");
  } catch (error) {
    console.error("[restaurant] Update profile error:", error);
    res.redirect("/user/profile?error=Loi khi cap nhat ho so");
  }
})

// Change password
router.post("/change-password", checkAuth, async (req, res) => {
  try {
    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;

    var user = await User.findById(req.session.user.id);
    if (!user) {
      return res.redirect("/user/profile?error=Khong tim thay tai khoan");
    }

    // Verify current password
    var isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.redirect("/user/profile?error=Mat khau hien tai khong dung");
    }

    if (!newPassword || newPassword.length < 6) {
      return res.redirect("/user/profile?error=Mat khau moi phai co it nhat 6 ky tu");
    }

    if (newPassword !== confirmPassword) {
      return res.redirect("/user/profile?error=Mat khau xac nhan khong khop");
    }

    user.password = newPassword;
    await user.save();

    res.redirect("/user/profile?success=Doi mat khau thanh cong");
  } catch (error) {
    console.error("[restaurant] User change password error:", error);
    res.redirect("/user/profile?error=Loi khi doi mat khau");
  }
})

// Request branch change for reception role
router.post("/request-branch-change", checkAuth, async (req, res) => {
  try {
    var user = await User.findById(req.session.user.id)
    if (!user) return res.redirect("/auth/logout")

    if (user.role !== "reception") {
      return res.redirect("/user/profile?error=Chi danh cho nhan vien le tan")
    }

    var newBranchId = req.body.newBranchId
    var branch = await Branch.findById(newBranchId)
    if (!branch) return res.redirect("/user/profile?error=Chi nhanh khong ton tai")

    if (user.branchId && user.branchId.toString() === newBranchId) {
      return res.redirect("/user/profile?error=Ban da o chi nhanh nay roi")
    }

    if (user.branchChangeStatus === "pending") {
      return res.redirect("/user/profile?error=Ban da co yeu cau dang cho duyet")
    }

    user.pendingBranchId = newBranchId
    user.branchChangeStatus = "pending"
    await user.save()

    var admin = await User.findOne({ role: "admin" })
    if (admin) {
      var notification = new Notification({
        type: "branch_change_request",
        userId: admin._id,
        amount: 0,
        message: "Le tan " + user.name + " yeu cau doi chi nhanh sang " + branch.name,
      })
      await notification.save()
    }

    res.redirect("/user/profile?success=Da gui yeu cau doi chi nhanh. Vui long cho admin duyet.")
  } catch (error) {
    console.error("[restaurant] Reception request branch change error:", error)
    res.redirect("/user/profile?error=Loi he thong")
  }
})

// Reservation form
router.get("/reservation", checkAuth, async (req, res) => {
  try {
    const branches = await Branch.find().populate("dishes")
    const dishes = await Dish.find({ available: true })
    res.render("user/reservation/index", { branches, dishes })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.post("/reservation", checkAuth, async (req, res) => {
  try {
    const { branchId, date, time, guests, specialRequests, dishes } = req.body

    const validation = validateReservationDate(date, time)
    if (!validation.valid) {
      const branches = await Branch.find()
      const allDishes = await Dish.find({ available: true })
      return res.status(400).render("user/reservation/index", {
        branches,
        dishes: allDishes,
        error: validation.error,
      })
    }

    // Check table availability
    const branch = await Branch.findById(branchId)
    if (!branch) {
      const branches = await Branch.find()
      const allDishes = await Dish.find({ available: true })
      return res.status(400).render("user/reservation/index", {
        branches,
        dishes: allDishes,
        error: "Chi nhánh không tồn tại",
      })
    }

    if (branch.availableTables < 1) {
      const branches = await Branch.find()
      const allDishes = await Dish.find({ available: true })
      return res.status(400).render("user/reservation/index", {
        branches,
        dishes: allDishes,
        error: "Không còn bàn trống tại chi nhánh này",
      })
    }

    const orderItems = []
    let foodTotal = 0
    let foodDiscount = 0

    if (dishes) {
      for (const [dishId, dishData] of Object.entries(dishes)) {
        const quantity = Number.parseInt(dishData.quantity) || 0
        if (quantity > 0) {
          const dish = await Dish.findById(dishId)
          if (dish) {
            const itemTotal = dish.price * quantity
            const itemDiscount = (dish.discount / 100) * itemTotal

            foodTotal += itemTotal
            foodDiscount += itemDiscount

            orderItems.push({
              dishId: dish._id,
              name: dish.name,
              quantity,
              price: dish.price,
              discount: dish.discount || 0,
            })
          }
        }
      }
    }

    const depositAmount = 100000 // Fixed deposit
    const totalAmount = depositAmount + (foodTotal - foodDiscount)

    const reservation = new Reservation({
      userId: req.session.user.id,
      branchId,
      date,
      time,
      guests,
      specialRequests,
      orderItems,
      depositAmount,
      foodTotal,
      foodDiscount,
      totalAmount,
      status: "pending",
      paymentStatus: "unpaid",
    })

    await reservation.save()

    // Decrease available tables
    branch.availableTables -= 1
    await branch.save()

    // Auto-assign reservation to staff - round-robin by _id
    try {
      const staffMembers = await User.find({ role: "staff" }).select("name").sort({ _id: 1 })

      if (staffMembers.length > 0) {
        // Find the last reservation assigned to staff
        const lastAssigned = await Reservation.findOne({ staffId: { $ne: null } }).sort({ createdAt: -1 }).select("staffId")
        
        let selectedIndex = 0
        if (lastAssigned && lastAssigned.staffId) {
          const lastIdx = staffMembers.findIndex(s => s._id.toString() === lastAssigned.staffId.toString())
          if (lastIdx !== -1) {
            selectedIndex = (lastIdx + 1) % staffMembers.length
          }
        }
        
        const selectedStaff = staffMembers[selectedIndex]
        reservation.staffId = selectedStaff._id
        await reservation.save()

        const staffNotif = new Notification({
          type: "reservation_assigned",
          userId: selectedStaff._id,
          amount: totalAmount,
          message: `Ban duoc giao dat ban #${reservation._id.toString().slice(-6).toUpperCase()} - ${totalAmount.toLocaleString('vi-VN')}d`,
        })
        await staffNotif.save()
        console.log("[restaurant] Auto-assigned reservation to staff:", selectedStaff.name, "(ID index:", selectedIndex, ")")
      }
    } catch (assignError) {
      console.error("[restaurant] Reservation auto-assign error (non-critical):", assignError)
    }

    // Redirect to payment page immediately (must pay before confirmation)
    res.redirect(`/user/payment/reservation/${reservation._id}`)
  } catch (error) {
    console.error("[restaurant] Reservation error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Cart
router.get("/cart", checkAuth, (req, res) => {
  const cart = req.session.cart || []
  res.render("user/cart/index", { cart })
})

// Add to cart
router.post("/cart/add", checkAuth, async (req, res) => {
  try {
    const { dishId, quantity } = req.body
    const dish = await Dish.findById(dishId)

    if (!req.session.cart) req.session.cart = []

    const existingItem = req.session.cart.find((item) => item.dishId === dishId)
    if (existingItem) {
      existingItem.quantity += Number.parseInt(quantity)
    } else {
      req.session.cart.push({
        dishId,
        name: dish.name,
        price: dish.price,
        discount: dish.discount || 0,
        quantity: Number.parseInt(quantity),
      })
    }

    res.redirect("/user/cart")
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.get("/cart/remove/:dishId", checkAuth, (req, res) => {
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter((item) => item.dishId !== req.params.dishId)
  }
  res.redirect("/user/cart")
})

// Checkout
router.get("/checkout", checkAuth, async (req, res) => {
  try {
    const cart = req.session.cart || []

    if (cart.length === 0) {
      return res.redirect("/user/cart?error=Giỏ hàng trống")
    }

    let total = 0
    let totalDiscount = 0

    for (const item of cart) {
      const dish = await Dish.findById(item.dishId)
      if (dish) {
        const itemTotal = dish.price * item.quantity
        const itemDiscount = (dish.discount / 100) * itemTotal
        total += itemTotal
        totalDiscount += itemDiscount
        item.discount = dish.discount
      }
    }

    const finalTotal = total - totalDiscount

    const allBranches = await Branch.find().populate("dishes")
    const cartDishIds = cart.map((item) => item.dishId)

    // Filter branches that have ALL dishes from cart
    const branches = allBranches.filter((branch) => {
      const branchDishIds = branch.dishes.map((d) => d._id.toString())
      return cartDishIds.every((dishId) => branchDishIds.includes(dishId))
    })

    const isCODRestricted = finalTotal > 10000000

    res.render("user/checkout/index", {
      cart,
      total,
      totalDiscount,
      finalTotal,
      branches,
      cartDishIds,
      isCODRestricted, // Pass restriction flag to view
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.post("/order", checkAuth, async (req, res) => {
  try {
    const {
      deliveryAddress,
      fullName,
      email,
      phone,
      orderType,
      branchId,
      guests,
      specialRequests,
      paymentTiming,
      largeOrderNote,
    } = req.body
    const cart = req.session.cart || []

    if (cart.length === 0) {
      return res.status(400).render("error", { error: "Giỏ hàng trống", layout: false })
    }

    if (orderType === "dine-in") {
      if (!branchId) {
        return res.status(400).render("error", { error: "Vui lòng chọn chi nhánh", layout: false })
      }

      const branch = await Branch.findById(branchId)
      if (!branch) {
        return res.status(400).render("error", { error: "Chi nhánh không tồn tại", layout: false })
      }

      if (branch.availableTables < 1) {
        return res.status(400).render("error", { error: "Không còn bàn trống tại chi nhánh này", layout: false })
      }
    }

    let totalPrice = 0
    let totalDiscount = 0
    const items = []

    for (const item of cart) {
      const dish = await Dish.findById(item.dishId)
      if (dish) {
        const itemPrice = dish.price * item.quantity
        const itemDiscount = (dish.discount / 100) * itemPrice
        totalPrice += itemPrice
        totalDiscount += itemDiscount

        items.push({
          dishId: dish._id,
          name: dish.name,
          quantity: item.quantity,
          price: dish.price,
          discount: dish.discount,
        })
      }
    }

    const finalPrice = totalPrice - totalDiscount

    if (finalPrice > 10000000 && paymentTiming === "cod") {
      return res.status(400).render("error", {
        error: "Đơn hàng trên 10 triệu đồng chỉ được thanh toán bằng chuyển khoản ngân hàng",
        layout: false,
      })
    }

    const order = new Order({
      userId: req.session.user.id,
      items,
      orderType: orderType || "takeaway",
      branchId: orderType === "dine-in" ? branchId : null,
      guests: orderType === "dine-in" ? guests : null,
      paymentTiming: paymentTiming || "prepaid",
      totalPrice,
      discount: totalDiscount,
      finalPrice,
      deliveryAddress: orderType === "takeaway" ? deliveryAddress : null,
      fullName,
      email,
      phone,
      specialRequests,
      largeOrderNote: largeOrderNote || null,
      status: "pending",
    })

    await order.save()

    if (finalPrice > 100000000) {
      const notification = new Notification({
        type: "large_order",
        orderId: order._id,
        userId: req.session.user.id,
        amount: finalPrice,
        message: `Đơn hàng giá trị cao: ${finalPrice.toLocaleString("vi-VN")}đ từ khách hàng ${fullName}`,
        userNote: largeOrderNote || "Không có yêu cầu đặc biệt",
        status: "pending",
      })
      await notification.save()

      order.adminNotified = true
      await order.save()

      console.log("[restaurant] Large order notification created:", notification._id)
    }

    if (orderType === "dine-in" && branchId) {
      const branch = await Branch.findById(branchId)
      if (branch && branch.availableTables > 0) {
        branch.availableTables -= 1
        await branch.save()
        console.log("[restaurant] Table decremented for dine-in order:", {
          branchId,
          remainingTables: branch.availableTables,
        })
      }
    }

    // Auto-assign order to shipper (takeaway) or staff (dine-in)
    // Round-robin by _id: sorted low to high, find last assigned, pick next, cycle back
    try {
      if (orderType === "takeaway") {
        // Get all shippers sorted by _id ascending
        const shippers = await User.find({ role: "shipper" }).select("name").sort({ _id: 1 })
        
        if (shippers.length > 0) {
          // Find the last takeaway order that was assigned to a shipper
          const lastAssigned = await Order.findOne({ shipperId: { $ne: null }, orderType: "takeaway" }).sort({ createdAt: -1 }).select("shipperId")
          
          let selectedIndex = 0
          if (lastAssigned && lastAssigned.shipperId) {
            // Find the index of the last assigned shipper
            const lastIdx = shippers.findIndex(s => s._id.toString() === lastAssigned.shipperId.toString())
            if (lastIdx !== -1) {
              selectedIndex = (lastIdx + 1) % shippers.length // Next in line, cycle back
            }
          }
          
          const selectedShipper = shippers[selectedIndex]
          order.shipperId = selectedShipper._id
          order.status = "processing"
          await order.save()

          const shipperNotif = new Notification({
            type: "order_assigned",
            orderId: order._id,
            userId: selectedShipper._id,
            amount: finalPrice,
            message: `Ban duoc giao don hang giao tai nha #${order._id.toString().slice(-6).toUpperCase()} - ${finalPrice.toLocaleString('vi-VN')}d`,
          })
          await shipperNotif.save()
          console.log("[restaurant] Auto-assigned takeaway order to shipper:", selectedShipper.name, "(ID index:", selectedIndex, ")")
        }
      } else if (orderType === "dine-in") {
        // Get all staff sorted by _id ascending
        const staffMembers = await User.find({ role: "staff" }).select("name").sort({ _id: 1 })

        if (staffMembers.length > 0) {
          // Find the last dine-in order that was assigned to staff
          const lastAssigned = await Order.findOne({ staffId: { $ne: null }, orderType: "dine-in" }).sort({ createdAt: -1 }).select("staffId")
          
          let selectedIndex = 0
          if (lastAssigned && lastAssigned.staffId) {
            const lastIdx = staffMembers.findIndex(s => s._id.toString() === lastAssigned.staffId.toString())
            if (lastIdx !== -1) {
              selectedIndex = (lastIdx + 1) % staffMembers.length
            }
          }
          
          const selectedStaff = staffMembers[selectedIndex]
          order.staffId = selectedStaff._id
          order.status = "processing"
          await order.save()

          const staffNotif = new Notification({
            type: "order_assigned",
            orderId: order._id,
            userId: selectedStaff._id,
            amount: finalPrice,
            message: `Ban duoc giao don an tai quan #${order._id.toString().slice(-6).toUpperCase()} - ${finalPrice.toLocaleString('vi-VN')}d`,
          })
          await staffNotif.save()
          console.log("[restaurant] Auto-assigned dine-in order to staff:", selectedStaff.name, "(ID index:", selectedIndex, ")")
        }
      }
    } catch (assignError) {
      console.error("[restaurant] Auto-assign error (non-critical):", assignError)
    }

    req.session.cart = []

    if (paymentTiming === "cod") {
      res.redirect("/user/profile?success=Đặt hàng thành công! Thanh toán khi nhận hàng")
    } else {
      res.redirect(`/user/payment/order/${order._id}`)
    }
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.get("/payment/order/:orderId", checkAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("userId").populate("branchId")

    if (!order) return res.status(404).render("404", { layout: false })
    if (order.userId._id.toString() !== req.session.user.id) {
      return res.status(403).render("error", { error: "Không có quyền truy cập", layout: false })
    }

    if (order.paymentStatus === "paid") {
      return res.redirect("/user/profile?error=Đơn hàng đã được thanh toán")
    }

    res.render("user/payment/index", {
      order,
      reservation: null,
      type: "order",
      title: "Thanh Toán Đơn Hàng",
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.post("/payment/order/:orderId/confirm", checkAuth, async (req, res) => {
  try {
    console.log("[restaurant] Order payment confirmation started")
    console.log("[restaurant] Request body:", req.body)

    const { paymentMethod } = req.body
    const order = await Order.findById(req.params.orderId)

    if (!order) {
      console.log("[restaurant] Order not found")
      return res.status(404).render("404", { layout: false })
    }

    if (order.userId.toString() !== req.session.user.id) {
      console.log("[restaurant] Unauthorized access")
      return res.status(403).render("error", { error: "Không có quyền truy cập", layout: false })
    }

    console.log("[restaurant] Creating payment record...")

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      userId: order.userId,
      amount: order.totalPrice,
      discount: order.discount,
      finalAmount: order.finalPrice,
      paymentMethod,
      status: "completed",
      revenueType: order.orderType === "dine-in" ? "reception" : "delivery",
      branchId: order.orderType === "dine-in" ? (order.branchId || null) : null,
      collectedBy: order.orderType !== "dine-in" ? (order.shipperId || null) : null,
      transactionId: `TXN${Date.now()}${order._id.toString().slice(-6)}`,
      paidAt: new Date(),
    })
    await payment.save()
    console.log("[restaurant] Payment saved:", payment._id)

    // Update order status
    order.status = "paid"
    order.paymentStatus = "paid"
    order.paymentMethod = paymentMethod
    order.paidAt = new Date()
    await order.save()
    console.log("[restaurant] Order updated")

    res.redirect("/user/profile?success=Thanh toán thành công!")
  } catch (error) {
    console.error("[restaurant] Payment confirmation error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.get("/payment/reservation/:reservationId", checkAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId)
      .populate("userId")
      .populate("branchId")
      .populate("orderItems.dishId")

    if (!reservation) return res.status(404).render("404", { layout: false })
    if (reservation.userId._id.toString() !== req.session.user.id) {
      return res.status(403).render("error", { error: "Không có quyền truy cập", layout: false })
    }

    if (reservation.paymentStatus === "paid") {
      return res.redirect("/user/profile?error=Đặt bàn đã được thanh toán")
    }

    res.render("user/payment/index", {
      order: null,
      reservation,
      type: "reservation",
      title: "Thanh Toán Đặt Bàn",
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.post("/payment/reservation/:reservationId/confirm", checkAuth, async (req, res) => {
  try {
    console.log("[restaurant] Reservation payment confirmation started")
    console.log("[restaurant] Request body:", req.body)

    const { paymentMethod } = req.body
    const reservation = await Reservation.findById(req.params.reservationId)

    if (!reservation) {
      console.log("[restaurant] Reservation not found")
      return res.status(404).render("404", { layout: false })
    }

    if (reservation.userId.toString() !== req.session.user.id) {
      console.log("[restaurant] Unauthorized access")
      return res.status(403).render("error", { error: "Không có quyền truy cập", layout: false })
    }

    console.log("[restaurant] Creating payment record...")

    // Create payment record
    const payment = new Payment({
      reservationId: reservation._id,
      userId: reservation.userId,
      amount: reservation.totalAmount,
      discount: reservation.foodDiscount,
      finalAmount: reservation.totalAmount,
      paymentMethod,
      status: "completed",
      revenueType: "reception",
      branchId: reservation.branchId || null,
      transactionId: `TXN${Date.now()}${reservation._id.toString().slice(-6)}`,
      paidAt: new Date(),
    })
    await payment.save()
    console.log("[restaurant] Payment saved:", payment._id)

    // Update reservation status
    reservation.status = "confirmed"
    reservation.paymentStatus = "paid"
    reservation.paymentMethod = paymentMethod
    reservation.paidAt = new Date()
    await reservation.save()
    console.log("[restaurant] Reservation updated")

    res.redirect("/user/profile?success=Thanh toán đặt bàn thành công!")
  } catch (error) {
    console.error("[restaurant] Payment confirmation error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// User orders list page
router.get("/orders", checkAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.user.id })
      .populate("items.dishId")
      .populate("branchId")
      .populate("shipperId", "name phone")
      .populate("staffId", "name phone")
      .populate("confirmedBy", "name role")
      .sort({ createdAt: -1 })

    res.render("user/orders/index", {
      title: "Don Hang Cua Toi",
      orders,
      message: req.session.message,
    })
    delete req.session.message
  } catch (error) {
    console.error("[restaurant] User orders error:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Rate an order
router.post("/orders/:id/rate", checkAuth, async (req, res) => {
  try {
    const { rating, ratingComment } = req.body
    const order = await Order.findOne({ _id: req.params.id, userId: req.session.user.id })

    if (!order) {
      req.session.message = { type: "error", text: "Khong tim thay don hang" }
      return res.redirect("/user/orders")
    }

    if (order.status !== "completed" && order.status !== "delivered") {
      req.session.message = { type: "error", text: "Chi co the danh gia don hang da hoan thanh hoac da giao" }
      return res.redirect("/user/orders")
    }

    if (order.rating) {
      req.session.message = { type: "error", text: "Ban da danh gia don hang nay roi" }
      return res.redirect("/user/orders")
    }

    const ratingNum = parseInt(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      req.session.message = { type: "error", text: "Danh gia phai tu 1 den 5 sao" }
      return res.redirect("/user/orders")
    }

    order.rating = ratingNum
    order.ratingComment = ratingComment || ""
    order.ratedAt = new Date()
    await order.save()

    // Notify admin about the new review
    const ratingLabels = ["", "Rat te", "Khong tot", "Binh thuong", "Tot", "Tuyet voi"]
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const notification = new Notification({
        type: "order_review",
        orderId: order._id,
        userId: admin._id,
        amount: 0,
        message: `Khach hang ${req.session.user.name} danh gia ${ratingNum} sao (${ratingLabels[ratingNum]}) cho don #${order._id.toString().slice(-6).toUpperCase()}`,
        details: ratingComment || null,
      })
      await notification.save()
    }

    req.session.message = { type: "success", text: "Danh gia thanh cong! Cam on ban." }
    res.redirect("/user/orders")
  } catch (error) {
    console.error("[restaurant] Rate order error:", error)
    req.session.message = { type: "error", text: "Loi khi danh gia" }
    res.redirect("/user/orders")
  }
})

// Rate a reservation
router.post("/reservations/:id/rate", checkAuth, async (req, res) => {
  try {
    const { rating, ratingComment } = req.body
    const reservation = await Reservation.findOne({ _id: req.params.id, userId: req.session.user.id })

    if (!reservation) {
      return res.redirect("/user/profile?error=Khong tim thay dat ban")
    }

    if (reservation.status !== "completed") {
      return res.redirect("/user/profile?error=Chi co the danh gia dat ban da hoan thanh")
    }

    if (reservation.rating) {
      return res.redirect("/user/profile?error=Ban da danh gia dat ban nay roi")
    }

    const ratingNum = parseInt(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.redirect("/user/profile?error=Danh gia phai tu 1 den 5 sao")
    }

    reservation.rating = ratingNum
    reservation.ratingComment = ratingComment || ""
    reservation.ratedAt = new Date()
    await reservation.save()

    // Notify admin about the new review
    const ratingLabels = ["", "Rat te", "Khong tot", "Binh thuong", "Tot", "Tuyet voi"]
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const notification = new Notification({
        type: "reservation_review",
        userId: admin._id,
        amount: 0,
        message: `Khach hang ${req.session.user.name} danh gia ${ratingNum} sao (${ratingLabels[ratingNum]}) cho dat ban #${reservation._id.toString().slice(-6).toUpperCase()}`,
        details: ratingComment || null,
      })
      await notification.save()
    }

    res.redirect("/user/profile?success=Danh gia thanh cong! Cam on ban.")
  } catch (error) {
    console.error("[restaurant] Rate reservation error:", error)
    res.redirect("/user/profile?error=Loi khi danh gia")
  }
})

function validateReservationDate(date, time) {
  const now = new Date()
  const reservationDateTime = new Date(`${date}T${time}`)

  if (reservationDateTime <= now) {
    return { valid: false, error: "Ngày giờ đặt bàn phải lớn hơn thời gian hiện tại" }
  }
  return { valid: true }
}

function generateQRCode(amount, orderRef, method) {
  if (method === "bank") {
    const bankId = "970422" // MB Bank (you can change this)
    const accountNo = "0123456789" // Replace with real account
    const accountName = "RESTAURANT"
    const content = orderRef

    // VietQR API - generates real QR code for Vietnamese banks
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${content}&accountName=${accountName}`
  }

  return null
}

module.exports = router
