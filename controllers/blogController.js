const Blog = require("../models/Blog");

// Get all blogs
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "name email").sort({ createdAt: -1 });
    res.render("admin/blog/index", { 
      title: "Quản Lý Blog", 
      blogs,
      success: req.query.success 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin");
  }
};

// Get new blog form
exports.getNewBlogForm = (req, res) => {
  res.render("admin/blog/form", { title: "Thêm Bài Viết Mới", blog: null });
};

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    const blog = new Blog({
      ...req.body,
      author: req.session.user._id
    });
    await blog.save();
    res.redirect("/admin/blogs?success=Thêm bài viết thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/blogs");
  }
};

// Get edit blog form
exports.getEditBlogForm = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    res.render("admin/blog/form", { title: "Chỉnh Sửa Bài Viết", blog });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/blogs");
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/admin/blogs?success=Cập nhật thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/blogs");
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/admin/blogs?success=Xóa thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/blogs");
  }
};
