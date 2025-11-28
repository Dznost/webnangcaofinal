const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["large_order", "large_reservation", "general"], required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  message: { type: String, required: true },
  userNote: String, // Special request from user
  status: { type: String, enum: ["pending", "read", "resolved"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Notification", notificationSchema)
