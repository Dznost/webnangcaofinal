const express = require("express")
const router = express.Router()
const receptionController = require("../controllers/receptionController")

function checkReception(req, res, next) {
  if (!req.session.user || req.session.user.role !== "reception") {
    return res.redirect("/login")
  }
  // Sync branchId into session for easy access in controller
  if (!req.session.user.branchId) {
    const User = require("../models/User")
    User.findById(req.session.user.id)
      .select("branchId")
      .lean()
      .then((u) => {
        if (u && u.branchId) req.session.user.branchId = u.branchId.toString()
        next()
      })
      .catch(() => next())
  } else {
    next()
  }
}

router.use(checkReception)

// Dashboard
router.get("/", receptionController.getDashboard)

// Orders (dine-in, branch-scoped)
router.get("/orders", receptionController.getOrders)
router.get("/orders/create", receptionController.getCreateOrderForm)
router.post("/orders/create", receptionController.createOrder)
router.get("/orders/:id", receptionController.getOrderDetail)
router.post("/orders/:id/confirm-completed", receptionController.confirmOrderCompleted)

// Reservations (branch-scoped)
router.get("/reservations", receptionController.getReservations)
router.get("/reservations/:id", receptionController.getReservationDetail)
router.post("/reservations/:id/confirm", receptionController.confirmReservation)

// Profile
router.get("/profile", receptionController.getProfile)
router.post("/change-password", receptionController.changePassword)
router.post("/request-branch-change", receptionController.requestBranchChange)

module.exports = router
