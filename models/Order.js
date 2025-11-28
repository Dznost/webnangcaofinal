const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
      name: String,
      quantity: Number,
      price: Number,
      discount: Number,
    },
  ],
  orderType: { type: String, enum: ["dine-in", "takeaway"], required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  guests: Number,
  paymentTiming: { type: String, enum: ["prepaid", "cod"], default: "prepaid" },
  totalPrice: Number,
  discount: { type: Number, default: 0 },
  finalPrice: Number,
  status: { 
    type: String, 
    enum: ["pending", "approved", "paid", "processing", "completed", "cancelled"], 
    default: "pending" 
  },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  paymentMethod: String,
  deliveryAddress: String,
  fullName: String,
  email: String,
  phone: String,
  specialRequests: String,
  paidAt: Date,
  adminNotified: { type: Boolean, default: false },
  largeOrderNote: String, // Special request from user for orders > 100M
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Order", orderSchema)
