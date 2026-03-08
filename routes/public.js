const express = require("express")
const router = express.Router()
const Dish = require("../models/Dish")
const Branch = require("../models/Branch")
const Event = require("../models/Event")
const Blog = require("../models/Blog")
const Contact = require("../models/Contact")
const Notification = require("../models/Notification")
const User = require("../models/User")
const Order = require("../models/Order")

const contactRateLimitMap = new Map()

router.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.user ? true : false
  res.locals.isAdmin = req.session.user?.role === "admin"
  next()
})

// Home
router.get("/", async (req, res) => {
  try {
    const dishes = await Dish.find().limit(6)
    const events = await Event.find().limit(3)

    // Get branches with active events
    const branches = await Branch.find().populate("dishes").limit(3)

    // Add active events for each branch
    const now = new Date()
    for (const branch of branches) {
      branch.activeEvents = await Event.find({
        $or: [{ branches: branch._id }, { discountScope: "global" }],
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
    }

    res.render("public/home/index", { 
    dishes, 
    events, 
    branches, 
    title: "La Maison - Fine Dining Restaurant | Trang Chu",
    metaDescription: "La Maison - Nha hang sang trong voi am thuc tinh te. Dat ban, xem thuc don va kham pha he thong chi nhanh tai Viet Nam."
  })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Menu
router.get("/menu", async (req, res) => {
  try {
    const category = req.query.category || "all"
    const search = req.query.search || ""

    const query = {}
    if (category !== "all") {
      query.category = category
    }
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const dishes = await Dish.find(query)
    res.render("public/menu/index", { dishes, category, search, title: "Thực Đơn" })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Dish detail
router.get("/dish/:id", async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
    if (!dish) return res.status(404).render("404", { layout: false })
    res.render("public/menu/detail", { dish, title: dish.name })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Branches
router.get("/branches", async (req, res) => {
  try {
  const branches = await Branch.find().select("name address phone image openingHours availableTables totalTables")
  res.render("public/branches/index", { 
    branches, 
    title: "He Thong Chi Nhanh - La Maison Restaurant",
    metaDescription: "Tim chi nhanh La Maison gan ban nhat. Xem dia chi, so dien thoai va tinh trang ban trong tai tat ca chi nhanh."
  })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Branch detail
router.get("/branch/:id", async (req, res) => {
  try {
    console.log("[restaurant] Public route - Loading branch detail:", req.params.id)

    const branch = await Branch.findById(req.params.id).populate("dishes")
    if (!branch) return res.status(404).render("404", { layout: false })

    console.log("[restaurant] Branch loaded from DB - images:", branch.images)
    console.log("[restaurant] Branch loaded from DB - main image:", branch.image)

    // Get active events for this branch
    const now = new Date()
    const events = await Event.find({
      $or: [{ branches: branch._id }, { discountScope: "global" }],
      startDate: { $lte: now },
      endDate: { $gte: now },
    })

    res.render("public/branches/detail", {
      branch,
      events,
      title: branch.name,
    })
  } catch (error) {
    console.error("[restaurant] Error loading branch detail:", error)
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Events
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find()
    res.render("public/events/index", { events, title: "Sự Kiện" })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Event detail
router.get("/event/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("branches").populate("dishes")
    if (!event) return res.status(404).render("404", { layout: false })
    res.render("public/events/detail", { event, title: event.title })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Blog
router.get("/blog", async (req, res) => {
  try {
    const blogs = await Blog.find()
    res.render("public/blog/index", { blogs, title: "Tin Tức" })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Blog detail
router.get("/blog/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).render("404", { layout: false })
    res.render("public/blog/detail", { blog, title: blog.title })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// About
router.get("/about", async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).select("name address phone openingHours availableTables totalTables")
    res.render("public/about/index", { 
      title: "Về Chúng Tôi - La Maison Fine Dining", 
      metaDescription: "Khám phá câu chuyện La Maison - Nhà hàng fine dining với hơn 10 năm kinh nghiệm mang đến trải nghiệm ẩm thực tuyệt vời",
      branches 
    })
  } catch (error) {
    res.render("public/about/index", { 
      title: "Về Chúng Tôi - La Maison", 
      branches: [] 
    })
  }
})

// Contact
router.get("/contact", async (req, res) => {
  try {
    const branches = await Branch.find().select("name address")
    res.render("public/contact/index", { title: "Lien He", branches })
  } catch (error) {
    res.render("public/contact/index", { title: "Lien He", branches: [] })
  }
})

router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body

    const userKey = req.session.userId || req.ip
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (!contactRateLimitMap.has(userKey)) {
      contactRateLimitMap.set(userKey, [])
    }

    const submissions = contactRateLimitMap.get(userKey)
    const recentSubmissions = submissions.filter((time) => now - time < oneHour)

    if (recentSubmissions.length >= 3) {
      return res.render("public/contact/index", {
        title: "Liên Hệ",
        error: "Bạn đã gửi quá 3 phản hồi trong 1 giờ. Vui lòng thử lại sau.",
      })
    }

    recentSubmissions.push(now)
    contactRateLimitMap.set(userKey, recentSubmissions)

    const contact = new Contact({ name, email, message })
    await contact.save()

    res.render("public/contact/index", {
      title: "Liên Hệ",
      success: "Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm.",
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Shipper application
router.post("/contact/shipper-application", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login")
    }

    const { name, email, phone, message, branchId } = req.body

    const contact = new Contact({
      name,
      email,
      phone,
      message,
      type: "shipper_application",
      userId: req.session.user.id,
      branchId: branchId || undefined,
    })
    await contact.save()

    // Find an admin to notify
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const branch = branchId ? await Branch.findById(branchId) : null
      const notification = new Notification({
        type: "shipper_application",
        contactId: contact._id,
        userId: admin._id,
        amount: 0,
        message: `Don dang ky shipper moi tu ${name} (${email}, ${phone})${branch ? ' - Chi nhanh: ' + branch.name : ''}`,
      })
      await notification.save()
    }

    const branches = await Branch.find().select("name address")
    res.render("public/contact/index", {
      title: "Lien He",
      branches,
      success: "Don dang ky shipper da duoc gui. Chung toi se xem xet va lien he voi ban.",
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Staff application
router.post("/contact/staff-application", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login")
    }

    const { name, email, phone, message, branchId } = req.body

    const contact = new Contact({
      name,
      email,
      phone,
      message,
      type: "staff_application",
      userId: req.session.user.id,
      branchId: branchId || undefined,
    })
    await contact.save()

    // Find an admin to notify
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const branch = branchId ? await Branch.findById(branchId) : null
      const notification = new Notification({
        type: "staff_application",
        contactId: contact._id,
        userId: admin._id,
        amount: 0,
        message: `Don dang ky nhan vien moi tu ${name} (${email}, ${phone})${branch ? ' - Chi nhanh: ' + branch.name : ''}`,
      })
      await notification.save()
    }

    const branches = await Branch.find().select("name address")
    res.render("public/contact/index", {
      title: "Lien He",
      branches,
      success: "Don dang ky nhan vien da duoc gui. Chung toi se xem xet va lien he voi ban.",
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// ── Public Order Review (QR code from walk-in order) ────────────────────────
router.get("/order-review/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("branchId", "name address")
    if (!order) return res.status(404).render("404", { layout: false })

    res.render("public/order-review", {
      title: "Danh Gia Don Hang",
      order,
      success: req.query.success || null,
    })
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

router.post("/order-review/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).render("404", { layout: false })

    if (order.rating) {
      return res.redirect(`/order-review/${order._id}?success=already`)
    }

    const { rating, ratingComment } = req.body
    const ratingNum = parseInt(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.redirect(`/order-review/${order._id}?success=invalid`)
    }

    order.rating = ratingNum
    order.ratingComment = ratingComment || ""
    order.ratedAt = new Date()
    await order.save()

    // Notify admin
    const admin = await User.findOne({ role: "admin" })
    if (admin) {
      const ratingLabels = ["", "Rat te", "Khong tot", "Binh thuong", "Tot", "Tuyet voi"]
      const notification = new Notification({
        type: "order_review",
        orderId: order._id,
        userId: admin._id,
        amount: 0,
        message: `Khach hang ${order.fullName || 'Vang lai'} danh gia ${ratingNum} sao (${ratingLabels[ratingNum]}) cho don #${order._id.toString().slice(-6).toUpperCase()}`,
        details: ratingComment || null,
      })
      await notification.save()
    }

    res.redirect(`/order-review/${order._id}?success=rated`)
  } catch (error) {
    res.status(500).render("error", { error: error.message, layout: false })
  }
})

// Login page
router.get("/login", (req, res) => {
  res.render("public/auth/login", { title: "Đăng Nhập" })
})

// Register page
router.get("/register", (req, res) => {
  res.render("public/auth/register", { title: "Đăng Ký" })
})

module.exports = router
