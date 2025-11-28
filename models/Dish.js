const mongoose = require("mongoose")

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  category: { type: String, enum: ["appetizer", "main", "dessert", "beverage"], required: true },
  discount: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Dish", dishSchema)
