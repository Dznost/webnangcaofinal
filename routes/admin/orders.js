const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

router.get("/", checkAdmin, orderController.getOrders);
router.get("/:id", checkAdmin, orderController.getOrderDetail);
router.post("/:id/status", checkAdmin, orderController.updateOrderStatus);
router.post("/:id/complete-cod", checkAdmin, orderController.completeCODPayment);

module.exports = router;
