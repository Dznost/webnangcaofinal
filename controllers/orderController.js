const Order = require("../models/Order");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const searchQuery = req.query.q || ""
    const statusFilter = req.query.status || ""
    const orderTypeFilter = req.query.orderType || ""
    const branchFilter = req.query.branchId || ""

    let query = {}
    if (statusFilter) query.status = statusFilter
    if (orderTypeFilter) query.orderType = orderTypeFilter
    if (branchFilter) query.branchId = branchFilter

    if (searchQuery) {
      // Search by order code suffix, customer name or phone
      query.$or = [
        { fullName: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
      ]
    }

    let orders = await Order.find(query)
      .populate("userId", "name email phone")
      .populate("shipperId", "name email phone")
      .populate("staffId", "name email phone")
      .populate("items.dishId", "name price")
      .populate("branchId", "name address")
      .sort({ createdAt: -1 })

    // If search yielded no results, try matching on userId name/phone
    if (searchQuery && orders.length === 0) {
      const User = require("../models/User")
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { phone: { $regex: searchQuery, $options: "i" } },
        ],
      }).select("_id")
      const userIds = matchedUsers.map((u) => u._id)
      const fallbackQuery = Object.assign({}, query)
      delete fallbackQuery.$or
      fallbackQuery.userId = { $in: userIds }
      orders = await Order.find(fallbackQuery)
        .populate("userId", "name email phone")
        .populate("shipperId", "name email phone")
        .populate("staffId", "name email phone")
        .populate("items.dishId", "name price")
        .populate("branchId", "name address")
        .sort({ createdAt: -1 })
    }

    const Branch = require("../models/Branch")
    const branches = await Branch.find().select("name").sort({ name: 1 })

    res.render("admin/orders/index", {
      title: "Quan Ly Don Hang",
      orders,
      branches,
      searchQuery,
      statusFilter,
      orderTypeFilter,
      branchFilter,
      success: req.query.success,
    })
  } catch (error) {
    console.error("[restaurant] Error in getOrders:", error)
    res.redirect("/admin")
  }
}

// Get order detail
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone createdAt")
      .populate("shipperId", "name email phone branchId")
      .populate("staffId", "name email phone role branchId")
      .populate("confirmedBy", "name email phone role")
      .populate("items.dishId", "name price discount")
      .populate("branchId", "name address phone");

    if (!order) {
      return res.redirect("/admin/orders");
    }

    const orderObj = order.toObject();
    orderObj.user = orderObj.userId;

    const payment = await Payment.findOne({ orderId: req.params.id });

    // Customer stats
    let customerStats = null;
    if (order.userId) {
      const [totalOrders, totalSpent, recentOrders] = await Promise.all([
        Order.countDocuments({ userId: order.userId._id }),
        Payment.aggregate([
          { $match: { userId: order.userId._id, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$finalAmount" } } },
        ]),
        Order.find({ userId: order.userId._id, _id: { $ne: order._id } })
          .select("_id status totalPrice createdAt orderType")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);
      customerStats = {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        recentOrders,
        memberSince: order.userId.createdAt,
      };
    }

    // Build timeline
    const timeline = [];
    timeline.push({ event: "Don hang duoc tao", time: order.createdAt, status: "created" });
    if (order.paidAt) timeline.push({ event: "Thanh toan thanh cong", time: order.paidAt, status: "paid" });
    if (order.shipperId) timeline.push({ event: "Giao cho shipper: " + (order.shipperId.name || ""), time: order.updatedAt, status: "assigned" });
    if (order.staffId) timeline.push({ event: "Giao cho nhan vien: " + (order.staffId.name || ""), time: order.updatedAt, status: "assigned" });
    if (order.confirmedAt) timeline.push({ event: "Xac nhan hoan thanh boi " + (order.confirmedBy?.name || ""), time: order.confirmedAt, status: "completed" });
    if (order.ratedAt) timeline.push({ event: "Khach hang danh gia " + order.rating + " sao", time: order.ratedAt, status: "rated" });
    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Get all shippers for assignment (no branch filter)
    const shippers = await User.find({ role: "shipper" }).select("name email phone").sort({ _id: 1 });

    // Get all staff and reception for dine-in assignment
    const staffMembers = await User.find({ role: { $in: ["staff", "reception"] } }).select("name email phone role").sort({ _id: 1 });

    res.render("admin/orders/detail", {
      title: "Chi Tiet Don Hang",
      order: orderObj,
      payment,
      shippers,
      staffMembers,
      customerStats,
      timeline,
      success: req.query.success || null,
    });
  } catch (error) {
    console.error("[restaurant] Error in getOrderDetail:", error);
    res.redirect("/admin/orders");
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log("[restaurant] Updating order status:", req.params.id, status);
    
    await Order.findByIdAndUpdate(req.params.id, { status });
    
    res.redirect(`/admin/orders/${req.params.id}?success=Cập nhật thành công`);
  } catch (error) {
    console.error("[restaurant] Error in updateOrderStatus:", error);
    res.redirect("/admin/orders");
  }
};

// Complete COD payment
exports.completeCODPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (order && order.paymentTiming === "cod" && order.paymentStatus !== "paid") {
      const payment = new Payment({
        orderId: order._id,
        userId: order.userId,
        amount: order.finalPrice || order.totalPrice,
        discount: order.discount || 0,
        finalAmount: order.finalPrice || order.totalPrice,
        paymentMethod: "cash",
        status: "completed",
        revenueType: order.orderType === "dine-in" ? "reception" : "delivery",
        branchId: order.branchId || null,
        collectedBy: order.shipperId || order.staffId || null,
        paidAt: new Date()
      });
      await payment.save();
      
      order.paymentStatus = "paid";
      order.status = "completed";
      order.paidAt = new Date();
      await order.save();
      
      console.log("[restaurant] COD payment completed for order:", order._id);
    }
    
    res.redirect(`/admin/orders/${req.params.id}?success=Xác nhận thanh toán thành công`);
  } catch (error) {
    console.error("[restaurant] Error in completeCODPayment:", error);
    res.redirect("/admin/orders");
  }
};

// Assign order to shipper
exports.assignToShipper = async (req, res) => {
  try {
    const { shipperId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.redirect("/admin/orders");
    }

    // Verify shipper exists and has shipper role
    const shipper = await User.findOne({ _id: shipperId, role: "shipper" });
    if (!shipper) {
      return res.redirect(`/admin/orders/${req.params.id}?success=Shipper khong hop le`);
    }

    order.shipperId = shipperId;
    order.status = "processing";
    await order.save();

    // Create notification for shipper
    const notification = new Notification({
      type: "order_assigned",
      orderId: order._id,
      userId: shipperId,
      amount: order.finalPrice || order.totalPrice,
      message: `Ban duoc giao don hang #${order._id.toString().slice(-6).toUpperCase()} - ${(order.finalPrice || order.totalPrice).toLocaleString('vi-VN')}d`,
    });
    await notification.save();

    console.log("[restaurant] Order assigned to shipper:", order._id, "->", shipperId);
    res.redirect(`/admin/orders/${req.params.id}?success=Da gui don hang cho shipper`);
  } catch (error) {
    console.error("[restaurant] Error in assignToShipper:", error);
    res.redirect("/admin/orders");
  }
};

// Assign dine-in order to staff or reception
exports.assignToStaff = async (req, res) => {
  try {
    const { staffId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.redirect("/admin/orders");
    }

    const staff = await User.findOne({ _id: staffId, role: { $in: ["staff", "reception"] } });
    if (!staff) {
      return res.redirect(`/admin/orders/${req.params.id}?success=Nhan vien khong hop le`);
    }

    order.staffId = staffId;
    order.status = "processing";
    await order.save();

    const roleLabel = staff.role === "reception" ? "le tan" : "nhan vien";
    const notification = new Notification({
      type: "order_assigned",
      orderId: order._id,
      userId: staffId,
      amount: order.finalPrice || order.totalPrice,
      message: `Ban duoc giao don an tai quan #${order._id.toString().slice(-6).toUpperCase()} - ${(order.finalPrice || order.totalPrice).toLocaleString('vi-VN')}d`,
    });
    await notification.save();

    console.log("[restaurant] Order assigned to", roleLabel, ":", order._id, "->", staffId);
    res.redirect(`/admin/orders/${req.params.id}?success=Da gui don hang cho ${roleLabel}`);
  } catch (error) {
    console.error("[restaurant] Error in assignToStaff:", error);
    res.redirect("/admin/orders");
  }
};

// Auto-assign dine-in order to staff (round-robin by _id)
exports.autoAssignToStaff = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.redirect("/admin/orders");
    }

    // Get all staff sorted by _id ascending
    var staffMembers = await User.find({ role: "staff" }).select("name").sort({ _id: 1 });

    if (staffMembers.length === 0) {
      return res.redirect(`/admin/orders/${req.params.id}?success=Khong co nhan vien nao trong he thong`);
    }

    // Find the last dine-in order assigned to staff
    var lastAssigned = await Order.findOne({ staffId: { $ne: null }, orderType: "dine-in" }).sort({ createdAt: -1 }).select("staffId");

    var selectedIndex = 0;
    if (lastAssigned && lastAssigned.staffId) {
      var lastIdx = staffMembers.findIndex(function(s) { return s._id.toString() === lastAssigned.staffId.toString(); });
      if (lastIdx !== -1) {
        selectedIndex = (lastIdx + 1) % staffMembers.length;
      }
    }

    var selectedStaff = staffMembers[selectedIndex];

    order.staffId = selectedStaff._id;
    order.status = "processing";
    await order.save();

    var notification = new Notification({
      type: "order_assigned",
      orderId: order._id,
      userId: selectedStaff._id,
      amount: order.finalPrice || order.totalPrice,
      message: `Ban duoc tu dong giao don an tai quan #${order._id.toString().slice(-6).toUpperCase()} - ${(order.finalPrice || order.totalPrice).toLocaleString('vi-VN')}d`,
    });
    await notification.save();

    console.log("[restaurant] Auto-assigned dine-in order", order._id, "to staff", selectedStaff.name);
    res.redirect(`/admin/orders/${req.params.id}?success=Da tu dong gan cho nhan vien ${selectedStaff.name}`);
  } catch (error) {
    console.error("[restaurant] Error in autoAssignToStaff:", error);
    res.redirect("/admin/orders");
  }
};

// Auto-assign order to shipper (round-robin by _id, low to high, cycle back)
exports.autoAssignToShipper = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.redirect("/admin/orders");
    }

    // Get all shippers sorted by _id ascending
    var shippers = await User.find({ role: "shipper" }).select("name").sort({ _id: 1 });

    if (shippers.length === 0) {
      return res.redirect(`/admin/orders/${req.params.id}?success=Khong co shipper nao trong he thong`);
    }

    // Find the last takeaway order assigned to a shipper
    var lastAssigned = await Order.findOne({ shipperId: { $ne: null }, orderType: "takeaway" }).sort({ createdAt: -1 }).select("shipperId");

    var selectedIndex = 0;
    if (lastAssigned && lastAssigned.shipperId) {
      var lastIdx = shippers.findIndex(function(s) { return s._id.toString() === lastAssigned.shipperId.toString(); });
      if (lastIdx !== -1) {
        selectedIndex = (lastIdx + 1) % shippers.length;
      }
    }

    var selectedShipper = shippers[selectedIndex];

    order.shipperId = selectedShipper._id;
    order.status = "processing";
    await order.save();

    var notification = new Notification({
      type: "order_assigned",
      orderId: order._id,
      userId: selectedShipper._id,
      amount: order.finalPrice || order.totalPrice,
      message: `Ban duoc tu dong giao don hang #${order._id.toString().slice(-6).toUpperCase()} - ${(order.finalPrice || order.totalPrice).toLocaleString('vi-VN')}d`,
    });
    await notification.save();

    console.log("[restaurant] Auto-assigned order", order._id, "to shipper", selectedShipper.name);
    res.redirect(`/admin/orders/${req.params.id}?success=Da tu dong gan cho shipper ${selectedShipper.name}`);
  } catch (error) {
    console.error("[restaurant] Error in autoAssignToShipper:", error);
    res.redirect("/admin/orders");
  }
};
