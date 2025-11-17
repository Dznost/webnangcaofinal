const User = require("../models/User");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render("admin/users/index", { 
      title: "Quản Lý Người Dùng", 
      users,
      success: req.query.success 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin");
  }
};

// Get user detail
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const orders = await Order.find({ user: req.params.id })
      .populate("items.dish")
      .sort({ createdAt: -1 });
    const reservations = await Reservation.find({ user: req.params.id })
      .populate("branch")
      .sort({ reservationDate: -1 });
    const payments = await Payment.find({
      $or: [
        { orderId: { $in: orders.map(o => o._id) } },
        { reservationId: { $in: reservations.map(r => r._id) } }
      ]
    }).sort({ createdAt: -1 });
    
    res.render("admin/users/detail", { 
      title: "Chi Tiết Người Dùng", 
      user,
      orders,
      reservations,
      payments 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/users");
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/users?success=Xóa người dùng thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/users");
  }
};
