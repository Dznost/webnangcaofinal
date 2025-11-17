const Order = require("../models/Order");
const Payment = require("../models/Payment");

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.dishId", "name price")
      .populate("branchId", "name address")
      .sort({ createdAt: -1 });
    
    res.render("admin/orders/index", { 
      title: "Quản Lý Đơn Hàng", 
      orders,
      success: req.query.success 
    });
  } catch (error) {
    console.error("[restaurant] Error in getOrders:", error);
    res.redirect("/admin");
  }
};

// Get order detail
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("items.dishId", "name price discount")
      .populate("branchId", "name address");
    
    if (!order) {
      return res.redirect("/admin/orders");
    }
    
    const orderObj = order.toObject();
    orderObj.user = orderObj.userId;
    
    const payment = await Payment.findOne({ orderId: req.params.id });
    
    res.render("admin/orders/detail", { 
      title: "Chi Tiết Đơn Hàng", 
      order: orderObj,
      payment 
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
        paymentMethod: "cash",
        status: "completed",
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
