const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/eventController");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

router.get("/", checkAdmin, eventController.getEvents);
router.get("/new", checkAdmin, eventController.getNewEventForm);
router.post("/", checkAdmin, eventController.createEvent);
router.get("/:id/edit", checkAdmin, eventController.getEditEventForm);
router.post("/:id", checkAdmin, eventController.updateEvent);
router.get("/:id/delete", checkAdmin, eventController.deleteEvent);

module.exports = router;
