const Dish = require("../models/Dish");
const Event = require("../models/Event");

// Get all dishes
exports.getDishes = async (req, res) => {
  try {
    const dishes = await Dish.find().populate('event').sort({ createdAt: -1 });
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
exports.getNewDishForm = async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' }).sort({ startDate: -1 });
    res.render("admin/dishes/form", { title: "Thêm Món Ăn Mới", dish: null, events });
  } catch (error) {
    console.error(error);
    res.render("admin/dishes/form", { title: "Thêm Món Ăn Mới", dish: null, events: [] });
  }
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
    const events = await Event.find({ status: 'active' }).sort({ startDate: -1 });
    res.render("admin/dishes/form", { title: "Chỉnh Sửa Món Ăn", dish, events });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/dishes");
  }
};

// Update dish
exports.updateDish = async (req, res) => {
  try {
    if (req.body.event === '') {
      req.body.event = null;
    }
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
