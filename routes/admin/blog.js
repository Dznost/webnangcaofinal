const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/blogController");

// Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

router.get("/", checkAdmin, blogController.getBlogs);
router.get("/new", checkAdmin, blogController.getNewBlogForm);
router.post("/", checkAdmin, blogController.createBlog);
router.get("/:id/edit", checkAdmin, blogController.getEditBlogForm);
router.post("/:id", checkAdmin, blogController.updateBlog);
router.get("/:id/delete", checkAdmin, blogController.deleteBlog);

module.exports = router;
