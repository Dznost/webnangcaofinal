const express = require("express");
const router = express.Router();
const revenueController = require("../../controllers/revenueController");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

router.get("/", checkAdmin, revenueController.getRevenue);

module.exports = router;
