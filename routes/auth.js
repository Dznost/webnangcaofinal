const express = require("express")
const router = express.Router()
const User = require("../models/User")

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body
    
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

    const user = new User({ name, email, password, phone, role: "user" })
    await user.save()
    
    console.log("[restaurant] User registered:", user.email, "Role:", user.role)

    req.session.user = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone,
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
      phone: user.phone,
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
      
      let redirectUrl = "/"
      if (user.role === "admin") redirectUrl = "/admin"
      else if (user.role === "shipper") redirectUrl = "/shipper"
      else if (user.role === "staff") redirectUrl = "/staff"
      else if (user.role === "reception") redirectUrl = "/reception"
      
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

// Google OAuth - Redirect to Google
router.get("/google", (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/google/callback`
  
  if (!googleClientId) {
    console.log("[restaurant] Google OAuth not configured - GOOGLE_CLIENT_ID missing")
    return res.redirect("/login?error=Dang nhap Google chua duoc cau hinh")
  }
  
  const scope = encodeURIComponent("openid email profile")
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
  
  res.redirect(googleAuthUrl)
})

// Google OAuth Callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code, error } = req.query
    
    if (error) {
      console.log("[restaurant] Google OAuth error:", error)
      return res.redirect("/login?error=Dang nhap Google that bai")
    }
    
    if (!code) {
      return res.redirect("/login?error=Khong nhan duoc ma xac thuc tu Google")
    }
    
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/google/callback`
    
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    })
    
    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      console.log("[restaurant] Google token error:", tokens)
      return res.redirect("/login?error=Khong the xac thuc voi Google")
    }
    
    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    
    const googleUser = await userInfoResponse.json()
    console.log("[restaurant] Google user:", googleUser.email)
    
    // Find or create user
    let user = await User.findOne({ email: googleUser.email })
    
    if (!user) {
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
        googleId: googleUser.id,
        avatar: googleUser.picture,
        role: "user"
      })
      await user.save()
      console.log("[restaurant] New Google user created:", user.email)
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.id
        if (googleUser.picture && !user.avatar) {
          user.avatar = googleUser.picture
        }
        await user.save()
      }
    }
    
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
    
    req.session.save((err) => {
      if (err) console.error("[restaurant] Session save error:", err)
      
      let redirectUrl = "/"
      if (user.role === "admin") redirectUrl = "/admin"
      else if (user.role === "shipper") redirectUrl = "/shipper"
      else if (user.role === "staff") redirectUrl = "/staff"
      else if (user.role === "reception") redirectUrl = "/reception"
      
      res.redirect(redirectUrl)
    })
  } catch (error) {
    console.error("[restaurant] Google OAuth callback error:", error)
    res.redirect("/login?error=Loi xac thuc Google")
  }
})

// Facebook OAuth - Redirect to Facebook
router.get("/facebook", (req, res) => {
  const facebookAppId = process.env.FACEBOOK_APP_ID
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/facebook/callback`
  
  if (!facebookAppId) {
    console.log("[restaurant] Facebook OAuth not configured - FACEBOOK_APP_ID missing")
    return res.redirect("/login?error=Dang nhap Facebook chua duoc cau hinh")
  }
  
  const scope = encodeURIComponent("email,public_profile")
  const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`
  
  res.redirect(facebookAuthUrl)
})

// Facebook OAuth Callback
router.get("/facebook/callback", async (req, res) => {
  try {
    const { code, error } = req.query
    
    if (error) {
      console.log("[restaurant] Facebook OAuth error:", error)
      return res.redirect("/login?error=Dang nhap Facebook that bai")
    }
    
    if (!code) {
      return res.redirect("/login?error=Khong nhan duoc ma xac thuc tu Facebook")
    }
    
    const facebookAppId = process.env.FACEBOOK_APP_ID
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/facebook/callback`
    
    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${facebookAppSecret}&code=${code}`
    
    const tokenResponse = await fetch(tokenUrl)
    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      console.log("[restaurant] Facebook token error:", tokens)
      return res.redirect("/login?error=Khong the xac thuc voi Facebook")
    }
    
    // Get user info
    const userInfoResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokens.access_token}`)
    const facebookUser = await userInfoResponse.json()
    
    if (!facebookUser.email) {
      return res.redirect("/login?error=Khong the lay email tu Facebook. Vui long cap quyen truy cap email.")
    }
    
    console.log("[restaurant] Facebook user:", facebookUser.email)
    
    // Find or create user
    let user = await User.findOne({ email: facebookUser.email })
    
    if (!user) {
      user = new User({
        name: facebookUser.name,
        email: facebookUser.email,
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
        facebookId: facebookUser.id,
        avatar: facebookUser.picture?.data?.url,
        role: "user"
      })
      await user.save()
      console.log("[restaurant] New Facebook user created:", user.email)
    } else {
      // Update Facebook ID if not set
      if (!user.facebookId) {
        user.facebookId = facebookUser.id
        if (facebookUser.picture?.data?.url && !user.avatar) {
          user.avatar = facebookUser.picture.data.url
        }
        await user.save()
      }
    }
    
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
    
    req.session.save((err) => {
      if (err) console.error("[restaurant] Session save error:", err)
      
      let redirectUrl = "/"
      if (user.role === "admin") redirectUrl = "/admin"
      else if (user.role === "shipper") redirectUrl = "/shipper"
      else if (user.role === "staff") redirectUrl = "/staff"
      else if (user.role === "reception") redirectUrl = "/reception"
      
      res.redirect(redirectUrl)
    })
  } catch (error) {
    console.error("[restaurant] Facebook OAuth callback error:", error)
    res.redirect("/login?error=Loi xac thuc Facebook")
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
