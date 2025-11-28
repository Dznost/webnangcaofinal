const express = require("express")
const router = express.Router()
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
    const reservations = await Reservation.find({ userId: req.session.user.id }).populate("branchId")
    const orders = await Order.find({ userId: req.session.user.id })
    res.render("user/profile/index", { reservations, orders })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Reservation form
router.get("/reservation", checkAuth, async (req, res) => {
  try {
    const branches = await Branch.find().populate("dishes")
    const dishes = await Dish.find({ available: true })
    res.render("user/reservation/index", { branches, dishes })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
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

    // Redirect to payment page immediately (must pay before confirmation)
    res.redirect(`/user/payment/reservation/${reservation._id}`)
  } catch (error) {
    console.error("[restaurant] Reservation error:", error)
    res.status(500).render("error", { error: error.message })
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
    res.status(500).render("error", { error: error.message })
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
    res.status(500).render("error", { error: error.message })
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
      return res.status(400).render("error", { error: "Giỏ hàng trống" })
    }

    if (orderType === "dine-in") {
      if (!branchId) {
        return res.status(400).render("error", { error: "Vui lòng chọn chi nhánh" })
      }

      const branch = await Branch.findById(branchId)
      if (!branch) {
        return res.status(400).render("error", { error: "Chi nhánh không tồn tại" })
      }

      if (branch.availableTables < 1) {
        return res.status(400).render("error", { error: "Không còn bàn trống tại chi nhánh này" })
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

    req.session.cart = []

    if (paymentTiming === "cod") {
      res.redirect("/user/profile?success=Đặt hàng thành công! Thanh toán khi nhận hàng")
    } else {
      res.redirect(`/user/payment/order/${order._id}`)
    }
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/payment/order/:orderId", checkAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("userId").populate("branchId")

    if (!order) return res.status(404).render("404")
    if (order.userId._id.toString() !== req.session.user.id) {
      return res.status(403).render("error", { error: "Không có quyền truy cập" })
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
    res.status(500).render("error", { error: error.message })
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
      return res.status(404).render("404")
    }

    if (order.userId.toString() !== req.session.user.id) {
      console.log("[restaurant] Unauthorized access")
      return res.status(403).render("error", { error: "Không có quyền truy cập" })
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
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/payment/reservation/:reservationId", checkAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId)
      .populate("userId")
      .populate("branchId")
      .populate("orderItems.dishId")

    if (!reservation) return res.status(404).render("404")
    if (reservation.userId._id.toString() !== req.session.user.id) {
      return res.status(403).render("error", { error: "Không có quyền truy cập" })
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
    res.status(500).render("error", { error: error.message })
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
      return res.status(404).render("404")
    }

    if (reservation.userId.toString() !== req.session.user.id) {
      console.log("[restaurant] Unauthorized access")
      return res.status(403).render("error", { error: "Không có quyền truy cập" })
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
    res.status(500).render("error", { error: error.message })
  }
})

// User orders list page
router.get("/orders", checkAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.user.id })
      .populate("items.dishId")
      .populate("branchId")
      .sort({ createdAt: -1 })

    res.render("user/orders/index", {
      title: "Đơn Hàng Của Tôi",
      orders,
      message: req.session.message,
    })
    delete req.session.message
  } catch (error) {
    console.error("[restaurant] User orders error:", error)
    res.status(500).render("error", { error: error.message })
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
