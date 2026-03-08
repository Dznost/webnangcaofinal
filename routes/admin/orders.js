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
router.post("/:id/assign-shipper", checkAdmin, orderController.assignToShipper);
router.post("/:id/auto-assign-shipper", checkAdmin, orderController.autoAssignToShipper);
router.post("/:id/assign-staff", checkAdmin, orderController.assignToStaff);
router.post("/:id/auto-assign-staff", checkAdmin, orderController.autoAssignToStaff);

module.exports = router;
