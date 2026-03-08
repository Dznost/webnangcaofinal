const express = require("express")
const router = express.Router()
const staffController = require("../controllers/staffController")

// Middleware: check if user is staff
function checkStaff(req, res, next) {
  if (!req.session.user || req.session.user.role !== "staff") {
    return res.redirect("/login")
  }
  next()
}

router.use(checkStaff)

// Dashboard
router.get("/", staffController.getDashboard)

// Orders (dine-in)
router.get("/orders", staffController.getOrders)
router.get("/orders/:id", staffController.getOrderDetail)
router.post("/orders/:id/confirm-completed", staffController.confirmOrderCompleted)

// Reservations
router.get("/reservations", staffController.getReservations)
router.get("/reservations/:id", staffController.getReservationDetail)
router.post("/reservations/:id/confirm-completed", staffController.confirmReservationCompleted)

// Profile
router.get("/profile", staffController.getProfile)
router.post("/change-password", staffController.changePassword)
router.post("/request-branch-change", staffController.requestBranchChange)

module.exports = router
