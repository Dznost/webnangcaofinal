const express = require("express")
const router = express.Router()
const Dish = require("../models/Dish")
const Branch = require("../models/Branch")
const Event = require("../models/Event")
const Blog = require("../models/Blog")
const Contact = require("../models/Contact")

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
        $or: [{ branches: branch._id }, { isGlobal: true }],
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
    }

    res.render("public/home/index", { dishes, events, branches, title: "Trang Chủ" })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
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
    res.status(500).render("error", { error: error.message })
  }
})

// Dish detail
router.get("/dish/:id", async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
    if (!dish) return res.status(404).render("404")
    res.render("public/menu/detail", { dish, title: dish.name })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Branches
router.get("/branches", async (req, res) => {
  try {
    const branches = await Branch.find()
    res.render("public/branches/index", { branches, title: "Chi Nhánh" })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Branch detail
router.get("/branch/:id", async (req, res) => {
  try {
    console.log("[restaurant] Public route - Loading branch detail:", req.params.id)

    const branch = await Branch.findById(req.params.id).populate("dishes")
    if (!branch) return res.status(404).render("404")

    console.log("[restaurant] Branch loaded from DB - images:", branch.images)
    console.log("[restaurant] Branch loaded from DB - main image:", branch.image)

    // Get active events for this branch
    const now = new Date()
    const events = await Event.find({
      $or: [{ branches: branch._id }, { isGlobal: true }],
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
    res.status(500).render("error", { error: error.message })
  }
})

// Events
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find()
    res.render("public/events/index", { events, title: "Sự Kiện" })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Event detail
router.get("/event/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).render("404")
    res.render("public/events/detail", { event, title: event.title })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Blog
router.get("/blog", async (req, res) => {
  try {
    const blogs = await Blog.find()
    res.render("public/blog/index", { blogs, title: "Tin Tức" })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// Blog detail
router.get("/blog/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).render("404")
    res.render("public/blog/detail", { blog, title: blog.title })
  } catch (error) {
    res.status(500).render("error", { error: error.message })
  }
})

// About
router.get("/about", (req, res) => {
  res.render("public/about/index", { title: "Về Chúng Tôi" })
})

// Contact
router.get("/contact", (req, res) => {
  res.render("public/contact/index", { title: "Liên Hệ" })
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
    res.status(500).render("error", { error: error.message })
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
