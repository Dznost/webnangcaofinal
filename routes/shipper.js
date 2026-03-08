const express = require("express")
const router = express.Router()
const shipperController = require("../controllers/shipperController")

// Middleware: check if user is shipper
function checkShipper(req, res, next) {
  if (!req.session.user || req.session.user.role !== "shipper") {
    return res.redirect("/login")
  }
  next()
}

router.use(checkShipper)

// Dashboard
router.get("/", shipperController.getDashboard)

// Orders
router.get("/orders", shipperController.getOrders)
router.get("/orders/:id", shipperController.getOrderDetail)
router.post("/orders/:id/confirm-completed", shipperController.confirmCompleted)

// Profile
router.get("/profile", shipperController.getProfile)
router.post("/change-password", shipperController.changePassword)
router.post("/request-branch-change", shipperController.requestBranchChange)

module.exports = router
