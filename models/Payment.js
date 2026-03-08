const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["bank", "cash"], required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  revenueType: { type: String, enum: ["delivery", "reception"], default: null },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  qrCode: String,
  transactionId: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Payment", paymentSchema)
