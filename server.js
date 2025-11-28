const express = require("express")
const mongoose = require("mongoose")
const session = require("express-session")
const expressLayouts = require("express-ejs-layouts")
const path = require("path")
const connectDB = require("./config/database")

const app = express()

// Connect to MongoDB
connectDB()

// Middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Session configuration
app.use(
  session({
    secret: "restaurant-secret-key-2024",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  }),
)

// View engine - Added express-ejs-layouts configuration
app.use(expressLayouts)
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.set("layout", "layout")

// Middleware to check user role
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  res.locals.isAdmin = req.session.user?.role === "admin"
  res.locals.isLoggedIn = !!req.session.user
  next()
})

// Routes
app.use("/", require("./routes/public"))
app.use("/user", require("./routes/user"))
app.use("/auth", require("./routes/auth"))

app.use("/admin", require("./routes/admin/index"))
app.use("/admin/dishes", require("./routes/admin/dishes"))
app.use("/admin/branches", require("./routes/admin/branches"))
app.use("/admin/events", require("./routes/admin/events"))
app.use("/admin/blogs", require("./routes/admin/blog")) // Changed from /admin/blog to /admin/blogs for consistency
app.use("/admin/orders", require("./routes/admin/orders"))
app.use("/admin/reservations", require("./routes/admin/reservations"))
app.use("/admin/users", require("./routes/admin/users"))
app.use("/admin/contacts", require("./routes/admin/contacts"))
app.use("/admin/revenue", require("./routes/admin/revenue"))

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { layout: false })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render("error", { error: err.message, layout: false })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
