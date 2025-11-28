const express = require("express")
const router = express.Router()
const Dish = require("../models/Dish")
const Branch = require("../models/Branch")
const Event = require("../models/Event")
const Blog = require("../models/Blog")
const User = require("../models/User")
const Order = require("../models/Order")
const Reservation = require("../models/Reservation")
const Contact = require("../models/Contact")

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/")
  }
  next()
}

// Dashboard
router.get("/", checkAdmin, async (req, res) => {
  try {
    const dishCount = await Dish.countDocuments()
    const branchCount = await Branch.countDocuments()
    const userCount = await User.countDocuments({ role: "user" })
    const eventCount = await Event.countDocuments()
    const reservationCount = await Reservation.countDocuments()
    const orderCount = await Order.countDocuments()
    const blogCount = await Blog.countDocuments()

    // Get recent orders and reservations
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate("userId")
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId")
      .populate("branchId")

    res.render("admin/dashboard", {
      dishCount,
      branchCount,
      userCount,
      eventCount,
      reservationCount,
      orderCount,
      blogCount,
      recentOrders,
      recentReservations,
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Dishes management
router.get("/dishes", checkAdmin, async (req, res) => {
  try {
    const dishes = await Dish.find()
    res.render("admin/dishes", { dishes })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/dish/new", checkAdmin, (req, res) => {
  res.render("admin/dish-form", { dish: null })
})

router.post("/dish", checkAdmin, async (req, res) => {
  try {
    const { name, description, price, image, category, discount } = req.body
    const dish = new Dish({ name, description, price, image, category, discount })
    await dish.save()
    res.redirect("/admin/dishes?success=Dish added successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/dish/:id/edit", checkAdmin, async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
    res.render("admin/dish-form", { dish })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/dish/:id", checkAdmin, async (req, res) => {
  try {
    const { name, description, price, image, category, discount } = req.body
    await Dish.findByIdAndUpdate(req.params.id, { name, description, price, image, category, discount })
    res.redirect("/admin/dishes?success=Dish updated successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/dish/:id/delete", checkAdmin, async (req, res) => {
  try {
    await Dish.findByIdAndDelete(req.params.id)
    res.redirect("/admin/dishes?success=Dish deleted successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Branches management
router.get("/branches", checkAdmin, async (req, res) => {
  try {
    const branches = await Branch.find()
    res.render("admin/branches", { branches })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/branch/new", checkAdmin, async (req, res) => {
  try {
    const dishes = await Dish.find()
    res.render("admin/branch-form", { branch: null, dishes })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/branch", checkAdmin, async (req, res) => {
  try {
    const { name, address, phone, email, image, images, openingHours, description, totalTables, dishes } = req.body
    
    const imagesArray = images ? images.split(',').map(img => img.trim()).filter(img => img) : []
    const dishesArray = dishes ? (Array.isArray(dishes) ? dishes : [dishes]) : []
    
    const branch = new Branch({ 
      name, 
      address, 
      phone, 
      email, 
      image, 
      images: imagesArray,
      openingHours, 
      description,
      totalTables: totalTables || 20,
      availableTables: totalTables || 20,
      dishes: dishesArray
    })
    await branch.save()
    res.redirect("/admin/branches?success=Chi nhánh đã được thêm thành công")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/branch/:id/edit", checkAdmin, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate("dishes")
    const dishes = await Dish.find()
    res.render("admin/branch-form", { branch, dishes })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/branch/:id", checkAdmin, async (req, res) => {
  try {
    const { name, address, phone, email, image, images, openingHours, description, totalTables, availableTables, dishes } = req.body
    
    const imagesArray = images ? images.split(',').map(img => img.trim()).filter(img => img) : []
    const dishesArray = dishes ? (Array.isArray(dishes) ? dishes : [dishes]) : []
    
    await Branch.findByIdAndUpdate(req.params.id, { 
      name, 
      address, 
      phone, 
      email, 
      image,
      images: imagesArray,
      openingHours, 
      description,
      totalTables,
      availableTables,
      dishes: dishesArray
    })
    res.redirect("/admin/branches?success=Chi nhánh đã được cập nhật thành công")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/branch/:id/delete", checkAdmin, async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id)
    res.redirect("/admin/branches?success=Branch deleted successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Events management
router.get("/events", checkAdmin, async (req, res) => {
  try {
    const events = await Event.find()
    res.render("admin/events", { events })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/event/new", checkAdmin, async (req, res) => {
  try {
    const branches = await Branch.find()
    res.render("admin/event-form", { event: null, branches })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

const validateEventDates = (startDate, endDate) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start <= now) {
    return { valid: false, error: "Ngày bắt đầu phải lớn hơn ngày hiện tại" }
  }
  if (end <= start) {
    return { valid: false, error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" }
  }
  return { valid: true }
}

const validateReservationDate = (date, time) => {
  const now = new Date()
  const reservationDateTime = new Date(`${date}T${time}`)

  if (reservationDateTime <= now) {
    return { valid: false, error: "Ngày giờ đặt bàn phải lớn hơn thời gian hiện tại" }
  }
  return { valid: true }
}

router.post("/event", checkAdmin, async (req, res) => {
  try {
    const { title, description, image, discount, startDate, endDate, branches, isGlobal } = req.body

    const validation = validateEventDates(startDate, endDate)
    if (!validation.valid) {
      const allBranches = await Branch.find()
      return res.status(400).render("admin/event-form", {
        event: null,
        branches: allBranches,
        error: validation.error,
      })
    }

    const branchesArray = branches ? (Array.isArray(branches) ? branches : [branches]) : []
    
    const event = new Event({ 
      title, 
      description, 
      image, 
      discount, 
      startDate, 
      endDate,
      branches: branchesArray,
      isGlobal: isGlobal === 'on'
    })
    await event.save()
    res.redirect("/admin/events?success=Sự kiện được thêm thành công")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/event/:id/edit", checkAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("branches")
    const branches = await Branch.find()
    res.render("admin/event-form", { event, branches })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/event/:id", checkAdmin, async (req, res) => {
  try {
    const { title, description, image, discount, startDate, endDate, branches, isGlobal } = req.body

    const validation = validateEventDates(startDate, endDate)
    if (!validation.valid) {
      const event = await Event.findById(req.params.id)
      const allBranches = await Branch.find()
      return res.status(400).render("admin/event-form", {
        event,
        branches: allBranches,
        error: validation.error,
      })
    }

    const branchesArray = branches ? (Array.isArray(branches) ? branches : [branches]) : []

    await Event.findByIdAndUpdate(req.params.id, { 
      title, 
      description, 
      image, 
      discount, 
      startDate, 
      endDate,
      branches: branchesArray,
      isGlobal: isGlobal === 'on'
    })
    res.redirect("/admin/events?success=Sự kiện được cập nhật thành công")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/event/:id/delete", checkAdmin, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id)
    res.redirect("/admin/events?success=Event deleted successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/blog", checkAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 })
    res.render("admin/blog", { blogs })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/blog/new", checkAdmin, (req, res) => {
  res.render("admin/blog-form", { blog: null })
})

router.post("/blog", checkAdmin, async (req, res) => {
  try {
    const { title, content, image, author } = req.body
    const blog = new Blog({ title, content, image, author })
    await blog.save()
    res.redirect("/admin/blog?success=Blog added successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/blog/:id/edit", checkAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    res.render("admin/blog-form", { blog })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/blog/:id", checkAdmin, async (req, res) => {
  try {
    const { title, content, image, author } = req.body
    await Blog.findByIdAndUpdate(req.params.id, { title, content, image, author })
    res.redirect("/admin/blog?success=Blog updated successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/blog/:id/delete", checkAdmin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id)
    res.redirect("/admin/blog?success=Blog deleted successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/orders", checkAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId").populate("items.dishId")
    res.render("admin/orders", { orders })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/order/:id", checkAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId").populate("items.dishId")
    res.render("admin/order-detail", { order })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/order/:id/status", checkAdmin, async (req, res) => {
  try {
    const { status } = req.body
    await Order.findByIdAndUpdate(req.params.id, { status })
    res.redirect("/admin/orders?success=Order status updated")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/order/:id/complete-cod", checkAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).render("404")

    if (order.paymentTiming === "cod") {
      order.status = "completed"
      order.paymentStatus = "paid"
      order.paymentMethod = "cash"
      order.paidAt = new Date()
      await order.save()
      
      res.redirect("/admin/orders?success=Đơn hàng COD đã được xác nhận thanh toán")
    } else {
      res.redirect("/admin/orders?error=Đơn hàng này không phải COD")
    }
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/reservations", checkAdmin, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 }).populate("userId").populate("branchId")
    res.render("admin/reservations", { reservations })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/reservation/:id", checkAdmin, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("userId").populate("branchId")
    res.render("admin/reservation-detail", { reservation })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/reservation/:id/status", checkAdmin, async (req, res) => {
  try {
    const { status } = req.body
    await Reservation.findByIdAndUpdate(req.params.id, { status })
    res.redirect("/admin/reservations?success=Reservation status updated")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/users", checkAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 })
    res.render("admin/users", { users })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/user/:id", checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    const orders = await Order.find({ userId: req.params.id }).populate("branchId")
    const reservations = await Reservation.find({ userId: req.params.id }).populate("branchId")
    const Payment = require("../models/Payment")
    const payments = await Payment.find({ userId: req.params.id }).populate("orderId").populate("reservationId")
    
    res.render("admin/user-detail", { user, orders, reservations, payments })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/user/:id/delete", checkAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.redirect("/admin/users?success=User deleted successfully")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/contacts", checkAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 })
    res.render("admin/contacts", { contacts })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/contact/:id", checkAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) return res.status(404).render("404")

    // Mark as read
    if (contact.status === "new") {
      contact.status = "read"
      await contact.save()
    }

    res.render("admin/contact-detail", { contact })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.post("/contact/:id/reply", checkAdmin, async (req, res) => {
  try {
    const { reply } = req.body
    await Contact.findByIdAndUpdate(req.params.id, { reply, status: "replied" })
    res.redirect("/admin/contacts?success=Phản hồi đã được gửi")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

router.get("/contact/:id/delete", checkAdmin, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id)
    res.redirect("/admin/contacts?success=Liên hệ đã được xóa")
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Revenue statistics route
router.get("/revenue", checkAdmin, async (req, res) => {
  try {
    const { year, month } = req.query
    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1

    // Get all paid payments
    const Payment = require("../models/Payment")
    
    let startDate, endDate
    if (month) {
      // Monthly view
      startDate = new Date(currentYear, currentMonth - 1, 1)
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)
    } else {
      // Yearly view
      startDate = new Date(currentYear, 0, 1)
      endDate = new Date(currentYear, 11, 31, 23, 59, 59)
    }

    const payments = await Payment.find({
      status: "completed",
      paidAt: { $gte: startDate, $lte: endDate }
    }).populate("orderId").populate("reservationId").populate("userId")

    // Calculate statistics
    let totalRevenue = 0
    let totalDiscount = 0
    let orderRevenue = 0
    let reservationRevenue = 0
    let orderCount = 0
    let reservationCount = 0

    const monthlyData = Array(12).fill(0)
    const paymentMethods = { bank: 0, momo: 0, cash: 0 }

    payments.forEach(payment => {
      totalRevenue += payment.finalAmount
      totalDiscount += payment.discount || 0
      
      if (payment.orderId) {
        orderRevenue += payment.finalAmount
        orderCount++
      } else if (payment.reservationId) {
        reservationRevenue += payment.finalAmount
        reservationCount++
      }

      // Count by payment method
      if (paymentMethods.hasOwnProperty(payment.paymentMethod)) {
        paymentMethods[payment.paymentMethod] += payment.finalAmount
      }

      // Monthly breakdown for yearly view
      if (!month) {
        const paymentMonth = new Date(payment.paidAt).getMonth()
        monthlyData[paymentMonth] += payment.finalAmount
      }
    })

    // Get COD orders (paid but not in Payment collection yet)
    const codOrders = await Order.find({
      paymentTiming: "cod",
      status: "completed",
      paidAt: { $gte: startDate, $lte: endDate }
    })

    codOrders.forEach(order => {
      totalRevenue += order.finalPrice
      orderRevenue += order.finalPrice
      orderCount++
      paymentMethods.cash += order.finalPrice
      
      if (!month) {
        const orderMonth = new Date(order.paidAt).getMonth()
        monthlyData[orderMonth] += order.finalPrice
      }
    })

    res.render("admin/revenue", {
      totalRevenue,
      totalDiscount,
      orderRevenue,
      reservationRevenue,
      orderCount,
      reservationCount,
      paymentMethods,
      monthlyData,
      payments,
      currentYear,
      currentMonth,
      viewType: month ? 'monthly' : 'yearly'
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

module.exports = router
