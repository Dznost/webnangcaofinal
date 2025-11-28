const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");

// Get all reservations
exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("userId", "name email phone")
      .populate("branchId", "name address")
      .populate("orderItems.dishId", "name price")
      .sort({ date: -1 });
    
    const reservationsWithAliases = reservations.map(res => {
      const resObj = res.toObject();
      resObj.branch = resObj.branchId;
      resObj.user = resObj.userId;
      if (resObj.orderItems) {
        resObj.orderItems = resObj.orderItems.map(item => ({
          ...item,
          dish: item.dishId
        }));
      }
      return resObj;
    });
    
    res.render("admin/reservations/index", { 
      title: "Quản Lý Đặt Bàn", 
      reservations: reservationsWithAliases,
      success: req.query.success 
    });
  } catch (error) {
    console.error("[restaurant] Error in getReservations:", error);
    res.redirect("/admin");
  }
};

// Get reservation detail
exports.getReservationDetail = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("branchId", "name address phone")
      .populate("orderItems.dishId", "name price discount");
      
    if (!reservation) {
      return res.redirect("/admin/reservations");
    }
    
    const resObj = reservation.toObject();
    resObj.branch = resObj.branchId;
    resObj.user = resObj.userId;
    if (resObj.orderItems) {
      resObj.orderItems = resObj.orderItems.map(item => ({
        ...item,
        dish: item.dishId
      }));
    }
    
    const payment = await Payment.findOne({ reservationId: req.params.id });
    
    res.render("admin/reservations/detail", { 
      title: "Chi Tiết Đặt Bàn", 
      reservation: resObj,
      payment 
    });
  } catch (error) {
    console.error("[restaurant] Error in getReservationDetail:", error);
    res.redirect("/admin/reservations");
  }
};

// Update reservation status
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log("[restaurant] Updating reservation status:", req.params.id, status);
    
    await Reservation.findByIdAndUpdate(req.params.id, { status });
    
    res.redirect(`/admin/reservations/${req.params.id}?success=Cập nhật thành công`);
  } catch (error) {
    console.error("[restaurant] Error in updateReservationStatus:", error);
    res.redirect("/admin/reservations");
  }
};
