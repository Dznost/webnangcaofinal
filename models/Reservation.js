const mongoose = require("mongoose")

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  date: { type: Date, required: true },
  time: String,
  guests: { type: Number, required: true },
  specialRequests: String,
  orderItems: [{
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
    name: String,
    quantity: Number,
    price: Number,
    discount: { type: Number, default: 0 }
  }],
  depositAmount: { type: Number, default: 0 }, // Fixed deposit for table
  foodTotal: { type: Number, default: 0 }, // Total food price
  foodDiscount: { type: Number, default: 0 }, // Total food discount
  totalAmount: { type: Number, default: 0 }, // deposit + food after discount
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "paid", "completed", "cancelled"], 
    default: "pending" 
  },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  paymentMethod: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Reservation", reservationSchema)
