const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

router.get("/", checkAdmin, userController.getUsers);
router.get("/:id", checkAdmin, userController.getUserDetail);
router.get("/:id/delete", checkAdmin, userController.deleteUser);

module.exports = router;
