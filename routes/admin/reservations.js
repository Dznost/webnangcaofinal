const express = require("express");
const router = express.Router();
const reservationController = require("../../controllers/reservationController");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

router.get("/", checkAdmin, reservationController.getReservations);
router.get("/:id", checkAdmin, reservationController.getReservationDetail);
router.post("/:id/status", checkAdmin, reservationController.updateReservationStatus);

module.exports = router;
