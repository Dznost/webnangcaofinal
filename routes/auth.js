const express = require("express")
const router = express.Router()
const User = require("../models/User")

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body
    
    console.log("[restaurant] Register attempt:", email)

    if (password !== confirmPassword) {
      return res.status(400).render("public/auth/register", { 
        error: "Mật khẩu không khớp",
        title: "Đăng Ký"
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).render("public/auth/register", { 
        error: "Email đã tồn tại",
        title: "Đăng Ký"
      })
    }

    const user = new User({ name, email, password, role: "user" })
    await user.save()
    
    console.log("[restaurant] User registered:", user.email, "Role:", user.role)

    req.session.user = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    }
    
    req.session.save((err) => {
      if (err) {
        console.error("[restaurant] Session save error:", err)
      }
      console.log("[restaurant] Session saved for user:", user.email)
      res.redirect("/")
    })
  } catch (error) {
    console.error("[restaurant] Register error:", error)
    res.status(500).render("public/auth/register", { 
      error: error.message,
      title: "Đăng Ký"
    })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    
    console.log("[restaurant] Login attempt:", email)
    
    const user = await User.findOne({ email })

    if (!user) {
      console.log("[restaurant] User not found:", email)
      return res.status(401).render("public/auth/login", { 
        error: "Email hoặc mật khẩu không đúng",
        title: "Đăng Nhập"
      })
    }

    const isPasswordValid = await user.comparePassword(password)
    console.log("[restaurant] Password valid:", isPasswordValid)

    if (!isPasswordValid) {
      return res.status(401).render("public/auth/login", { 
        error: "Email hoặc mật khẩu không đúng",
        title: "Đăng Nhập"
      })
    }

    console.log("[restaurant] Login successful - Email:", user.email, "Role:", user.role)

    req.session.user = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    }
    
    req.session.save((err) => {
      if (err) {
        console.error("[restaurant] Session save error:", err)
        return res.status(500).render("public/auth/login", { 
          error: "Lỗi hệ thống, vui lòng thử lại",
          title: "Đăng Nhập"
        })
      }
      
      console.log("[restaurant] Session saved successfully for:", user.email)
      console.log("[restaurant] Session data:", req.session.user)
      
      const redirectUrl = user.role === "admin" ? "/admin" : "/"
      console.log("[restaurant] Redirecting to:", redirectUrl)
      
      res.redirect(redirectUrl)
    })
  } catch (error) {
    console.error("[restaurant] Login error:", error)
    res.status(500).render("public/auth/login", { 
      error: error.message,
      title: "Đăng Nhập"
    })
  }
})

// Logout
router.get("/logout", (req, res) => {
  console.log("[restaurant] Logout:", req.session.user?.email)
  req.session.destroy((err) => {
    if (err) {
      console.error("[restaurant] Logout error:", err)
    }
    res.redirect("/")
  })
})

module.exports = router
