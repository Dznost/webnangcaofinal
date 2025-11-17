const Dish = require("../models/Dish");

// Get all dishes
exports.getDishes = async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ createdAt: -1 });
    res.render("admin/dishes/index", { 
      title: "Quản Lý Món Ăn", 
      dishes,
      success: req.query.success 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin");
  }
};

// Get new dish form
exports.getNewDishForm = (req, res) => {
  res.render("admin/dishes/form", { title: "Thêm Món Ăn Mới", dish: null });
};

// Create new dish
exports.createDish = async (req, res) => {
  try {
    const dish = new Dish(req.body);
    await dish.save();
    res.redirect("/admin/dishes?success=Thêm món ăn thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/dishes");
  }
};

// Get edit dish form
exports.getEditDishForm = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    res.render("admin/dishes/form", { title: "Chỉnh Sửa Món Ăn", dish });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/dishes");
  }
};

// Update dish
exports.updateDish = async (req, res) => {
  try {
    await Dish.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/admin/dishes?success=Cập nhật thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/dishes");
  }
};

// Delete dish
exports.deleteDish = async (req, res) => {
  try {
    await Dish.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dishes?success=Xóa thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/dishes");
  }
};
