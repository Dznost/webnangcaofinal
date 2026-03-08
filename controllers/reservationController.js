const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");
const Branch = require("../models/Branch");
const User = require("../models/User");

// Get all reservations
exports.getReservations = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const statusFilter = req.query.status || "";
    const branchFilter = req.query.branchId || "";

    let query = {};
    if (statusFilter) query.status = statusFilter;
    if (branchFilter) query.branchId = branchFilter;

    if (searchQuery) {
      query.$or = [
        { fullName: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ];
    }

    let reservations = await Reservation.find(query)
      .populate("userId", "name email phone")
      .populate("branchId", "name address")
      .populate("orderItems.dishId", "name price")
      .sort({ date: -1 });

    // Fallback search by user name/phone if no results
    if (searchQuery && reservations.length === 0) {
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { phone: { $regex: searchQuery, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchedUsers.map((u) => u._id);
      const fallbackQuery = Object.assign({}, query);
      delete fallbackQuery.$or;
      fallbackQuery.userId = { $in: userIds };
      reservations = await Reservation.find(fallbackQuery)
        .populate("userId", "name email phone")
        .populate("branchId", "name address")
        .populate("orderItems.dishId", "name price")
        .sort({ date: -1 });
    }

    const reservationsWithAliases = reservations.map((r) => {
      const resObj = r.toObject();
      resObj.branch = resObj.branchId;
      resObj.user = resObj.userId;
      if (resObj.orderItems) {
        resObj.orderItems = resObj.orderItems.map((item) => ({
          ...item,
          dish: item.dishId,
        }));
      }
      return resObj;
    });

    const branches = await Branch.find().select("name").sort({ name: 1 });

    res.render("admin/reservations/index", {
      title: "Quan Ly Dat Ban",
      reservations: reservationsWithAliases,
      branches,
      searchQuery,
      statusFilter,
      branchFilter,
      success: req.query.success,
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
      .populate("userId", "name email phone createdAt")
      .populate("branchId", "name address phone")
      .populate("orderItems.dishId", "name price discount");

    if (!reservation) {
      return res.redirect("/admin/reservations");
    }

    const resObj = reservation.toObject();
    resObj.branch = resObj.branchId;
    resObj.user = resObj.userId;
    if (resObj.orderItems) {
      resObj.orderItems = resObj.orderItems.map((item) => ({
        ...item,
        dish: item.dishId,
      }));
    }

    const payment = await Payment.findOne({ reservationId: req.params.id });

    // Guest history
    let guestStats = null;
    if (reservation.userId) {
      const [totalReservations, recentReservations] = await Promise.all([
        Reservation.countDocuments({ userId: reservation.userId._id }),
        Reservation.find({ userId: reservation.userId._id, _id: { $ne: reservation._id } })
          .select("_id status date time numberOfGuests")
          .populate("branchId", "name")
          .sort({ date: -1 })
          .limit(5)
          .lean(),
      ]);
      guestStats = {
        totalReservations,
        recentReservations,
        memberSince: reservation.userId.createdAt,
      };
    }

    res.render("admin/reservations/detail", {
      title: "Chi Tiet Dat Ban",
      reservation: resObj,
      payment,
      guestStats,
      success: req.query.success || null,
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
